import { jsPDF } from 'jspdf';
import type { Project, ProjectNode, ProjectEdge, NodeKind, Page, ProjectUI } from '../model/types';
import { nodeTypeRegistry } from '../model/registry';

// ── Layout constants ──

const PAGE_W = 210;
const PAGE_H = 297;
const M_LEFT = 20;
const M_RIGHT = 20;
const M_TOP = 22;
const M_BOTTOM = 18;
const CONTENT_W = PAGE_W - M_LEFT - M_RIGHT;
const MAX_Y = PAGE_H - M_BOTTOM;

// ── Colors ──

const C_PRIMARY = [30, 64, 120] as const;       // dark blue
const C_ACCENT = [59, 130, 246] as const;        // bright blue
const C_TEXT = [31, 41, 55] as const;            // grey-900
const C_MUTED = [107, 114, 128] as const;        // grey-500
const C_LIGHT_BG = [248, 250, 252] as const;     // grey-50
const C_BORDER = [226, 232, 240] as const;       // grey-200
const C_RED = [185, 28, 28] as const;
const C_GREEN = [5, 150, 105] as const;
const C_ORANGE = [194, 65, 12] as const;
const C_PURPLE = [109, 40, 217] as const;

// ── Helpers ──

interface ConnectionInfo {
  incoming: { name: string; type: NodeKind; label: string }[];
  outgoing: { name: string; type: NodeKind; label: string }[];
}

function buildConnectionMap(pages: Page[]): Map<string, ConnectionInfo> {
  const nodeById = new Map<string, ProjectNode>();
  pages.forEach(p => p.nodes.forEach(n => nodeById.set(n.id, n)));

  const map = new Map<string, ConnectionInfo>();
  pages.forEach(p => p.nodes.forEach(n => map.set(n.id, { incoming: [], outgoing: [] })));

  pages.forEach(p => {
    p.edges.forEach(edge => {
      const sourceNode = nodeById.get(edge.source);
      const targetNode = nodeById.get(edge.target);
      if (!sourceNode || !targetNode) return;

      const sourceName = str(sourceNode.data.name) || str(sourceNode.data.title) || 'Untitled';
      const targetName = str(targetNode.data.name) || str(targetNode.data.title) || 'Untitled';
      const edgeLabel = edge.label || '';

      map.get(edge.source)?.outgoing.push({ name: targetName, type: targetNode.type, label: edgeLabel });
      map.get(edge.target)?.incoming.push({ name: sourceName, type: sourceNode.type, label: edgeLabel });
    });
  });

  return map;
}

function collectNodesByKind(pages: Page[]): Map<NodeKind, ProjectNode[]> {
  const map = new Map<NodeKind, ProjectNode[]>();
  pages.forEach(p => {
    p.nodes.forEach(n => {
      const list = map.get(n.type) ?? [];
      list.push(n);
      map.set(n.type, list);
    });
  });
  return map;
}

function str(val: unknown): string {
  if (typeof val === 'string') return val.trim();
  return '';
}

function tags(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter(v => typeof v === 'string' && v.trim()).map(v => String(v).trim());
  return [];
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + '...';
}

/**
 * Parse schema notes like "id: uuid pk\nemail: varchar(255) unique"
 * into table rows: [['id', 'uuid pk'], ['email', 'varchar(255) unique']]
 */
function parseSchemaToRows(schema: string): string[][] {
  const lines = schema.split('\n').map(l => l.trim()).filter(Boolean);
  const rows: string[][] = [];
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      rows.push([line.slice(0, colonIdx).trim(), line.slice(colonIdx + 1).trim()]);
    } else {
      // Try space-separated: "id uuid pk" -> ["id", "uuid pk"]
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        rows.push([parts[0], parts.slice(1).join(' ')]);
      }
    }
  }
  return rows;
}

/** Strip markdown bold/italic markers for plain-text PDF rendering */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold**
    .replace(/__(.+?)__/g, '$1')        // __bold__
    .replace(/\*(.+?)\*/g, '$1')        // *italic*
    .replace(/_(.+?)_/g, '$1')          // _italic_
    .replace(/~~(.+?)~~/g, '$1')        // ~~strike~~
    .replace(/`(.+?)`/g, '$1')          // `code`
    .replace(/^#{1,6}\s+/gm, '')        // # headings
    .replace(/^\s*[-*+]\s+/gm, '- ')    // bullet lists normalize
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // [link](url) -> link
}

/**
 * Rough height estimate (mm) for a node block in the PDF.
 * Doesn't need to be pixel-perfect — just prevents most cross-page splits.
 */
