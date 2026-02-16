import React, { useCallback, DragEvent, useMemo, useState } from 'react';
import {
  List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Box, Divider, Tabs, Tab, Stack, Chip, Button, Alert, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
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
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { FlowDirection, NodeKind } from '../model/types';
import { nodeTypeRegistry } from '../model/registry';
import { useProjectStore } from '../store/useProjectStore';
import { blueprintPresets, instantiateBlueprintPages, instantiateBlueprintProject } from '../blueprints/presets';

const iconComponents: Record<string, React.ReactElement> = {
  DnsOutlined: <DnsOutlinedIcon />,
  PlayArrowOutlined: <PlayArrowOutlinedIcon />,
  StorageOutlined: <StorageOutlinedIcon />,
  CloudOutlined: <CloudOutlinedIcon />,
  AccountTreeOutlined: <AccountTreeOutlinedIcon />,
  ApiOutlined: <ApiOutlinedIcon />,
  CodeOutlined: <CodeOutlinedIcon />,
  InsightsOutlined: <InsightsOutlinedIcon />,
  ChatBubbleOutline: <ChatBubbleOutlineIcon />,
  DescriptionOutlined: <DescriptionOutlinedIcon />,
  FlagOutlined: <FlagOutlinedIcon />,
};

const coreKinds: NodeKind[] = ['service', 'router', 'action', 'database', 'infra', 'framework', 'integration', 'code'];
const metaKinds: NodeKind[] = ['overview', 'comment', 'spec', 'milestone'];

interface NodePaletteProps {
  onOpenChangelog?: () => void;
  onOpenInfo?: () => void;
}

export default function NodePalette({ onOpenChangelog, onOpenInfo }: NodePaletteProps) {
  const addNode = useProjectStore(s => s.addNode);
  const addPage = useProjectStore(s => s.addPage);
  const setNodes = useProjectStore(s => s.setNodes);
  const setEdges = useProjectStore(s => s.setEdges);
  const setPageViewport = useProjectStore(s => s.setPageViewport);
  const setSelectedNode = useProjectStore(s => s.setSelectedNode);
  const setSelectedEdge = useProjectStore(s => s.setSelectedEdge);
  const loadProject = useProjectStore(s => s.loadProject);
  const setUI = useProjectStore(s => s.setUI);

  const [tab, setTab] = useState<'nodes' | 'blueprints'>('nodes');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [blueprintDirection, setBlueprintDirection] = useState<FlowDirection>('TOP_DOWN');

  const handleClick = useCallback((kind: NodeKind) => {
    // Add to center of viewport (approx)
    addNode(kind, { x: 250 + Math.random() * 100, y: 200 + Math.random() * 100 });
  }, [addNode]);

  const handleDragStart = useCallback((e: DragEvent, kind: NodeKind) => {
    e.dataTransfer.setData('application/knitflow-node-kind', kind);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const applyBlueprintAsProject = useCallback((presetId: string) => {
    const project = instantiateBlueprintProject(presetId, blueprintDirection);
    loadProject(project);
    setFeedback(`Applied blueprint as new project: ${project.project.name} (${blueprintDirection === 'TOP_DOWN' ? 'Top down' : 'Left to right'})`);
  }, [loadProject, blueprintDirection]);

  const appendBlueprintAsCanvases = useCallback((presetId: string) => {
    const stateBefore = useProjectStore.getState();
    if (stateBefore.project.ui.direction !== blueprintDirection) {
      setUI({ direction: blueprintDirection });
    }

    const pages = instantiateBlueprintPages(presetId, blueprintDirection);

    pages.forEach(page => {
      addPage(page.name);
      const activePageId = useProjectStore.getState().activePageId;
      setNodes(activePageId, page.nodes);
      setEdges(activePageId, page.edges);
      setPageViewport(page.viewport);
    });

    setSelectedNode(null);
    setSelectedEdge(null);
    setFeedback(`Added blueprint canvases: ${pages.length} (${blueprintDirection === 'TOP_DOWN' ? 'Top down' : 'Left to right'})`);
  }, [addPage, setNodes, setEdges, setPageViewport, setSelectedNode, setSelectedEdge, blueprintDirection, setUI]);

  const renderGroup = (label: string, kinds: NodeKind[]) => (
    <Box key={label}>
      <Typography variant="overline" sx={{ px: 2, pt: 1.5, display: 'block', color: 'text.secondary' }}>
        {label}
      </Typography>
      <List dense disablePadding>
        {kinds.map(kind => {
          const def = nodeTypeRegistry[kind];
          return (
            <ListItemButton
              key={kind}
              onClick={() => handleClick(kind)}
              draggable
              onDragStart={(e) => handleDragStart(e as unknown as DragEvent, kind)}
              sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {iconComponents[def.icon]}
              </ListItemIcon>
              <ListItemText
                primary={def.label}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  const blueprintsView = useMemo(() => (
    <Stack spacing={1.1} sx={{ p: 1.2 }}>
      <FormControl size="small" fullWidth>
        <InputLabel id="blueprint-direction-label">Flow direction</InputLabel>
        <Select
          labelId="blueprint-direction-label"
          label="Flow direction"
          value={blueprintDirection}
          onChange={event => setBlueprintDirection(event.target.value as FlowDirection)}
        >
          <MenuItem value="TOP_DOWN">Top down</MenuItem>
          <MenuItem value="LEFT_RIGHT">Left to right</MenuItem>
        </Select>
      </FormControl>

      {blueprintPresets.map(preset => (
        <Box
          key={preset.id}
          sx={{
            border: '1px solid #e4e9f1',
            borderRadius: 2,
            p: 1.1,
            bgcolor: '#fff',
          }}
        >
          <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: '#1f2b3d', lineHeight: 1.2 }}>
            {preset.name}
          </Typography>
          <Typography sx={{ mt: 0.45, fontSize: 12, color: '#617088', lineHeight: 1.35 }}>
            {preset.summary}
          </Typography>

          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.85, mb: 0.95 }}>
            <Chip
              size="small"
              label={`${preset.pageCount} canvas${preset.pageCount > 1 ? 'es' : ''}`}
              sx={{
                height: 20,
                bgcolor: '#f3f6fb',
                border: '1px solid #dee7f2',
                color: '#4b5c73',
                '& .MuiChip-label': { px: 0.8, fontSize: 10.5, fontWeight: 700 },
              }}
            />
            {preset.tags.map(tag => (
              <Chip
                key={`${preset.id}-${tag}`}
                size="small"
                label={tag}
                sx={{
                  height: 20,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e5eaf2',
                  color: '#5f7088',
                  '& .MuiChip-label': { px: 0.8, fontSize: 10.5, fontWeight: 600 },
                }}
              />
            ))}
          </Stack>

          <Stack direction="row" spacing={0.8}>
            <Button
              size="small"
              variant="contained"
              onClick={() => applyBlueprintAsProject(preset.id)}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.6 }}
            >
              Apply Project
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => appendBlueprintAsCanvases(preset.id)}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.6 }}
            >
              Add Canvas
            </Button>
          </Stack>
        </Box>
      ))}
    </Stack>
  ), [appendBlueprintAsCanvases, applyBlueprintAsProject, blueprintDirection]);

  return (
    <Box sx={{ width: '100%', pt: 1 }}>
      <Typography variant="subtitle2" sx={{ px: 2, pb: 0.5, fontWeight: 700 }}>
        Node Palette
      </Typography>
      <Stack direction="row" spacing={0.8} sx={{ px: 1.2, pb: 0.9 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={onOpenChangelog}
          startIcon={<HistoryOutlinedIcon />}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.6, flex: 1 }}
        >
          Changelog
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={onOpenInfo}
          startIcon={<InfoOutlinedIcon />}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.6, flex: 1 }}
        >
          Info
        </Button>
      </Stack>
      <Divider />
      <Tabs
        value={tab}
        onChange={(_, value: 'nodes' | 'blueprints') => setTab(value)}
        variant="fullWidth"
        sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 700, fontSize: 12 } }}
      >
        <Tab value="nodes" label="Nodes" />
        <Tab value="blueprints" label="Blueprints" />
      </Tabs>
      <Divider />

      {feedback && (
        <Alert
          severity="success"
          onClose={() => setFeedback(null)}
          sx={{ m: 1, py: 0.4, '& .MuiAlert-message': { fontSize: 12.5 } }}
        >
          {feedback}
        </Alert>
      )}

      {tab === 'nodes' ? (
        <>
          {renderGroup('Core', coreKinds)}
          <Divider sx={{ my: 0.5 }} />
          {renderGroup('Meta', metaKinds)}
        </>
      ) : blueprintsView}
    </Box>
  );
}
