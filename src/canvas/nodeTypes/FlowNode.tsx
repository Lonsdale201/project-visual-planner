import React, { useEffect, useMemo } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { Box, Button, Chip, Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ApiOutlinedIcon from '@mui/icons-material/ApiOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-http';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { NodeKind, FlowDirection, Page } from '../../model/types';
import { nodeTypeRegistry } from '../../model/registry';
import { nodeColorMap } from '../../utils/nodeColors';
import { parseDbSchema, type DbSchemaField } from '../../utils/parseDbSchema';
import { parseServiceEndpoints } from '../../utils/serviceEndpoints';
import {
  stackPresets,
  frameworkPresets,
  infraPresets,
  integrationPresets,
  findPresetByLabel,
  type PresetOption,
} from '../../utils/presets';
import { FrameworkPresetIcon, IntegrationPresetIcon, TechStackPresetIcon } from '../../utils/presetIcons';
import { useProjectStore } from '../../store/useProjectStore';

const iconMap: Record<string, React.ReactElement> = {
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

interface FlowNodeProps {
  id: string;
  data: Record<string, unknown>;
  selected?: boolean;
}

function selectActivePage(s: { project: { pages: Page[] }; activePageId: string }): Page {
  return s.project.pages.find(p => p.id === s.activePageId) ?? s.project.pages[0];
}

function getHandlePositions(direction: FlowDirection): { input: Position; output: Position } {
  switch (direction) {
    case 'TOP_DOWN':
      return { input: Position.Top, output: Position.Bottom };
    case 'LEFT_RIGHT':
      return { input: Position.Left, output: Position.Right };
    case 'RIGHT_LEFT':
      return { input: Position.Right, output: Position.Left };
  }
}

function toStr(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toTags(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((tag): tag is string => typeof tag === 'string') : [];
}

function compact(text: string, max = 120): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}...`;
}

function uniqueValues(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }

  return out.sort((a, b) => a.localeCompare(b));
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function clampHandleCount(value: unknown, fallback: number): number {
  const raw = Math.round(toNumber(value, fallback));
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(8, Math.max(0, raw));
}

function getDistributedHandleStyle(position: Position, index: number, total: number, color: string): React.CSSProperties {
  const safeTotal = Math.max(1, total);
  const ratio = safeTotal === 1 ? 0.5 : (index + 1) / (safeTotal + 1);
  const percent = `${Math.round(ratio * 1000) / 10}%`;

  if (position === Position.Top) {
    return { left: percent, top: 0, transform: 'translate(-50%, -50%)', background: color };
  }
  if (position === Position.Bottom) {
    return { left: percent, top: '100%', transform: 'translate(-50%, -50%)', background: color };
  }
  if (position === Position.Left) {
    return { left: 0, top: percent, transform: 'translate(-50%, -50%)', background: color };
  }
  return { left: '100%', top: percent, transform: 'translate(-50%, -50%)', background: color };
}

type CodeLanguage = 'typescript' | 'javascript' | 'json' | 'yaml' | 'sql' | 'bash' | 'http' | 'markdown' | 'html';

const supportedCodeLanguages: CodeLanguage[] = [
  'typescript',
  'javascript',
  'json',
  'yaml',
  'sql',
  'bash',
  'http',
  'markdown',
  'html',
];

function parseCodeLanguage(value: unknown): CodeLanguage {
  const normalized = toStr(value).toLowerCase();
  return (supportedCodeLanguages as string[]).includes(normalized)
    ? (normalized as CodeLanguage)
    : 'typescript';
}

function codeLanguageToPrism(lang: CodeLanguage): string {
  switch (lang) {
    case 'typescript':
      return 'typescript';
    case 'javascript':
      return 'javascript';
    case 'json':
      return 'json';
    case 'yaml':
      return 'yaml';
    case 'sql':
      return 'sql';
    case 'bash':
      return 'bash';
    case 'http':
      return 'http';
    case 'markdown':
      return 'markdown';
    case 'html':
      return 'markup';
  }
}

function collectOverviewStats(pages: Page[]): {
  integrations: number;
  actionTypes: string[];
  databases: string[];
  infraProviders: string[];
  frameworks: number;
  frameworkNames: string[];
  milestones: number;
  milestoneLabels: string[];
  milestoneItems: Array<{ id: string; order: number; title: string; goal: string; priority: string }>;
} {
  const allNodes = pages.flatMap(page => page.nodes);
  const stackItems = allNodes
    .filter(node => node.type === 'stack')
    .flatMap(node => (Array.isArray(node.data.items) ? node.data.items : []))
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object');

  const integrationNodes = allNodes.filter(node => node.type === 'integration');
  const actionNodes = allNodes.filter(node => node.type === 'action');
  const databaseNodes = allNodes.filter(node => node.type === 'database');
  const infraNodes = allNodes.filter(node => node.type === 'infra');
  const frameworkNodes = allNodes.filter(node => node.type === 'framework');
  const milestoneNodes = allNodes.filter(node => node.type === 'milestone');

  const stackedIntegrations = stackItems.filter(item => toStr(item.type) === 'integration');
  const stackedActions = stackItems.filter(item => toStr(item.type) === 'action');
  const stackedDatabases = stackItems.filter(item => toStr(item.type) === 'database');
  const stackedInfra = stackItems.filter(item => toStr(item.type) === 'infra');
  const stackedFrameworks = stackItems.filter(item => toStr(item.type) === 'framework');
  const stackedMilestones = stackItems.filter(item => toStr(item.type) === 'milestone');

  const actionTypes = uniqueValues([
    ...actionNodes.map(node => toStr(node.data.tag) || toStr(node.data.name)),
    ...stackedActions.map(item => toStr(item.tag) || toStr(item.name)),
  ]);

  const databases = uniqueValues([
    ...databaseNodes.map(node => toStr(node.data.dbType)),
    ...stackedDatabases.map(item => toStr(item.dbType)),
  ]);
  const infraProviders = uniqueValues([
    ...infraNodes.map(node => toStr(node.data.provider)),
    ...stackedInfra.map(item => toStr(item.provider)),
  ]);
  const frameworkNames = uniqueValues([
    ...frameworkNodes.map(node => toStr(node.data.framework) || toStr(node.data.name)),
    ...stackedFrameworks.map(item => toStr(item.framework) || toStr(item.name)),
  ]);
  const milestoneLabels = uniqueValues([
    ...milestoneNodes.map(node => toStr(node.data.milestoneLabel) || toStr(node.data.title)),
    ...stackedMilestones.map(item => toStr(item.milestoneLabel) || toStr(item.title) || toStr(item.name)),
  ]);
  const milestoneItems = milestoneNodes
    .map(node => ({
      id: node.id,
      order: toNumber(node.data.order, Number.MAX_SAFE_INTEGER),
      title: toStr(node.data.title) || toStr(node.data.milestoneLabel) || 'Untitled milestone',
      goal: toStr(node.data.goal),
      priority: toStr(node.data.priority).toLowerCase(),
    }))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.title.localeCompare(b.title);
    });

  return {
    integrations: integrationNodes.length + stackedIntegrations.length,
    actionTypes,
    databases,
    infraProviders,
    frameworks: frameworkNodes.length + stackedFrameworks.length,
    frameworkNames,
    milestones: milestoneNodes.length + stackedMilestones.length,
    milestoneLabels,
    milestoneItems,
  };
}

function firstLine(text: string): string {
  return text
    .split('\n')
    .map(line => line.trim())
    .find(Boolean) ?? '';
}

function formatIntegrationUrl(value: unknown): string {
  const raw = toStr(value).trim();
  if (!raw) return 'n/a';
  try {
    const parsed = new URL(raw);
    return parsed.host || compact(raw, 34);
  } catch {
    return compact(raw.replace(/^https?:\/\//i, ''), 34);
  }
}

function normalizeMarkdownInput(text: string): string {
  return text
    .replace(/\[link\]\s*(https?:\/\/[^\s\]]+)\s*\[\/link\]/gi, '[Link]($1)')
    .replace(/\[link\]\s*(https?:\/\/[^\s\]]+)\s*\[link\]/gi, '[Link]($1)');
}

function compactLinkLabel(href: string): string {
  try {
    const url = new URL(href);
    const path = url.pathname && url.pathname !== '/' ? url.pathname : '';
    return `${url.host}${path}`.slice(0, 42);
  } catch {
    return href.slice(0, 42);
  }
}

function MarkdownText({ text, mb = 0 }: { text: string; mb?: number }) {
  const normalized = normalizeMarkdownInput(text);
  const needsRichMarkdown = /(\*\*|__|`|^\s*[-*]\s+|\[[^\]]+\]\([^)]+\))/m.test(normalized) || /https?:\/\/\S+/i.test(normalized);

  if (!needsRichMarkdown) {
    return (
      <Typography
        variant="body2"
        component="div"
        sx={{
          color: '#7a8798',
          lineHeight: 1.45,
          fontSize: 14.5,
          mb,
          overflowWrap: 'anywhere',
          '& p': { m: 0 },
        }}
      >
        {normalized}
      </Typography>
    );
  }

  return (
    <Typography
      variant="body2"
      component="div"
      sx={{
        color: '#7a8798',
        lineHeight: 1.45,
        fontSize: 14.5,
        mb,
        '& p': { m: 0 },
        '& ul, & ol': { m: 0, pl: 2.2 },
        '& li': { m: 0 },
        overflowWrap: 'anywhere',
        '& code': {
          backgroundColor: '#f2f5fa',
          border: '1px solid #e4eaf2',
          borderRadius: 0.8,
          px: 0.45,
          py: 0.1,
          fontSize: '0.86em',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        },
        '& a': {
          color: '#2b5fc7',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            const childParts = React.Children.toArray(children);
            const rawText = childParts.map(part => (typeof part === 'string' ? part : '')).join('').trim();
            const fallbackHref = href ?? '';
            const label = !rawText || rawText === fallbackHref ? compactLinkLabel(fallbackHref) : rawText;
            return (
              <a href={fallbackHref} target="_blank" rel="noreferrer" {...props}>
                {label || 'Link'}
              </a>
            );
          },
        }}
      >
        {normalized}
      </ReactMarkdown>
    </Typography>
  );
}