function estimateNodeHeight(node: ProjectNode, includeEdgeLabels: boolean): number {
  let h = 12; // subTitle baseline
  const d = node.data;

  const textLines = (val: unknown, width = CONTENT_W - 4): number => {
    const s = str(val);
    if (!s) return 0;
    // Rough: ~3.5 chars per mm at 10pt Helvetica
    const charsPerLine = Math.floor(width * 3.5);
    return Math.max(1, Math.ceil(s.length / charsPerLine));
  };

  switch (node.type) {
    case 'service':
      h += 5; // description
      h += textLines(d.description) * 5;
      h += textLines(d.notes) * 5;
      h += (Array.isArray(d.endpoints) ? Math.min(d.endpoints.length, 10) : 0) * 6 + 10; // table
      break;
    case 'database':
      h += 6; // type label
      h += textLines(d.connectionNotes) * 5;
      h += textLines(d.schemaNotes) * 6 + 10; // schema table
      break;
    case 'integration':
      h += 6; // requestNotes
      h += textLines(d.requestNotes) * 5;
      break;
    case 'infra':
    case 'framework':
      h += 6 + textLines(d.notes) * 5;
      break;
    case 'persona':
      h += 6; // role
      h += 8; // priority bar
      h += textLines(d.painPoints) * 5;
      h += tags(d.segment).length > 0 ? 8 : 0;
      break;
    case 'feature':
      h += textLines(d.description) * 5;
      h += textLines(d.userStory) * 5 + 6; // quote block
      break;
    case 'dataEntity':
      h += textLines(d.description) * 5;
      h += tags(d.attributes).length > 0 ? 8 : 0;
      h += 10; // source + owner
      break;
    case 'channel':
      h += 9; // direction badge
      h += 6; // metric
      h += textLines(d.notes) * 5;
      break;
    case 'kpi':
      h += 20; // big metric
      h += 10; // measurement + owner
      break;
    case 'risk':
      h += 16; // risk matrix
      h += textLines(d.mitigation) * 5;
      break;
    case 'milestone':
      h += textLines(d.goal) * 5 + 6;
      break;
    case 'comment':
    case 'spec':
      h += textLines(d.body) * 5;
      break;
    default:
      h += 20;
  }

  if (includeEdgeLabels) h += 8; // connections line
  return h;
}

// ── PDF Builder Wrapper ──

class PdfBuilder {
  doc: jsPDF;
  y = M_TOP;
  pageNum = 1;
  projectName = '';

  constructor() {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  }

  private ensureSpace(needed: number) {
    if (this.y + needed > MAX_Y) {
      this.newPage();
    }
  }

  /** If the block won't fit on this page but WOULD fit on a fresh page, break now. */
  ensureBlockFits(estimatedH: number) {
    const remaining = MAX_Y - this.y;
    const fullPageH = MAX_Y - M_TOP;
    if (estimatedH > remaining && estimatedH <= fullPageH) {
      this.newPage();
    }
  }

  newPage() {
    this.doc.addPage();
    this.pageNum++;
    this.y = M_TOP;
    this.drawPageHeader();
  }

  drawPageHeader() {
    if (this.pageNum <= 1) return;
    this.doc.setFontSize(8);
    this.doc.setTextColor(...C_MUTED);
    this.doc.text(this.projectName, M_LEFT, 10);
    this.doc.text(`Page ${this.pageNum}`, PAGE_W - M_RIGHT, 10, { align: 'right' });
    this.doc.setDrawColor(...C_BORDER);
    this.doc.line(M_LEFT, 13, PAGE_W - M_RIGHT, 13);
    this.y = M_TOP;
  }

  // ── Cover page ──

