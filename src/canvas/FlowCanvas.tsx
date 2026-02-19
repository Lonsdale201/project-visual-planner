import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ConnectionLineType,
  addEdge as rfAddEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type EdgeTypes,
  type ReactFlowInstance,
  BackgroundVariant,
} from '@xyflow/react';
import {
  Menu, MenuItem, ListItemIcon, ListItemText,
  Box, Paper, Typography, IconButton, Chip, Divider, Tooltip, Stack,
} from '@mui/material';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeselectOutlinedIcon from '@mui/icons-material/DeselectOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import ApiOutlinedIcon from '@mui/icons-material/ApiOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import '@xyflow/react/dist/style.css';
import './flowCanvas.css';
import { useProjectStore } from '../store/useProjectStore';
import FlowNode from './nodeTypes/FlowNode';
import ProjectEdgeRenderer, { type ProjectEdgeData } from './edgeTypes/ProjectEdge';
import type { EdgeType, NodeKind, ProjectNode, ProjectEdge as ProjectEdgeModel, Page, StackItemData } from '../model/types';
import { nodeTypeRegistry } from '../model/registry';
import { nodeColorMap } from '../utils/nodeColors';
import { v4 as uuid } from 'uuid';

const nodeTypes: NodeTypes = {
  service: FlowNode,
  workstream: FlowNode,
  bridge: FlowNode,
  router: FlowNode,
  stack: FlowNode,
  action: FlowNode,
  database: FlowNode,
  infra: FlowNode,
  framework: FlowNode,
  capability: FlowNode,
  integration: FlowNode,
  brand: FlowNode,
  code: FlowNode,
  overview: FlowNode,
  comment: FlowNode,
  spec: FlowNode,
  milestone: FlowNode,
  persona: FlowNode,
  feature: FlowNode,
  dataEntity: FlowNode,
  channel: FlowNode,
  kpi: FlowNode,
  risk: FlowNode,
};

const edgeTypes: EdgeTypes = {
  project: ProjectEdgeRenderer,
};

interface ClipboardPayload {
  nodes: ProjectNode[];
  edges: ProjectEdgeModel[];
}

interface NodeContextMenuState {
  nodeId: string;
  mouseX: number;
  mouseY: number;
}

interface NavigatorTreeNode {
  id: string;
  type: NodeKind;
  name: string;
  children: string[];
  attachedComments: number;
  isStacked: boolean;
}

const navigatorIconMap: Record<string, React.ReactElement> = {
  DnsOutlined: <DnsOutlinedIcon sx={{ fontSize: 14 }} />,
  PlayArrowOutlined: <PlayArrowOutlinedIcon sx={{ fontSize: 14 }} />,
  StorageOutlined: <StorageOutlinedIcon sx={{ fontSize: 14 }} />,
  CloudOutlined: <CloudOutlinedIcon sx={{ fontSize: 14 }} />,
  AccountTreeOutlined: <AccountTreeOutlinedIcon sx={{ fontSize: 14 }} />,
  ApiOutlined: <ApiOutlinedIcon sx={{ fontSize: 14 }} />,
  CodeOutlined: <CodeOutlinedIcon sx={{ fontSize: 14 }} />,
  InsightsOutlined: <InsightsOutlinedIcon sx={{ fontSize: 14 }} />,
  ChatBubbleOutline: <ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />,
  DescriptionOutlined: <DescriptionOutlinedIcon sx={{ fontSize: 14 }} />,
  FlagOutlined: <FlagOutlinedIcon sx={{ fontSize: 14 }} />,
};

function getNodeDisplayName(node: ProjectNode): string {
  const name = typeof node.data.name === 'string' ? node.data.name : '';
  const title = typeof node.data.title === 'string' ? node.data.title : '';
  return (name || title || node.type).trim();
}

function selectActivePage(s: { project: { pages: Page[] }; activePageId: string }): Page {
  return s.project.pages.find(p => p.id === s.activePageId) ?? s.project.pages[0];
}

function getConnectionLineType(edgeType: EdgeType): ConnectionLineType {
  if (edgeType === 'straight') return ConnectionLineType.Straight;
  if (edgeType === 'smoothstep') return ConnectionLineType.SmoothStep;
  return ConnectionLineType.Bezier;
}

function getSourceThemeForNode(node: ProjectNode | undefined): ProjectEdgeData['sourceTheme'] {
  if (!node) return undefined;
  const fallbackPreset = nodeTypeRegistry[node.type].defaultStylePreset;
  const preset = node.stylePreset ?? fallbackPreset;
  const colors = nodeColorMap[preset];
  return {
    border: colors.border,
    header: colors.header,
    text: colors.text,
  };
}

function cloneData<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
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

function getSourceHandleCount(node: ProjectNode | undefined): number {
  if (!node) return 0;
  const def = nodeTypeRegistry[node.type];
  return node.type === 'router'
    ? clampHandleCount(node.data.outputCount, def.outputHandles)
    : def.outputHandles;
}

function getTargetHandleCount(node: ProjectNode | undefined): number {
  if (!node) return 0;
  const def = nodeTypeRegistry[node.type];
  return node.type === 'router'
    ? clampHandleCount(node.data.inputCount, def.inputHandles)
    : def.inputHandles;
}

function getDefaultSourceHandle(node: ProjectNode | undefined): string | undefined {
  const count = getSourceHandleCount(node);
  return count > 0 ? 'out-0' : undefined;
}

function getDefaultTargetHandle(node: ProjectNode | undefined): string | undefined {
  const count = getTargetHandleCount(node);
  return count > 0 ? 'in-0' : undefined;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return target.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
}

const COMMENT_ATTACH_RADIUS = 260;

interface AttachNodeLike {
  id: string;
  type?: string;
  data?: Record<string, unknown>;
  position: { x: number; y: number };
  width?: number;
  height?: number;
}

const COMMENT_ATTACH_GAP = 28;
const COMMENT_STACK_GAP = 20;
const ATTACHABLE_NODE_TYPES = new Set<NodeKind>(['comment', 'code']);

function isAttachableNodeType(type?: string): boolean {
  if (!type) return false;
  return ATTACHABLE_NODE_TYPES.has(type as NodeKind);
}

function isStickyCommentNode(type?: string, data?: Record<string, unknown>): boolean {
  return type === 'comment' && Boolean(data?.sticky);
}

function isAttachableNode(node: { type?: string; data?: Record<string, unknown> }): boolean {
  if (!isAttachableNodeType(node.type)) return false;
  if (isStickyCommentNode(node.type, node.data)) return false;
  return true;
}

function estimateNodeWidth(node: ProjectNode): number {
  if (node.type === 'overview') return 540;
  if (node.type === 'code') return 390;
  if (node.type === 'brand') return 88;
  return 340;
}