function getSummary(kind: NodeKind, data: Record<string, unknown>): string {
  switch (kind) {
    case 'service':
      return toStr(data.description);
    case 'router':
      return toStr(data.notes);
    case 'stack':
      return toStr(data.summary);
    case 'action':
      return toStr(data.comment);
    case 'database':
      return toStr(data.connectionNotes);
    case 'infra':
      return toStr(data.notes);
    case 'framework':
      return toStr(data.notes);
    case 'integration':
      return toStr(data.requestNotes) || toStr(data.responseNotes);
    case 'code':
      return firstLine(toStr(data.content));
    case 'overview':
      return toStr(data.description);
    case 'comment':
    case 'spec':
      return toStr(data.body);
    case 'milestone':
      return toStr(data.goal);
  }
}

function getMetaLabel(kind: NodeKind, data: Record<string, unknown>): string {
  switch (kind) {
    case 'service':
      return 'Service';
    case 'router':
      return toStr(data.tag) || 'Router';
    case 'stack':
      return 'Stack';
    case 'database':
      return toStr(data.dbType) || 'Database';
    case 'infra':
      return toStr(data.provider) || 'Infrastructure';
    case 'framework':
      return toStr(data.framework) || 'Framework';
    case 'integration':
      return toStr(data.boundary) === 'internal' ? 'Internal' : 'External';
    case 'code':
      return parseCodeLanguage(data.language).toUpperCase();
    case 'overview':
      return 'Live';
    case 'comment':
      return '';
    case 'spec':
      return 'Spec';
    case 'milestone':
      return toStr(data.dueDate) ? `Due ${toStr(data.dueDate)}` : 'Milestone';
    case 'action':
      return '';
  }
}