  drawCover(name: string, description: string, flowLabel: string, date: string, specTexts: string[] = []) {
    this.projectName = name;

    // Background band
    this.doc.setFillColor(...C_PRIMARY);
    this.doc.rect(0, 0, PAGE_W, 85, 'F');

    // Title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(truncate(name, 50), M_LEFT, 42);

    // Flow label
    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(flowLabel, M_LEFT, 55);

    // Date
    this.doc.setFontSize(10);
    this.doc.text(date, M_LEFT, 68);

    // Description
    let yAfterDesc = 100;
    if (description) {
      this.doc.setTextColor(...C_TEXT);
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      const lines: string[] = this.doc.splitTextToSize(description, CONTENT_W);
      this.doc.text(lines, M_LEFT, 100);
      yAfterDesc = 100 + lines.length * 5 + 6;
    }

    // Spec / Project Details content on the cover page
    if (specTexts.length > 0) {
      this.y = yAfterDesc;
      // Thin accent line separator
      this.doc.setDrawColor(...C_ACCENT);
      this.doc.setLineWidth(0.6);
      this.doc.line(M_LEFT, this.y, M_LEFT + 40, this.y);
      this.doc.setLineWidth(0.2);
      this.y += 6;

      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...C_PRIMARY);
      this.doc.text('Project Details', M_LEFT, this.y);
      this.y += 6;

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...C_TEXT);
      for (const text of specTexts) {
        const cleaned = stripMarkdown(text);
        const lines: string[] = this.doc.splitTextToSize(cleaned, CONTENT_W);
        for (const line of lines) {
          if (this.y + 5 > MAX_Y) break; // stay on page 1
          this.doc.text(line, M_LEFT, this.y);
          this.y += 4.5;
        }
        this.y += 2;
      }
    }

    // Footer
    this.doc.setFontSize(8);
    this.doc.setTextColor(...C_MUTED);
    this.doc.text('Generated by KnitFlow', M_LEFT, PAGE_H - 10);

    this.newPage();
  }

  // ── Section header ──

  sectionTitle(title: string) {
    this.ensureSpace(16);
    this.doc.setFillColor(...C_ACCENT);
    this.doc.rect(M_LEFT, this.y - 1, 3, 10, 'F');
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...C_PRIMARY);
    this.doc.text(title, M_LEFT + 7, this.y + 7);
    this.y += 14;
    this.doc.setDrawColor(...C_BORDER);
    this.doc.line(M_LEFT, this.y, PAGE_W - M_RIGHT, this.y);
    this.y += 6;
  }

  // ── Subsection ──

  subTitle(title: string) {
    this.ensureSpace(12);
    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...C_TEXT);
    this.doc.text(title, M_LEFT, this.y + 4);
    this.y += 9;
  }

  // ── Body text ──

  bodyText(text: string, indent = 0) {
    if (!text) return;
    const cleaned = stripMarkdown(text);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...C_TEXT);
    const maxW = CONTENT_W - indent;
    const lines: string[] = this.doc.splitTextToSize(cleaned, maxW);
    for (const line of lines) {
      this.ensureSpace(5);
      this.doc.text(line, M_LEFT + indent, this.y);
      this.y += 4.5;
    }
    this.y += 1;
  }

  // ── Label: value pair ──

  labelValue(label: string, value: string, indent = 0) {
    if (!value) return;
    this.ensureSpace(6);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...C_MUTED);
    this.doc.text(label + ':', M_LEFT + indent, this.y);
    const labelW = this.doc.getTextWidth(label + ': ');
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...C_TEXT);
    const remaining = CONTENT_W - indent - labelW;
    const valLines: string[] = this.doc.splitTextToSize(stripMarkdown(value), remaining);
    this.doc.text(valLines[0] || '', M_LEFT + indent + labelW, this.y);
    this.y += 4.5;
    for (let i = 1; i < valLines.length; i++) {
      this.ensureSpace(5);
      this.doc.text(valLines[i], M_LEFT + indent + labelW, this.y);
      this.y += 4.5;
    }
  }

  // ── Status badge (small rounded pill) ──

  statusBadge(status: string) {
    this.ensureSpace(7);
    const s = (status || 'open').toLowerCase();
    const color: readonly [number, number, number] =
      s === 'mitigated' || s === 'done' || s === 'resolved' ? C_GREEN
      : s === 'in-progress' || s === 'in_progress' ? C_ACCENT
      : s === 'blocked' ? C_RED
      : C_MUTED;
    const label = s.toUpperCase();
    const tw = this.doc.getTextWidth(label) + 6;
    this.doc.setFillColor(color[0], color[1], color[2]);
    this.doc.roundedRect(M_LEFT + 4, this.y - 2.8, tw > 18 ? tw : 18, 5, 1.5, 1.5, 'F');
    this.doc.setFontSize(7.5);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(label, M_LEFT + 7, this.y + 0.3);
    this.doc.setTextColor(...C_TEXT);
    this.y += 5;
  }

  // ── Inline badge pair (priority + status on one line) ──

  dualBadge(priority: string, status: string) {
    this.ensureSpace(7);
    const p = (priority || 'must').toLowerCase();
    const s = (status || 'planned').toLowerCase();

    const pColor: readonly [number, number, number] =
      p === 'must' || p === 'critical' ? C_RED : p === 'should' ? C_ORANGE : C_MUTED;
    const sColor: readonly [number, number, number] =
      s === 'done' || s === 'complete' ? C_GREEN
      : s === 'in-progress' || s === 'in_progress' ? C_ACCENT
      : C_MUTED;

    let x = M_LEFT + 4;

    // Priority pill
    const pLabel = p.toUpperCase();
    this.doc.setFontSize(7.5);
    this.doc.setFont('helvetica', 'bold');
    const pW = Math.max(this.doc.getTextWidth(pLabel) + 6, 18);
    this.doc.setFillColor(pColor[0], pColor[1], pColor[2]);
    this.doc.roundedRect(x, this.y - 2.8, pW, 5, 1.5, 1.5, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(pLabel, x + 3, this.y + 0.3);
    x += pW + 3;

    // Status pill
    const sLabel = s.toUpperCase();
    const sW = Math.max(this.doc.getTextWidth(sLabel) + 6, 18);
    this.doc.setFillColor(sColor[0], sColor[1], sColor[2]);
    this.doc.roundedRect(x, this.y - 2.8, sW, 5, 1.5, 1.5, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(sLabel, x + 3, this.y + 0.3);

    this.doc.setTextColor(...C_TEXT);
    this.y += 5;
  }

  // ── Small label (no value, just a styled label) ──

  miniLabel(label: string, indent = 0) {
    this.ensureSpace(5);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...C_MUTED);
    this.doc.text(label.toUpperCase(), M_LEFT + indent, this.y);
    this.y += 3.5;
  }

  // ── Tag chips row ──

  tagRow(label: string, items: string[], color: readonly [number, number, number] = C_ACCENT) {
    if (items.length === 0) return;
    this.ensureSpace(8);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...C_MUTED);
    this.doc.text(label + ':', M_LEFT, this.y);
    let x = M_LEFT + this.doc.getTextWidth(label + ':  ');

    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    for (const tag of items) {
      const tw = this.doc.getTextWidth(tag) + 5;
      if (x + tw > PAGE_W - M_RIGHT) {
        this.y += 6;
        this.ensureSpace(6);
        x = M_LEFT + 4;
      }
      this.doc.setFillColor(color[0], color[1], color[2]);
      this.doc.roundedRect(x, this.y - 3.2, tw, 5, 1.5, 1.5, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(tag, x + 2.5, this.y + 0.3);
      x += tw + 2;
    }
    this.doc.setTextColor(...C_TEXT);
    this.y += 6;
  }

  // ── Connections list ──

  connections(connInfo: ConnectionInfo) {
    const has = connInfo.incoming.length > 0 || connInfo.outgoing.length > 0;
    if (!has) return;
    this.ensureSpace(6);
    this.doc.setFontSize(8.5);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(...C_MUTED);
    const parts: string[] = [];
    if (connInfo.incoming.length > 0) {
      const names = connInfo.incoming.map(c => c.label ? `${c.name} (${c.label})` : c.name).join(', ');
      parts.push(`<- ${names}`);
    }
    if (connInfo.outgoing.length > 0) {
      const names = connInfo.outgoing.map(c => c.label ? `${c.name} (${c.label})` : c.name).join(', ');
      parts.push(`-> ${names}`);
    }
    const text = parts.join('  |  ');
    const lines: string[] = this.doc.splitTextToSize(text, CONTENT_W - 4);
    for (const line of lines) {
      this.ensureSpace(4.5);
      this.doc.text(line, M_LEFT + 4, this.y);
      this.y += 4;
    }
    this.y += 2;
  }

  // ── Table ──

  table(headers: string[], rows: string[][], colWidths: number[]) {
    const rowH = 6;
    const headerH = 7;

    // Header
    this.ensureSpace(headerH + rowH);
    this.doc.setFillColor(...C_PRIMARY);
    this.doc.rect(M_LEFT, this.y, CONTENT_W, headerH, 'F');
    this.doc.setFontSize(8.5);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    let hx = M_LEFT + 2;
    headers.forEach((h, i) => {
      this.doc.text(truncate(h, 30), hx, this.y + 5);
      hx += colWidths[i];
    });
    this.y += headerH;

    // Rows
    this.doc.setFont('helvetica', 'normal');
    rows.forEach((row, rowIdx) => {
      this.ensureSpace(rowH);
      if (rowIdx % 2 === 0) {
        this.doc.setFillColor(...C_LIGHT_BG);
        this.doc.rect(M_LEFT, this.y, CONTENT_W, rowH, 'F');
      }
      this.doc.setTextColor(...C_TEXT);
      this.doc.setFontSize(8.5);
      let rx = M_LEFT + 2;
      row.forEach((cell, i) => {
        this.doc.text(truncate(cell, Math.floor(colWidths[i] / 2)), rx, this.y + 4.2);
        rx += colWidths[i];
      });
      this.y += rowH;
    });
    this.y += 4;
  }

  // ── Horizontal rule ──

  separator() {
    this.y += 2;
    this.doc.setDrawColor(...C_BORDER);
    this.doc.line(M_LEFT + 10, this.y, PAGE_W - M_RIGHT - 10, this.y);
    this.y += 5;
  }

  // ── Priority bar (visual) ──

  priorityBar(label: string, level: string) {
    this.ensureSpace(8);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...C_MUTED);
    this.doc.text(label, M_LEFT + 4, this.y);
    const barX = M_LEFT + 30;
    const barW = 40;
    const pct = level === 'high' || level === 'critical' ? 1.0 : level === 'medium' ? 0.6 : 0.3;
    const color: [number, number, number] = level === 'high' || level === 'critical' ? [...C_RED] : level === 'medium' ? [...C_ORANGE] : [...C_MUTED];
    // Background
    this.doc.setFillColor(235, 238, 243);
    this.doc.roundedRect(barX, this.y - 2.8, barW, 3.5, 1.5, 1.5, 'F');
    // Fill
    this.doc.setFillColor(...color);
    this.doc.roundedRect(barX, this.y - 2.8, barW * pct, 3.5, 1.5, 1.5, 'F');
    // Label
    this.doc.setTextColor(...color);
    this.doc.text(level.toUpperCase(), barX + barW + 3, this.y);
    this.doc.setTextColor(...C_TEXT);
    this.y += 6;
  }

  // ── Big metric value (for KPI) ──

  bigMetric(value: string, unit: string) {
    this.ensureSpace(18);
    this.doc.setFillColor(254, 242, 242);
    this.doc.roundedRect(M_LEFT + 4, this.y - 1, 60, 16, 2, 2, 'F');
    this.doc.setDrawColor(254, 202, 202);
    this.doc.roundedRect(M_LEFT + 4, this.y - 1, 60, 16, 2, 2, 'S');
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...C_RED);
    this.doc.text(value || 'TBD', M_LEFT + 8, this.y + 9);
    if (unit) {
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(unit, M_LEFT + 8, this.y + 13.5);
    }
    this.doc.setTextColor(...C_TEXT);
    this.y += 19;
  }

  // ── Risk matrix pair ──

  riskMatrix(impact: string, likelihood: string) {
    this.ensureSpace(12);
    const boxW = 35;
    const drawBox = (x: number, label: string, value: string) => {
      const color = value === 'high' || value === 'critical' ? C_RED : value === 'medium' ? C_ORANGE : C_GREEN;
      this.doc.setFillColor(color[0], color[1], color[2]);
      this.doc.roundedRect(x, this.y, boxW, 10, 1.5, 1.5, 'F');
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(label, x + 2, this.y + 3.5);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text((value || 'medium').toUpperCase(), x + 2, this.y + 8);
    };
    drawBox(M_LEFT + 4, 'IMPACT', impact);
    drawBox(M_LEFT + 4 + boxW + 4, 'LIKELIHOOD', likelihood);
    this.doc.setTextColor(...C_TEXT);
    this.y += 14;
  }

  // ── Direction arrow (for Channel) ──

  directionBadge(direction: string, channelType: string) {
    this.ensureSpace(8);
    const arrow = direction === 'inbound' ? 'v' : direction === 'outbound' ? '^' : '<>';
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...C_PURPLE);
    this.doc.text(`${arrow} ${(direction || 'inbound').toUpperCase()}`, M_LEFT + 4, this.y + 1);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...C_TEXT);
    this.doc.text(channelType || 'sync', M_LEFT + 40, this.y + 1);
    this.y += 7;
  }

  // ── Quote block (for user stories) ──

  quoteBlock(text: string) {
    if (!text) return;
    this.ensureSpace(10);
    this.doc.setDrawColor(...C_ACCENT);
    const lines: string[] = this.doc.splitTextToSize(stripMarkdown(text), CONTENT_W - 14);
    const blockH = lines.length * 4.5 + 2;
    this.ensureSpace(blockH);
    this.doc.setLineWidth(0.8);
    this.doc.line(M_LEFT + 6, this.y - 1, M_LEFT + 6, this.y + blockH - 2);
    this.doc.setLineWidth(0.2);
    this.doc.setFontSize(9.5);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(...C_MUTED);
    for (const line of lines) {
      this.doc.text(line, M_LEFT + 10, this.y + 1);
      this.y += 4.5;
    }
    this.doc.setTextColor(...C_TEXT);
    this.y += 3;
  }

  // ── Note block (indented, italic, left border accent) ──

  noteBlock(text: string) {
    if (!text) return;
    const cleaned = stripMarkdown(text);
    const indent = 12;
    const maxW = CONTENT_W - indent - 2;
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'italic');
    const lines: string[] = this.doc.splitTextToSize(cleaned, maxW);
    const blockH = lines.length * 4.2 + 2;
    this.ensureSpace(blockH + 2);

    // Left accent bar (thin, muted)
    this.doc.setDrawColor(...C_BORDER);
    this.doc.setLineWidth(0.6);
    this.doc.line(M_LEFT + indent - 3, this.y - 1, M_LEFT + indent - 3, this.y + blockH - 1);
    this.doc.setLineWidth(0.2);

    // "note" mini-label
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...C_BORDER);
    this.doc.text('NOTE', M_LEFT + indent, this.y + 0.5);
    this.y += 4;

    // Body text (italic, muted)
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(...C_MUTED);
    for (const line of lines) {
      this.ensureSpace(4.5);
      this.doc.text(line, M_LEFT + indent, this.y);
      this.y += 4.2;
    }
    this.doc.setTextColor(...C_TEXT);
    this.y += 3;
  }

  spacing(mm = 4) {
    this.y += mm;
  }

  save(filename: string) {
    this.doc.save(filename);
  }
}

