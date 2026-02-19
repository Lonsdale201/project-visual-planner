import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Drawer, Box, IconButton,
  Tooltip, Chip, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import FlowCanvas from '../canvas/FlowCanvas';
import NodePalette from '../palette/NodePalette';
import InspectorPanel from '../inspector/InspectorPanel';
import PageTabs from './PageTabs';
import ImportExportButtons from './ImportExportButtons';
import SettingsDialog from './SettingsDialog';
import MarkdownDocsDialog from './MarkdownDocsDialog';
import { APP_VERSION } from './appMeta';
import { useProjectStore } from '../store/useProjectStore';
import type { FlowMode } from '../model/types';
import changelogMarkdown from '../../CHANGELOG.md?raw';
import infoMarkdown from '../../INFO.md?raw';

const LEFT_DRAWER_WIDTH = 220;
const RIGHT_DRAWER_WIDTH = 320;

export default function AppShell() {
  const projectName = useProjectStore(s => s.project.project.name);
  const dirty = useProjectStore(s => s.dirty);
  const selectedNodeId = useProjectStore(s => s.selectedNodeId);
  const selectedEdgeId = useProjectStore(s => s.selectedEdgeId);
  const activeFlow = useProjectStore(s => (s.project.activeFlow === 'business' ? 'business' : 'development'));
  const setActiveFlow = useProjectStore(s => s.setActiveFlow);
  const saveToStorage = useProjectStore(s => s.saveToStorage);
  const resetProject = useProjectStore(s => s.resetProject);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const hasSelection = Boolean(selectedNodeId || selectedEdgeId);
  const effectiveRightOpen = rightOpen && hasSelection;

  // Autosave with debounce
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      saveToStorage();
    }, 1500);
    return () => clearTimeout(timer);
  }, [dirty, saveToStorage]);

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          '& .MuiIconButton-root': { color: 'rgba(255,255,255,0.92)' },
          '& .MuiIconButton-root.Mui-disabled': { color: 'rgba(255,255,255,0.4)' },
        }}
      >
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <IconButton color="inherit" edge="start" onClick={() => setLeftOpen(!leftOpen)}>
            <MenuIcon />
          </IconButton>

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mr: 1 }} noWrap>
            {projectName}
          </Typography>

          <Chip
            label={dirty ? 'Unsaved' : 'Saved'}
            size="small"
            color={dirty ? 'warning' : 'success'}
            sx={{ height: 22, fontSize: '0.7rem' }}
          />
          <Chip
            label={`v${APP_VERSION}`}
            size="small"
            variant="outlined"
            sx={{ height: 22, fontSize: '0.7rem', color: 'white', borderColor: 'rgba(255,255,255,0.45)' }}
          />

          <ToggleButtonGroup
            exclusive
            size="small"
            value={activeFlow}
            onChange={(_, next: FlowMode | null) => {
              if (!next || next === activeFlow) return;
              setActiveFlow(next);
            }}
            sx={{
              ml: 1,
              bgcolor: 'rgba(255,255,255,0.08)',
              borderRadius: 1.2,
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.85)',
                borderColor: 'rgba(255,255,255,0.24)',
                px: 1.2,
                py: 0.28,
                fontSize: 12,
              },
              '& .MuiToggleButton-root.Mui-selected': {
                bgcolor: 'rgba(255,255,255,0.18)',
                color: '#fff',
              },
              '& .MuiToggleButton-root.Mui-selected:hover': {
                bgcolor: 'rgba(255,255,255,0.24)',
              },
            }}
          >
            <ToggleButton value="development">Development</ToggleButton>
            <ToggleButton value="business">Business Brief</ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ mx: 1, flexGrow: 1, minWidth: 0, display: 'flex' }}>
            <PageTabs />
          </Box>

          <ImportExportButtons />

          <Tooltip title="New Project">
            <IconButton color="inherit" onClick={resetProject}>
              <AddCircleOutlineIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Settings">
            <IconButton color="inherit" onClick={() => setSettingsOpen(true)}>
              <SettingsOutlinedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Node Navigator">
            <IconButton
              color="inherit"
              onClick={() => setNavigatorOpen(prev => !prev)}
              sx={{ bgcolor: navigatorOpen ? 'rgba(255,255,255,0.14)' : 'transparent' }}
            >
              <AccountTreeOutlinedIcon />
            </IconButton>
          </Tooltip>

          <IconButton
            color="inherit"
            edge="end"
            onClick={() => setRightOpen(!rightOpen)}
            disabled={!hasSelection}
          >
            <ChevronRightIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Left Drawer - Node Palette */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={leftOpen}
        sx={{
          width: leftOpen ? LEFT_DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: LEFT_DRAWER_WIDTH,
            boxSizing: 'border-box',
            top: 48,
            height: 'calc(100% - 48px)',
          },
        }}
      >
        <NodePalette onOpenChangelog={() => setChangelogOpen(true)} onOpenInfo={() => setInfoOpen(true)} />
      </Drawer>

      {/* Center - Canvas */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '48px',
          height: 'calc(100vh - 48px)',
          overflow: 'hidden',
          transition: 'margin 0.2s',
          ml: leftOpen ? 0 : `-${LEFT_DRAWER_WIDTH}px`,
        }}
      >
        <FlowCanvas showNodeNavigator={navigatorOpen} />
      </Box>

      {/* Right Drawer - Inspector */}
      <Drawer
        variant="persistent"
        anchor="right"
        open={effectiveRightOpen}
        sx={{
          width: effectiveRightOpen ? RIGHT_DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: RIGHT_DRAWER_WIDTH,
            boxSizing: 'border-box',
            top: 48,
            height: 'calc(100% - 48px)',
          },
        }}
      >
        <InspectorPanel />
      </Drawer>

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <MarkdownDocsDialog
        open={changelogOpen}
        onClose={() => setChangelogOpen(false)}
        title="Changelog"
        markdown={changelogMarkdown}
        paginateBySections
        sectionsPerPage={3}
      />

      <MarkdownDocsDialog
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="System Info"
        markdown={infoMarkdown}
      />
    </Box>
  );
}
