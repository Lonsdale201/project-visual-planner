import { v4 as uuid } from 'uuid';
import type { Project, Page, ProjectNode, NodeKind, FlowDirection } from '../model/types';
import projectManagerSaasRaw from './data/project-manager-saas.knitflow.json';
import aiApiStarterRaw from './data/ai-api-starter.knitflow.json';
import wpLmsPluginRaw from './data/wp-lms-plugin.knitflow.json';

export interface BlueprintPresetMeta {
  id: string;
  name: string;
  summary: string;
  tags: string[];
  pageCount: number;
}

interface BlueprintPreset extends BlueprintPresetMeta {
  project: Project;
}

const blueprintPresetsInternal: BlueprintPreset[] = [
  {
    id: 'project-manager-saas',
    name: 'Project Manager SaaS',
    summary: 'Full-stack collaborative PM system with AI, integrations, milestones, and delivery flow.',
    tags: ['full', 'saas', 'ai', 'collaboration'],
    pageCount: (projectManagerSaasRaw as Project).pages.length,
    project: projectManagerSaasRaw as Project,
  },
  {
    id: 'ai-api-starter',
    name: 'AI API Starter',
    summary: 'Lean starter architecture for auth + core API + DB + one external notification integration.',
    tags: ['starter', 'api', 'ai'],
    pageCount: (aiApiStarterRaw as Project).pages.length,
    project: aiApiStarterRaw as Project,
  },
  {
    id: 'wp-lms-plugin',
    name: 'WordPress LMS Plugin',
    summary: 'WP LMS plugin architecture with custom table CRUD, ORM/DTO/Presenter pattern, and split domain flows.',
    tags: ['wordpress', 'plugin', 'lms', 'crud'],
    pageCount: (wpLmsPluginRaw as Project).pages.length,
    project: wpLmsPluginRaw as Project,
  },
];

export const blueprintPresets: BlueprintPresetMeta[] = blueprintPresetsInternal.map(({ project: _project, ...meta }) => meta);

function cloneProject(project: Project): Project {
  if (typeof structuredClone === 'function') return structuredClone(project);
  return JSON.parse(JSON.stringify(project)) as Project;
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

function getNodeWidth(type: NodeKind): number {
  if (type === 'overview') return 540;
  if (type === 'code') return 390;
  return 340;
}

function getNodeHeight(node: ProjectNode): number {
  switch (node.type) {
    case 'overview':
      return 520;
    case 'database': {
      const schema = typeof node.data.schemaNotes === 'string' ? node.data.schemaNotes : '';
      const rows = Math.max(4, schema.split('\n').filter(Boolean).length);
      return 180 + Math.min(6, rows) * 24;
    }
    case 'service': {
      const endpoints = Array.isArray(node.data.endpoints) ? node.data.endpoints.length : 0;
      return 150 + Math.min(4, endpoints) * 26 + (endpoints > 4 ? 22 : 0);
    }
    case 'code':
      return Boolean(node.data.expanded) ? 460 : 330;
    case 'milestone':
      return 170;
    case 'integration':
      return 185;
    case 'action':
      return 170;
    case 'comment':
    case 'spec':
      return 170;
    default:
      return 165;
  }
}

function overlaps(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }, gap = 26): boolean {
  return !(
    a.x + a.w + gap <= b.x
    || b.x + b.w + gap <= a.x
    || a.y + a.h + gap <= b.y
    || b.y + b.h + gap <= a.y
  );
}

function autoResolveNodeOverlaps(page: Page, direction: FlowDirection): Page {
  const sortedNodes = [...page.nodes].sort((a, b) => {
    const aAxes = toFlowAxes(a.position, direction);
    const bAxes = toFlowAxes(b.position, direction);
    if (aAxes.primary !== bAxes.primary) return aAxes.primary - bAxes.primary;
    return aAxes.secondary - bAxes.secondary;
  });

  const placed: ProjectNode[] = [];

  for (const node of sortedNodes) {
    const width = getNodeWidth(node.type);
    const height = getNodeHeight(node);
    let x = node.position.x;
    let y = node.position.y;
    let guard = 0;

    while (guard < 260) {
      const currentBox = { x, y, w: width, h: height };
      const blocker = placed.find(other => {
        const otherBox = {
          x: other.position.x,
          y: other.position.y,
          w: getNodeWidth(other.type),
          h: getNodeHeight(other),
        };
        return overlaps(currentBox, otherBox);
      });

      if (!blocker) break;
      if (direction === 'TOP_DOWN') {
        y = blocker.position.y + getNodeHeight(blocker) + 34;
      } else if (direction === 'LEFT_RIGHT') {
        x = blocker.position.x + getNodeWidth(blocker.type) + 34;
      } else {
        x = blocker.position.x - width - 34;
      }
      guard += 1;
    }

    placed.push({
      ...node,
      position: { x, y },
    });
  }

  const byId = new Map(placed.map(node => [node.id, node]));
  return {
    ...page,
    nodes: page.nodes.map(node => byId.get(node.id) ?? node),
  };
}

