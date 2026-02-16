import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type {
  Project, Page, ProjectNode, ProjectEdge,
  NodeKind, FlowDirection, EdgeType, ThemePreset, PageViewport, NodeStylePreset,
} from '../model/types';
import { nodeTypeRegistry } from '../model/registry';

const STORAGE_KEY = 'knitflow:lastProject';

function createDefaultPage(): Page {
  return {
    id: uuid(),
    name: 'Main',
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
    edges: [],
  };
}

function createDefaultProject(): Project {
  return {
    schemaVersion: '1.0.0',
    project: {
      id: uuid(),
      name: 'Untitled Project',
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    ui: {
      themePreset: 'light',
      edgeType: 'smoothstep',
      direction: 'TOP_DOWN',
      edgeDashed: false,
      hideEdgeLabels: false,
      showMiniMap: true,
    },
    pages: [createDefaultPage()],
  };
}

function normalizeProject(project: Project): Project {
  const ui = project.ui as Project['ui'] & { edgeDashed?: boolean; hideEdgeLabels?: boolean; showMiniMap?: boolean };
  return {
    ...project,
    ui: {
      ...project.ui,
      edgeDashed: typeof ui.edgeDashed === 'boolean' ? ui.edgeDashed : false,
      hideEdgeLabels: typeof ui.hideEdgeLabels === 'boolean' ? ui.hideEdgeLabels : false,
      showMiniMap: typeof ui.showMiniMap === 'boolean' ? ui.showMiniMap : true,
    },
  };
}

// Try to load from localStorage
function loadFromStorage(): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Project;
  } catch { /* ignore */ }
  return null;
}

interface ProjectStore {
  // State
  project: Project;
  activePageId: string;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  dirty: boolean;
  history: Project[];

  // Computed helpers
  activePage: () => Page;

  // Project actions
  setProjectName: (name: string) => void;
  setProjectDescription: (desc: string) => void;
  setUI: (ui: Partial<Project['ui']>) => void;
  loadProject: (proj: Project) => void;
  resetProject: () => void;
  undo: () => void;

  // Page actions
  addPage: (name?: string) => void;
  renamePage: (pageId: string, name: string) => void;
  deletePage: (pageId: string) => void;
  setActivePage: (pageId: string) => void;
  setPageViewport: (viewport: PageViewport) => void;