function estimateNodeHeight(node: ProjectNode): number {
  if (node.type === 'overview') return 520;
  if (node.type === 'milestone') return 170;
  if (node.type === 'integration') return 185;
  if (node.type === 'brand') return 88;
  if (node.type === 'action') return 170;

  if (node.type === 'code') {
    return Boolean(node.data.expanded) ? 460 : 330;
  }

  if (node.type === 'database') {
    const schema = typeof node.data.schemaNotes === 'string' ? node.data.schemaNotes : '';
    const rows = Math.max(4, schema.split('\n').filter(Boolean).length);
    return 180 + Math.min(6, rows) * 24;
  }

  if (node.type === 'service') {
    const endpoints = Array.isArray(node.data.endpoints) ? node.data.endpoints.length : 0;
    return 150 + Math.min(4, endpoints) * 26 + (endpoints > 4 ? 22 : 0);
  }

  if (node.type === 'comment' || node.type === 'spec') {
    const body = typeof node.data.body === 'string' ? node.data.body.trim() : '';
    if (!body) return 170;
    const lineCount = Math.max(body.split('\n').length, Math.ceil(body.length / 56));
    return Math.min(360, 170 + Math.max(0, lineCount - 4) * 12);
  }

  return 165;
}

function findAttachTargetId(draggedNode: AttachNodeLike, canvasNodes: AttachNodeLike[]): string | null {
  if (!isAttachableNode(draggedNode)) return null;

  const centerOf = (node: AttachNodeLike) => ({
    x: node.position.x + ((node.width ?? 320) / 2),
    y: node.position.y + ((node.height ?? 170) / 2),
  });

  const draggedCenter = centerOf(draggedNode);
  let bestId: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const node of canvasNodes) {
    if (node.id === draggedNode.id || node.type === 'comment') continue;
    const c = centerOf(node);
    const dx = c.x - draggedCenter.x;
    const dy = c.y - draggedCenter.y;
    const dist = Math.hypot(dx, dy);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestId = node.id;
    }
  }

  if (!bestId) return null;
  if (bestDistance > COMMENT_ATTACH_RADIUS) return null;
  return bestId;
}

// Store -> React Flow
function storeNodesToRF(nodes: ProjectNode[]): Node[] {
  return nodes.map(n => ({
    id: n.id,
    type: n.type,
    position: { ...n.position },
    draggable: !(n.type === 'comment' && Boolean(n.data?.sticky)),
    data: { ...n.data, nodeKind: n.type, stylePreset: n.stylePreset },
  }));
}

function storeEdgesToRF(
  edges: ProjectEdgeModel[],
  globalEdgeType: EdgeType,
  edgeDashed: boolean,
  hideEdgeLabels: boolean,
  nodes: ProjectNode[],
  dimmedNodeIds?: Set<string>,
): Edge[] {
  const nodeById = new Map(nodes.map(node => [node.id, node]));

  return edges.flatMap(e => {
    const sourceNode = nodeById.get(e.source);
    const targetNode = nodeById.get(e.target);
    const sourceCount = getSourceHandleCount(sourceNode);
    const targetCount = getTargetHandleCount(targetNode);
    if (sourceCount <= 0 || targetCount <= 0) return [];

    const sourceHandle = normalizeHandleId(e.sourceHandle) ?? getDefaultSourceHandle(sourceNode);
    const targetHandle = normalizeHandleId(e.targetHandle) ?? getDefaultTargetHandle(targetNode);
    if (!sourceHandle || !targetHandle) return [];

    return [{
      source: e.source,
      target: e.target,
      sourceHandle,
      targetHandle,
      id: e.id,
      type: 'project',
      label: e.label,
      data: {
        edgeKind: e.type ?? globalEdgeType,
        sourceTheme: getSourceThemeForNode(sourceNode),
        hideLabel: hideEdgeLabels,
        dimmed: Boolean(dimmedNodeIds && (dimmedNodeIds.has(e.source) || dimmedNodeIds.has(e.target))),
      } satisfies ProjectEdgeData,
      style: edgeDashed ? { strokeDasharray: '8 6' } : undefined,
    }];
  });
}

interface FlowCanvasProps {
  showNodeNavigator?: boolean;
}

interface StickyDragState {
  nodeId: string;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
}

