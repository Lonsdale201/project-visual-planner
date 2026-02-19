// ── Domain types ──

export type FlowDirection = 'TOP_DOWN' | 'LEFT_RIGHT' | 'RIGHT_LEFT';
export type EdgeType = 'straight' | 'smoothstep' | 'bezier';
export type ThemePreset = 'light' | 'dark';

export type NodeKind =
  | 'service'
  | 'workstream'
  | 'bridge'
  | 'router'
  | 'stack'
  | 'action'
  | 'database'
  | 'infra'
  | 'framework'
  | 'capability'
  | 'integration'
  | 'brand'
  | 'code'
  | 'overview'
  | 'comment'
  | 'spec'
  | 'milestone'
  | 'persona'
  | 'feature'
  | 'dataEntity'
  | 'channel'
  | 'kpi'
  | 'risk';

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

export interface WorkstreamData {
  name: string;
  owner: string;
  objective: string;
  deliverables: string[];
  notes: string;
}

export interface ActionData {
  name: string;
  tag: string;
  comment: string;
}

export interface BridgeData {
  name: string;
  toFlow: FlowMode;
  toPageId: string;
  toNodeId: string;
  syncFields: string[];
  notes: string;
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
  dbType:
    | 'postgres'
    | 'mysql'
    | 'mongodb'
    | 'redis'
    | 'supabase'
    | 'supabase cloud'
    | 'google cloud sql'
    | 'firebase firestore'
    | 'neon'
    | 'planetscale'
    | 's3'
    | 'sqlite'
    | 'other';
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

export interface CapabilityData {
  name: string;
  area: string;
  maturity: 'low' | 'medium' | 'high';
  gap: string;
  notes: string;
}

export interface IntegrationData {
  name: string;
  boundary: 'internal' | 'external';
  baseUrl: string;
  authMethod: string;
  requestNotes: string;
}

export interface BrandData {
  brand: string;
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
  sticky?: boolean;
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

export interface PersonaData {
  name: string;
  role: string;
  painPoints: string;
  segment: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface FeatureData {
  name: string;
  description: string;
  priority: 'must' | 'should' | 'could' | 'wont';
  status: 'planned' | 'in-progress' | 'done';
  userStory: string;
}

export interface DataEntityData {
  name: string;
  description: string;
  attributes: string[];
  source: string;
  owner: string;
}

export interface ChannelData {
  name: string;
  channelType: 'sync' | 'webhook' | 'embed' | 'email' | 'manual' | 'social' | 'paid';
  direction: 'inbound' | 'outbound' | 'both';
  metric: string;
  notes: string;
}

export interface KpiData {
  name: string;
  target: string;
  unit: string;
  measurement: string;
  owner: string;
}

export interface RiskData {
  name: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'low' | 'medium' | 'high';
  mitigation: string;
  status: 'open' | 'mitigated' | 'accepted';
}

export type NodeDataMap = {
  service: ServiceData;
  workstream: WorkstreamData;
  bridge: BridgeData;
  router: RouterData;
  stack: StackData;
  action: ActionData;
  database: DatabaseData;
  infra: InfraData;
  framework: FrameworkData;
  capability: CapabilityData;
  integration: IntegrationData;
  brand: BrandData;
  code: CodeData;
  overview: OverviewData;
  comment: CommentData;
  spec: SpecData;
  milestone: MilestoneData;
  persona: PersonaData;
  feature: FeatureData;
  dataEntity: DataEntityData;
  channel: ChannelData;
  kpi: KpiData;
  risk: RiskData;
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
  pdfIncludeEdgeLabels?: boolean;
}

export interface ProjectMeta {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type FlowMode = 'development' | 'business';

export interface FlowGraph {
  ui: ProjectUI;
  pages: Page[];
}

export interface ProjectFlows {
  development: FlowGraph;
  business: FlowGraph;
}

export interface Project {
  schemaVersion: string;
  project: ProjectMeta;
  ui: ProjectUI;
  pages: Page[];
  activeFlow?: FlowMode;
  flows?: ProjectFlows;
}
