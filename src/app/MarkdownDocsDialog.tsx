import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Typography,
  Divider,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useT } from '../i18n';

interface MarkdownDocsDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  markdown: string;
  paginateBySections?: boolean;
  sectionsPerPage?: number;
}

interface MarkdownSection {
  id: string;
  title: string;
  markdown: string;
}

function parseMarkdownSections(markdown: string, notesTitle: string, documentTitle: string): MarkdownSection[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const sections: MarkdownSection[] = [];

  let currentTitle = '';
  let currentBody: string[] = [];

  const flush = () => {
    if (!currentTitle && !currentBody.length) return;
    const fallbackTitle = currentTitle || notesTitle;
    sections.push({
      id: fallbackTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: fallbackTitle,
      markdown: `## ${fallbackTitle}\n\n${currentBody.join('\n').trim()}`,
    });
    currentTitle = '';
    currentBody = [];
  };

  lines.forEach(line => {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      flush();
      currentTitle = match[1].trim();
      return;
    }
    currentBody.push(line);
  });

  flush();

  if (!sections.length) {
    return [{
      id: 'full-doc',
      title: documentTitle,
      markdown,
    }];
  }

  return sections;
}

export default function MarkdownDocsDialog({
  open,
  onClose,
  title,
  markdown,
  paginateBySections = false,
  sectionsPerPage = 3,
}: MarkdownDocsDialogProps) {
  const t = useT();
  const [pageIndex, setPageIndex] = useState(0);

  const sections = useMemo(
    () => parseMarkdownSections(markdown, t('pdf.notes'), t('docs.document')),
    [markdown, t],
  );
  const totalPages = Math.max(1, Math.ceil(sections.length / sectionsPerPage));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  useEffect(() => {
    if (!open) return;
    setPageIndex(0);
  }, [open, markdown]);

  const shownSections = useMemo(() => {
    if (!paginateBySections) return sections;
    const from = safePageIndex * sectionsPerPage;
    return sections.slice(from, from + sectionsPerPage);
  }, [paginateBySections, sections, safePageIndex, sectionsPerPage]);

  const canPrev = safePageIndex > 0;
  const canNext = safePageIndex < totalPages - 1;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {shownSections.map((section, index) => (
            <Box key={`${section.id}-${index}`}>
              <Box
                sx={{
                  '& p': { mt: 0.5, mb: 0.8, lineHeight: 1.55 },
                  '& ul, & ol': { mt: 0.5, mb: 0.8, pl: 2.6 },
                  '& li': { mb: 0.25 },
                  '& h1, & h2, & h3': { mt: 0, mb: 0.8 },
                  '& code': {
                    px: 0.4,
                    py: 0.1,
                    borderRadius: 0.7,
                    bgcolor: '#f4f7fb',
                    border: '1px solid #e0e7f1',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '0.9em',
                  },
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {section.markdown}
                </ReactMarkdown>
              </Box>
              {index < shownSections.length - 1 && <Divider sx={{ mt: 1 }} />}
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {paginateBySections
            ? t('docs.pageOf', { page: safePageIndex + 1, total: totalPages })
            : t('docs.sections', { count: sections.length })}
        </Typography>
        <Stack direction="row" spacing={1}>
          {paginateBySections && (
            <>
              <Button onClick={() => setPageIndex(safePageIndex - 1)} disabled={!canPrev}>{t('docs.previous')}</Button>
              <Button onClick={() => setPageIndex(safePageIndex + 1)} disabled={!canNext}>{t('docs.next')}</Button>
            </>
          )}
          <Button onClick={onClose} variant="contained">{t('docs.close')}</Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