// ── Business flow PDF sections ──

function renderBusinessSections(pdf: PdfBuilder, nodesByKind: Map<NodeKind, ProjectNode[]>, connMap: Map<string, ConnectionInfo>, includeEdgeLabels: boolean) {
  // Personas
  const personas = nodesByKind.get('persona') ?? [];
  if (personas.length > 0) {
    pdf.sectionTitle('Personas');
    personas.forEach((n, i) => {
      pdf.ensureBlockFits(estimateNodeHeight(n, includeEdgeLabels));
      if (i > 0) pdf.separator();
      pdf.subTitle(str(n.data.name) || 'Untitled Persona');
      pdf.labelValue('Role', str(n.data.role), 4);
      pdf.priorityBar('Priority', str(n.data.priority) || 'medium');
      if (str(n.data.painPoints)) {
        pdf.miniLabel('Pain Points', 4);
        pdf.bodyText(str(n.data.painPoints), 6);
      }
      pdf.tagRow('Segment', tags(n.data.segment), C_ORANGE);
      if (includeEdgeLabels) pdf.connections(connMap.get(n.id) ?? { incoming: [], outgoing: [] });
    });
    pdf.spacing(6);
  }

  // Features
  const features = nodesByKind.get('feature') ?? [];
  if (features.length > 0) {
    pdf.sectionTitle('Feature Map');
    // Summary table
    pdf.table(
      ['Feature', 'Priority', 'Status'],
      features.map(n => [
        str(n.data.name) || 'Untitled',
        (str(n.data.priority) || 'must').toUpperCase(),
        str(n.data.status) || 'planned',
      ]),
      [80, 40, 50],
    );
    // Detailed
    features.forEach(n => {
      pdf.ensureBlockFits(estimateNodeHeight(n, includeEdgeLabels));
      pdf.subTitle(str(n.data.name) || 'Untitled Feature');
      pdf.dualBadge(str(n.data.priority), str(n.data.status));
      pdf.bodyText(str(n.data.description), 4);
      if (str(n.data.userStory)) {
        pdf.quoteBlock(str(n.data.userStory));
      }
      if (includeEdgeLabels) pdf.connections(connMap.get(n.id) ?? { incoming: [], outgoing: [] });
      pdf.spacing(3);
    });
  }

  // Data Entities
  const entities = nodesByKind.get('dataEntity') ?? [];
  if (entities.length > 0) {
    pdf.sectionTitle('Data Model');
    entities.forEach((n, i) => {
      pdf.ensureBlockFits(estimateNodeHeight(n, includeEdgeLabels));
      if (i > 0) pdf.separator();
      pdf.subTitle(str(n.data.name) || 'Untitled Entity');
      pdf.bodyText(str(n.data.description), 4);
      pdf.tagRow('Attributes', tags(n.data.attributes), C_GREEN);
      pdf.labelValue('Source', str(n.data.source), 4);
      pdf.labelValue('Owner', str(n.data.owner), 4);
      if (includeEdgeLabels) pdf.connections(connMap.get(n.id) ?? { incoming: [], outgoing: [] });
    });
    pdf.spacing(6);
  }

  // Channels
  const channels = nodesByKind.get('channel') ?? [];
  if (channels.length > 0) {
    pdf.sectionTitle('Channels');
    channels.forEach((n, i) => {
      pdf.ensureBlockFits(estimateNodeHeight(n, includeEdgeLabels));
      if (i > 0) pdf.separator();
      pdf.subTitle(str(n.data.name) || 'Untitled Channel');
      pdf.directionBadge(str(n.data.direction), str(n.data.channelType));
      if (str(n.data.metric)) {
        pdf.labelValue('Metric', str(n.data.metric), 4);
      }
      if (str(n.data.notes)) {
        pdf.bodyText(str(n.data.notes), 4);
      }
      if (includeEdgeLabels) pdf.connections(connMap.get(n.id) ?? { incoming: [], outgoing: [] });
    });
    pdf.spacing(6);
  }

  // KPIs
  const kpis = nodesByKind.get('kpi') ?? [];
  if (kpis.length > 0) {
    pdf.sectionTitle('KPIs');
    kpis.forEach((n, i) => {
      pdf.ensureBlockFits(estimateNodeHeight(n, includeEdgeLabels));
      if (i > 0) pdf.separator();
      pdf.subTitle(str(n.data.name) || 'Untitled KPI');
      pdf.bigMetric(str(n.data.target), str(n.data.unit));
      pdf.labelValue('Measurement', str(n.data.measurement), 4);
      pdf.labelValue('Owner', str(n.data.owner), 4);
      if (includeEdgeLabels) pdf.connections(connMap.get(n.id) ?? { incoming: [], outgoing: [] });
    });
    pdf.spacing(6);
  }

  // Risks
  const risks = nodesByKind.get('risk') ?? [];
  if (risks.length > 0) {
    pdf.sectionTitle('Risk Register');
    // Summary table
    pdf.table(
      ['Risk', 'Impact', 'Likelihood', 'Status'],
      risks.map(n => [
        str(n.data.name) || 'Untitled',
        (str(n.data.impact) || 'medium').toUpperCase(),
        (str(n.data.likelihood) || 'medium').toUpperCase(),
        (str(n.data.status) || 'open').toUpperCase(),
      ]),
      [60, 35, 35, 40],
    );
    // Detailed
    risks.forEach(n => {
      pdf.ensureBlockFits(estimateNodeHeight(n, includeEdgeLabels));
      pdf.subTitle(str(n.data.name) || 'Untitled Risk');
      pdf.riskMatrix(str(n.data.impact), str(n.data.likelihood));
      pdf.statusBadge(str(n.data.status) || 'open');
      if (str(n.data.mitigation)) {
        pdf.miniLabel('Mitigation', 4);
        pdf.bodyText(str(n.data.mitigation), 6);
      }
      pdf.spacing(3);
    });
  }

  // Bridges / Handoffs
  const bridges = nodesByKind.get('bridge') ?? [];
  if (bridges.length > 0) {
    pdf.sectionTitle('Handoffs');
    bridges.forEach((n, i) => {
      if (i > 0) pdf.separator();
      pdf.subTitle(str(n.data.name) || 'Handoff');
      if (str(n.data.toFlow)) {
        pdf.tagRow('Target', [str(n.data.toFlow)], C_ACCENT);
      }
      if (tags(n.data.syncFields).length > 0) {
        pdf.tagRow('Sync Fields', tags(n.data.syncFields), C_PRIMARY);
      }
      if (str(n.data.notes)) {
        pdf.bodyText(str(n.data.notes), 4);
      }
      if (includeEdgeLabels) pdf.connections(connMap.get(n.id) ?? { incoming: [], outgoing: [] });
    });
    pdf.spacing(6);
  }
}

