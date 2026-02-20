import React, { useState } from 'react';
import {
  IconButton, Tooltip, Snackbar, Alert,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { useProjectStore } from '../store/useProjectStore';
import { exportProjectToFile } from '../io/exportProject';
import { exportProjectToPdf } from '../io/exportPdf';
import { importProjectFromFile } from '../io/importProject';
import { useT } from '../i18n';

export default function ImportExportButtons() {
  const t = useT();
  const getExportData = useProjectStore(s => s.getExportData);
  const loadProject = useProjectStore(s => s.loadProject);
  const saveToStorage = useProjectStore(s => s.saveToStorage);

  const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const handleExport = () => {
    const data = getExportData();
    exportProjectToFile(data);
    setSnack({ message: t('importExport.projectExported'), severity: 'success' });
  };

  const handleExportPdf = () => {
    const data = getExportData();
    exportProjectToPdf(data, t);
    setSnack({ message: t('importExport.pdfExported'), severity: 'success' });
  };

  const handleImport = async () => {
    const { project, validation } = await importProjectFromFile();
    if (project) {
      loadProject(project);
      saveToStorage();
      setSnack({ message: t('importExport.importSuccess'), severity: 'success' });
    } else if (validation.errors.length > 0 && validation.errors[0] !== 'Import cancelled') {
      setSnack({
        message: t('importExport.importFailed', { errors: validation.errors.join('; ') }),
        severity: 'error',
      });
    }
  };

  return (
    <>
      <Tooltip title={t('importExport.importProject')}>
        <IconButton color="inherit" onClick={handleImport}>
          <FileUploadOutlinedIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('importExport.exportJson')}>
        <IconButton color="inherit" onClick={handleExport}>
          <FileDownloadOutlinedIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('importExport.exportPdf')}>
        <IconButton color="inherit" onClick={handleExportPdf}>
          <PictureAsPdfOutlinedIcon />
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
