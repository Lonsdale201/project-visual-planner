# System Guide

## Basic usage

- Drag nodes from **Node Palette** to the canvas.
- Connect nodes by dragging from output handle to input handle.
- Select a node or edge to edit details in the right sidebar.
- Use **Settings** to change direction, edge style, labels, and minimap.

## Keybinds

- `Delete` / `Backspace`: delete selected node or edge.
- `Ctrl + C`: copy selected node(s).
- `Ctrl + V`: paste copied node(s).
- `Ctrl + D`: duplicate selected node(s).
- `Ctrl + Z`: undo (global history, up to 3 steps).
- `Ctrl + K`: toggle edge labels globally (same state as Settings -> Hide all labels).

## Stack feature

- Select at least 2 nodes.
- Right click a selected node and choose **Stack selected**.
- Nodes are merged into one stack node to reduce visual noise.
- Right click stack node and choose **Unstack** to restore original nodes and stashed edges.

## Attach notes and code (drag to node)

- Drag a `Comment` or `Code` node close to a target node.
- Drop when attach preview is shown.
- Attached nodes are hidden under the target node.
- Target node shows separate attachment counters:
  comment bubble icon for comments, code icon for code blocks.
- Click the badge to expand/collapse attached nodes.

## Navigator

- Toggle **Node Navigator** from the top bar.
- Click a node in navigator to focus that branch.
- Use eye icon to hide a node/subtree.
- Hidden and focus state affects only the canvas view.
