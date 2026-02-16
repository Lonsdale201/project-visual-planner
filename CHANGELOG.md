# Changelog

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
