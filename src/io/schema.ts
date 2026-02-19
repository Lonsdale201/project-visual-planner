import type { JSONSchemaType } from 'ajv';
import type { Project } from '../model/types';

// We use a loose schema definition (not strict JSONSchemaType) because
// the full Project type has union data types that are hard to express.
// Instead we use a practical AJV-compatible schema object.

export const projectJsonSchema: Record<string, unknown> = {
  type: 'object',
  required: ['schemaVersion', 'project', 'ui', 'pages'],
  properties: {
    schemaVersion: { type: 'string' },
    activeFlow: { type: 'string', enum: ['development', 'business'] },
    project: {
      type: 'object',
      required: ['id', 'name'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
    ui: {
      type: 'object',
      required: ['edgeType', 'direction'],
      properties: {
        themePreset: { type: 'string', enum: ['light', 'dark'] },
        edgeType: { type: 'string', enum: ['straight', 'smoothstep', 'bezier'] },
        direction: { type: 'string', enum: ['TOP_DOWN', 'LEFT_RIGHT', 'RIGHT_LEFT'] },
        edgeDashed: { type: 'boolean' },
        hideEdgeLabels: { type: 'boolean' },
        showMiniMap: { type: 'boolean' },
      },
    },
    pages: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['id', 'name', 'nodes', 'edges'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          viewport: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              zoom: { type: 'number' },
            },
          },
          nodes: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'type', 'position', 'data'],
              properties: {
                id: { type: 'string' },
                type: { type: 'string', enum: ['service', 'workstream', 'bridge', 'router', 'stack', 'action', 'database', 'infra', 'framework', 'capability', 'integration', 'brand', 'code', 'overview', 'comment', 'spec', 'milestone', 'persona', 'feature', 'dataEntity', 'channel', 'kpi', 'risk'] },
                position: {
                  type: 'object',
                  required: ['x', 'y'],
                  properties: { x: { type: 'number' }, y: { type: 'number' } },
                },
                data: { type: 'object' },
                stylePreset: { type: 'string' },
              },
            },
          },
          edges: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'source', 'target'],
              properties: {
                id: { type: 'string' },
                source: { type: 'string' },
                target: { type: 'string' },
                sourceHandle: { type: 'string' },
                targetHandle: { type: 'string' },
                type: { type: 'string' },
                label: { type: 'string' },
              },
            },
          },
        },
      },
    },
    flows: {
      type: 'object',
      required: ['development', 'business'],
      properties: {
        development: {
          type: 'object',
          required: ['ui', 'pages'],
          properties: {
            ui: {
              type: 'object',
              required: ['edgeType', 'direction'],
              properties: {
                themePreset: { type: 'string', enum: ['light', 'dark'] },
                edgeType: { type: 'string', enum: ['straight', 'smoothstep', 'bezier'] },
                direction: { type: 'string', enum: ['TOP_DOWN', 'LEFT_RIGHT', 'RIGHT_LEFT'] },
                edgeDashed: { type: 'boolean' },
                hideEdgeLabels: { type: 'boolean' },
                showMiniMap: { type: 'boolean' },
              },
            },
            pages: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['id', 'name', 'nodes', 'edges'],
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  viewport: {
                    type: 'object',
                    properties: {
                      x: { type: 'number' },
                      y: { type: 'number' },
                      zoom: { type: 'number' },
                    },
                  },
                  nodes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'type', 'position', 'data'],
                      properties: {
                        id: { type: 'string' },
                        type: { type: 'string', enum: ['service', 'workstream', 'bridge', 'router', 'stack', 'action', 'database', 'infra', 'framework', 'capability', 'integration', 'brand', 'code', 'overview', 'comment', 'spec', 'milestone', 'persona', 'feature', 'dataEntity', 'channel', 'kpi', 'risk'] },
                        position: {
                          type: 'object',
                          required: ['x', 'y'],
                          properties: { x: { type: 'number' }, y: { type: 'number' } },
                        },
                        data: { type: 'object' },
                        stylePreset: { type: 'string' },
                      },
                    },
                  },
                  edges: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'source', 'target'],
                      properties: {
                        id: { type: 'string' },
                        source: { type: 'string' },
                        target: { type: 'string' },
                        sourceHandle: { type: 'string' },
                        targetHandle: { type: 'string' },
                        type: { type: 'string' },
                        label: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        business: {
          type: 'object',
          required: ['ui', 'pages'],
          properties: {
            ui: {
              type: 'object',
              required: ['edgeType', 'direction'],
              properties: {
                themePreset: { type: 'string', enum: ['light', 'dark'] },
                edgeType: { type: 'string', enum: ['straight', 'smoothstep', 'bezier'] },
                direction: { type: 'string', enum: ['TOP_DOWN', 'LEFT_RIGHT', 'RIGHT_LEFT'] },
                edgeDashed: { type: 'boolean' },
                hideEdgeLabels: { type: 'boolean' },
                showMiniMap: { type: 'boolean' },
              },
            },
            pages: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['id', 'name', 'nodes', 'edges'],
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  viewport: {
                    type: 'object',
                    properties: {
                      x: { type: 'number' },
                      y: { type: 'number' },
                      zoom: { type: 'number' },
                    },
                  },
                  nodes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'type', 'position', 'data'],
                      properties: {
                        id: { type: 'string' },
                        type: { type: 'string', enum: ['service', 'workstream', 'bridge', 'router', 'stack', 'action', 'database', 'infra', 'framework', 'capability', 'integration', 'brand', 'code', 'overview', 'comment', 'spec', 'milestone', 'persona', 'feature', 'dataEntity', 'channel', 'kpi', 'risk'] },
                        position: {
                          type: 'object',
                          required: ['x', 'y'],
                          properties: { x: { type: 'number' }, y: { type: 'number' } },
                        },
                        data: { type: 'object' },
                        stylePreset: { type: 'string' },
                      },
                    },
                  },
                  edges: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'source', 'target'],
                      properties: {
                        id: { type: 'string' },
                        source: { type: 'string' },
                        target: { type: 'string' },
                        sourceHandle: { type: 'string' },
                        targetHandle: { type: 'string' },
                        type: { type: 'string' },
                        label: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  additionalProperties: false,
};
