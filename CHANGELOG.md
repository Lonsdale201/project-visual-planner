# Changelog

## 2.1.0 - 2026-02-20

### New
- Two-language support: English / Hungarian.

### Fix
- Improved right-click context menu recognition for nodes.

## 2.0.0 - 2026-02-20

### New: Business Flow
- Added 8 dedicated business node types: Persona, Feature, Data Entity, Channel, KPI, Risk, Bridge, and Spec.
- Added 2 business flow blueprints: "SaaS Go-to-Market Plan" and "E-commerce Product Launch".
- Blueprints are filtered by active flow mode — dev blueprints only show in development, business blueprints only in business.
- Fixed blueprint instantiation so business blueprints correctly load into business flow.

### New: Development Flow
- Added Brand Icon node type for visual branding elements.

### New: PDF Export
- Full PDF generation for both development and business flows via jsPDF.
- Business PDF includes: Personas, Feature Map (with priority/status badges), Data Model, Channels, KPIs, Risk Register (with impact/likelihood matrix), and Handoffs.
- Development PDF includes: Services (with endpoint tables), Databases (with schema tables), Integrations, Infrastructure, Frameworks, Actions, and Milestones.
- Cover page with project details and spec content inline.
- Visual elements: tag chips, priority bars, risk matrices, big metric cards, quote blocks, note blocks, status/priority pill badges.
- Settings toggle for including edge labels in PDF (default off).
- Page-break prevention: nodes avoid splitting across pages.
- Note: PDF generation for business flow is still being refined.

## 1.1 - 2026.02.16

- Added single-node JSON schema editor in the inspector sidebar (copy/paste/apply per node).
- Code nodes are now attachable to parent nodes the same way as comments.
- Fixed router handle updates so connection lines follow updated `in/out` handle positions.
- Added tech stack label toggle for the `Project Overview` node.
- Fixed `Database` node behavior: clearing `schemaNotes` removes the placeholder schema block from node view.
- Expanded `Database` type options with more managed database service providers.

## 1.0.1 - 2026-02-16

- Added attach support for `Code` nodes (same drag-to-attach flow as comments).
- Improved attached node layout to avoid overlaps for mixed `Comment` + `Code` stacks.
- Added separate attachment badges: comment bubble for comments, code icon for code blocks.
- Improved attach preview and nested attachment rendering consistency.
- Updated system docs and keybind guide in `INFO.md`.

## 1.0.0 - 2026-02-15

- Added stack and unstack workflow from node context menu.
- Added global undo history (up to 3 steps).
- Added markdown support for node text content.
- Added attachable comment behavior with comment badges.
- Added node navigator panel with focus and subtree hide.
- Added edge label visibility toggle.

## 0.9.0 - 2026-02-14

- Improved blueprint layouts for top-down and left-right direction modes.
- Added milestone placement strategy to reduce line clutter.
- Added router node type for connection distribution.
- Added WordPress LMS blueprint with CRUD and architecture patterns.

## 0.8.0 - 2026-02-13

- Added stack node rendering and stack pager UI.
- Added better markdown link handling in node descriptions.
- Added hide/show controls for comments attached to parent nodes.
- Added blueprint auto-layout overlap resolution.

## 0.7.0 - 2026-02-12

- Initial internal alpha for the project planner canvas.
- Added node palette, page tabs, import/export, and settings.
- Added custom node and edge renderers with style presets.
