import { v4 as uuid } from 'uuid';
import type { FlowGraph, FlowMode, Page, Project, ProjectUI } from './types';
import { nodeTypeRegistry } from './registry';

export const FLOW_MODEL_SCHEMA_VERSION = '1.2.0';

const DEFAULT_UI: ProjectUI = {
  themePreset: 'light',
  edgeType: 'smoothstep',
  direction: 'TOP_DOWN',
  edgeDashed: false,
  hideEdgeLabels: false,
  showMiniMap: true,
};

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function ensureUi(ui: Partial<ProjectUI> | undefined): ProjectUI {
  return {
    ...DEFAULT_UI,
    ...(ui ?? {}),
    edgeDashed: typeof ui?.edgeDashed === 'boolean' ? ui.edgeDashed : DEFAULT_UI.edgeDashed,
    hideEdgeLabels: typeof ui?.hideEdgeLabels === 'boolean' ? ui.hideEdgeLabels : DEFAULT_UI.hideEdgeLabels,
    showMiniMap: typeof ui?.showMiniMap === 'boolean' ? ui.showMiniMap : DEFAULT_UI.showMiniMap,
  };
}

function normalizeHandleId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  const lower = normalized.toLowerCase();
  if (lower === 'null' || lower === 'undefined') return undefined;
  return normalized;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function clampHandleCount(value: unknown, fallback: number): number {
  const rounded = Math.round(toFiniteNumber(value, fallback));
  if (!Number.isFinite(rounded)) return fallback;
  return Math.max(0, Math.min(8, rounded));
}

function getSourceHandleCount(node: Page['nodes'][number] | undefined): number {
  if (!node) return 0;
  const def = nodeTypeRegistry[node.type];
  return node.type === 'router'
    ? clampHandleCount(node.data.outputCount, def.outputHandles)
    : def.outputHandles;
}

function getTargetHandleCount(node: Page['nodes'][number] | undefined): number {
  if (!node) return 0;
  const def = nodeTypeRegistry[node.type];
  return node.type === 'router'
    ? clampHandleCount(node.data.inputCount, def.inputHandles)
    : def.inputHandles;
}

function getDefaultSourceHandle(node: Page['nodes'][number] | undefined): string | undefined {
  const count = getSourceHandleCount(node);
  return count > 0 ? 'out-0' : undefined;
}

function getDefaultTargetHandle(node: Page['nodes'][number] | undefined): string | undefined {
  const count = getTargetHandleCount(node);
  return count > 0 ? 'in-0' : undefined;
}

function createDefaultPage(name: string): Page {
  return {
    id: uuid(),
    name,
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
    edges: [],
  };
}

function ensurePages(pages: Page[] | undefined, defaultName: string): Page[] {
  if (!pages?.length) return [createDefaultPage(defaultName)];

  return pages.map((page, index) => {
    const nodes = Array.isArray(page.nodes) ? page.nodes : [];
    const nodeById = new Map(nodes.map(node => [node.id, node]));

    return {
      ...page,
      id: page.id || uuid(),
      name: page.name || `${defaultName} ${index + 1}`,
      viewport: {
        x: typeof page.viewport?.x === 'number' ? page.viewport.x : 0,
        y: typeof page.viewport?.y === 'number' ? page.viewport.y : 0,
        zoom: typeof page.viewport?.zoom === 'number' ? page.viewport.zoom : 1,
      },
      nodes,
      edges: (Array.isArray(page.edges) ? page.edges : [])
        .filter(edge => edge && typeof edge === 'object')
        .flatMap(edge => {
          const sourceNode = nodeById.get(edge.source);
          const targetNode = nodeById.get(edge.target);
          const sourceCount = getSourceHandleCount(sourceNode);
          const targetCount = getTargetHandleCount(targetNode);
          if (sourceCount <= 0 || targetCount <= 0) return [];

          const sourceHandle = normalizeHandleId(edge.sourceHandle) ?? getDefaultSourceHandle(sourceNode);
          const targetHandle = normalizeHandleId(edge.targetHandle) ?? getDefaultTargetHandle(targetNode);
          if (!sourceHandle || !targetHandle) return [];

          return [{
            ...edge,
            sourceHandle,
            targetHandle,
          }];
        }),
    };
  });
}

function ensureFlowGraph(
  graph: FlowGraph | undefined,
  fallbackUi: ProjectUI,
  fallbackPages: Page[] | undefined,
  defaultPageName: string,
): FlowGraph {
  const ui = ensureUi(graph?.ui ?? fallbackUi);
  const pages = ensurePages(graph?.pages ?? fallbackPages, defaultPageName);
  return { ui, pages };
}

export function migrateProjectToFlowModel(project: Project): Project {
  const topLevelUi = ensureUi(project.ui);
  const topLevelPages = ensurePages(project.pages, 'Main');
  const requestedFlow: FlowMode = project.activeFlow === 'business' ? 'business' : 'development';

  const development = ensureFlowGraph(
    project.flows?.development,
    topLevelUi,
    requestedFlow === 'development' ? topLevelPages : undefined,
    'Development Main',
  );
  const business = ensureFlowGraph(
    project.flows?.business,
    topLevelUi,
    requestedFlow === 'business' ? topLevelPages : undefined,
    'Business Main',
  );

  const activeFlow: FlowMode = requestedFlow;
  const activeGraph = activeFlow === 'business' ? business : development;

  return {
    ...project,
    schemaVersion: project.schemaVersion || FLOW_MODEL_SCHEMA_VERSION,
    ui: cloneValue(activeGraph.ui),
    pages: cloneValue(activeGraph.pages),
    activeFlow,
    flows: {
      development,
      business,
    },
  };
}

export function syncProjectFlowState(project: Project): Project {
  const requestedFlow: FlowMode = project.activeFlow === 'business' ? 'business' : 'development';
  const snapshotUi = ensureUi(project.ui);
  const snapshotPages = ensurePages(
    project.pages,
    requestedFlow === 'business' ? 'Business Main' : 'Development Main',
  );

  const nextInput: Project = {
    ...project,
    activeFlow: requestedFlow,
    flows: {
      development: project.flows?.development ?? {
        ui: cloneValue(snapshotUi),
        pages: ensurePages(undefined, 'Development Main'),
      },
      business: project.flows?.business ?? {
        ui: cloneValue(snapshotUi),
        pages: ensurePages(undefined, 'Business Main'),
      },
    },
  };

  nextInput.flows![requestedFlow] = {
    ui: cloneValue(snapshotUi),
    pages: cloneValue(snapshotPages),
  };

  const normalized = migrateProjectToFlowModel(nextInput);
  const activeFlow = normalized.activeFlow ?? 'development';

  const nextFlows = {
    ...normalized.flows!,
    [activeFlow]: {
      ui: cloneValue(normalized.ui),
      pages: cloneValue(normalized.pages),
    },
  };

  return {
    ...normalized,
    schemaVersion: FLOW_MODEL_SCHEMA_VERSION,
    flows: nextFlows,
  };
}