function autoLayoutByTopology(page: Page, direction: FlowDirection): Page {
  if (!page.nodes.length) return page;

  const nodeById = new Map(page.nodes.map(node => [node.id, node]));
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  page.nodes.forEach(node => {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
  });

  page.edges.forEach(edge => {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) return;
    outgoing.get(edge.source)?.push(edge.target);
    incoming.get(edge.target)?.push(edge.source);
  });

  const originalAxes = new Map<string, { primary: number; secondary: number }>(
    page.nodes.map(node => [node.id, toFlowAxes(node.position, direction)]),
  );

  const indegree = new Map<string, number>(page.nodes.map(node => [node.id, incoming.get(node.id)?.length ?? 0]));
  const depth = new Map<string, number>(page.nodes.map(node => [node.id, 0]));
  const queue = page.nodes
    .filter(node => (indegree.get(node.id) ?? 0) === 0)
    .sort((a, b) => (originalAxes.get(a.id)?.secondary ?? 0) - (originalAxes.get(b.id)?.secondary ?? 0))
    .map(node => node.id);

  const visited = new Set<string>();
  while (queue.length) {
    const current = queue.shift()!;
    visited.add(current);
    const nextDepth = (depth.get(current) ?? 0) + 1;
    const nextNodes = outgoing.get(current) ?? [];

    nextNodes.forEach(targetId => {
      depth.set(targetId, Math.max(depth.get(targetId) ?? 0, nextDepth));
      const nextIndegree = (indegree.get(targetId) ?? 1) - 1;
      indegree.set(targetId, nextIndegree);
      if (nextIndegree === 0) {
        queue.push(targetId);
      }
    });
  }

  if (visited.size < page.nodes.length) {
    const remaining = page.nodes
      .filter(node => !visited.has(node.id))
      .sort((a, b) => (originalAxes.get(a.id)?.secondary ?? 0) - (originalAxes.get(b.id)?.secondary ?? 0));

    remaining.forEach(node => {
      const parents = incoming.get(node.id) ?? [];
      const parentDepth = parents.length ? Math.max(...parents.map(parentId => depth.get(parentId) ?? 0)) : 0;
      depth.set(node.id, parentDepth + (parents.length ? 1 : 0));
    });
  }

  const maxDepthBeforeMilestones = Math.max(...[...depth.values(), 0]);
  const milestoneDepth = maxDepthBeforeMilestones + 1;
  page.nodes.forEach(node => {
    if (node.type === 'milestone') {
      depth.set(node.id, milestoneDepth);
    }
  });

  const layerMap = new Map<number, ProjectNode[]>();
  page.nodes.forEach(node => {
    const layer = depth.get(node.id) ?? 0;
    const bucket = layerMap.get(layer) ?? [];
    bucket.push(node);
    layerMap.set(layer, bucket);
  });

  const layers = [...layerMap.entries()].sort((a, b) => a[0] - b[0]);
  const axisPositionById = new Map<string, { primary: number; secondary: number }>();
  const primaryGap = 96;
  const secondaryGap = 52;
  let primaryCursor = 0;

  layers.forEach(([, nodes]) => {
    const getAnchor = (node: ProjectNode): number => {
      if (node.type === 'milestone') {
        const value = Number(node.data.order);
        if (Number.isFinite(value)) return value * 1000;
      }
      const parentSecondary = (incoming.get(node.id) ?? [])
        .map(parentId => axisPositionById.get(parentId)?.secondary)
        .filter((value): value is number => typeof value === 'number');
      if (parentSecondary.length) {
        return parentSecondary.reduce((sum, value) => sum + value, 0) / parentSecondary.length;
      }
      return originalAxes.get(node.id)?.secondary ?? 0;
    };

    nodes.sort((a, b) => {
      const anchorDelta = getAnchor(a) - getAnchor(b);
      if (anchorDelta !== 0) return anchorDelta;
      return (originalAxes.get(a.id)?.secondary ?? 0) - (originalAxes.get(b.id)?.secondary ?? 0);
    });

    const sizeById = new Map(
      nodes.map(node => {
        const width = getNodeWidth(node.type);
        const height = getNodeHeight(node);
        const primarySize = direction === 'TOP_DOWN' ? height : width;
        const secondarySize = direction === 'TOP_DOWN' ? width : height;
        return [node.id, { primarySize, secondarySize }] as const;
      }),
    );

    const layerPrimarySize = Math.max(...nodes.map(node => sizeById.get(node.id)?.primarySize ?? 0), 0);
    const secondaryTotal = nodes.reduce(
      (sum, node, index) => sum + (sizeById.get(node.id)?.secondarySize ?? 0) + (index > 0 ? secondaryGap : 0),
      0,
    );
    let secondaryCursor = -secondaryTotal / 2;
    const primaryCenter = primaryCursor + layerPrimarySize / 2;

    nodes.forEach(node => {
      const secondarySize = sizeById.get(node.id)?.secondarySize ?? 0;
      const secondaryCenter = secondaryCursor + secondarySize / 2;
      axisPositionById.set(node.id, { primary: primaryCenter, secondary: secondaryCenter });
      secondaryCursor += secondarySize + secondaryGap;
    });

    primaryCursor += layerPrimarySize + primaryGap;
  });

  const laidOutNodes = page.nodes.map(node => {
    const axisPos = axisPositionById.get(node.id);
    if (!axisPos) return node;
    return { ...node, position: fromFlowAxes(axisPos.primary, axisPos.secondary, direction) };
  });

  const originalCenter = page.nodes.reduce(
    (acc, node) => ({ x: acc.x + node.position.x, y: acc.y + node.position.y }),
    { x: 0, y: 0 },
  );
  originalCenter.x /= page.nodes.length;
  originalCenter.y /= page.nodes.length;

  const layoutCenter = laidOutNodes.reduce(
    (acc, node) => ({ x: acc.x + node.position.x, y: acc.y + node.position.y }),
    { x: 0, y: 0 },
  );
  layoutCenter.x /= laidOutNodes.length;
  layoutCenter.y /= laidOutNodes.length;

  const shiftX = originalCenter.x - layoutCenter.x;
  const shiftY = originalCenter.y - layoutCenter.y;

  return {
    ...page,
    nodes: laidOutNodes.map(node => ({
      ...node,
      position: { x: node.position.x + shiftX, y: node.position.y + shiftY },
    })),
  };
}