export default function FlowCanvas({ showNodeNavigator = false }: FlowCanvasProps) {
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const clipboardRef = useRef<ClipboardPayload | null>(null);
  const pasteCounterRef = useRef(0);
  const pendingSelectedNodeIdsRef = useRef<Set<string> | null>(null);
  const attachPreviewFrameRef = useRef<number | null>(null);
  const pendingAttachPreviewIdRef = useRef<string | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const navDragRef = useRef<{ dragging: boolean; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const stickyDragRef = useRef<StickyDragState | null>(null);

  // Read from store
  const storeNodes = useProjectStore(s => selectActivePage(s).nodes);
  const storeEdges = useProjectStore(s => selectActivePage(s).edges);
  const pageViewport = useProjectStore(s => selectActivePage(s).viewport);
  const edgeType = useProjectStore(s => s.project.ui.edgeType);
  const flowDirection = useProjectStore(s => s.project.ui.direction);
  const edgeDashed = useProjectStore(s => Boolean(s.project.ui.edgeDashed));
  const hideEdgeLabels = useProjectStore(s => Boolean(s.project.ui.hideEdgeLabels));
  const showMiniMap = useProjectStore(s => (typeof s.project.ui.showMiniMap === 'boolean' ? s.project.ui.showMiniMap : true));

  // Local React Flow state: dimensions, selection, interactions
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [nodeContextMenu, setNodeContextMenu] = useState<NodeContextMenuState | null>(null);
  const [attachPreviewTargetId, setAttachPreviewTargetId] = useState<string | null>(null);
  const [navigatorPos, setNavigatorPos] = useState({ x: 16, y: 16 });
  const [expandedNavIds, setExpandedNavIds] = useState<Set<string>>(new Set());
  const [hiddenNodeIds, setHiddenNodeIds] = useState<Set<string>>(new Set());
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [stickyDragPreviewById, setStickyDragPreviewById] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    const viewport = reactFlowRef.current?.getViewport() ?? pageViewport;
    const zoom = viewport.zoom || 1;
    const state = useProjectStore.getState();
    const activePage = state.project.pages.find(p => p.id === state.activePageId);
    if (!activePage) return;

    let changed = false;
    const nextNodes = activePage.nodes.map(node => {
      if (node.type !== 'comment') return node;

      const sticky = Boolean(node.data.sticky);
      const pinned = Boolean(node.data.stickyPinned);

      if (sticky && !pinned) {
        changed = true;
        return {
          ...node,
          position: {
            x: node.position.x * zoom + viewport.x,
            y: node.position.y * zoom + viewport.y,
          },
          data: {
            ...node.data,
            stickyPinned: true,
          },
        };
      }

      if (!sticky && pinned) {
        changed = true;
        const nextData = { ...node.data } as Record<string, unknown>;
        delete nextData.stickyPinned;
        return {
          ...node,
          position: {
            x: (node.position.x - viewport.x) / zoom,
            y: (node.position.y - viewport.y) / zoom,
          },
          data: nextData,
        };
      }

      return node;
    });

    if (changed) {
      state.replacePageGraph(state.activePageId, nextNodes, activePage.edges);
    }
  }, [storeNodes, pageViewport]);

  const {
    navigatorRoots,
    navigatorNodeMap,
    navigatorAttachedCommentCounts,
    navigatorDescendants,
    visibleNodeIds,
    dimmedNodeIds,
  } = React.useMemo(() => {
    const nodeById = new Map(storeNodes.map(node => [node.id, node]));

    const attachedCommentCounts = new Map<string, number>();
    storeNodes.forEach(node => {
      if (!isAttachableNode(node)) return;
      const attachedTo = typeof node.data.attachedTo === 'string' ? node.data.attachedTo : '';
      if (!attachedTo || !nodeById.has(attachedTo)) return;
      attachedCommentCounts.set(attachedTo, (attachedCommentCounts.get(attachedTo) ?? 0) + 1);
    });

    const treeCandidateNodes = storeNodes.filter(node => {
      if (!isAttachableNode(node)) return true;
      const attachedTo = typeof node.data.attachedTo === 'string' ? node.data.attachedTo : '';
      return !attachedTo || !nodeById.has(attachedTo);
    });
    const treeIds = new Set(treeCandidateNodes.map(node => node.id));

    const childrenById = new Map<string, string[]>();
    const parentsById = new Map<string, string[]>();
    const incomingCount = new Map<string, number>();
    treeCandidateNodes.forEach(node => {
      childrenById.set(node.id, []);
      parentsById.set(node.id, []);
      incomingCount.set(node.id, 0);
    });

    storeEdges.forEach(edge => {
      if (!treeIds.has(edge.source) || !treeIds.has(edge.target)) return;
      childrenById.get(edge.source)?.push(edge.target);
      parentsById.get(edge.target)?.push(edge.source);
      incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
    });

    const navNodeMap = new Map<string, NavigatorTreeNode>();
    treeCandidateNodes.forEach(node => {
      navNodeMap.set(node.id, {
        id: node.id,
        type: node.type,
        name: getNodeDisplayName(node),
        children: childrenById.get(node.id) ?? [],
        attachedComments: attachedCommentCounts.get(node.id) ?? 0,
        isStacked: node.type === 'stack',
      });
    });

    const roots = treeCandidateNodes
      .filter(node => (incomingCount.get(node.id) ?? 0) === 0)
      .map(node => node.id);
    const fallbackRoots = roots.length ? roots : treeCandidateNodes.map(node => node.id);

    const descendants = new Map<string, Set<string>>();
    const attachedCommentsByTarget = new Map<string, string[]>();
    storeNodes.forEach(node => {
      if (!isAttachableNode(node)) return;
      const attachedTo = typeof node.data.attachedTo === 'string' ? node.data.attachedTo : '';
      if (!attachedTo) return;
      const list = attachedCommentsByTarget.get(attachedTo) ?? [];
      list.push(node.id);
      attachedCommentsByTarget.set(attachedTo, list);
    });

    const computeDescendants = (startId: string): Set<string> => {
      const visited = new Set<string>();
      const queue = [...(childrenById.get(startId) ?? [])];
      while (queue.length) {
        const next = queue.shift()!;
        if (visited.has(next)) continue;
        visited.add(next);
        (childrenById.get(next) ?? []).forEach(child => queue.push(child));
      }
      (attachedCommentsByTarget.get(startId) ?? []).forEach(commentId => visited.add(commentId));
      for (const nodeId of [...visited]) {
        (attachedCommentsByTarget.get(nodeId) ?? []).forEach(commentId => visited.add(commentId));
      }
      return visited;
    };

    treeCandidateNodes.forEach(node => {
      descendants.set(node.id, computeDescendants(node.id));
    });

    const visibleIds = new Set(storeNodes.map(node => node.id).filter(id => !hiddenNodeIds.has(id)));

    const dimmedIds = new Set<string>();
    if (showNodeNavigator && focusNodeId && visibleIds.has(focusNodeId)) {
      const focusSet = new Set<string>([focusNodeId]);

      (descendants.get(focusNodeId) ?? new Set<string>()).forEach(id => {
        if (visibleIds.has(id)) focusSet.add(id);
      });

      const parentQueue = [...(parentsById.get(focusNodeId) ?? [])];
      while (parentQueue.length) {
        const parentId = parentQueue.shift()!;
        if (focusSet.has(parentId)) continue;
        if (visibleIds.has(parentId)) focusSet.add(parentId);
        (parentsById.get(parentId) ?? []).forEach(nextParent => parentQueue.push(nextParent));
      }

      storeNodes.forEach(node => {
        if (!visibleIds.has(node.id)) return;
        if (!focusSet.has(node.id)) dimmedIds.add(node.id);
      });
    }

    return {
      navigatorRoots: fallbackRoots,
      navigatorNodeMap: navNodeMap,
      navigatorAttachedCommentCounts: attachedCommentCounts,
      navigatorDescendants: descendants,
      visibleNodeIds: visibleIds,
      dimmedNodeIds: dimmedIds,
    };
  }, [storeNodes, storeEdges, hiddenNodeIds, focusNodeId, showNodeNavigator]);

  useEffect(() => {
    if (!showNodeNavigator) return;
    setExpandedNavIds(prev => {
      if (prev.size > 0) return prev;
      return new Set(navigatorRoots);
    });
  }, [showNodeNavigator, navigatorRoots]);

  useEffect(() => {
    if (!focusNodeId) return;
    if (!navigatorNodeMap.has(focusNodeId) || hiddenNodeIds.has(focusNodeId)) {
      setFocusNodeId(null);
    }
  }, [focusNodeId, navigatorNodeMap, hiddenNodeIds]);

  useEffect(() => {
    if (showNodeNavigator) return;
    if (focusNodeId) setFocusNodeId(null);
  }, [showNodeNavigator, focusNodeId]);

  const { displayNodes, displayEdges, stickyOverlayNodes } = React.useMemo(() => {
    const nodeById = new Map(storeNodes.map(node => [node.id, node]));
    const attachedByTarget = new Map<string, ProjectNode[]>();
    const renderedNodes: ProjectNode[] = [];
    const renderedIds = new Set<string>();
    const stickyNodes: ProjectNode[] = [];

    storeNodes.forEach(node => {
      if (!visibleNodeIds.has(node.id)) return;
      if (!isAttachableNode(node)) return;
      const attachedTo = typeof node.data.attachedTo === 'string' ? node.data.attachedTo : '';
      if (!attachedTo || !nodeById.has(attachedTo) || !visibleNodeIds.has(attachedTo)) return;
      const list = attachedByTarget.get(attachedTo) ?? [];
      list.push(node);
      attachedByTarget.set(attachedTo, list);
    });

    const hasValidAttachTarget = (node: ProjectNode): boolean => {
      if (!isAttachableNode(node)) return false;
      const attachedTo = typeof node.data.attachedTo === 'string' ? node.data.attachedTo : '';
      if (!attachedTo || attachedTo === node.id) return false;
      return nodeById.has(attachedTo) && visibleNodeIds.has(attachedTo);
    };

    const renderNodeRecursive = (node: ProjectNode, positionOverride?: { x: number; y: number }) => {
      if (!visibleNodeIds.has(node.id)) return;
      if (renderedIds.has(node.id)) return;
      if (node.type === 'comment' && Boolean(node.data.sticky) && Boolean(node.data.stickyPinned)) {
        stickyNodes.push(node);
        renderedIds.add(node.id);
        return;
      }

      const attachedChildren = attachedByTarget.get(node.id) ?? [];
      const attachedCount = attachedChildren.length;
      const attachedCommentCount = attachedChildren.filter(child => child.type === 'comment').length;
      const attachedCodeCount = attachedChildren.filter(child => child.type === 'code').length;
      const projectedNode: ProjectNode = {
        ...node,
        position: positionOverride ? { ...positionOverride } : { ...node.position },
        data: {
          ...node.data,
          attachedNodeCount: attachedCount,
          attachedCommentCount,
          attachedCodeCount,
          attachedCommentsExpanded: Boolean(node.data.showAttachedComments),
          __attachCandidate: node.id === attachPreviewTargetId,
          __dimmed: dimmedNodeIds.has(node.id),
        },
      };

      renderedNodes.push(projectedNode);
      renderedIds.add(projectedNode.id);

      if (!Boolean(node.data.showAttachedComments)) return;
      const children = attachedByTarget.get(node.id) ?? [];
      if (!children.length) return;

      const childHeights = children.map(child => estimateNodeHeight(child));
      const totalChildrenHeight = childHeights.reduce((sum, h) => sum + h, 0);
      const totalGapsHeight = Math.max(0, children.length - 1) * COMMENT_STACK_GAP;
      const totalStackHeight = totalChildrenHeight + totalGapsHeight;
      const parentCenterY = projectedNode.position.y + (estimateNodeHeight(projectedNode) / 2);
      const startY = parentCenterY - (totalStackHeight / 2);
      const parentWidth = estimateNodeWidth(projectedNode);

      children.forEach((childNode, index) => {
        const offsetBefore = childHeights
          .slice(0, index)
          .reduce((sum, h) => sum + h + COMMENT_STACK_GAP, 0);
        const childWidth = estimateNodeWidth(childNode);
        const childX = flowDirection === 'RIGHT_LEFT'
          ? projectedNode.position.x - childWidth - COMMENT_ATTACH_GAP
          : projectedNode.position.x + parentWidth + COMMENT_ATTACH_GAP;
        const childY = startY + offsetBefore;

        renderNodeRecursive(childNode, { x: childX, y: childY });
      });
    };

    storeNodes.forEach(node => {
      if (!visibleNodeIds.has(node.id)) return;
      if (hasValidAttachTarget(node)) return;
      renderNodeRecursive(node);
    });

    storeNodes.forEach(node => {
      if (!visibleNodeIds.has(node.id)) return;
      if (renderedIds.has(node.id)) return;
      if (hasValidAttachTarget(node)) return;
      renderNodeRecursive(node);
    });

    const renderedEdges = storeEdges.filter(edge => renderedIds.has(edge.source) && renderedIds.has(edge.target));

    return { displayNodes: renderedNodes, displayEdges: renderedEdges, stickyOverlayNodes: stickyNodes };
  }, [storeNodes, storeEdges, flowDirection, attachPreviewTargetId, visibleNodeIds, dimmedNodeIds]);

  // Sync store -> local while preserving React Flow internals.
  useEffect(() => {
    setNodes(currentNodes => {
      const currentMap = new Map(currentNodes.map(n => [n.id, n]));
      const pendingSelectedNodeIds = pendingSelectedNodeIdsRef.current;

      const merged = displayNodes.map((sn: ProjectNode) => {
        const rfNew = storeNodesToRF([sn])[0];
        const existing = currentMap.get(sn.id);
        if (existing) {
          return {
            ...existing,
            position: rfNew.position,
            data: rfNew.data,
            type: rfNew.type,
            selected: pendingSelectedNodeIds ? pendingSelectedNodeIds.has(sn.id) : existing.selected,
          };
        }

        return pendingSelectedNodeIds ? { ...rfNew, selected: pendingSelectedNodeIds.has(sn.id) } : rfNew;
      });

      if (pendingSelectedNodeIds) {
        pendingSelectedNodeIdsRef.current = null;
      }

      return merged;
    });
  }, [displayNodes, setNodes]);

  useEffect(() => {
    setEdges(storeEdgesToRF(displayEdges, edgeType, edgeDashed, hideEdgeLabels, displayNodes, dimmedNodeIds));
  }, [displayEdges, displayNodes, edgeType, edgeDashed, hideEdgeLabels, setEdges, dimmedNodeIds]);

  const buildClipboardPayload = useCallback((page: Page, nodeIds: Set<string>): ClipboardPayload => {
    const copiedNodes = page.nodes
      .filter(n => nodeIds.has(n.id))
      .map(n => ({
        ...n,
        position: { ...n.position },
        data: cloneData(n.data),
      }));

    const copiedEdges = page.edges
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map(e => ({ ...e }));

    return { nodes: copiedNodes, edges: copiedEdges };
  }, []);

  const getNextPasteOffset = useCallback(() => {
    pasteCounterRef.current += 1;
    const step = pasteCounterRef.current;
    return {
      x: 48 + (step - 1) * 16,
      y: 36 + (step - 1) * 12,
    };
  }, []);

  const applyClonePayload = useCallback((payload: ClipboardPayload, offset: { x: number; y: number }): boolean => {
    if (!payload.nodes.length) return false;

    const state = useProjectStore.getState();
    const activePage = state.project.pages.find(p => p.id === state.activePageId);
    if (!activePage) return false;

    const idMap = new Map<string, string>();

    const clonedNodes: ProjectNode[] = payload.nodes.map(n => {
      const id = uuid();
      idMap.set(n.id, id);
      return {
        ...n,
        id,
        position: { x: n.position.x + offset.x, y: n.position.y + offset.y },
        data: cloneData(n.data),
      };
    });

    const clonedEdges: ProjectEdgeModel[] = payload.edges.flatMap(e => {
      const source = idMap.get(e.source);
      const target = idMap.get(e.target);
      if (!source || !target) return [];

      return [{
        ...e,
        id: uuid(),
        source,
        target,
      }];
    });

    const newNodeIds = new Set(clonedNodes.map(n => n.id));
    pendingSelectedNodeIdsRef.current = newNodeIds;

    state.setNodes(state.activePageId, [...activePage.nodes, ...clonedNodes]);
    state.setEdges(state.activePageId, [...activePage.edges, ...clonedEdges]);
    state.setSelectedNode(null);
    state.setSelectedEdge(null);

    return true;
  }, []);

  const deselectAll = useCallback(() => {
    setNodes(curr => curr.map(n => (n.selected ? { ...n, selected: false } : n)));
    setEdges(curr => curr.map(e => (e.selected ? { ...e, selected: false } : e)));

    const state = useProjectStore.getState();
    state.setSelectedNode(null);
    state.setSelectedEdge(null);
    setNodeContextMenu(null);
  }, [setNodes, setEdges]);

  const copySelection = useCallback((): boolean => {
    const state = useProjectStore.getState();
    const activePage = state.project.pages.find(p => p.id === state.activePageId);
    if (!activePage) return false;

    const selectedNodeIds = new Set(nodes.filter(n => n.selected).map(n => n.id));
    if (!selectedNodeIds.size && state.selectedNodeId) {
      selectedNodeIds.add(state.selectedNodeId);
    }

    if (!selectedNodeIds.size) return false;

    clipboardRef.current = buildClipboardPayload(activePage, selectedNodeIds);
    pasteCounterRef.current = 0;
    return true;
  }, [nodes, buildClipboardPayload]);

  const duplicateNodeIds = useCallback((nodeIds: string[]): boolean => {
    if (!nodeIds.length) return false;

    const state = useProjectStore.getState();
    const activePage = state.project.pages.find(p => p.id === state.activePageId);
    if (!activePage) return false;

    const payload = buildClipboardPayload(activePage, new Set(nodeIds));
    if (!payload.nodes.length) return false;

    const applied = applyClonePayload(payload, getNextPasteOffset());
    if (applied) {
      setNodeContextMenu(null);
    }
    return applied;
  }, [applyClonePayload, buildClipboardPayload, getNextPasteOffset]);

  const pasteClipboard = useCallback((): boolean => {
    const payload = clipboardRef.current;
    if (!payload) return false;

    const applied = applyClonePayload(payload, getNextPasteOffset());
    if (applied) {
      setNodeContextMenu(null);
    }
    return applied;
  }, [applyClonePayload, getNextPasteOffset]);

  useEffect(() => {
    const onGlobalKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && key === 'c') {
        if (isEditableTarget(event.target)) return;
        if (copySelection()) {
          event.preventDefault();
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === 'v') {
        if (isEditableTarget(event.target)) return;
        if (pasteClipboard()) {
          event.preventDefault();
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === 'z' && !event.shiftKey) {
        if (isEditableTarget(event.target)) return;
        useProjectStore.getState().undo();
        event.preventDefault();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        if (isEditableTarget(event.target)) return;
        const state = useProjectStore.getState();
        state.setUI({ hideEdgeLabels: !Boolean(state.project.ui.hideEdgeLabels) });
        event.preventDefault();
        return;
      }

      if (event.key === 'Escape') {
        const hasSelection =
          Boolean(nodeContextMenu) ||
          nodes.some(n => n.selected) ||
          edges.some(e => e.selected) ||
          Boolean(useProjectStore.getState().selectedNodeId) ||
          Boolean(useProjectStore.getState().selectedEdgeId);

        if (hasSelection) {
          event.preventDefault();
          deselectAll();
        }
      }
    };

    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, [copySelection, pasteClipboard, deselectAll, nodeContextMenu, nodes, edges]);

  useEffect(() => {
    return () => {
      if (attachPreviewFrameRef.current !== null) {
        cancelAnimationFrame(attachPreviewFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const drag = navDragRef.current;
      if (drag?.dragging) {
        event.preventDefault();
        const nextX = drag.originX + (event.clientX - drag.startX);
        const nextY = drag.originY + (event.clientY - drag.startY);
        setNavigatorPos({
          x: Math.max(8, nextX),
          y: Math.max(8, nextY),
        });
        return;
      }

      const stickyDrag = stickyDragRef.current;
      if (!stickyDrag) return;
      event.preventDefault();
      const nextX = stickyDrag.originX + (event.clientX - stickyDrag.startClientX);
      const nextY = stickyDrag.originY + (event.clientY - stickyDrag.startClientY);
      setStickyDragPreviewById(prev => ({
        ...prev,
        [stickyDrag.nodeId]: { x: nextX, y: nextY },
      }));
    };

    const onMouseUp = () => {
      if (navDragRef.current) {
        navDragRef.current.dragging = false;
      }

      const stickyDrag = stickyDragRef.current;
      if (!stickyDrag) return;
      const preview = stickyDragPreviewById[stickyDrag.nodeId];
      stickyDragRef.current = null;
      if (!preview) return;

      const state = useProjectStore.getState();
      const activePage = state.project.pages.find(p => p.id === state.activePageId);
      if (!activePage) return;
      const nextNodes = activePage.nodes.map(node => (
        node.id === stickyDrag.nodeId
          ? { ...node, position: { x: preview.x, y: preview.y } }
          : node
      ));
      state.replacePageGraph(state.activePageId, nextNodes, activePage.edges);
      setStickyDragPreviewById(prev => {
        const next = { ...prev };
        delete next[stickyDrag.nodeId];
        return next;
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [stickyDragPreviewById]);

  const startStickyDrag = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const node = stickyOverlayNodes.find(n => n.id === nodeId);
    if (!node) return;
    const preview = stickyDragPreviewById[nodeId];
    stickyDragRef.current = {
      nodeId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: preview?.x ?? node.position.x,
      originY: preview?.y ?? node.position.y,
    };
  }, [stickyOverlayNodes, stickyDragPreviewById]);

  const startNavigatorDrag = useCallback((event: React.MouseEvent) => {
    navDragRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: navigatorPos.x,
      originY: navigatorPos.y,
    };
  }, [navigatorPos.x, navigatorPos.y]);

  const toggleNavCollapse = useCallback((nodeId: string) => {
    setExpandedNavIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const toggleNavFocus = useCallback((nodeId: string) => {
    setFocusNodeId(prev => (prev === nodeId ? null : nodeId));
  }, []);

  const toggleNodeHidden = useCallback((nodeId: string) => {
    const descendants = navigatorDescendants.get(nodeId) ?? new Set<string>();
    setHiddenNodeIds(prev => {
      const next = new Set(prev);
      const targetHidden = next.has(nodeId);
      if (targetHidden) {
        next.delete(nodeId);
        descendants.forEach(id => next.delete(id));
      } else {
        next.add(nodeId);
        descendants.forEach(id => next.add(id));
      }
      return next;
    });
    if (focusNodeId === nodeId) setFocusNodeId(null);
  }, [navigatorDescendants, focusNodeId]);

  const clearNavigatorFilters = useCallback(() => {
    setHiddenNodeIds(new Set());
    setFocusNodeId(null);
  }, []);

  const onNodeDrag = useCallback((_: React.MouseEvent, draggedNode: Node) => {
    const nextTargetId = isAttachableNode(draggedNode as AttachNodeLike) ? findAttachTargetId(draggedNode as AttachNodeLike, nodes as AttachNodeLike[]) : null;
    pendingAttachPreviewIdRef.current = nextTargetId;

    if (attachPreviewFrameRef.current !== null) return;
    attachPreviewFrameRef.current = requestAnimationFrame(() => {
      attachPreviewFrameRef.current = null;
      const next = pendingAttachPreviewIdRef.current;
      setAttachPreviewTargetId(current => (current === next ? current : next));
    });
  }, [nodes]);

  // Save dragged node positions to store after drag.
  const onNodeDragStop = useCallback((_: React.MouseEvent, draggedNode: Node, draggedNodes: Node[]) => {
    const dragBatch = Array.isArray(draggedNodes) && draggedNodes.length
      ? draggedNodes
      : [draggedNode];
    if (!dragBatch.length) return;

    const state = useProjectStore.getState();
    const activePage = state.project.pages.find(p => p.id === state.activePageId);
    if (!activePage) return;

    const draggedPositionById = new Map(
      dragBatch.map(n => [n.id, { x: n.position.x, y: n.position.y }]),
    );

    const isDraggedNodeAttachable = isAttachableNode(draggedNode as AttachNodeLike);
    const computedTargetId = isDraggedNodeAttachable ? findAttachTargetId(draggedNode as AttachNodeLike, nodes as AttachNodeLike[]) : null;
    const targetId = computedTargetId ?? attachPreviewTargetId;

    const nextNodes = activePage.nodes.map(node => {
      const position = draggedPositionById.get(node.id);
      const baseNode = position ? { ...node, position } : node;

      if (!isDraggedNodeAttachable || baseNode.id !== draggedNode.id) {
        return baseNode;
      }

      const currentAttachedTo = typeof baseNode.data?.attachedTo === 'string' ? baseNode.data.attachedTo : '';
      if (targetId === currentAttachedTo) return baseNode;

      const nextData = { ...baseNode.data } as Record<string, unknown>;
      if (targetId) nextData.attachedTo = targetId;
      else delete nextData.attachedTo;

      return {
        ...baseNode,
        data: nextData,
      };
    });

    state.replacePageGraph(state.activePageId, nextNodes, activePage.edges);
    setAttachPreviewTargetId(null);
  }, [attachPreviewTargetId, nodes]);

  const onConnect = useCallback((connection: Connection) => {
    const id = uuid();
    const state = useProjectStore.getState();
    const activePage = state.project.pages.find(p => p.id === state.activePageId);
    if (!activePage || !connection.source || !connection.target) return;

    const sourceNode = activePage.nodes.find(n => n.id === connection.source);
    const targetNode = activePage.nodes.find(n => n.id === connection.target);
    const sourceHandle = normalizeHandleId(connection.sourceHandle) ?? getDefaultSourceHandle(sourceNode);
    const targetHandle = normalizeHandleId(connection.targetHandle) ?? getDefaultTargetHandle(targetNode);
    if (!sourceHandle || !targetHandle) return;

    const sourceTheme = getSourceThemeForNode(sourceNode);

    setEdges(eds => rfAddEdge({
      source: connection.source,
      target: connection.target,
      sourceHandle,
      targetHandle,
      id,
      type: 'project',
      data: {
        edgeKind: edgeType,
        sourceTheme,
        hideLabel: hideEdgeLabels,
      } satisfies ProjectEdgeData,
      style: edgeDashed ? { strokeDasharray: '8 6' } : undefined,
    }, eds));

    state.addEdge({
      id,
      source: connection.source,
      target: connection.target,
      sourceHandle,
      targetHandle,
      type: edgeType as ProjectEdgeModel['type'],
    });
  }, [edgeType, edgeDashed, hideEdgeLabels, setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setNodeContextMenu(null);
    useProjectStore.getState().setSelectedNode(node.id);
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setNodeContextMenu(null);
    useProjectStore.getState().setSelectedEdge(edge.id);
  }, []);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    const alreadySelectedIds = new Set(nodes.filter(n => n.selected).map(n => n.id));
    const preserveSelection = alreadySelectedIds.size >= 2 && alreadySelectedIds.has(node.id);

    if (!preserveSelection) {
      setNodes(curr => curr.map(n => ({ ...n, selected: n.id === node.id })));
      setEdges(curr => curr.map(e => (e.selected ? { ...e, selected: false } : e)));

      const state = useProjectStore.getState();
      state.setSelectedNode(node.id);
      state.setSelectedEdge(null);
    }

    setNodeContextMenu({
      nodeId: node.id,
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
    });
  }, [nodes, setNodes, setEdges]);

  const onPaneClick = useCallback(() => {
    const s = useProjectStore.getState();
    s.setSelectedNode(null);
    s.setSelectedEdge(null);
    setNodeContextMenu(null);
    setAttachPreviewTargetId(null);
  }, []);

  // Keyboard delete (when canvas wrapper has focus)
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const s = useProjectStore.getState();
      if (s.selectedNodeId) s.removeNode(s.selectedNodeId);
      else if (s.selectedEdgeId) s.removeEdge(s.selectedEdgeId);
    }
  }, []);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData('application/knitflow-node-kind') as NodeKind;
    if (!kind || !nodeTypeRegistry[kind]) return;

    const rf = reactFlowRef.current;
    if (!rf) return;

    const position = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    useProjectStore.getState().addNode(kind, position);
    setNodeContextMenu(null);
  }, []);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowRef.current = instance;
  }, []);

  const onMoveEnd = useCallback(() => {
    const rf = reactFlowRef.current;
    if (!rf) return;

    const vp = rf.getViewport();
    useProjectStore.getState().setPageViewport({ x: vp.x, y: vp.y, zoom: vp.zoom });
  }, []);

  const closeNodeContextMenu = useCallback(() => {
    setNodeContextMenu(null);
  }, []);

  const handleContextDelete = useCallback(() => {
    if (!nodeContextMenu) return;
    useProjectStore.getState().removeNode(nodeContextMenu.nodeId);
    setNodeContextMenu(null);
  }, [nodeContextMenu]);

  const handleContextDuplicate = useCallback(() => {
    if (!nodeContextMenu) return;
    duplicateNodeIds([nodeContextMenu.nodeId]);
  }, [nodeContextMenu, duplicateNodeIds]);

  const handleContextDeselect = useCallback(() => {
    deselectAll();
  }, [deselectAll]);

  const handleContextResetDefaults = useCallback(() => {
    if (!nodeContextMenu) return;

    const state = useProjectStore.getState();
    const activePage = state.project.pages.find(p => p.id === state.activePageId);
    if (!activePage) return;

    const targetNode = activePage.nodes.find(n => n.id === nodeContextMenu.nodeId);
    if (!targetNode) return;

    const def = nodeTypeRegistry[targetNode.type];
    state.setNodes(
      state.activePageId,
      activePage.nodes.map(n => {
        if (n.id !== targetNode.id) return n;
        return {
          ...n,
          data: cloneData(def.defaultData),
          stylePreset: def.defaultStylePreset,
        };
      }),
    );

    state.setSelectedNode(targetNode.id);
    state.setSelectedEdge(null);
    setNodeContextMenu(null);
  }, [nodeContextMenu]);

  const handleContextStackSelected = useCallback(() => {
    const selectedNodeIds = nodes.filter(node => node.selected).map(node => node.id);
    if (selectedNodeIds.length < 2) return;

    const state = useProjectStore.getState();
    const activePage = state.project.pages.find(page => page.id === state.activePageId);
    if (!activePage) return;

    const selectedSet = new Set(selectedNodeIds);
    const selectedNodes = activePage.nodes.filter(node => selectedSet.has(node.id));
    if (selectedNodes.length < 2) return;

    const centroid = selectedNodes.reduce(
      (acc, node) => ({ x: acc.x + node.position.x, y: acc.y + node.position.y }),
      { x: 0, y: 0 },
    );
    centroid.x /= selectedNodes.length;
    centroid.y /= selectedNodes.length;

    const stackItems: StackItemData[] = selectedNodes.map(node => ({
      id: node.id,
      type: node.type,
      name: getNodeDisplayName(node),
      tag: typeof node.data.tag === 'string' ? node.data.tag : undefined,
      title: typeof node.data.title === 'string' ? node.data.title : undefined,
      dbType: typeof node.data.dbType === 'string' ? node.data.dbType : undefined,
      provider: typeof node.data.provider === 'string' ? node.data.provider : undefined,
      framework: typeof node.data.framework === 'string' ? node.data.framework : undefined,
      milestoneLabel: typeof node.data.milestoneLabel === 'string' ? node.data.milestoneLabel : undefined,
      snapshot: cloneData(node),
    }));

    const stackNodeId = uuid();
    const stackNode: ProjectNode = {
      id: stackNodeId,
      type: 'stack',
      position: { x: centroid.x, y: centroid.y },
      stylePreset: 'teal',
      data: {
        ...cloneData(nodeTypeRegistry.stack.defaultData),
        name: `Stack (${selectedNodes.length})`,
        summary: `Grouped ${selectedNodes.length} nodes to reduce visual noise.`,
        activeIndex: 0,
        items: stackItems,
        stashedEdges: cloneData(activePage.edges.filter(edge => selectedSet.has(edge.source) || selectedSet.has(edge.target))),
      },
    };

    const affectedEdges = activePage.edges.filter(edge => selectedSet.has(edge.source) || selectedSet.has(edge.target));
    const incoming = affectedEdges.filter(edge => !selectedSet.has(edge.source) && selectedSet.has(edge.target));
    const outgoing = affectedEdges.filter(edge => selectedSet.has(edge.source) && !selectedSet.has(edge.target));
    const keptIncoming = incoming[0];
    const keptOutgoing = outgoing[0];

    const untouchedEdges = activePage.edges.filter(
      edge => !selectedSet.has(edge.source) && !selectedSet.has(edge.target),
    );

    const nextEdges = [...untouchedEdges];
    if (keptIncoming) {
      nextEdges.push({
        ...keptIncoming,
        id: uuid(),
        target: stackNodeId,
        targetHandle: 'in-0',
      });
    }
    if (keptOutgoing) {
      nextEdges.push({
        ...keptOutgoing,
        id: uuid(),
        source: stackNodeId,
        sourceHandle: 'out-0',
      });
    }

    const nextNodes = [
      ...activePage.nodes.filter(node => !selectedSet.has(node.id)),
      stackNode,
    ];

    state.replacePageGraph(state.activePageId, nextNodes, nextEdges);
    state.setSelectedNode(stackNodeId);
    state.setSelectedEdge(null);
    setNodeContextMenu(null);
  }, [nodes]);

  const handleContextUnstack = useCallback(() => {
    if (!nodeContextMenu) return;
    const state = useProjectStore.getState();
    const activePage = state.project.pages.find(page => page.id === state.activePageId);
    if (!activePage) return;

    const stackNode = activePage.nodes.find(node => node.id === nodeContextMenu.nodeId);
    if (!stackNode || stackNode.type !== 'stack') return;

    const items = Array.isArray(stackNode.data.items) ? (stackNode.data.items as StackItemData[]) : [];
    const snapshots = items
      .map(item => item.snapshot)
      .filter((snapshot): snapshot is ProjectNode => Boolean(snapshot && typeof snapshot === 'object'));
    if (!snapshots.length) return;

    const existingNodes = activePage.nodes.filter(node => node.id !== stackNode.id);
    const existingNodeIds = new Set(existingNodes.map(node => node.id));
    const idMap = new Map<string, string>();

    const originalCenter = snapshots.reduce(
      (acc, node) => ({ x: acc.x + node.position.x, y: acc.y + node.position.y }),
      { x: 0, y: 0 },
    );
    originalCenter.x /= snapshots.length;
    originalCenter.y /= snapshots.length;

    const dx = stackNode.position.x - originalCenter.x;
    const dy = stackNode.position.y - originalCenter.y;

    const restoredNodes: ProjectNode[] = snapshots.map(snapshot => {
      const desiredId = snapshot.id;
      const nextId = existingNodeIds.has(desiredId) ? uuid() : desiredId;
      idMap.set(desiredId, nextId);
      existingNodeIds.add(nextId);
      return {
        ...cloneData(snapshot),
        id: nextId,
        position: {
          x: snapshot.position.x + dx,
          y: snapshot.position.y + dy,
        },
      };
    });

    const stashedEdges = Array.isArray(stackNode.data.stashedEdges)
      ? cloneData(stackNode.data.stashedEdges as ProjectEdgeModel[])
      : [];
    const untouchedEdges = activePage.edges.filter(edge => edge.source !== stackNode.id && edge.target !== stackNode.id);
    const validNodeIds = new Set([...existingNodes.map(node => node.id), ...restoredNodes.map(node => node.id)]);
    const edgeIds = new Set(untouchedEdges.map(edge => edge.id));

    const remappedStashedEdges: ProjectEdgeModel[] = [];
    stashedEdges.forEach(edge => {
      const source = idMap.get(edge.source) ?? edge.source;
      const target = idMap.get(edge.target) ?? edge.target;
      if (!validNodeIds.has(source) || !validNodeIds.has(target)) return;
      const nextId = edgeIds.has(edge.id) ? uuid() : edge.id;
      edgeIds.add(nextId);
      remappedStashedEdges.push({
        ...edge,
        id: nextId,
        source,
        target,
      });
    });

    state.replacePageGraph(
      state.activePageId,
      [...existingNodes, ...restoredNodes],
      [...untouchedEdges, ...remappedStashedEdges],
    );
    state.setSelectedNode(null);
    state.setSelectedEdge(null);
    setNodeContextMenu(null);
  }, [nodeContextMenu]);

  const selectedNodeCount = nodes.filter(node => node.selected).length;
  const contextNodeType = nodeContextMenu
    ? (nodes.find(node => node.id === nodeContextMenu.nodeId)?.type as NodeKind | undefined)
    : undefined;

  const renderNavigatorNode = useCallback((nodeId: string, depth = 0, trail: Set<string> = new Set()): React.ReactNode => {
    if (trail.has(nodeId)) return null;
    const treeNode = navigatorNodeMap.get(nodeId);
    if (!treeNode) return null;
    const nextTrail = new Set(trail);
    nextTrail.add(nodeId);

    const children = treeNode.children;
    const hasChildren = children.length > 0;
    const expanded = expandedNavIds.has(nodeId);
    const isHidden = hiddenNodeIds.has(nodeId);
    const isFocused = focusNodeId === nodeId;
    const dimmedByFocus = Boolean(focusNodeId && dimmedNodeIds.has(nodeId));
    const iconKey = nodeTypeRegistry[treeNode.type]?.icon;
    const icon = (iconKey && navigatorIconMap[iconKey]) ? navigatorIconMap[iconKey] : <DnsOutlinedIcon sx={{ fontSize: 14 }} />;
    const attachedCount = navigatorAttachedCommentCounts.get(nodeId) ?? treeNode.attachedComments;

    return (
      <React.Fragment key={`nav-${nodeId}`}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            pl: 0.6 + depth * 1.05,
            pr: 0.45,
            py: 0.18,
            borderRadius: 1,
            bgcolor: isFocused ? '#eef4ff' : 'transparent',
            opacity: isHidden ? 0.45 : dimmedByFocus ? 0.35 : 1,
            '&:hover': { bgcolor: isFocused ? '#e7efff' : '#f5f8fc' },
          }}
        >
          <IconButton
            size="small"
            onClick={() => hasChildren ? toggleNavCollapse(nodeId) : toggleNavFocus(nodeId)}
            sx={{ width: 20, height: 20, mr: 0.4 }}
          >
            {hasChildren
              ? (expanded ? <ExpandMoreOutlinedIcon sx={{ fontSize: 16 }} /> : <ChevronRightOutlinedIcon sx={{ fontSize: 16 }} />)
              : <Box sx={{ width: 10, height: 10 }} />}
          </IconButton>

          <Box onClick={() => toggleNavFocus(nodeId)} sx={{ display: 'flex', alignItems: 'center', gap: 0.6, minWidth: 0, flexGrow: 1, cursor: 'pointer' }}>
            <Box sx={{ color: '#52647f', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</Box>
            <Typography sx={{ fontSize: 12, color: '#22334a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {treeNode.name}
            </Typography>
          </Box>

          {treeNode.isStacked && (
            <Chip
              label="S"
              size="small"
              sx={{
                height: 18,
                mr: 0.35,
                borderRadius: 0.9,
                bgcolor: '#f3f6fb',
                border: '1px solid #dce4f1',
                '& .MuiChip-label': { px: 0.55, fontSize: 10, fontWeight: 700 },
              }}
            />
          )}

          {attachedCount > 0 && (
            <Chip
              label={`C${attachedCount}`}
              size="small"
              sx={{
                height: 18,
                mr: 0.35,
                borderRadius: 0.9,
                bgcolor: '#f3f6fb',
                border: '1px solid #dce4f1',
                '& .MuiChip-label': { px: 0.55, fontSize: 10, fontWeight: 700 },
              }}
            />
          )}

          <Tooltip title={isHidden ? 'Show node/subtree' : 'Hide node/subtree'}>
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                toggleNodeHidden(nodeId);
              }}
              sx={{ width: 22, height: 22 }}
            >
              {isHidden ? <VisibilityOffOutlinedIcon sx={{ fontSize: 15 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 15 }} />}
            </IconButton>
          </Tooltip>
        </Box>

        {hasChildren && expanded && children.map(childId => renderNavigatorNode(childId, depth + 1, nextTrail))}
      </React.Fragment>
    );
  }, [
    navigatorNodeMap,
    expandedNavIds,
    hiddenNodeIds,
    focusNodeId,
    dimmedNodeIds,
    navigatorAttachedCommentCounts,
    toggleNavCollapse,
    toggleNavFocus,
    toggleNodeHidden,
  ]);

  return (
    <div ref={canvasWrapperRef} style={{ width: '100%', height: '100%', position: 'relative' }} onKeyDown={onKeyDown} tabIndex={0}>
      <ReactFlow
        className={`kf-flow${edgeDashed ? ' kf-flow-dashed' : ''}`}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onInit={onInit}
        onMoveEnd={onMoveEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={pageViewport}
        connectionLineType={getConnectionLineType(edgeType)}
        connectionRadius={32}
        fitView={false}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        {showMiniMap && <MiniMap nodeStrokeWidth={3} pannable zoomable />}
      </ReactFlow>

      {showNodeNavigator && (
        <Paper
          elevation={6}
          sx={{
            position: 'absolute',
            left: navigatorPos.x,
            top: navigatorPos.y,
            width: 300,
            maxHeight: 420,
            zIndex: 20,
            border: '1px solid #dbe3ef',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box
            onMouseDown={startNavigatorDrag}
            sx={{
              px: 1,
              py: 0.7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: '#f4f7fc',
              borderBottom: '1px solid #e0e7f2',
              cursor: 'grab',
              userSelect: 'none',
            }}
          >
            <Stack direction="row" spacing={0.7} sx={{ alignItems: 'center' }}>
              <AccountTreeOutlinedIcon sx={{ fontSize: 16, color: '#4e607b' }} />
              <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: '#27364c' }}>
                Node Navigator
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.4}>
              <Tooltip title="Clear focus and hidden filters">
                <IconButton size="small" onClick={clearNavigatorFilters} sx={{ width: 22, height: 22 }}>
                  <RestartAltIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear focus">
                <IconButton size="small" onClick={() => setFocusNodeId(null)} sx={{ width: 22, height: 22 }}>
                  <CloseOutlinedIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ maxHeight: 370, overflowY: 'auto', px: 0.45, py: 0.45 }}>
            <Box
              onClick={(event) => {
                if (event.currentTarget === event.target) {
                  setFocusNodeId(null);
                }
              }}
              sx={{ minHeight: 120 }}
            >
              {navigatorRoots.map(rootId => renderNavigatorNode(rootId, 0))}
            </Box>
          </Box>
        </Paper>
      )}

      {stickyOverlayNodes.map(node => {
        const preview = stickyDragPreviewById[node.id];
        const position = preview ?? node.position;
        const title = typeof node.data.title === 'string' ? node.data.title : 'Note';
        const body = typeof node.data.body === 'string' ? node.data.body : '';
        const dimmed = dimmedNodeIds.has(node.id);
        return (
          <Paper
            key={`sticky-${node.id}`}
            elevation={3}
            onMouseDown={(event) => startStickyDrag(node.id, event)}
            onClick={(event) => {
              event.stopPropagation();
              useProjectStore.getState().setSelectedNode(node.id);
            }}
            sx={{
              position: 'absolute',
              left: position.x,
              top: position.y,
              width: 330,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              bgcolor: '#fffdf5',
              cursor: 'grab',
              zIndex: 15,
              opacity: dimmed ? 0.32 : 1,
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <Box sx={{ px: 1.2, py: 0.9, borderBottom: '1px solid #edf2f7', bgcolor: '#fff9e8' }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#1f2937' }}>
                {title}
              </Typography>
            </Box>
            <Box sx={{ px: 1.2, py: 1 }}>
              <Typography sx={{ fontSize: 12, color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                {body || 'Empty note'}
              </Typography>
            </Box>
          </Paper>
        );
      })}

      <Menu
        open={Boolean(nodeContextMenu)}
        onClose={closeNodeContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          nodeContextMenu
            ? { top: nodeContextMenu.mouseY, left: nodeContextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleContextDuplicate}>
          <ListItemIcon><ContentCopyOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextDelete}>
          <ListItemIcon><DeleteOutlineIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextDeselect}>
          <ListItemIcon><DeselectOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Deselect</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextResetDefaults}>
          <ListItemIcon><RestartAltIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Reset to defaults</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextStackSelected} disabled={selectedNodeCount < 2}>
          <ListItemIcon><AccountTreeOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Stack selected</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextUnstack} disabled={contextNodeType !== 'stack'}>
          <ListItemIcon><AccountTreeOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Unstack</ListItemText>
        </MenuItem>
      </Menu>
    </div>
  );
}