  // Node actions
  addNode: (kind: NodeKind, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  patchNode: (
    nodeId: string,
    patch: {
      data?: Record<string, unknown>;
      position?: { x: number; y: number };
      stylePreset?: NodeStylePreset;
    },
  ) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  removeNode: (nodeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;

  // Edge actions
  addEdge: (edge: ProjectEdge) => void;
  removeEdge: (edgeId: string) => void;
  updateEdgeLabel: (edgeId: string, label: string) => void;
  setSelectedEdge: (edgeId: string | null) => void;

  // Bulk updates from React Flow callbacks
  setNodes: (pageId: string, nodes: ProjectNode[]) => void;
  setEdges: (pageId: string, edges: ProjectEdge[]) => void;
  replacePageGraph: (pageId: string, nodes: ProjectNode[], edges: ProjectEdge[]) => void;

  // Persistence
  saveToStorage: () => void;
  getExportData: () => Project;
}

// Helper: update active page immutably
function updatePage(pages: Page[], pageId: string, updater: (p: Page) => Page): Page[] {
  return pages.map(p => p.id === pageId ? updater(p) : p);
}

function cloneProject(project: Project): Project {
  if (typeof structuredClone === 'function') return structuredClone(project);
  return JSON.parse(JSON.stringify(project)) as Project;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function clampRouterHandleCount(value: unknown, fallback: number): number {
  const raw = Math.round(toFiniteNumber(value, fallback));
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(8, Math.max(0, raw));
}

function remapRouterHandle(
  handle: string | undefined,
  prefix: 'in' | 'out',
  nextCount: number,
): string | undefined {
  if (!handle) return handle;
  const match = handle.match(new RegExp(`^${prefix}-(\\d+)$`));
  if (!match) return handle;

  const index = Number(match[1]);
  if (!Number.isFinite(index)) return handle;
  if (nextCount <= 0) return undefined;
  if (index < nextCount) return `${prefix}-${index}`;
  return `${prefix}-${nextCount - 1}`;
}

function toFlowAxes(position: { x: number; y: number }, direction: FlowDirection): { primary: number; secondary: number } {
  if (direction === 'TOP_DOWN') return { primary: position.y, secondary: position.x };
  if (direction === 'LEFT_RIGHT') return { primary: position.x, secondary: position.y };
  return { primary: -position.x, secondary: position.y };
}

function fromFlowAxes(primary: number, secondary: number, direction: FlowDirection): { x: number; y: number } {
  if (direction === 'TOP_DOWN') return { x: secondary, y: primary };
  if (direction === 'LEFT_RIGHT') return { x: primary, y: secondary };
  return { x: -primary, y: secondary };
}

function realignNodesToDirection(
  nodes: ProjectNode[],
  previousDirection: FlowDirection,
  nextDirection: FlowDirection,
): ProjectNode[] {
  if (!nodes.length || previousDirection === nextDirection) return nodes;

  const currentCenter = nodes.reduce(
    (acc, node) => ({ x: acc.x + node.position.x, y: acc.y + node.position.y }),
    { x: 0, y: 0 },
  );
  currentCenter.x /= nodes.length;
  currentCenter.y /= nodes.length;

  const transformed = nodes.map(node => {
    const axes = toFlowAxes(node.position, previousDirection);
    const mapped = fromFlowAxes(axes.primary, axes.secondary, nextDirection);
    return { ...node, position: mapped };
  });

  const transformedCenter = transformed.reduce(
    (acc, node) => ({ x: acc.x + node.position.x, y: acc.y + node.position.y }),
    { x: 0, y: 0 },
  );
  transformedCenter.x /= transformed.length;
  transformedCenter.y /= transformed.length;

  const dx = currentCenter.x - transformedCenter.x;
  const dy = currentCenter.y - transformedCenter.y;

  return transformed.map(node => ({
    ...node,
    position: { x: node.position.x + dx, y: node.position.y + dy },
  }));
}

export const useProjectStore = create<ProjectStore>((set, get) => {
  const saved = loadFromStorage();
  const initial = saved ? normalizeProject(saved) : createDefaultProject();

  const withHistory = (updater: (s: ProjectStore) => Partial<ProjectStore> | ProjectStore) => {
    set(s => {
      const next = updater(s);
      const nextProject = (next as Partial<ProjectStore>).project;
      if (!nextProject || nextProject === s.project) return next as Partial<ProjectStore>;

      const nextHistory = [...s.history, cloneProject(s.project)];
      if (nextHistory.length > 3) nextHistory.splice(0, nextHistory.length - 3);

      return {
        ...next,
        history: nextHistory,
      } as Partial<ProjectStore>;
    });
  };

  return {
    project: initial,
    activePageId: initial.pages[0].id,
    selectedNodeId: null,
    selectedEdgeId: null,
    dirty: false,
    history: [],

    activePage: () => {
      const s = get();
      return s.project.pages.find(p => p.id === s.activePageId) ?? s.project.pages[0];
    },

    // ── Project ──
    setProjectName: (name) => withHistory(s => ({
      dirty: true,
      project: { ...s.project, project: { ...s.project.project, name, updatedAt: new Date().toISOString() } },
    })),

    setProjectDescription: (description) => withHistory(s => ({
      dirty: true,
      project: { ...s.project, project: { ...s.project.project, description, updatedAt: new Date().toISOString() } },
    })),

    setUI: (ui) => withHistory(s => {
      const nextUi = { ...s.project.ui, ...ui };
      const nextEdgeType = ui.edgeType;
      const edgeTypeChanged = Boolean(nextEdgeType && nextEdgeType !== s.project.ui.edgeType);
      const nextDirection = ui.direction;
      const directionChanged = Boolean(nextDirection && nextDirection !== s.project.ui.direction);

      return {
        dirty: true,
        project: {
          ...s.project,
          ui: nextUi,
          // Global UI changes can reshape existing graph representation.
          pages: s.project.pages.map(page => ({
            ...page,
            nodes: directionChanged
              ? realignNodesToDirection(page.nodes, s.project.ui.direction, nextDirection as FlowDirection)
              : page.nodes,
            edges: edgeTypeChanged
              ? page.edges.map(edge => ({ ...edge, type: nextEdgeType }))
              : page.edges,
          })),
        },
      };
    }),

    loadProject: (proj) => {
      const normalized = normalizeProject(proj);
      set({
        project: normalized,
        activePageId: normalized.pages[0]?.id ?? '',
        selectedNodeId: null,
        selectedEdgeId: null,
        dirty: false,
        history: [],
      });
    },

    resetProject: () => {
      const fresh = createDefaultProject();
      localStorage.removeItem(STORAGE_KEY);
      set({
        project: fresh,
        activePageId: fresh.pages[0].id,
        selectedNodeId: null,
        selectedEdgeId: null,
        dirty: false,
        history: [],
      });
    },

    undo: () => set(s => {
      if (!s.history.length) return s;
      const previous = s.history[s.history.length - 1];
      const remaining = s.history.slice(0, -1);
      const activePageId = previous.pages.some(page => page.id === s.activePageId)
        ? s.activePageId
        : (previous.pages[0]?.id ?? '');
      return {
        project: previous,
        history: remaining,
        activePageId,
        selectedNodeId: null,
        selectedEdgeId: null,
        dirty: true,
      };
    }),

    // ── Pages ──
    addPage: (name) => withHistory(s => {
      const page = createDefaultPage();
      if (name) page.name = name;
      return {
        dirty: true,
        project: { ...s.project, pages: [...s.project.pages, page] },
        activePageId: page.id,
      };
    }),

    renamePage: (pageId, name) => withHistory(s => ({
      dirty: true,
      project: {
        ...s.project,
        pages: updatePage(s.project.pages, pageId, p => ({ ...p, name })),
      },
    })),

    deletePage: (pageId) => withHistory(s => {
      if (s.project.pages.length <= 1) return s;
      const pages = s.project.pages.filter(p => p.id !== pageId);
      const activePageId = s.activePageId === pageId ? pages[0].id : s.activePageId;
      return { dirty: true, project: { ...s.project, pages }, activePageId };
    }),

    setActivePage: (pageId) => set({ activePageId: pageId, selectedNodeId: null, selectedEdgeId: null }),

    setPageViewport: (viewport) => set(s => ({
      project: {
        ...s.project,
        pages: updatePage(s.project.pages, s.activePageId, p => ({ ...p, viewport })),
      },
    })),

    // ── Nodes ──
    addNode: (kind, position) => withHistory(s => {
      const def = nodeTypeRegistry[kind];
      const node: ProjectNode = {
        id: uuid(),
        type: kind,
        position,
        data: { ...def.defaultData },
        stylePreset: def.defaultStylePreset,
      };
      return {
        dirty: true,
        project: {
          ...s.project,
          pages: updatePage(s.project.pages, s.activePageId, p => ({
            ...p, nodes: [...p.nodes, node],
          })),
        },
        selectedNodeId: node.id,
        selectedEdgeId: null,
      };
    }),

    updateNodeData: (nodeId, data) => withHistory(s => {
      const activePage = s.project.pages.find(p => p.id === s.activePageId);
      if (!activePage) return s;

      const targetNode = activePage.nodes.find(n => n.id === nodeId);
      if (!targetNode) return s;

      const nextNodes = activePage.nodes.map(n => (
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ));

      let nextEdges = activePage.edges;
      if (targetNode.type === 'router') {
        const inputTouched = Object.prototype.hasOwnProperty.call(data, 'inputCount');
        const outputTouched = Object.prototype.hasOwnProperty.call(data, 'outputCount');

        if (inputTouched || outputTouched) {
          const nextInputCount = clampRouterHandleCount(
            inputTouched ? data.inputCount : targetNode.data.inputCount,
            2,
          );
          const nextOutputCount = clampRouterHandleCount(
            outputTouched ? data.outputCount : targetNode.data.outputCount,
            3,
          );

          nextEdges = activePage.edges.map(edge => {
            if (edge.source !== nodeId && edge.target !== nodeId) return edge;

            const nextSourceHandle = edge.source === nodeId
              ? remapRouterHandle(edge.sourceHandle, 'out', nextOutputCount)
              : edge.sourceHandle;
            const nextTargetHandle = edge.target === nodeId
              ? remapRouterHandle(edge.targetHandle, 'in', nextInputCount)
              : edge.targetHandle;

            if (nextSourceHandle === edge.sourceHandle && nextTargetHandle === edge.targetHandle) return edge;

            return {
              ...edge,
              sourceHandle: nextSourceHandle,
              targetHandle: nextTargetHandle,
            };
          });
        }
      }

      return {
        dirty: true,
        project: {
          ...s.project,
          pages: updatePage(s.project.pages, s.activePageId, p => ({
            ...p,
            nodes: nextNodes,
            edges: nextEdges,
          })),
        },
      };
    }),

    patchNode: (nodeId, patch) => withHistory(s => {
      const activePage = s.project.pages.find(p => p.id === s.activePageId);
      if (!activePage) return s;

      const targetNode = activePage.nodes.find(n => n.id === nodeId);
      if (!targetNode) return s;

      const nextNodes = activePage.nodes.map(n => {
        if (n.id !== nodeId) return n;
        return {
          ...n,
          data: patch.data ? { ...patch.data } : n.data,
          position: patch.position ? { ...patch.position } : n.position,
          stylePreset: patch.stylePreset ?? n.stylePreset,
        };
      });

      let nextEdges = activePage.edges;
      if (targetNode.type === 'router' && patch.data) {
        const inputTouched = Object.prototype.hasOwnProperty.call(patch.data, 'inputCount');
        const outputTouched = Object.prototype.hasOwnProperty.call(patch.data, 'outputCount');

        if (inputTouched || outputTouched) {
          const nextInputCount = clampRouterHandleCount(
            inputTouched ? patch.data.inputCount : targetNode.data.inputCount,
            2,
          );
          const nextOutputCount = clampRouterHandleCount(
            outputTouched ? patch.data.outputCount : targetNode.data.outputCount,
            3,
          );

          nextEdges = activePage.edges.map(edge => {
            if (edge.source !== nodeId && edge.target !== nodeId) return edge;

            const nextSourceHandle = edge.source === nodeId
              ? remapRouterHandle(edge.sourceHandle, 'out', nextOutputCount)
              : edge.sourceHandle;
            const nextTargetHandle = edge.target === nodeId
              ? remapRouterHandle(edge.targetHandle, 'in', nextInputCount)
              : edge.targetHandle;

            if (nextSourceHandle === edge.sourceHandle && nextTargetHandle === edge.targetHandle) return edge;

            return {
              ...edge,
              sourceHandle: nextSourceHandle,
              targetHandle: nextTargetHandle,
            };
          });
        }
      }

      return {
        dirty: true,
        project: {
          ...s.project,
          pages: updatePage(s.project.pages, s.activePageId, p => ({
            ...p,
            nodes: nextNodes,
            edges: nextEdges,
          })),
        },
      };
    }),

    updateNodePosition: (nodeId, position) => withHistory(s => ({
      dirty: true,
      project: {
        ...s.project,
        pages: updatePage(s.project.pages, s.activePageId, p => ({
          ...p,
          nodes: p.nodes.map(n => n.id === nodeId ? { ...n, position } : n),
        })),
      },
    })),

    removeNode: (nodeId) => withHistory(s => ({
      dirty: true,
      selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
      project: {
        ...s.project,
        pages: updatePage(s.project.pages, s.activePageId, p => ({
          ...p,
          nodes: p.nodes.filter(n => n.id !== nodeId),
          edges: p.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
        })),
      },
    })),

    setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: null }),

    // ── Edges ──
    addEdge: (edge) => withHistory(s => ({
      dirty: true,
      project: {
        ...s.project,
        pages: updatePage(s.project.pages, s.activePageId, p => ({
          ...p, edges: [...p.edges, edge],
        })),
      },
    })),

    removeEdge: (edgeId) => withHistory(s => ({
      dirty: true,
      selectedEdgeId: s.selectedEdgeId === edgeId ? null : s.selectedEdgeId,
      project: {
        ...s.project,
        pages: updatePage(s.project.pages, s.activePageId, p => ({
          ...p, edges: p.edges.filter(e => e.id !== edgeId),
        })),
      },
    })),

    updateEdgeLabel: (edgeId, label) => withHistory(s => ({
      dirty: true,
      project: {
        ...s.project,
        pages: updatePage(s.project.pages, s.activePageId, p => ({
          ...p, edges: p.edges.map(e => e.id === edgeId ? { ...e, label } : e),
        })),
      },
    })),

    setSelectedEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: null }),

    // ── Bulk (React Flow callbacks) ──
    setNodes: (pageId, nodes) => withHistory(s => ({
      dirty: true,
      project: {
        ...s.project,
        pages: updatePage(s.project.pages, pageId, p => ({ ...p, nodes })),
      },
    })),

    setEdges: (pageId, edges) => withHistory(s => ({
      dirty: true,
      project: {
        ...s.project,
        pages: updatePage(s.project.pages, pageId, p => ({ ...p, edges })),
      },
    })),

    replacePageGraph: (pageId, nodes, edges) => withHistory(s => ({
      dirty: true,
      project: {
        ...s.project,
        pages: updatePage(s.project.pages, pageId, p => ({ ...p, nodes, edges })),
      },
    })),

    // ── Persistence ──
    saveToStorage: () => {
      const s = get();
      const data = { ...s.project, project: { ...s.project.project, updatedAt: new Date().toISOString() } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      set({ dirty: false, project: data });
    },

    getExportData: () => {
      const s = get();
      return { ...s.project, project: { ...s.project.project, updatedAt: new Date().toISOString() } };
    },
  };
});
