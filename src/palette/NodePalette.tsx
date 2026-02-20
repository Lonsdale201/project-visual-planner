import React, { useCallback, type DragEvent, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
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
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmber';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { FlowDirection, FlowMode, NodeKind } from '../model/types';
import { nodeTypeRegistry } from '../model/registry';
import { useProjectStore } from '../store/useProjectStore';
import { blueprintPresets, instantiateBlueprintPages, instantiateBlueprintProject } from '../blueprints/presets';
import { useI18nStore, useT } from '../i18n';
import type { Locale, TranslationKey } from '../i18n';

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
  PersonOutlined: <PersonOutlinedIcon />,
  ExtensionOutlined: <ExtensionOutlinedIcon />,
  TableChartOutlined: <TableChartOutlinedIcon />,
  CampaignOutlined: <CampaignOutlinedIcon />,
  TrackChangesOutlined: <TrackChangesOutlinedIcon />,
  WarningAmberOutlined: <WarningAmberOutlinedIcon />,
};

const developmentCoreKinds: NodeKind[] = ['service', 'bridge', 'router', 'action', 'database', 'infra', 'framework', 'integration', 'brand', 'code'];
const developmentMetaKinds: NodeKind[] = ['overview', 'comment', 'spec', 'milestone'];
const businessStrategyKinds: NodeKind[] = ['persona', 'feature', 'kpi'];
const businessExecutionKinds: NodeKind[] = ['channel', 'dataEntity', 'brand', 'router'];
const businessAlignmentKinds: NodeKind[] = ['risk', 'bridge', 'comment'];

const nodeTranslationKeyByKind: Record<NodeKind, TranslationKey> = {
  service: 'nodes.service',
  workstream: 'nodes.workstream',
  bridge: 'nodes.bridge',
  router: 'nodes.router',
  stack: 'nodes.stack',
  action: 'nodes.action',
  database: 'nodes.database',
  infra: 'nodes.infra',
  framework: 'nodes.framework',
  capability: 'nodes.capability',
  integration: 'nodes.integration',
  brand: 'nodes.brand',
  code: 'nodes.code',
  overview: 'nodes.overview',
  comment: 'nodes.comment',
  spec: 'nodes.spec',
  milestone: 'nodes.milestone',
  persona: 'nodes.persona',
  feature: 'nodes.feature',
  dataEntity: 'nodes.dataEntity',
  channel: 'nodes.channel',
  kpi: 'nodes.kpi',
  risk: 'nodes.risk',
};

interface NodePaletteProps {
  onOpenChangelog?: () => void;
  onOpenInfo?: () => void;
}