// ── Development flow PDF sections ──

function renderDevelopmentSections(pdf: PdfBuilder, nodesByKind: Map<NodeKind, ProjectNode[]>, connMap: Map<string, ConnectionInfo>, includeEdgeLabels: boolean) {
  // Services
  const services = nodesByKind.get('service') ?? [];
  if (services.length > 0) {
    pdf.sectionTitle('Services');
    pdf.table(
      ['Service', 'Tag', 'Endpoints'],
      services.map(n => [
        str(n.data.name) || 'Untitled',
        str(n.data.tag),
        String(Array.isArray(n.data.endpoints) ? n.data.endpoints.length : 0),
      ]),
      [70, 50, 50],
    );
    services.forEach(n => {
      pdf.ensureBlockFits(estimateNodeHeight(n, includeEdgeLabels));
      pdf.subTitle(str(n.data.name) || 'Untitled Service');
      pdf.bodyText(str(n.data.description), 4);
      const endpoints = Array.isArray(n.data.endpoints) ? n.data.endpoints : [];
      if (endpoints.length > 0) {
        pdf.table(
          ['Method', 'Route'],
          endpoints.slice(0, 10).map((ep: { method?: string; route?: string }) => [
            str(ep.method) || 'GET',
            str(ep.route) || '/',
          ]),
          [30, 140],
        );
      }
      pdf.noteBlock(str(n.data.notes));
      if (includeEdgeLabels) pdf.connections(connMap.get(n.id) ?? { incoming: [], outgoing: [] });
      pdf.spacing(3);
    });
  }

  // Databases
  const databases = nodesByKind.get('database') ?? [];
  if (databases.length > 0) {
    pdf.sectionTitle('Databases');
    databases.forEach((n, i) => {
      pdf.ensureBlockFits(estimateNodeHeight(n, includeEdgeLabels));
      if (i > 0) pdf.separator();
      pdf.subTitle(str(n.data.name) || 'Untitled Database');
      pdf.labelValue('Type', str(n.data.dbType), 4);
      pdf.bodyText(str(n.data.connectionNotes), 4);
      if (str(n.data.schemaNotes)) {
        const schemaRows = parseSchemaToRows(str(n.data.schemaNotes));
        if (schemaRows.length > 0) {
          pdf.table(
            ['Column', 'Type / Constraints'],
            schemaRows,
            [60, 110],
          );
        } else {
          pdf.labelValue('Schema', '', 4);
          pdf.bodyText(str(n.data.schemaNotes), 8);
        }
      }
      if (includeEdgeLabels) pdf.connections(connMap.get(n.id) ?? { incoming: [], outgoing: [] });
    });
    pdf.spacing(6);
  }

  // Integrations
  const integrations = nodesByKind.get('integration') ?? [];
  if (integrations.length > 0) {
    pdf.sectionTitle('Integrations');
    pdf.table(
      ['Integration', 'Boundary', 'Auth', 'URL'],
      integrations.map(n => [
        str(n.data.name) || 'Untitled',
        str(n.data.boundary) || 'external',
        str(n.data.authMethod) || 'n/a',
        truncate(str(n.data.baseUrl), 35),
      ]),
      [40, 30, 35, 65],
    );
    integrations.forEach(n => {
      if (str(n.data.requestNotes)) {
        pdf.labelValue(str(n.data.name) || 'Integration', str(n.data.requestNotes), 4);
      }
      if (includeEdgeLabels) pdf.connections(connMap.get(n.id) ?? { incoming: [], outgoing: [] });
    });
    pdf.spacing(6);
  }

  // Infrastructure
  const infra = nodesByKind.get('infra') ?? [];
  if (infra.length > 0) {
    pdf.sectionTitle('Infrastructure');
    infra.forEach((n, i) => {
      pdf.ensureBlockFits(estimateNodeHeight(n, includeEdgeLabels));
      if (i > 0) pdf.separator();
      pdf.subTitle(str(n.data.name) || 'Untitled');
      pdf.labelValue('Provider', str(n.data.provider), 4);
      pdf.noteBlock(str(n.data.notes));
      if (includeEdgeLabels) pdf.connections(connMap.get(n.id) ?? { incoming: [], outgoing: [] });
    });
    pdf.spacing(6);
  }

  // Frameworks
  const frameworks = nodesByKind.get('framework') ?? [];
  if (frameworks.length > 0) {
    pdf.sectionTitle('Frameworks');
    frameworks.forEach((n, i) => {
      pdf.ensureBlockFits(estimateNodeHeight(n, includeEdgeLabels));
      if (i > 0) pdf.separator();
      pdf.subTitle(str(n.data.name) || 'Untitled');
      pdf.labelValue('Framework', str(n.data.framework), 4);
      pdf.noteBlock(str(n.data.notes));
      if (includeEdgeLabels) pdf.connections(connMap.get(n.id) ?? { incoming: [], outgoing: [] });
    });
    pdf.spacing(6);
  }

  // Actions
  const actions = nodesByKind.get('action') ?? [];
  if (actions.length > 0) {
    pdf.sectionTitle('Actions');
    pdf.table(
      ['Action', 'Tag', 'Description'],
      actions.map(n => [
        str(n.data.name) || 'Untitled',
        str(n.data.tag),
        truncate(str(n.data.comment), 50),
      ]),
      [55, 40, 75],
    );
  }
}

