import type { NodeKind, NodeStylePreset } from './types';

// ── Field definition for schema-driven forms ──

export type FieldType = 'string' | 'text' | 'enum' | 'tags' | 'date' | 'number' | 'endpointList' | 'boolean';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];      // for enum type
  placeholder?: string;
}

export interface NodeTypeDef {
  kind: NodeKind;
  label: string;
  icon: string;             // MUI icon name key
  defaultStylePreset: NodeStylePreset;
  fields: FieldDef[];
  defaultData: Record<string, unknown>;
  inputHandles: number;
  outputHandles: number;
}

// ── Registry ──

export const nodeTypeRegistry: Record<NodeKind, NodeTypeDef> = {
  service: {
    kind: 'service',
    label: 'Service',
    icon: 'DnsOutlined',
    defaultStylePreset: 'blue',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'name', label: 'Name', type: 'string', placeholder: 'Service name' },
      { key: 'tag', label: 'Tag', type: 'string', placeholder: 'Auth, API, Core...' },
      { key: 'description', label: 'Note', type: 'text', placeholder: 'Describe this service...' },
      { key: 'endpoints', label: 'Endpoints', type: 'endpointList' },
      { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Additional notes...' },
    ],
    defaultData: {
      name: 'Auth API',
      tag: 'Auth',
      description: 'Handles user authentication and session lifecycle.',
      endpoints: [
        { id: 'auth-login', method: 'POST', route: '/auth/login' },
        { id: 'auth-refresh', method: 'POST', route: '/auth/refresh' },
      ],
      notes: 'Core backend service used by web and mobile clients.',
    },
  },

  workstream: {
    kind: 'workstream',
    label: 'Workstream',
    icon: 'DnsOutlined',
    defaultStylePreset: 'blue',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'name', label: 'Name', type: 'string', placeholder: 'Growth Workstream' },
      { key: 'owner', label: 'Owner', type: 'string', placeholder: 'Team / Role owner' },
      { key: 'objective', label: 'Objective', type: 'text', placeholder: 'What outcome this stream drives...' },
      { key: 'deliverables', label: 'Deliverables', type: 'tags', placeholder: 'Landing page, Campaign plan, KPI dashboard' },
      { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Dependencies, constraints, risk...' },
    ],
    defaultData: {
      name: 'Core Workstream',
      owner: 'Marketing Lead',
      objective: 'Drive measurable progress on the main business objective.',
      deliverables: ['Campaign brief', 'Execution timeline'],
      notes: 'Track owners and deadlines for each deliverable.',
    },
  },

  bridge: {
    kind: 'bridge',
    label: 'Flow Bridge',
    icon: 'ApiOutlined',
    defaultStylePreset: 'teal',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'name', label: 'Name', type: 'string', placeholder: 'Bridge to Business Brief' },
      { key: 'toFlow', label: 'Target Flow', type: 'enum', options: ['development', 'business'] },
      { key: 'toPageId', label: 'Target Page ID', type: 'string', placeholder: 'page-main-brief' },
      { key: 'toNodeId', label: 'Target Node ID', type: 'string', placeholder: 'overview-brief' },
      { key: 'syncFields', label: 'Sync Fields', type: 'tags', placeholder: 'goal,scope,kpi' },
      { key: 'notes', label: 'Note', type: 'text', placeholder: 'Bridge behavior and mapping notes...' },
    ],
    defaultData: {
      name: 'Bridge to Business',
      toFlow: 'business',
      toPageId: '',
      toNodeId: '',
      syncFields: [],
      notes: 'Use as a hand-off point between development and business flows.',
    },
  },

  router: {
    kind: 'router',
    label: 'Router',
    icon: 'AccountTreeOutlined',
    defaultStylePreset: 'teal',
    inputHandles: 2,
    outputHandles: 3,
    fields: [
      { key: 'name', label: 'Name', type: 'string', placeholder: 'Auth Event Router' },
      { key: 'tag', label: 'Tag', type: 'string', placeholder: 'Fan-out, Bridge, Merge...' },
      { key: 'inputCount', label: 'Inputs', type: 'number', placeholder: '2' },
      { key: 'outputCount', label: 'Outputs', type: 'number', placeholder: '3' },
      { key: 'notes', label: 'Note', type: 'text', placeholder: 'Routing purpose...' },
    ],
    defaultData: {
      name: 'Flow Router',
      tag: 'Fan-out',
      inputCount: 2,
      outputCount: 3,
      notes: 'Use as a visual split/merge point to reduce line clutter.',
    },
  },

  stack: {
    kind: 'stack',
    label: 'Stack',
    icon: 'AccountTreeOutlined',
    defaultStylePreset: 'teal',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'name', label: 'Name', type: 'string', placeholder: 'Integration Stack' },
      { key: 'summary', label: 'Note', type: 'text', placeholder: 'Why these nodes are grouped...' },
    ],
    defaultData: {
      name: 'Node Stack',
      summary: 'Grouped nodes for cleaner visualization.',
      activeIndex: 0,
      items: [],
    },
  },

  action: {
    kind: 'action',
    label: 'Action',
    icon: 'PlayArrowOutlined',
    defaultStylePreset: 'purple',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'name', label: 'Name', type: 'string', placeholder: 'Action name' },
      { key: 'tag', label: 'Tag', type: 'string', placeholder: 'Webhook, Notify, Sync...' },
      { key: 'comment', label: 'Note', type: 'text', placeholder: 'Short action details...' },
    ],
    defaultData: {
      name: 'Send Notification',
      tag: 'Automation',
      comment: 'Trigger outbound notification after validation.',
    },
  },

  database: {
    kind: 'database',
    label: 'Database',
    icon: 'StorageOutlined',
    defaultStylePreset: 'green',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'name', label: 'Name', type: 'string', placeholder: 'Database name' },
      {
        key: 'dbType',
        label: 'Type',
        type: 'enum',
        options: [
          'postgres',
          'mysql',
          'mongodb',
          'redis',
          'supabase',
          'supabase cloud',
          'google cloud sql',
          'firebase firestore',
          'neon',
          'planetscale',
          's3',
          'sqlite',
          'other',
        ],
      },
      { key: 'connectionNotes', label: 'Note', type: 'text', placeholder: 'Connection string / config...' },
      { key: 'schemaNotes', label: 'Db Schema', type: 'text', placeholder: 'id: uuid pk\nemail: varchar(255) unique\ncreated_at: timestamp' },
    ],
    defaultData: {
      name: 'User Database',
      dbType: 'postgres',
      connectionNotes: 'Primary transactional database in private network.',
      schemaNotes: 'id: uuid pk\nemail: varchar(255) unique\nrole: varchar(32)\ncreated_at: timestamp not null',
      dbSchemaExpanded: false,
    },
  },

  infra: {
    kind: 'infra',
    label: 'Infrastructure',
    icon: 'CloudOutlined',
    defaultStylePreset: 'orange',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'name', label: 'Name', type: 'string', placeholder: 'Infra name' },
      { key: 'provider', label: 'Provider', type: 'string', placeholder: 'AWS, Docker, Nginx...' },
      { key: 'notes', label: 'Note', type: 'text', placeholder: 'Configuration details...' },
    ],
    defaultData: {
      name: 'Cloud Runtime',
      provider: 'AWS',
      notes: 'Runs containerized services behind load balancer.',
    },
  },

  framework: {
    kind: 'framework',
    label: 'Framework',
    icon: 'AccountTreeOutlined',
    defaultStylePreset: 'blue',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'name', label: 'Name', type: 'string', placeholder: 'Framework role' },
      { key: 'framework', label: 'Framework', type: 'string', placeholder: 'WordPress, Strapi, Next.js...' },
      { key: 'notes', label: 'Note', type: 'text', placeholder: 'Architecture notes...' },
    ],
    defaultData: {
      name: 'CMS Core',
      framework: 'Strapi',
      notes: 'Headless CMS powering editorial content and dynamic pages.',
    },
  },

  capability: {
    kind: 'capability',
    label: 'Capability',
    icon: 'InsightsOutlined',
    defaultStylePreset: 'orange',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'name', label: 'Name', type: 'string', placeholder: 'Lifecycle Emailing' },
      { key: 'area', label: 'Area', type: 'string', placeholder: 'Acquisition / Activation / Retention...' },
      { key: 'maturity', label: 'Maturity', type: 'enum', options: ['low', 'medium', 'high'] },
      { key: 'gap', label: 'Gap', type: 'text', placeholder: 'What is currently missing?' },
      { key: 'notes', label: 'Notes', type: 'text', placeholder: 'How this capability supports the plan...' },
    ],
    defaultData: {
      name: 'Execution Capability',
      area: 'Acquisition',
      maturity: 'medium',
      gap: 'Needs clearer process ownership and KPI instrumentation.',
      notes: 'Use this node to map operational capability readiness.',
    },
  },

  integration: {
    kind: 'integration',
    label: 'Integration',
    icon: 'ApiOutlined',
    defaultStylePreset: 'purple',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'name', label: 'Integration Type', type: 'string', placeholder: 'Slack, Stripe, Notion...' },
      { key: 'boundary', label: 'Boundary', type: 'enum', options: ['external', 'internal'] },
      { key: 'baseUrl', label: 'Base URL', type: 'string', placeholder: 'https://api.example.com' },
      { key: 'authMethod', label: 'Auth Method', type: 'string', placeholder: 'Bearer / API Key / OAuth...' },
      { key: 'requestNotes', label: 'Note', type: 'text', placeholder: 'Request format...' },
    ],
    defaultData: {
      name: 'Slack',
      boundary: 'external',
      baseUrl: 'https://slack.com/api',
      authMethod: 'Bearer Token',
      requestNotes: 'POST /chat.postMessage',
    },
  },

  brand: {
    kind: 'brand',
    label: 'Brand Icon',
    icon: 'ApiOutlined',
    defaultStylePreset: 'purple',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'brand', label: 'Brand', type: 'string', placeholder: 'Slack, Gmail, Discord...' },
    ],
    defaultData: {
      brand: 'Slack',
    },
  },

  code: {
    kind: 'code',
    label: 'Code / Schema',
    icon: 'CodeOutlined',
    defaultStylePreset: 'grey',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'title', label: 'Title', type: 'string', placeholder: 'Snippet title' },
      {
        key: 'language',
        label: 'Language',
        type: 'enum',
        options: ['typescript', 'javascript', 'json', 'yaml', 'sql', 'bash', 'http', 'markdown', 'html'],
      },
      {
        key: 'content',
        label: 'Content',
        type: 'text',
        placeholder: 'Paste code / JSON schema / REST payload / API contract...',
      },
    ],
    defaultData: {
      title: 'User schema payload',
      language: 'json',
      content: '{\n  "id": "uuid",\n  "email": "string",\n  "createdAt": "timestamp"\n}',
      expanded: false,
    },
  },

  overview: {
    kind: 'overview',
    label: 'Project Overview',
    icon: 'InsightsOutlined',
    defaultStylePreset: 'teal',
    inputHandles: 0,
    outputHandles: 0,
    fields: [
      { key: 'title', label: 'Title', type: 'string', placeholder: 'Overview title' },
      { key: 'description', label: 'Note', type: 'text', placeholder: 'What this overview summarizes...' },
      { key: 'releaseDate', label: 'Release Date', type: 'string', placeholder: 'Q3 2026 or 2026-09-15' },
      { key: 'stacks', label: 'Stacks', type: 'tags', placeholder: 'Select or type stacks...' },
    ],
    defaultData: {
      title: 'Project Overview',
      description: 'Live summary of integrations, frameworks, action types, databases, and infrastructure.',
      releaseDate: 'Q3 2026',
      stacks: ['TypeScript', 'React', 'Node.js', 'Docker'],
      overviewMilestonesExpanded: false,
      overviewStacksShowLabels: false,
    },
  },

  comment: {
    kind: 'comment',
    label: 'Comment',
    icon: 'ChatBubbleOutline',
    defaultStylePreset: 'grey',
    inputHandles: 0,
    outputHandles: 0,
    fields: [
      { key: 'title', label: 'Title', type: 'string', placeholder: 'Comment title' },
      { key: 'body', label: 'Note', type: 'text', placeholder: 'Write your comment...' },
      { key: 'sticky', label: 'Sticky mode', type: 'boolean' },
      { key: 'includeInPdf', label: 'Include in PDF', type: 'boolean' },
    ],
    defaultData: {
      title: 'Architecture Note',
      body: 'Capture short decisions and assumptions here.',
      sticky: false,
      includeInPdf: true,
    },
  },

  spec: {
    kind: 'spec',
    label: 'Project details',
    icon: 'DescriptionOutlined',
    defaultStylePreset: 'teal',
    inputHandles: 0,
    outputHandles: 0,
    fields: [
      { key: 'title', label: 'Title', type: 'string', placeholder: 'Spec title' },
      { key: 'body', label: 'Note', type: 'text', placeholder: 'Specification content...' },
      { key: 'includeInPdf', label: 'Include in PDF', type: 'boolean' },
    ],
    defaultData: {
      title: 'Project details',
      body: 'Define requirements, constraints, and acceptance criteria.',
      includeInPdf: true,
    },
  },

  milestone: {
    kind: 'milestone',
    label: 'Milestone',
    icon: 'FlagOutlined',
    defaultStylePreset: 'red',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'title', label: 'Title', type: 'string', placeholder: 'Milestone title' },
      { key: 'milestoneLabel', label: 'Milestone Label', type: 'string', placeholder: 'Milestone 1' },
      { key: 'order', label: 'Order', type: 'number', placeholder: '1' },
      { key: 'priority', label: 'Priority', type: 'enum', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'goal', label: 'Note', type: 'text', placeholder: 'What is the goal?' },
      { key: 'dueDate', label: 'Due Date', type: 'date' },
    ],
    defaultData: {
      title: 'MVP Release',
      milestoneLabel: 'Milestone 1',
      order: 1,
      priority: 'high',
      goal: 'Ship end-to-end login and project planning flow.',
      dueDate: '2026-03-15',
    },
  },
  persona: {
    kind: 'persona',
    label: 'Persona',
    icon: 'PersonOutlined',
    defaultStylePreset: 'orange',
    inputHandles: 0,
    outputHandles: 1,
    fields: [
      { key: 'name', label: 'Name', type: 'string', placeholder: 'WP Site Owner' },
      { key: 'role', label: 'Role', type: 'string', placeholder: 'Admin, End-user, Decision maker...' },
      { key: 'painPoints', label: 'Pain Points', type: 'text', placeholder: 'What problems does this persona face?' },
      { key: 'segment', label: 'Segment', type: 'tags', placeholder: 'SMB, Enterprise, Freelancer...' },
      { key: 'priority', label: 'Priority', type: 'enum', options: ['low', 'medium', 'high'] },
    ],
    defaultData: {
      name: 'Primary User',
      role: 'Decision maker',
      painPoints: 'Needs a clear, consolidated view of customer data across multiple sites.',
      segment: ['SMB'],
      priority: 'high',
    },
  },

  feature: {
    kind: 'feature',
    label: 'Feature',
    icon: 'ExtensionOutlined',
    defaultStylePreset: 'blue',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'name', label: 'Name', type: 'string', placeholder: 'Customer 360 View' },
      { key: 'description', label: 'Description', type: 'text', placeholder: 'What does this feature do?' },
      { key: 'priority', label: 'Priority', type: 'enum', options: ['must', 'should', 'could', 'wont'] },
      { key: 'status', label: 'Status', type: 'enum', options: ['planned', 'in-progress', 'done'] },
      { key: 'userStory', label: 'User Story', type: 'text', placeholder: 'As a [role], I want [goal] so that [benefit]...' },
    ],
    defaultData: {
      name: 'Core Feature',
      description: 'A key product capability that delivers direct user value.',
      priority: 'must',
      status: 'planned',
      userStory: 'As a site owner, I want to see all customer activity in one place.',
    },
  },

  dataEntity: {
    kind: 'dataEntity',
    label: 'Data Entity',
    icon: 'TableChartOutlined',
    defaultStylePreset: 'green',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'name', label: 'Name', type: 'string', placeholder: 'Contact' },
      { key: 'description', label: 'Description', type: 'text', placeholder: 'What does this entity represent?' },
      { key: 'attributes', label: 'Attributes', type: 'tags', placeholder: 'email, name, phone, source...' },
      { key: 'source', label: 'Source', type: 'string', placeholder: 'WP Users, WooCommerce, Form...' },
      { key: 'owner', label: 'Owner', type: 'string', placeholder: 'Team or system responsible' },
    ],
    defaultData: {
      name: 'Contact',
      description: 'A unified customer or lead record aggregated from multiple sources.',
      attributes: ['email', 'name', 'source', 'created_at'],
      source: 'WP Users + WooCommerce',
      owner: 'CRM Platform',
    },
  },

  channel: {
    kind: 'channel',
    label: 'Channel',
    icon: 'CampaignOutlined',
    defaultStylePreset: 'purple',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'name', label: 'Name', type: 'string', placeholder: 'WP Plugin Sync' },
      { key: 'channelType', label: 'Type', type: 'enum', options: ['sync', 'webhook', 'embed', 'email', 'manual', 'social', 'paid'] },
      { key: 'direction', label: 'Direction', type: 'enum', options: ['inbound', 'outbound', 'both'] },
      { key: 'metric', label: 'Metric', type: 'string', placeholder: 'Sync latency, Open rate...' },
      { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Channel details and constraints...' },
    ],
    defaultData: {
      name: 'Data Channel',
      channelType: 'sync',
      direction: 'inbound',
      metric: '',
      notes: 'Primary data ingestion or distribution channel.',
    },
  },

  kpi: {
    kind: 'kpi',
    label: 'KPI',
    icon: 'TrackChangesOutlined',
    defaultStylePreset: 'red',
    inputHandles: 1,
    outputHandles: 0,
    fields: [
      { key: 'name', label: 'Name', type: 'string', placeholder: 'Monthly Active Sites' },
      { key: 'target', label: 'Target', type: 'string', placeholder: '100 sites, > 90%, < 5s...' },
      { key: 'unit', label: 'Unit', type: 'string', placeholder: 'count, %, seconds...' },
      { key: 'measurement', label: 'How to Measure', type: 'text', placeholder: 'Query, dashboard, formula...' },
      { key: 'owner', label: 'Owner', type: 'string', placeholder: 'Team or person responsible' },
    ],
    defaultData: {
      name: 'Key Metric',
      target: 'TBD',
      unit: '',
      measurement: 'Define the data source and calculation method.',
      owner: '',
    },
  },

  risk: {
    kind: 'risk',
    label: 'Risk',
    icon: 'WarningAmberOutlined',
    defaultStylePreset: 'orange',
    inputHandles: 1,
    outputHandles: 1,
    fields: [
      { key: 'name', label: 'Name', type: 'string', placeholder: 'GDPR Compliance' },
      { key: 'impact', label: 'Impact', type: 'enum', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'likelihood', label: 'Likelihood', type: 'enum', options: ['low', 'medium', 'high'] },
      { key: 'mitigation', label: 'Mitigation', type: 'text', placeholder: 'How to reduce or handle this risk...' },
      { key: 'status', label: 'Status', type: 'enum', options: ['open', 'mitigated', 'accepted'] },
    ],
    defaultData: {
      name: 'Project Risk',
      impact: 'medium',
      likelihood: 'medium',
      mitigation: 'Identify mitigation steps and assign ownership.',
      status: 'open',
    },
  },
};

export const nodeKinds = Object.keys(nodeTypeRegistry) as NodeKind[];
