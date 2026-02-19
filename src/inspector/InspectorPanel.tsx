import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Divider, TextField, Button, Chip, Stack, Tabs, Tab, Alert,
} from '@mui/material';
import { useProjectStore } from '../store/useProjectStore';
import { nodeTypeRegistry } from '../model/registry';
import SchemaForm from './forms/SchemaForm';
import type { NodeKind, NodeStylePreset, Page } from '../model/types';

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
  const patchNode = useProjectStore(s => s.patchNode);
  const updateEdgeLabel = useProjectStore(s => s.updateEdgeLabel);
  const removeNode = useProjectStore(s => s.removeNode);

  const node = page.nodes.find(n => n.id === selectedNodeId);
  if (!node) return <StatsPanel />;
  const showJsonEditor = node.type !== 'overview';

  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [jsonDraft, setJsonDraft] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonDirty, setJsonDirty] = useState(false);

  const def = nodeTypeRegistry[node.type];
  const nodeName = (node.data.name as string) || (node.data.title as string) || (node.data.brand as string) || def.label;

  const handleChange = (key: string, value: unknown) => {
    updateNodeData(node.id, { [key]: value });
  };

  const canonicalNodeJson = useMemo(
    () => JSON.stringify(node, null, 2),
    [node],
  );

  const immutableTopLevelKeys = useMemo(() => new Set([
    'id',
    'type',
    'width',
    'height',
    'selected',
    'dragging',
    'resizing',
    'positionAbsolute',
    'sourcePosition',
    'targetPosition',
    'zIndex',
    'parentId',
    'extent',
    'expandParent',
    'hidden',
  ]), []);

  useEffect(() => {
    setJsonError(null);
    setJsonDirty(false);
    setJsonDraft(canonicalNodeJson);
    setMode('form');
  }, [node.id]);

  useEffect(() => {
    if (jsonDirty) return;
    setJsonDraft(canonicalNodeJson);
  }, [canonicalNodeJson, jsonDirty]);

  const copyJson = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(jsonDraft);
        return;
      }
      const textarea = document.createElement('textarea');
      textarea.value = jsonDraft;
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

  const pasteJson = async () => {
    try {
      if (!navigator.clipboard?.readText) return;
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;
      setJsonDraft(text);
      setJsonDirty(true);
      setJsonError(null);
    } catch {
      // noop
    }
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setJsonError('JSON must be an object.');
        return;
      }

      const value = parsed as Record<string, unknown>;
      const stylePresets: NodeStylePreset[] = ['blue', 'green', 'orange', 'red', 'purple', 'grey', 'teal'];

      const patch: {
        data?: Record<string, unknown>;
        position?: { x: number; y: number };
        stylePreset?: NodeStylePreset;
      } = {};

      const hasMutableTopLevelKeys =
        Object.prototype.hasOwnProperty.call(value, 'data')
        || Object.prototype.hasOwnProperty.call(value, 'position')
        || Object.prototype.hasOwnProperty.call(value, 'stylePreset');

      const hasImmutableTopLevelKeys = Object.keys(value).some(key => immutableTopLevelKeys.has(key));

      if (Object.prototype.hasOwnProperty.call(value, 'data')) {
        if (!value.data || typeof value.data !== 'object' || Array.isArray(value.data)) {
          setJsonError('`data` must be an object.');
          return;
        }
        patch.data = value.data as Record<string, unknown>;
      } else if (!hasMutableTopLevelKeys && !hasImmutableTopLevelKeys) {
        // Convenience mode: paste plain data object.
        patch.data = value;
      }

      if (Object.prototype.hasOwnProperty.call(value, 'position')) {
        const position = value.position as unknown;
        if (!position || typeof position !== 'object' || Array.isArray(position)) {
          setJsonError('`position` must be an object with numeric `x` and `y`.');
          return;
        }

        const x = (position as { x?: unknown }).x;
        const y = (position as { y?: unknown }).y;
        if (typeof x !== 'number' || !Number.isFinite(x) || typeof y !== 'number' || !Number.isFinite(y)) {
          setJsonError('`position.x` and `position.y` must be finite numbers.');
          return;
        }

        patch.position = { x, y };
      }

      if (Object.prototype.hasOwnProperty.call(value, 'stylePreset')) {
        const stylePreset = value.stylePreset;
        if (typeof stylePreset === 'string' && stylePresets.includes(stylePreset as NodeStylePreset)) {
          patch.stylePreset = stylePreset as NodeStylePreset;
        } else {
          setJsonError(`Invalid stylePreset. Allowed: ${stylePresets.join(', ')}.`);
          return;
        }
      }

      // Intentionally ignored on apply: immutable/system top-level keys and unknown keys.
      if (!patch.data && !patch.position && !patch.stylePreset) {
        if (hasImmutableTopLevelKeys) {
          setJsonError('Only immutable/system fields were found. Editable fields: `data`, `position`, `stylePreset`.');
          return;
        }
        setJsonError('No applicable fields found. Use `data`, `position` or `stylePreset`.');
        return;
      }

      patchNode(node.id, patch);
      setJsonError(null);
      setJsonDirty(false);
    } catch {
      setJsonError('Invalid JSON format.');
    }
  };

  const resetJsonDraft = () => {
    setJsonDraft(canonicalNodeJson);
    setJsonError(null);
    setJsonDirty(false);
  };

  const outgoingEdges = page.edges.filter(e => e.source === node.id);
  const targetNameById = new Map(page.nodes.map(n => [n.id, (n.data.name as string) || (n.data.title as string) || 'Untitled']));
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            {def.label}
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2, mt: 0.2 }}>
            {nodeName || 'Untitled'}
          </Typography>
          <Stack direction="row" spacing={0.6} sx={{ mt: 0.4, alignItems: 'center', minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                color: 'text.secondary',
                userSelect: 'all',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 180,
              }}
              title={node.id}
            >
              {node.id}
            </Typography>
          </Stack>
        </Box>
        <Button size="small" color="error" onClick={() => removeNode(node.id)}>
          Delete
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Tabs
        value={mode}
        onChange={(_, value: 'form' | 'json') => setMode(value)}
        variant="fullWidth"
        sx={{ mb: 1.2, minHeight: 34, '& .MuiTab-root': { minHeight: 34, textTransform: 'none', fontWeight: 700, fontSize: 12 } }}
      >
        <Tab value="form" label="Form" />
        {showJsonEditor && <Tab value="json" label="JSON" />}
      </Tabs>

      {mode === 'form' || !showJsonEditor ? (
        <SchemaForm
          fields={def.fields}
          data={node.data}
          nodeKind={node.type}
          onChange={handleChange}
        />
      ) : (
        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Editable node JSON. Apply ignores immutable/system keys (for example <code>id</code>, <code>type</code>, <code>width</code>, <code>height</code>).
          </Typography>
          <TextField
            value={jsonDraft}
            onChange={event => {
              setJsonDraft(event.target.value);
              setJsonDirty(true);
            }}
            multiline
            minRows={16}
            fullWidth
            size="small"
            sx={{
              '& .MuiInputBase-inputMultiline': {
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 12.5,
                lineHeight: 1.45,
                resize: 'vertical',
              },
            }}
          />
          {jsonError && (
            <Alert severity="error" sx={{ py: 0.3 }}>
              {jsonError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
            <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', gap: 0.8 }}>
              <Button size="small" variant="outlined" onClick={copyJson} sx={{ textTransform: 'none' }}>
                Copy
              </Button>
              <Button size="small" variant="outlined" onClick={pasteJson} sx={{ textTransform: 'none' }}>
                Paste
              </Button>
              <Button size="small" variant="outlined" onClick={resetJsonDraft} sx={{ textTransform: 'none' }}>
                Reset
              </Button>
            </Stack>
            <Button
              size="small"
              variant="contained"
              onClick={applyJson}
              sx={{ textTransform: 'none', minWidth: 88, ml: 'auto' }}
            >
              Apply
            </Button>
          </Box>
        </Stack>
      )}

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
