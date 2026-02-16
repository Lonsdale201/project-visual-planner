// ── Domain types ──

export type FlowDirection = 'TOP_DOWN' | 'LEFT_RIGHT' | 'RIGHT_LEFT';
export type EdgeType = 'straight' | 'smoothstep' | 'bezier';
export type ThemePreset = 'light' | 'dark';

export type NodeKind =
  | 'service'
  | 'router'
  | 'stack'
  | 'action'
  | 'database'
  | 'infra'
  | 'framework'
  | 'integration'
  | 'code'
  | 'overview'
  | 'comment'
  | 'spec'
  | 'milestone';

// ── Style presets for nodes ──
export type NodeStylePreset =
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'purple'
  | 'grey'
  | 'teal';

// ── Node data payloads (per kind) ──

export type ServiceEndpointMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'WS';

export interface ServiceEndpoint {
  id: string;
  method: ServiceEndpointMethod;
  route: string;
}

export interface ServiceData {
  name: string;
  tag: string;
  description: string;
  endpoints: ServiceEndpoint[];
  notes: string;
}

export interface ActionData {
  name: string;
  tag: string;
  comment: string;
}

export interface RouterData {
  name: string;
  tag: string;
  notes: string;
  inputCount: number;
  outputCount: number;
}

export interface StackItemData {
  id: string;
  type: NodeKind;
  name: string;
  tag?: string;
  title?: string;
  dbType?: string;
  provider?: string;
  framework?: string;
  milestoneLabel?: string;
  snapshot?: ProjectNode;
}

export interface StackData {
  name: string;
  summary: string;
  activeIndex: number;
  items: StackItemData[];
  stashedEdges?: ProjectEdge[];
}

export interface DatabaseData {
  name: string;
  dbType: 'postgres' | 'mysql' | 'mongodb' | 'redis' | 'supabase' | 's3' | 'sqlite' | 'other';
  connectionNotes: string;
  schemaNotes: string;
}

export interface InfraData {
  name: string;
  provider: string;
  notes: string;
}

export interface FrameworkData {
  name: string;
  framework: string;
  notes: string;
}

export interface IntegrationData {
  name: string;
  boundary: 'internal' | 'external';
  baseUrl: string;
  authMethod: string;
  requestNotes: string;
}

export interface OverviewData {
  title: string;
  description: string;
  stacks: string[];
  releaseDate: string;
}

export interface CodeData {
  title: string;
  language: 'typescript' | 'javascript' | 'json' | 'yaml' | 'sql' | 'bash' | 'http' | 'markdown' | 'html';
  content: string;
  expanded: boolean;
  attachedTo?: string;
}

export interface CommentData {
  title: string;
  body: string;
  attachedTo?: string;
}

export interface SpecData {
  title: string;
  body: string;
}

export interface MilestoneData {
  title: string;
  milestoneLabel: string;
  order: number;
  goal: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export type NodeDataMap = {
  service: ServiceData;
  router: RouterData;
  stack: StackData;
  action: ActionData;
  database: DatabaseData;
  infra: InfraData;
  framework: FrameworkData;
  integration: IntegrationData;
  code: CodeData;
  overview: OverviewData;
  comment: CommentData;
  spec: SpecData;
  milestone: MilestoneData;
};

// ── Node data as flexible record (schema-driven) ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NodeData = Record<string, any>;

// ── Graph elements ──

export interface ProjectNode {
  id: string;
  type: NodeKind;
  position: { x: number; y: number };
  data: NodeData;
  stylePreset?: NodeStylePreset;
}

export interface ProjectEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: EdgeType;
  label?: string;
}

// ── Page ──

export interface PageViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Page {
  id: string;
  name: string;
  viewport: PageViewport;
  nodes: ProjectNode[];
  edges: ProjectEdge[];
}

// ── Project ──

export interface ProjectUI {
  themePreset: ThemePreset;
  edgeType: EdgeType;
  direction: FlowDirection;
  edgeDashed: boolean;
  hideEdgeLabels: boolean;
  showMiniMap: boolean;
}

export interface ProjectMeta {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  schemaVersion: string;
  project: ProjectMeta;
  ui: ProjectUI;
  pages: Page[];
}
