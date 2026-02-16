import React, { useState } from 'react';
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useProjectStore } from '../store/useProjectStore';

export default function PageTabs() {
  const pages = useProjectStore(s => s.project.pages);
  const activePageId = useProjectStore(s => s.activePageId);
  const setActivePage = useProjectStore(s => s.setActivePage);
  const addPage = useProjectStore(s => s.addPage);
  const renamePage = useProjectStore(s => s.renamePage);
  const deletePage = useProjectStore(s => s.deletePage);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const activePage = pages.find(page => page.id === activePageId);

  const handleSelectChange = (event: SelectChangeEvent) => {
    setActivePage(event.target.value);
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(e.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleRenameCurrent = () => {
    if (!activePage) return;
    const next = window.prompt('Rename canvas', activePage.name);
    if (typeof next === 'string' && next.trim()) {
      renamePage(activePage.id, next.trim());
    }
    handleCloseMenu();
  };

  const handleDeleteCurrent = () => {
    if (activePageId) deletePage(activePageId);
    handleCloseMenu();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0, gap: 0.4 }}>
      <FormControl
        size="small"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          maxWidth: 340,
          '& .MuiOutlinedInput-root': {
            height: 34,
            color: '#fff',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.42)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.7)' },
            '&.Mui-focused fieldset': { borderColor: '#fff' },
          },
          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.8)' },
          '& .MuiInputLabel-root.Mui-focused': { color: '#fff' },
          '& .MuiSvgIcon-root': { color: '#fff' },
        }}
      >
        <InputLabel id="canvas-select-label">Canvas</InputLabel>
        <Select
          labelId="canvas-select-label"
          value={activePageId}
          onChange={handleSelectChange}
          label="Canvas"
          MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
        >
          {pages.map(page => (
            <MenuItem key={page.id} value={page.id}>
              {page.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Tooltip title="New canvas">
        <IconButton size="small" onClick={() => addPage()} sx={{ color: 'inherit' }}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Canvas actions">
        <IconButton size="small" onClick={handleOpenMenu} sx={{ color: 'inherit' }}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleRenameCurrent} disabled={!activePage}>
          Rename current
        </MenuItem>
        <MenuItem onClick={handleDeleteCurrent} disabled={pages.length <= 1}>
          Delete current
        </MenuItem>
      </Menu>
    </Box>
  );
}