// ── Shared sections (milestones, notes) ──

function renderSharedSections(pdf: PdfBuilder, nodesByKind: Map<NodeKind, ProjectNode[]>, connMap: Map<string, ConnectionInfo>, includeEdgeLabels: boolean) {
  // Milestones
  const milestones = nodesByKind.get('milestone') ?? [];
  if (milestones.length > 0) {
    const sorted = [...milestones].sort((a, b) => {
      const ao = typeof a.data.order === 'number' ? a.data.order : 999;
      const bo = typeof b.data.order === 'number' ? b.data.order : 999;
      return ao - bo;
    });
    pdf.sectionTitle('Milestones');
    pdf.table(
      ['#', 'Milestone', 'Priority', 'Due Date', 'Goal'],
      sorted.map(n => [
        String(typeof n.data.order === 'number' ? n.data.order : '-'),
        str(n.data.title) || 'Untitled',
        (str(n.data.priority) || 'medium').toUpperCase(),
        str(n.data.dueDate) || 'TBD',
        truncate(str(n.data.goal), 40),
      ]),
      [12, 45, 28, 35, 50],
    );
    sorted.forEach(n => {
      pdf.ensureBlockFits(estimateNodeHeight(n, includeEdgeLabels));
      if (str(n.data.goal)) {
        pdf.labelValue(str(n.data.title) || 'Milestone', str(n.data.goal), 4);
      }
      if (includeEdgeLabels) pdf.connections(connMap.get(n.id) ?? { incoming: [], outgoing: [] });
    });
    pdf.spacing(6);
  }

  // Comments / Notes (specs already rendered on first page)
  const comments = (nodesByKind.get('comment') ?? []).filter(n => n.data.includeInPdf !== false);
  if (comments.length > 0) {
    pdf.sectionTitle('Notes');
    comments.forEach((n, i) => {
      pdf.ensureBlockFits(estimateNodeHeight(n, includeEdgeLabels));
      if (i > 0) pdf.separator();
      const title = str(n.data.title) || 'Note';
      pdf.subTitle(title);
      pdf.bodyText(str(n.data.body), 4);
    });
  }
}

