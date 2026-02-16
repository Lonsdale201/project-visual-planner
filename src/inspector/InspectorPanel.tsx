import React from 'react';
import {
  Box, Typography, Divider, TextField, Button, Chip, Stack,
} from '@mui/material';
import { useProjectStore } from '../store/useProjectStore';
import { nodeTypeRegistry } from '../model/registry';
import SchemaForm from './forms/SchemaForm';
import type { NodeKind, Page } from '../model/types';

// Helper: get active page directly from state (no get() indirection)
function selectActivePage(s: { project: { pages: Page[] }; activePageId: string }): Page {
  return s.project.pages.find(p => p.id === s.activePageId) ?? s.project.pages[0];
}

// Stats panel shown when nothing is selected
function StatsPanel() {
  const project = useProjectStore(s => s.project);
  const page = useProjectStore(s => selectActivePage(s));

  // Count nodes by type
  const nodeCounts: Record<string, number> = {};
  page.nodes.forEach(n => {
    nodeCounts[n.type] = (nodeCounts[n.type] ?? 0) + 1;
  });

  // Count unconnected nodes
  const connectedIds = new Set<string>();
  page.edges.forEach(e => { connectedIds.add(e.source); connectedIds.add(e.target); });
  const unconnected = page.nodes.filter(n => !connectedIds.has(n.id)).length;

  // Milestones
  const milestones = page.nodes.filter(n => n.type === 'milestone');

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
        Project Info
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {project.project.name}
      </Typography>
      {project.project.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {project.project.description}
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
        Page: {page.name}
      </Typography>

      <Typography variant="body2">Nodes: {page.nodes.length}</Typography>
      <Typography variant="body2">Edges: {page.edges.length}</Typography>
      <Typography variant="body2">Unconnected: {unconnected}</Typography>

      {Object.keys(nodeCounts).length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">By type:</Typography>
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {Object.entries(nodeCounts).map(([type, count]) => (
              <Chip key={type} label={`${nodeTypeRegistry[type as NodeKind]?.label ?? type}: ${count}`} size="small" />
            ))}
          </Stack>
        </Box>
      )}

      {milestones.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
            Milestones
          </Typography>
          {milestones.map(m => (
            <Box key={m.id} sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {m.data.title as string || 'Untitled'}
              </Typography>
              {m.data.dueDate && (
                <Typography variant="caption" color="text.secondary">
                  Due: {m.data.dueDate as string}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// Node inspector
function NodeInspector() {
  const selectedNodeId = useProjectStore(s => s.selectedNodeId);
  const page = useProjectStore(s => selectActivePage(s));
  const updateNodeData = useProjectStore(s => s.updateNodeData);
  const updateEdgeLabel = useProjectStore(s => s.updateEdgeLabel);
  const removeNode = useProjectStore(s => s.removeNode);

  const node = page.nodes.find(n => n.id === selectedNodeId);
  if (!node) return <StatsPanel />;

  const def = nodeTypeRegistry[node.type];

  const handleChange = (key: string, value: unknown) => {
    updateNodeData(node.id, { [key]: value });
  };

  const outgoingEdges = page.edges.filter(e => e.source === node.id);
  const targetNameById = new Map(page.nodes.map(n => [n.id, (n.data.name as string) || (n.data.title as string) || 'Untitled']));

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {def.label}
        </Typography>
        <Button size="small" color="error" onClick={() => removeNode(node.id)}>
          Delete
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <SchemaForm
        fields={def.fields}
        data={node.data}
        nodeKind={node.type}
        onChange={handleChange}
      />

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        Connection Labels
      </Typography>
      {outgoingEdges.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          No outgoing connections yet. Create an edge to add a label.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {outgoingEdges.map((edge, index) => (
            <TextField
              key={edge.id}
              label={`To: ${targetNameById.get(edge.target) ?? edge.target}`}
              value={edge.label ?? ''}
              onChange={e => updateEdgeLabel(edge.id, e.target.value)}
              placeholder={`Optional label for connection ${index + 1}`}
              size="small"
              fullWidth
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

// Edge inspector
function EdgeInspector() {
  const selectedEdgeId = useProjectStore(s => s.selectedEdgeId);
  const page = useProjectStore(s => selectActivePage(s));
  const updateEdgeLabel = useProjectStore(s => s.updateEdgeLabel);
  const removeEdge = useProjectStore(s => s.removeEdge);

  const edge = page.edges.find(e => e.id === selectedEdgeId);
  if (!edge) return <StatsPanel />;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Edge
        </Typography>
        <Button size="small" color="error" onClick={() => removeEdge(edge.id)}>
          Delete
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <TextField
        label="Label"
        value={edge.label ?? ''}
        onChange={e => updateEdgeLabel(edge.id, e.target.value)}
        size="small"
        fullWidth
        placeholder="Optional edge label..."
      />
    </Box>
  );
}

export default function InspectorPanel() {
  const selectedNodeId = useProjectStore(s => s.selectedNodeId);
  const selectedEdgeId = useProjectStore(s => s.selectedEdgeId);

  if (selectedNodeId) return <NodeInspector />;
  if (selectedEdgeId) return <EdgeInspector />;
  return <StatsPanel />;
}