export default function NodePalette({ onOpenChangelog, onOpenInfo }: NodePaletteProps) {
  const t = useT();
  const locale = useI18nStore(s => s.locale);
  const setLocale = useI18nStore(s => s.setLocale);
  const addNode = useProjectStore(s => s.addNode);
  const addPage = useProjectStore(s => s.addPage);
  const setNodes = useProjectStore(s => s.setNodes);
  const setEdges = useProjectStore(s => s.setEdges);
  const setPageViewport = useProjectStore(s => s.setPageViewport);
  const setSelectedNode = useProjectStore(s => s.setSelectedNode);
  const setSelectedEdge = useProjectStore(s => s.setSelectedEdge);
  const loadProject = useProjectStore(s => s.loadProject);
  const setUI = useProjectStore(s => s.setUI);
  const activeFlow = useProjectStore(s => (s.project.activeFlow === 'business' ? 'business' : 'development'));

  const [tab, setTab] = useState<'nodes' | 'blueprints'>('nodes');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [blueprintDirection, setBlueprintDirection] = useState<FlowDirection>('TOP_DOWN');

  const handleClick = useCallback((kind: NodeKind) => {
    addNode(kind, { x: 250 + Math.random() * 100, y: 200 + Math.random() * 100 });
  }, [addNode]);

  const handleDragStart = useCallback((e: DragEvent, kind: NodeKind) => {
    e.dataTransfer.setData('application/knitflow-node-kind', kind);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const applyBlueprintAsProject = useCallback((presetId: string) => {
    const project = instantiateBlueprintProject(presetId, blueprintDirection);
    loadProject(project);
    setFeedback(t('palette.appliedAsProject', {
      name: project.project.name,
      direction: blueprintDirection === 'TOP_DOWN' ? t('palette.topDown') : t('palette.leftRight'),
    }));
  }, [blueprintDirection, loadProject, t]);

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
    setFeedback(t('palette.addedCanvases', {
      count: pages.length,
      direction: blueprintDirection === 'TOP_DOWN' ? t('palette.topDown') : t('palette.leftRight'),
    }));
  }, [addPage, blueprintDirection, setEdges, setNodes, setPageViewport, setSelectedEdge, setSelectedNode, setUI, t]);

  const getKindLabel = (kind: NodeKind, flow: FlowMode): string => {
    if (flow === 'business') {
      if (kind === 'brand') return t('palette.brandChannelIcon');
      if (kind === 'router') return t('palette.flowSplit');
      if (kind === 'bridge') return t('palette.projectHandoff');
      if (kind === 'comment') return t('palette.note');
    }
    return t(nodeTranslationKeyByKind[kind]);
  };

  const renderGroup = (label: string, kinds: NodeKind[], flow: FlowMode) => (
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
                primary={getKindLabel(kind, flow)}
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
        <InputLabel id="blueprint-direction-label">{t('palette.flowDirection')}</InputLabel>
        <Select
          labelId="blueprint-direction-label"
          label={t('palette.flowDirection')}
          value={blueprintDirection}
          onChange={event => setBlueprintDirection(event.target.value as FlowDirection)}
        >
          <MenuItem value="TOP_DOWN">{t('palette.topDown')}</MenuItem>
          <MenuItem value="LEFT_RIGHT">{t('palette.leftRight')}</MenuItem>
        </Select>
      </FormControl>

      {blueprintPresets.filter(preset => preset.flow === activeFlow).map(preset => {
        const nameKey = `blueprints.${preset.id}.name` as TranslationKey;
        const summaryKey = `blueprints.${preset.id}.summary` as TranslationKey;
        const translatedName = t(nameKey);
        const translatedSummary = t(summaryKey);
        const name = translatedName === nameKey ? preset.name : translatedName;
        const summary = translatedSummary === summaryKey ? preset.summary : translatedSummary;

        return (
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
              {name}
            </Typography>
            <Typography sx={{ mt: 0.45, fontSize: 12, color: '#617088', lineHeight: 1.35 }}>
              {summary}
            </Typography>

            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.85, mb: 0.95 }}>
              <Chip
                size="small"
                label={preset.pageCount > 1
                  ? t('palette.canvasCountPlural', { count: preset.pageCount })
                  : t('palette.canvasCount', { count: preset.pageCount })}
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
                {t('palette.applyProject')}
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => appendBlueprintAsCanvases(preset.id)}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.6 }}
              >
                {t('palette.addCanvas')}
              </Button>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  ), [activeFlow, appendBlueprintAsCanvases, applyBlueprintAsProject, blueprintDirection, t]);

  return (
    <Box sx={{ width: '100%', pt: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" sx={{ px: 2, pb: 0.5, fontWeight: 700 }}>
        {t('palette.title')}
      </Typography>
      <Stack direction="row" spacing={0.8} sx={{ px: 1.2, pb: 0.9 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={onOpenChangelog}
          startIcon={<HistoryOutlinedIcon />}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.6, flex: 1 }}
        >
          {t('palette.changelog')}
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={onOpenInfo}
          startIcon={<InfoOutlinedIcon />}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.6, flex: 1 }}
        >
          {t('palette.info')}
        </Button>
      </Stack>
      <Divider />
      <Tabs
        value={tab}
        onChange={(_, value: 'nodes' | 'blueprints') => setTab(value)}
        variant="fullWidth"
        sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 700, fontSize: 12 } }}
      >
        <Tab value="nodes" label={t('palette.nodesTab')} />
        <Tab value="blueprints" label={t('palette.blueprintsTab')} />
      </Tabs>
      <Divider />

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
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
            {activeFlow === 'development' ? (
              <>
                {renderGroup(t('palette.groupCore'), developmentCoreKinds, activeFlow)}
                <Divider sx={{ my: 0.5 }} />
                {renderGroup(t('palette.groupMeta'), developmentMetaKinds, activeFlow)}
              </>
            ) : (
              <>
                {renderGroup(t('palette.groupStrategy'), businessStrategyKinds, activeFlow)}
                <Divider sx={{ my: 0.5 }} />
                {renderGroup(t('palette.groupExecution'), businessExecutionKinds, activeFlow)}
                <Divider sx={{ my: 0.5 }} />
                {renderGroup(t('palette.groupAlignment'), businessAlignmentKinds, activeFlow)}
              </>
            )}
          </>
        ) : blueprintsView}
      </Box>

      <Divider />
      <Box
        sx={{
          px: 1.2,
          py: 0.95,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          bgcolor: '#f8fbff',
          borderTop: '1px solid #dde7f4',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: 0.3,
            color: '#3b4f69',
            textTransform: 'uppercase',
          }}
        >
          {t('fields.language')}
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={locale}
          onChange={(_, value: Locale | null) => {
            if (!value) return;
            setLocale(value);
          }}
          sx={{
            bgcolor: '#e9f1fb',
            border: '1px solid #b9cde7',
            borderRadius: 2,
            p: 0.25,
            '& .MuiToggleButton-root': {
              minWidth: 52,
              height: 30,
              border: 0,
              borderRadius: 1.4,
              px: 1.1,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.4,
              color: '#355072',
              textTransform: 'uppercase',
            },
            '& .MuiToggleButton-root.Mui-selected': {
              bgcolor: '#1f4f89',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(31, 79, 137, 0.36)',
            },
            '& .MuiToggleButton-root.Mui-selected:hover': {
              bgcolor: '#1a4578',
            },
          }}
        >
          <ToggleButton value="en">EN</ToggleButton>
          <ToggleButton value="hu">HU</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
}