// ── Main export function ──

export function exportProjectToPdf(project: Project) {
  const pdf = new PdfBuilder();
  const flow = project.activeFlow === 'business' ? 'business' : 'development';
  const flowLabel = flow === 'business' ? 'Business Plan' : 'Development Architecture';
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Use flow-specific pages if available, otherwise use top-level pages
  const pages = project.flows?.[flow]?.pages ?? project.pages;

  const includeEdgeLabels = Boolean(project.ui.pdfIncludeEdgeLabels);

  // Build data structures
  const nodesByKind = collectNodesByKind(pages);
  const connMap = buildConnectionMap(pages);

  // Collect spec content for the cover page
  const specs = (nodesByKind.get('spec') ?? []).filter(n => n.data.includeInPdf !== false);
  const specTexts = specs.map(n => {
    const title = str(n.data.title);
    const body = str(n.data.body);
    const showTitle = title && title !== 'Project details' && title !== 'Project Details';
    return showTitle ? `${title}\n${body}` : body;
  }).filter(Boolean);

  // Cover page (includes spec content inline)
  pdf.drawCover(
    project.project.name || 'Untitled Project',
    project.project.description || '',
    flowLabel,
    now,
    specTexts,
  );

  // Flow-specific sections
  if (flow === 'business') {
    renderBusinessSections(pdf, nodesByKind, connMap, includeEdgeLabels);
  } else {
    renderDevelopmentSections(pdf, nodesByKind, connMap, includeEdgeLabels);
  }

  // Shared sections (milestones + comments only, specs already rendered on cover)
  renderSharedSections(pdf, nodesByKind, connMap, includeEdgeLabels);

  // Save
  const filename = `${(project.project.name || 'project').replace(/\s+/g, '_')}_${flow}.pdf`;
  pdf.save(filename);
}
