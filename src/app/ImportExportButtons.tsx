import React, { useState } from 'react';
import {
  IconButton, Tooltip, Snackbar, Alert,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { useProjectStore } from '../store/useProjectStore';
import { exportProjectToFile } from '../io/exportProject';
import { importProjectFromFile } from '../io/importProject';

export default function ImportExportButtons() {
  const getExportData = useProjectStore(s => s.getExportData);
  const loadProject = useProjectStore(s => s.loadProject);
  const saveToStorage = useProjectStore(s => s.saveToStorage);

  const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const handleExport = () => {
    const data = getExportData();
    exportProjectToFile(data);
    setSnack({ message: 'Project exported!', severity: 'success' });
  };

  const handleImport = async () => {
    const { project, validation } = await importProjectFromFile();
    if (project) {
      loadProject(project);
      saveToStorage();
      setSnack({ message: 'Project imported successfully!', severity: 'success' });
    } else if (validation.errors.length > 0 && validation.errors[0] !== 'Import cancelled') {
      setSnack({ message: `Import failed: ${validation.errors.join('; ')}`, severity: 'error' });
    }
  };

  return (
    <>
      <Tooltip title="Import Project">
        <IconButton color="inherit" onClick={handleImport}>
          <FileUploadOutlinedIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Export Project">
        <IconButton color="inherit" onClick={handleExport}>
          <FileDownloadOutlinedIcon />
        </IconButton>
      </Tooltip>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack ? (
          <Alert severity={snack.severity} onClose={() => setSnack(null)} variant="filled">
            {snack.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