function cloneNodeData<T>(data: T): T {
  if (typeof structuredClone === 'function') return structuredClone(data);
  return JSON.parse(JSON.stringify(data)) as T;
}

function remapPageIdsSafe(page: Page): Page {
  const nodeIdMap = new Map<string, string>();
  const nodes = page.nodes.map(node => {
    const newId = uuid();
    nodeIdMap.set(node.id, newId);
    return {
      ...node,
      id: newId,
      data: cloneNodeData(node.data),
    };
  });

  const edges = page.edges
    .map(edge => {
      const newSource = nodeIdMap.get(edge.source);
      const newTarget = nodeIdMap.get(edge.target);
      if (!newSource || !newTarget) return null;
      return {
        ...edge,
        id: uuid(),
        source: newSource,
        target: newTarget,
      };
    })
    .filter((edge): edge is Page['edges'][number] => edge !== null);

  return {
    ...page,
    id: uuid(),
    nodes,
    edges,
  };
}

function getBlueprintProjectInternal(presetId: string): Project {
  const preset = blueprintPresetsInternal.find(item => item.id === presetId);
  if (!preset) throw new Error(`Unknown blueprint preset: ${presetId}`);
  return cloneProject(preset.project);
}

function applyDirectionToPages(pages: Page[], direction: FlowDirection): Page[] {
  return pages.map(page => ({
    ...autoLayoutByTopology(
      {
        ...page,
        nodes: direction === 'TOP_DOWN'
          ? page.nodes
          : realignNodesToDirection(page.nodes, 'TOP_DOWN', direction),
      },
      direction,
    ),
  }));
}

export function instantiateBlueprintProject(presetId: string, direction: FlowDirection = 'TOP_DOWN'): Project {
  const raw = getBlueprintProjectInternal(presetId);
  const now = new Date().toISOString();

  const pages = raw.pages.map(page => remapPageIdsSafe(page));
  const directedPages = applyDirectionToPages(pages, direction);
  const laidOutPages = directedPages.map(page => autoResolveNodeOverlaps(page, direction));

  return {
    ...raw,
    project: {
      ...raw.project,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    },
    ui: {
      ...raw.ui,
      direction,
    },
    pages: laidOutPages,
  };
}

export function instantiateBlueprintPages(presetId: string, direction: FlowDirection = 'TOP_DOWN'): Page[] {
  const raw = getBlueprintProjectInternal(presetId);
  const remappedPages = raw.pages.map(page => remapPageIdsSafe(page));
  const directedPages = applyDirectionToPages(remappedPages, direction);
  return directedPages.map(page => autoResolveNodeOverlaps(page, direction));
}
