import type { NodeKind, NodeStylePreset } from './types';

// ── Field definition for schema-driven forms ──

export type FieldType = 'string' | 'text' | 'enum' | 'tags' | 'date' | 'number' | 'endpointList';

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
      { key: 'dbType', label: 'Type', type: 'enum', options: ['postgres', 'mysql', 'mongodb', 'redis', 'supabase', 's3', 'sqlite', 'other'] },
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
    ],
    defaultData: {
      title: 'Architecture Note',
      body: 'Capture short decisions and assumptions here.',
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
    ],
    defaultData: {
      title: 'Project details',
      body: 'Define requirements, constraints, and acceptance criteria.',
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
};

export const nodeKinds = Object.keys(nodeTypeRegistry) as NodeKind[];
