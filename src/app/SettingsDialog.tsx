import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Stack, Typography, Divider, FormControlLabel, Switch,
} from '@mui/material';
import { useProjectStore } from '../store/useProjectStore';
import type { EdgeType, FlowDirection } from '../model/types';
import { useT } from '../i18n';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: Props) {
  const t = useT();
  const project = useProjectStore(s => s.project);
  const setProjectName = useProjectStore(s => s.setProjectName);
  const setProjectDescription = useProjectStore(s => s.setProjectDescription);
  const setUI = useProjectStore(s => s.setUI);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('settings.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('settings.projectSection')}</Typography>
          <TextField
            label={t('settings.projectName')}
            value={project.project.name}
            onChange={e => setProjectName(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label={t('settings.description')}
            value={project.project.description}
            onChange={e => setProjectDescription(e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
          />

          <Divider />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('settings.flowSection')}</Typography>

          <TextField
            label={t('settings.edgeType')}
            value={project.ui.edgeType}
            onChange={e => setUI({ edgeType: e.target.value as EdgeType })}
            size="small"
            fullWidth
            select
          >
            <MenuItem value="straight">{t('settings.straight')}</MenuItem>
            <MenuItem value="smoothstep">{t('settings.smoothStep')}</MenuItem>
            <MenuItem value="bezier">{t('settings.bezier')}</MenuItem>
          </TextField>

          <FormControlLabel
            control={(
              <Switch
                checked={Boolean(project.ui.edgeDashed)}
                onChange={e => setUI({ edgeDashed: e.target.checked })}
              />
            )}
            label={t('settings.dashedLines')}
          />

          <FormControlLabel
            control={(
              <Switch
                checked={Boolean(project.ui.hideEdgeLabels)}
                onChange={e => setUI({ hideEdgeLabels: e.target.checked })}
              />
            )}
            label={t('settings.hideAllLabels')}
          />

          <FormControlLabel
            control={(
              <Switch
                checked={Boolean(project.ui.showMiniMap)}
                onChange={e => setUI({ showMiniMap: e.target.checked })}
              />
            )}
            label={t('settings.showMiniMap')}
          />

          <Divider />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('settings.pdfSection')}</Typography>

          <FormControlLabel
            control={(
              <Switch
                checked={Boolean(project.ui.pdfIncludeEdgeLabels)}
                onChange={e => setUI({ pdfIncludeEdgeLabels: e.target.checked })}
              />
            )}
            label={t('settings.pdfIncludeEdgeLabels')}
          />

          <Divider />
          <TextField
            label={t('settings.flowDirection')}
            value={project.ui.direction}
            onChange={e => setUI({ direction: e.target.value as FlowDirection })}
            size="small"
            fullWidth
            select
          >
            <MenuItem value="TOP_DOWN">{t('settings.topDown')}</MenuItem>
            <MenuItem value="LEFT_RIGHT">{t('settings.leftRight')}</MenuItem>
            <MenuItem value="RIGHT_LEFT">{t('settings.rightLeft')}</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('settings.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