function getDetailRows(kind: NodeKind, data: Record<string, unknown>): Array<{ label: string; value: string }> {
  if (kind === 'stack') {
    const items = Array.isArray(data.items) ? data.items.length : 0;
    return [{ label: 'Items', value: String(items) }];
  }

  if (kind === 'router') {
    return [
      { label: 'In', value: String(clampHandleCount(data.inputCount, 2)) },
      { label: 'Out', value: String(clampHandleCount(data.outputCount, 3)) },
    ];
  }

  if (kind === 'integration') {
    return [
      { label: 'URL', value: formatIntegrationUrl(data.baseUrl) },
      { label: 'Auth', value: toStr(data.authMethod) || 'n/a' },
    ];
  }

  return [];
}

function getConnectedFlowNodeCount(page: Page, startNodeId: string): number {
  if (!startNodeId) return 0;

  const adjacency = new Map<string, Set<string>>();
  for (const edge of page.edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  const visited = new Set<string>([startNodeId]);
  const queue: string[] = [startNodeId];

  while (queue.length) {
    const current = queue.shift()!;
    const neighbors = adjacency.get(current);
    if (!neighbors) continue;

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return Math.max(0, visited.size - 1);
}

function NodePresetIcon({ kind, data }: { kind: NodeKind; data: Record<string, unknown> }) {
  if (kind === 'infra') {
    return (
      <Box
        sx={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: '1px solid #dbe3ec',
          bgcolor: '#eef2f7',
          color: '#5b6b80',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          mr: 0.9,
        }}
      >
        <CloudOutlinedIcon sx={{ fontSize: 12 }} />
      </Box>
    );
  }

  let presetLabel = '';
  let preset: PresetOption | undefined;

  if (kind === 'integration') {
    presetLabel = toStr(data.name);
    preset = findPresetByLabel(integrationPresets, presetLabel);
  }

  if (kind === 'framework') {
    presetLabel = toStr(data.framework);
    preset = findPresetByLabel(frameworkPresets, presetLabel);
  }

  if (!presetLabel) return null;

  const fallbackPreset = preset ?? {
    value: '',
    label: presetLabel,
    abbr: 'CU',
    color: '#64748b',
    bg: '#eef2f7',
  };

  return (
    <Box sx={{ mr: 0.9, display: 'flex', alignItems: 'center' }}>
      {kind === 'framework' ? (
        <FrameworkPresetIcon preset={fallbackPreset} size={20} />
      ) : (
        <IntegrationPresetIcon preset={fallbackPreset} size={20} />
      )}
    </Box>
  );
}

const defaultDbSchemaFields: DbSchemaField[] = [
  { name: 'id', type: 'uuid', constraints: 'pk' },
  { name: 'email', type: 'varchar(255)', constraints: 'unique' },
  { name: 'created_at', type: 'timestamp', constraints: 'not null' },
  { name: 'updated_at', type: 'timestamp', constraints: 'not null' },
];

export default function FlowNode({ id, data, selected }: FlowNodeProps) {
  const direction = useProjectStore(s => s.project.ui.direction);
  const page = useProjectStore(s => selectActivePage(s));
  const allPages = useProjectStore(s => s.project.pages);
  const updateNodeData = useProjectStore(s => s.updateNodeData);
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, direction, updateNodeInternals]);

  const kind = data.nodeKind as NodeKind;
  if (!kind || !nodeTypeRegistry[kind]) {
    return <div style={{ padding: 8, background: '#fee', border: '1px solid red' }}>Unknown: {String(kind)}</div>;
  }

  const def = nodeTypeRegistry[kind];
  const preset = (data.stylePreset as string) || def.defaultStylePreset;
  const colors = nodeColorMap[preset as keyof typeof nodeColorMap] ?? nodeColorMap[def.defaultStylePreset];
  const handlePos = getHandlePositions(direction);

  const title = toStr(data.name) || toStr(data.title) || 'Untitled node';
  const summary = getSummary(kind, data);
  const serviceEndpoints = kind === 'service' ? parseServiceEndpoints(data.endpoints) : [];
  const detailRows = getDetailRows(kind, data);
  const metaLabel = getMetaLabel(kind, data);
  const dbSchemaSource = kind === 'database' ? toStr(data.schemaNotes) : '';
  const hasDbSchemaInput = kind === 'database' && dbSchemaSource.trim().length > 0;
  const dbSchema = kind === 'database' ? parseDbSchema(dbSchemaSource) : [];
  const dbSchemaExpanded = kind === 'database' ? Boolean(data.dbSchemaExpanded) : false;
  const dbSchemaPreview = kind === 'database'
    ? (hasDbSchemaInput ? dbSchema : defaultDbSchemaFields)
    : [];
  const dbSchemaPreviewRows = dbSchemaExpanded ? dbSchemaPreview : dbSchemaPreview.slice(0, 4);
  const dbSchemaExtraCount = dbSchemaExpanded ? 0 : Math.max(0, dbSchemaPreview.length - dbSchemaPreviewRows.length);
  const nodeTag = (kind === 'action' || kind === 'service') ? toStr(data.tag) : '';
  const stackItemsRaw = kind === 'stack' && Array.isArray(data.items) ? data.items : [];
  const stackItems = stackItemsRaw
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const type = toStr(record.type) as NodeKind;
      return {
        id: toStr(record.id),
        type,
        name: toStr(record.name) || toStr(record.title) || type || 'Node',
        tag: toStr(record.tag),
      };
    })
    .filter((item): item is { id: string; type: NodeKind; name: string; tag: string } => Boolean(item));
  const stackActiveIndex = kind === 'stack'
    ? Math.max(0, Math.min(stackItems.length - 1, toNumber(data.activeIndex, 0)))
    : 0;
  const stackActiveItem = stackItems[stackActiveIndex];
  const hasSummary = Boolean(summary.trim());
  const isDimmed = Boolean(data.__dimmed);
  const isCode = kind === 'code';
  const codeLanguage = isCode ? parseCodeLanguage(data.language) : 'typescript';
  const codePrismLanguage = codeLanguageToPrism(codeLanguage);
  const codeContent = isCode ? toStr(data.content) : '';
  const codeExpanded = isCode ? Boolean(data.expanded) : false;
  const codeLineCount = isCode ? Math.max(1, codeContent.split('\n').length) : 0;
  const codeHighlighted = useMemo(() => {
    if (!isCode) return '';
    const source = codeContent || '// Add code or schema from the inspector';
    const fallbackGrammar = Prism.languages.typescript ?? Prism.languages.javascript;
    const grammar = Prism.languages[codePrismLanguage] ?? fallbackGrammar;
    return Prism.highlight(source, grammar, codePrismLanguage);
  }, [isCode, codeContent, codePrismLanguage]);
  const milestonePriority = kind === 'milestone' ? toStr(data.priority).toLowerCase() : '';
  const milestoneFlowCount = kind === 'milestone' ? getConnectedFlowNodeCount(page, id) : 0;
  const milestoneDueDate = kind === 'milestone' ? toStr(data.dueDate) : '';
  const milestoneLabel = kind === 'milestone' ? (toStr(data.milestoneLabel) || def.label) : def.label;
  const attachedCommentCount = Math.max(0, toNumber(data.attachedCommentCount, 0));
  const attachedCommentsExpanded = Boolean(data.attachedCommentsExpanded);
  const hasAttachedCommentsBadge = kind !== 'comment' && attachedCommentCount > 0;
  const isAttachCandidate = Boolean(data.__attachCandidate);
  const overviewStats = kind === 'overview' ? collectOverviewStats(allPages) : null;
  const isOverview = kind === 'overview';
  const overviewMilestonesExpanded = isOverview ? Boolean(data.overviewMilestonesExpanded) : false;
  const overviewReleaseDate = isOverview ? toStr(data.releaseDate) : '';
  const overviewStacks = isOverview
    ? uniqueValues([
      ...toTags(data.stacks),
      ...(overviewStats?.frameworkNames ?? []),
      ...(overviewStats?.infraProviders ?? []),
    ])
    : [];
  const nodeWidth = isOverview ? 540 : isCode ? 390 : 340;
  const inputHandleCount = kind === 'router'
    ? clampHandleCount(data.inputCount, def.inputHandles)
    : def.inputHandles;
  const outputHandleCount = kind === 'router'
    ? clampHandleCount(data.outputCount, def.outputHandles)
    : def.outputHandles;
  const hideMetaChip =
    kind === 'comment'
    || kind === 'action'
    || kind === 'milestone'
    || isOverview
    || (kind === 'service' && Boolean(nodeTag));

  const priorityTone: Record<string, { color: string; bg: string; border: string }> = {
    low: { color: '#2b8f6a', bg: '#ecf9f3', border: '#c4eddc' },
    medium: { color: '#946200', bg: '#fff8e6', border: '#f3e2a6' },
    high: { color: '#b45309', bg: '#fff1e8', border: '#f6d2bc' },
    critical: { color: '#b42318', bg: '#fdecec', border: '#f4c4c4' },
  };
  const endpointMethodTone: Record<string, { color: string; bg: string; border: string }> = {
    get: { color: '#166534', bg: '#ecfdf3', border: '#bbf7d0' },
    post: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
    put: { color: '#b45309', bg: '#fff7ed', border: '#fed7aa' },
    patch: { color: '#7e22ce', bg: '#f5f3ff', border: '#ddd6fe' },
    delete: { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
    ws: { color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
  };

  const priorityStyle = priorityTone[milestonePriority] ?? priorityTone.medium;
  const toggleCodeExpanded = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isCode) return;
    updateNodeData(id, { expanded: !codeExpanded });
  };
  const copyCodeToClipboard = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isCode) return;

    const source = codeContent || '// Add code or schema from the inspector';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(source);
        return;
      }

      const textarea = document.createElement('textarea');
      textarea.value = source;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch {
      // noop
    }
  };
  const toggleDbSchemaExpanded = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (kind !== 'database') return;
    updateNodeData(id, { dbSchemaExpanded: !dbSchemaExpanded });
  };
  const toggleOverviewMilestonesExpanded = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isOverview) return;
    updateNodeData(id, { overviewMilestonesExpanded: !overviewMilestonesExpanded });
  };
  const showPrevStackItem = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (kind !== 'stack' || stackItems.length === 0) return;
    const next = stackActiveIndex <= 0 ? stackItems.length - 1 : stackActiveIndex - 1;
    updateNodeData(id, { activeIndex: next });
  };
  const showNextStackItem = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (kind !== 'stack' || stackItems.length === 0) return;
    const next = stackActiveIndex >= stackItems.length - 1 ? 0 : stackActiveIndex + 1;
    updateNodeData(id, { activeIndex: next });
  };
  const toggleAttachedComments = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!hasAttachedCommentsBadge) return;
    updateNodeData(id, { showAttachedComments: !attachedCommentsExpanded });
  };

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          width: nodeWidth,
          maxWidth: nodeWidth,
          borderRadius: 3.5,
          bgcolor: '#fff',
          border: `1.5px solid ${
            isOverview
              ? (selected ? '#c7d2e5' : '#d7dee8')
              : (selected ? colors.border : alpha(colors.border, 0.45))
          }`,
          boxShadow: selected
            ? `0 10px 28px ${isOverview ? 'rgba(15, 23, 42, 0.12)' : alpha(colors.border, 0.22)}`
            : (isOverview ? '0 3px 14px rgba(53, 79, 143, 0.09)' : '0 2px 10px rgba(17, 24, 39, 0.08)'),
          transition: 'box-shadow 130ms ease, border-color 130ms ease',
          overflow: 'visible',
          opacity: isDimmed ? 0.28 : 1,
        }}
      >
        {!isOverview && (
          <Box
            sx={{
              position: 'absolute',
              left: 14,
              top: -12,
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1,
              py: 0.35,
              borderRadius: 99,
              bgcolor: colors.header,
              border: `1px solid ${alpha(colors.border, 0.35)}`,
              color: colors.text,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.2,
            }}
          >
            {iconMap[def.icon]}
            {milestoneLabel}
          </Box>
        )}

        {kind === 'milestone' && (
          <Box
            sx={{
              position: 'absolute',
              top: -12,
              right: 14,
              display: 'flex',
              gap: 0.7,
              alignItems: 'center',
            }}
          >
            <Chip
              label={(milestonePriority || 'medium').toUpperCase()}
              size="small"
              sx={{
                height: 22,
                borderRadius: 999,
                border: `1px solid ${priorityStyle.border}`,
                bgcolor: priorityStyle.bg,
                color: priorityStyle.color,
                '& .MuiChip-label': { px: 1, fontSize: 10.5, fontWeight: 700 },
              }}
            />
          </Box>
        )}

        {hasAttachedCommentsBadge && (
          <Button
            size="small"
            onClick={toggleAttachedComments}
            sx={{
              position: 'absolute',
              top: -12,
              right: kind === 'milestone' ? 96 : 14,
              minWidth: 0,
              height: 24,
              px: 0.8,
              borderRadius: 999,
              border: '1px solid #cfd9ea',
              bgcolor: attachedCommentsExpanded ? '#edf3ff' : '#f8fafc',
              color: '#3f5c8c',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
            }}
          >
            <ChatBubbleOutlineIcon sx={{ fontSize: 14, mr: 0.45 }} />
            {attachedCommentCount}
          </Button>
        )}

        {isAttachCandidate && (
          <Box
            sx={{
              position: 'absolute',
              inset: -7,
              borderRadius: 3.8,
              border: '2px dashed #6d8ed9',
              bgcolor: 'rgba(73, 116, 207, 0.05)',
              display: 'grid',
              placeItems: 'center',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          >
            <Chip
              label="Attach comment"
              size="small"
              sx={{
                height: 24,
                borderRadius: 999,
                border: '1px solid #b9c9eb',
                bgcolor: '#f2f6ff',
                color: '#35558a',
                '& .MuiChip-label': { px: 1, fontSize: 11, fontWeight: 700 },
              }}
            />
          </Box>
        )}

        <Box sx={{ px: 1.6, pt: 2.05, pb: 1.25 }}>
          {isOverview ? (
            <Box sx={{ mb: 1.05 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  fontSize: 19,
                  color: '#1a2538',
                  lineHeight: 1.15,
                  pr: 1,
                  mb: 0.55,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </Typography>
                {hasSummary && (
                  <MarkdownText text={summary} />
                )}
            </Box>
          ) : (
            <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
              <Stack direction="row" sx={{ alignItems: 'center', minWidth: 0, flexGrow: 1 }}>
                <NodePresetIcon kind={kind} data={data} />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    fontSize: 20,
                    color: '#111827',
                    lineHeight: 1.25,
                    pr: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {title}
                </Typography>
              </Stack>

              {(kind === 'action' || kind === 'service') && nodeTag && (
                <Chip
                  label={compact(nodeTag, 20)}
                  size="small"
                  sx={{
                    height: 24,
                    maxWidth: 120,
                    flexShrink: 0,
                    borderRadius: 999,
                    bgcolor: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    color: '#4b5563',
                    '& .MuiChip-label': {
                      px: 1.05,
                      fontSize: 10.5,
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
              )}

              {!hideMetaChip && (
                <Chip
                  label={metaLabel}
                  size="small"
                  sx={{
                    height: 26,
                    maxWidth: 130,
                    flexShrink: 0,
                    borderRadius: 999,
                    bgcolor: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    color: '#4b5563',
                    '& .MuiChip-label': {
                      px: 1.15,
                      fontSize: 11,
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
              )}
            </Stack>
          )}

          <Divider sx={{ mb: 1.1, borderColor: '#e6ebf1' }} />

          {kind === 'database' ? (
            <>
                {hasSummary && (
                  <MarkdownText text={summary} mb={0.8} />
                )}

              <Box
                sx={{
                  borderRadius: 1.8,
                  border: '1px solid #e7edf3',
                  bgcolor: '#f9fbfe',
                  overflow: 'hidden',
                  mb: 0.85,
                }}
              >
                {dbSchemaPreviewRows.length > 0 ? (
                  <>
                    <Stack
                      direction="row"
                      sx={{
                        px: 1.1,
                        py: 0.6,
                        bgcolor: '#eef3f9',
                        borderBottom: '1px solid #e2e9f2',
                        color: '#5b6b80',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 10.5, flex: 1 }}>
                        Field
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 10.5, width: 110 }}>
                        Type
                      </Typography>
                    </Stack>

                    {dbSchemaPreviewRows.map(field => (
                      <Stack
                        key={field.name}
                        direction="row"
                        sx={{
                          px: 1.1,
                          py: 0.58,
                          borderBottom: '1px solid #edf2f8',
                          '&:last-of-type': { borderBottom: 'none' },
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            flex: 1,
                            color: '#1f2937',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            pr: 0.8,
                          }}
                        >
                          {field.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            width: 110,
                            color: '#556579',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {field.type}
                        </Typography>
                      </Stack>
                    ))}
                  </>
                ) : (
                  <Typography sx={{ px: 1.1, py: 0.9, fontSize: 12, color: '#75849a' }}>
                    Schema provided, but format is not recognized yet.
                  </Typography>
                )}
              </Box>

              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 0.7 }}>
                <Stack direction="row" spacing={0.65} sx={{ flexWrap: 'wrap', gap: 0.6 }}>
                  <Chip
                    label={`Columns: ${dbSchemaPreview.length}`}
                    size="small"
                    sx={{
                      height: 22,
                      borderRadius: 1.7,
                      bgcolor: '#f8fafc',
                      border: '1px solid #e7edf3',
                      color: '#4f5f72',
                      '& .MuiChip-label': { fontSize: 11, fontWeight: 600, px: 1 },
                    }}
                  />
                  {dbSchemaExtraCount > 0 && (
                    <Chip
                      label={`+${dbSchemaExtraCount} more`}
                      size="small"
                      sx={{
                        height: 22,
                        borderRadius: 1.7,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e7edf3',
                        color: '#4f5f72',
                        '& .MuiChip-label': { fontSize: 11, fontWeight: 600, px: 1 },
                      }}
                    />
                  )}
                </Stack>
                {dbSchemaPreview.length > 4 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={toggleDbSchemaExpanded}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderColor: '#d6deea',
                      color: '#42546b',
                      borderRadius: 1.6,
                      minWidth: 0,
                      px: 1.05,
                      py: 0.3,
                    }}
                  >
                    {dbSchemaExpanded ? 'Collapse' : 'Expand full schema'}
                  </Button>
                )}
              </Stack>
            </>
          ) : kind === 'overview' && overviewStats ? (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 0.9,
                  mb: 0.95,
                }}
              >
                {[
                  {
                    key: 'integrations',
                    label: 'INTEGRATIONS',
                    value: overviewStats.integrations,
                    icon: <ApiOutlinedIcon sx={{ fontSize: 14 }} />,
                    iconBg: '#dfe6ff',
                    iconColor: '#4f46e5',
                  },
                  {
                    key: 'actions',
                    label: 'ACTIONS',
                    value: overviewStats.actionTypes.length,
                    icon: <PlayArrowOutlinedIcon sx={{ fontSize: 14 }} />,
                    iconBg: '#f8dff0',
                    iconColor: '#c0266d',
                  },
                  {
                    key: 'databases',
                    label: 'DB TYPES',
                    value: overviewStats.databases.length,
                    icon: <StorageOutlinedIcon sx={{ fontSize: 14 }} />,
                    iconBg: '#feeccf',
                    iconColor: '#c2410c',
                  },
                ].map(stat => (
                  <Box
                    key={stat.key}
                    sx={{
                      borderRadius: 2,
                      border: '1px solid #dfe7f2',
                      bgcolor: '#fdfefe',
                      px: 1,
                      py: 0.85,
                    }}
                  >
                    <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: 1.4,
                          bgcolor: stat.iconBg,
                          color: stat.iconColor,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {stat.icon}
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.45, color: '#8995a8' }}>
                          {stat.label}
                        </Typography>
                        <Typography sx={{ fontSize: 20, lineHeight: 1.05, fontWeight: 800, color: '#1f2b3d' }}>
                          {stat.value}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Box>

              <Box sx={{ mt: 0.95, mb: 0.95 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: '#6c7789', letterSpacing: 0.3, mb: 0.65 }}>
                  TECH STACK
                </Typography>
                <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', gap: 0.8 }}>
                    {(overviewStacks.length ? overviewStacks : ['No stacks yet']).map((stackName, index) => {
                    const stackPreset =
                      findPresetByLabel(stackPresets, stackName)
                      ?? findPresetByLabel(frameworkPresets, stackName)
                      ?? findPresetByLabel(infraPresets, stackName)
                      ?? {
                        value: '',
                        label: stackName,
                        abbr: stackName.slice(0, 2).toUpperCase(),
                        color: '#64748b',
                        bg: '#eef2f7',
                    };

                    return (
                      <Tooltip key={`${stackName}-${index}`} title={stackName} arrow placement="top">
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1.6,
                            border: '1px solid #dce4f0',
                            bgcolor: '#fff',
                            display: 'grid',
                            placeItems: 'center',
                            boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)',
                          }}
                        >
                          <TechStackPresetIcon preset={stackPreset} size={24} plain />
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Stack>
              </Box>

              <Box>
                <Stack direction="row" sx={{ alignItems: 'center', mb: 0.7 }}>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.45, color: '#8995a8' }}>
                    MILESTONES
                  </Typography>
                  <Box
                    sx={{
                      flexGrow: 1,
                      height: '2px',
                      bgcolor: '#cfd8e3',
                      mx: 0.9,
                      borderRadius: 999,
                    }}
                  />
                  {overviewReleaseDate && (
                    <Chip
                      label={compact(overviewReleaseDate, 18)}
                      size="small"
                      sx={{
                        height: 24,
                        borderRadius: 999,
                        border: '1px solid #d9e2ef',
                        bgcolor: '#f8fafd',
                        color: '#5b6b80',
                        '& .MuiChip-label': { px: 1, fontSize: 12, fontWeight: 700 },
                      }}
                    />
                  )}
                </Stack>

                {overviewStats.milestoneItems.length === 0 ? (
                  <Typography sx={{ fontSize: 12.5, color: '#7a8798' }}>
                    No milestones yet.
                  </Typography>
                ) : (
                  <Box sx={{ position: 'relative', pl: 0, pt: 0.1, pb: 0.1 }}>
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 8,
                        top: 12,
                        bottom: 12,
                        width: '1px',
                        bgcolor: '#d6dee9',
                      }}
                    />

                    <Stack spacing={0.85}>
                      {(overviewMilestonesExpanded
                        ? overviewStats.milestoneItems
                        : overviewStats.milestoneItems.slice(0, 4)
                      ).map((item, index) => {
                        const itemPriority = priorityTone[item.priority] ?? priorityTone.medium;
                        const milestoneOrder = item.order === Number.MAX_SAFE_INTEGER ? index + 1 : item.order;

                        return (
                          <Stack
                            key={item.id}
                            direction="row"
                            sx={{
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 0.8,
                              position: 'relative',
                              minHeight: 42,
                              pl: 2.2,
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                left: 3,
                                top: 7,
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: itemPriority.color,
                                border: '2px solid #fff',
                                boxShadow: `0 0 0 1px ${alpha(itemPriority.color, 0.35)}`,
                              }}
                            />

                            <Box sx={{ minWidth: 0, flexGrow: 1, pl: 1.1 }}>
                              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#2f3a4a', lineHeight: 1.22 }}>
                                {`${milestoneOrder}. ${item.title}`}
                              </Typography>
                              {item.goal && (
                                <Typography sx={{ fontSize: 12, color: '#6f7b8f', mt: 0.2, lineHeight: 1.25 }}>
                                  {compact(firstLine(item.goal), 70)}
                                </Typography>
                              )}
                            </Box>

                            <Chip
                              label={(item.priority || 'medium').toUpperCase()}
                              size="small"
                              sx={{
                                height: 22,
                                borderRadius: 999,
                                border: `1px solid ${alpha(itemPriority.color, 0.32)}`,
                                bgcolor: '#f8fafc',
                                color: itemPriority.color,
                                '& .MuiChip-label': { px: 0.9, fontSize: 10.5, fontWeight: 700 },
                              }}
                            />
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Box>
                )}
                {overviewStats.milestoneItems.length > 4 && (
                  <Box sx={{ mt: 0.75, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={toggleOverviewMilestonesExpanded}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        borderColor: '#d6deea',
                        color: '#42546b',
                        borderRadius: 1.6,
                        minWidth: 0,
                        px: 1.05,
                        py: 0.3,
                      }}
                    >
                      {overviewMilestonesExpanded ? 'Collapse milestones' : `Expand milestones (+${overviewStats.milestoneItems.length - 4})`}
                    </Button>
                  </Box>
                )}
              </Box>
            </>
          ) : kind === 'code' ? (
            <>
                {hasSummary && (
                  <MarkdownText text={summary} mb={0.8} />
                )}

              <Box
                sx={{
                  borderRadius: 2,
                  border: '1px solid #dce4f1',
                  bgcolor: '#fbfcfe',
                  overflow: 'hidden',
                  mb: 0.82,
                }}
              >
                <Stack
                  direction="row"
                  sx={{
                    px: 1,
                    py: 0.65,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #e2e9f4',
                    bgcolor: '#f3f6fb',
                  }}
                >
                  <Typography sx={{ color: '#5d6d84', fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>
                    {codeLanguage.toUpperCase()}
                  </Typography>
                  <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center' }}>
                    <Typography sx={{ color: '#7a8798', fontSize: 11 }}>
                      {codeLineCount} lines
                    </Typography>
                    <Tooltip title="Copy code">
                      <IconButton
                        size="small"
                        onClick={copyCodeToClipboard}
                        sx={{ width: 22, height: 22 }}
                      >
                        <ContentCopyOutlinedIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                <Box
                  component="pre"
                  className={`language-${codePrismLanguage}`}
                  sx={{
                    m: 0,
                    px: 1.05,
                    py: 0.9,
                    fontSize: 12,
                    lineHeight: 1.45,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    maxHeight: codeExpanded ? 'none' : 200,
                    overflow: codeExpanded ? 'visible' : 'hidden',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    '& code': {
                      fontFamily: 'inherit',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      background: 'transparent !important',
                    },
                  }}
                >
                  <code
                    className={`language-${codePrismLanguage}`}
                    dangerouslySetInnerHTML={{ __html: codeHighlighted }}
                  />
                </Box>
              </Box>

              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 0.7 }}>
                <Stack direction="row" spacing={0.6} sx={{ flexWrap: 'wrap', gap: 0.55 }}>
                  <Chip
                    label={`Format: ${codeLanguage}`}
                    size="small"
                    sx={{
                      height: 22,
                      borderRadius: 1.7,
                      bgcolor: '#f8fafc',
                      border: '1px solid #e7edf3',
                      color: '#4f5f72',
                      '& .MuiChip-label': { fontSize: 11, fontWeight: 600, px: 1 },
                    }}
                  />
                  <Chip
                    label={`Lines: ${codeLineCount}`}
                    size="small"
                    sx={{
                      height: 22,
                      borderRadius: 1.7,
                      bgcolor: '#f8fafc',
                      border: '1px solid #e7edf3',
                      color: '#4f5f72',
                      '& .MuiChip-label': { fontSize: 11, fontWeight: 600, px: 1 },
                    }}
                  />
                </Stack>

                <Button
                  size="small"
                  variant="outlined"
                  onClick={toggleCodeExpanded}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderColor: '#d6deea',
                    color: '#42546b',
                    borderRadius: 1.6,
                    minWidth: 0,
                    px: 1.05,
                    py: 0.3,
                  }}
                >
                  {codeExpanded ? 'Collapse' : 'Expand full content'}
                </Button>
              </Stack>
            </>
          ) : kind === 'stack' ? (
            <>
                {hasSummary && (
                  <MarkdownText text={summary} mb={0.8} />
                )}

              {stackItems.length === 0 ? (
                <Typography sx={{ fontSize: 12.5, color: '#8b97a9' }}>
                  No stacked items yet.
                </Typography>
              ) : (
                <Box
                  sx={{
                    borderRadius: 2,
                    border: '1px solid #dce4f1',
                    bgcolor: '#fbfcfe',
                    overflow: 'hidden',
                    mb: 0.82,
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{
                      px: 1,
                      py: 0.65,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #e2e9f4',
                      bgcolor: '#f3f6fb',
                    }}
                  >
                    <Typography sx={{ color: '#5d6d84', fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>
                      {`STACK ${stackActiveIndex + 1}/${stackItems.length}`}
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Button size="small" variant="outlined" onClick={showPrevStackItem} sx={{ minWidth: 0, px: 0.8, py: 0.2, fontWeight: 700 }}>
                        {'<'}
                      </Button>
                      <Button size="small" variant="outlined" onClick={showNextStackItem} sx={{ minWidth: 0, px: 0.8, py: 0.2, fontWeight: 700 }}>
                        {'>'}
                      </Button>
                    </Stack>
                  </Stack>

                  <Box sx={{ px: 1.05, py: 0.95 }}>
                    <Typography sx={{ fontSize: 12, color: '#8b97a9', fontWeight: 700, letterSpacing: 0.25, mb: 0.35 }}>
                      {stackActiveItem?.type?.toUpperCase() ?? 'NODE'}
                    </Typography>
                    <Typography sx={{ fontSize: 13.5, color: '#2d3a4f', fontWeight: 700, lineHeight: 1.28 }}>
                      {compact(stackActiveItem?.name ?? 'Untitled', 60)}
                    </Typography>
                    {stackActiveItem?.tag && (
                      <Chip
                        label={compact(stackActiveItem.tag, 18)}
                        size="small"
                        sx={{
                          mt: 0.6,
                          height: 22,
                          borderRadius: 1.7,
                          bgcolor: '#f8fafc',
                          border: '1px solid #e7edf3',
                          color: '#4f5f72',
                          '& .MuiChip-label': { fontSize: 11, fontWeight: 600, px: 1 },
                        }}
                      />
                    )}
                  </Box>
                </Box>
              )}
            </>
          ) : kind === 'service' ? (
            <>
                {hasSummary && (
                  <MarkdownText text={summary} mb={serviceEndpoints.length ? 0.8 : 0} />
                )}

              {serviceEndpoints.length === 0 ? (
                <Typography sx={{ fontSize: 12.5, color: '#8b97a9' }}>
                  No endpoints yet. Add them from the sidebar.
                </Typography>
              ) : (
                <Stack spacing={0.58}>
                  {serviceEndpoints.slice(0, 4).map(endpoint => {
                    const methodTone = endpointMethodTone[endpoint.method.toLowerCase()] ?? endpointMethodTone.get;
                    return (
                      <Stack key={endpoint.id} direction="row" sx={{ alignItems: 'center', gap: 0.55, minWidth: 0 }}>
                        <Chip
                          label={endpoint.method}
                          size="small"
                          sx={{
                            height: 20,
                            borderRadius: 1.5,
                            border: `1px solid ${methodTone.border}`,
                            bgcolor: methodTone.bg,
                            color: methodTone.color,
                            width: 54,
                            '& .MuiChip-label': {
                              px: 0.6,
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: 0.2,
                            },
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            color: '#3c4b61',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            minWidth: 0,
                          }}
                        >
                          {endpoint.route}
                        </Typography>
                      </Stack>
                    );
                  })}

                  {serviceEndpoints.length > 4 && (
                    <Chip
                      label={`+${serviceEndpoints.length - 4} more endpoints`}
                      size="small"
                      sx={{
                        alignSelf: 'flex-start',
                        height: 20,
                        borderRadius: 1.6,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e7edf3',
                        color: '#4f5f72',
                        '& .MuiChip-label': { fontSize: 10.5, fontWeight: 700, px: 0.8 },
                      }}
                    />
                  )}
                </Stack>
              )}
            </>
          ) : kind === 'comment' || kind === 'spec' ? (
            hasSummary ? <MarkdownText text={summary} mb={detailRows.length ? 0.85 : 0} /> : null
          ) : (
            hasSummary ? <MarkdownText text={summary} mb={detailRows.length || kind === 'milestone' ? 0.85 : 0} /> : null
          )}

          {kind === 'milestone' && (
            <Stack direction="row" sx={{ alignItems: 'center', gap: 0.6 }}>
              {milestoneDueDate && (
                <Chip
                  label={`Due ${milestoneDueDate}`}
                  size="small"
                  sx={{
                    height: 22,
                    borderRadius: 1.7,
                    bgcolor: '#f8fafc',
                    border: '1px solid #e7edf3',
                    color: '#4f5f72',
                    '& .MuiChip-label': { fontSize: 11, fontWeight: 600, px: 1 },
                  }}
                />
              )}
              <Box sx={{ flexGrow: 1 }} />
              <Chip
                label={`Flow: ${milestoneFlowCount}`}
                size="small"
                sx={{
                  height: 22,
                  borderRadius: 1.7,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e7edf3',
                  color: '#4f5f72',
                  '& .MuiChip-label': { fontSize: 11, fontWeight: 600, px: 1 },
                }}
              />
            </Stack>
          )}

          {detailRows.length > 0 && (
            <Stack direction="row" spacing={0.65} sx={{ flexWrap: 'wrap', gap: 0.6 }}>
              {detailRows.map(row => (
                <Chip
                  key={row.label}
                  label={`${row.label}: ${row.value}`}
                  size="small"
                  sx={{
                    height: 22,
                    borderRadius: 1.7,
                    bgcolor: '#f8fafc',
                    border: '1px solid #e7edf3',
                    color: '#4f5f72',
                    '& .MuiChip-label': {
                      fontSize: 11,
                      fontWeight: 600,
                      px: 1,
                    },
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Box>

      {Array.from({ length: inputHandleCount }).map((_, index) => (
        <Handle
          key={`in-${index}`}
          className="kf-handle kf-handle-target"
          type="target"
          position={handlePos.input}
          id={`in-${index}`}
          style={getDistributedHandleStyle(handlePos.input, index, inputHandleCount, colors.border)}
        />
      ))}
      {Array.from({ length: outputHandleCount }).map((_, index) => (
        <Handle
          key={`out-${index}`}
          className="kf-handle kf-handle-source"
          type="source"
          position={handlePos.output}
          id={`out-${index}`}
          style={getDistributedHandleStyle(handlePos.output, index, outputHandleCount, colors.border)}
        />
      ))}
    </>
  );
}



