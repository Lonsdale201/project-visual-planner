import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Stack, Typography, Divider, FormControlLabel, Switch,
} from '@mui/material';
import { useProjectStore } from '../store/useProjectStore';
import type { EdgeType, FlowDirection } from '../model/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: Props) {
  const project = useProjectStore(s => s.project);
  const setProjectName = useProjectStore(s => s.setProjectName);
  const setProjectDescription = useProjectStore(s => s.setProjectDescription);
  const setUI = useProjectStore(s => s.setUI);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Project Settings</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Project</Typography>
          <TextField
            label="Project Name"
            value={project.project.name}
            onChange={e => setProjectName(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Description"
            value={project.project.description}
            onChange={e => setProjectDescription(e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
          />

          <Divider />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Flow</Typography>

          <TextField
            label="Edge Type"
            value={project.ui.edgeType}
            onChange={e => setUI({ edgeType: e.target.value as EdgeType })}
            size="small"
            fullWidth
            select
          >
            <MenuItem value="straight">Straight</MenuItem>
            <MenuItem value="smoothstep">Smooth Step</MenuItem>
            <MenuItem value="bezier">Bezier</MenuItem>
          </TextField>

          <FormControlLabel
            control={(
              <Switch
                checked={Boolean(project.ui.edgeDashed)}
                onChange={e => setUI({ edgeDashed: e.target.checked })}
              />
            )}
            label="Dashed connection lines"
          />

          <FormControlLabel
            control={(
              <Switch
                checked={Boolean(project.ui.hideEdgeLabels)}
                onChange={e => setUI({ hideEdgeLabels: e.target.checked })}
              />
            )}
            label="Hide all labels"
          />

          <FormControlLabel
            control={(
              <Switch
                checked={Boolean(project.ui.showMiniMap)}
                onChange={e => setUI({ showMiniMap: e.target.checked })}
              />
            )}
            label="Show mini map"
          />

          <Divider />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>PDF Export</Typography>

          <FormControlLabel
            control={(
              <Switch
                checked={Boolean(project.ui.pdfIncludeEdgeLabels)}
                onChange={e => setUI({ pdfIncludeEdgeLabels: e.target.checked })}
              />
            )}
            label="Include edge labels in PDF"
          />

          <Divider />
          <TextField
            label="Flow Direction"
            value={project.ui.direction}
            onChange={e => setUI({ direction: e.target.value as FlowDirection })}
            size="small"
            fullWidth
            select
          >
            <MenuItem value="TOP_DOWN">Top to Down</MenuItem>
            <MenuItem value="LEFT_RIGHT">Left to Right</MenuItem>
            <MenuItem value="RIGHT_LEFT">Right to Left</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
