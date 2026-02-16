# Project Visual Planner

Interactive, node-based visual planner for software architecture, product flows, and technical blueprints.

[![Open Online](https://img.shields.io/badge/Open-Project%20Visual%20Planner-2ea44f?style=for-the-badge)](https://lonsdale201.github.io/project-visual-planner/)

## What Is This?

Project Visual Planner is a browser-based canvas app where you can design and document system architecture with connected nodes.
It helps teams turn complex backend/frontend/integration logic into readable flow diagrams and reusable blueprint templates.

## What Can You Use It For?

- SaaS architecture planning
- API and service dependency mapping
- Workflow and automation design
- Technical discovery and team handoff docs
- Prebuilt blueprint customization (instead of starting from scratch)

## Key Features

- Drag-and-drop node canvas with typed nodes
- Smart edge rendering with optional edge labels
- Global shortcuts (`Ctrl+Z`, `Ctrl+K`, copy/paste, delete)
- Stack/Unstack nodes to reduce visual noise
- Comment attach mode (drag comment node onto target node)
- Node Navigator panel with focus and subtree hide
- Import/export project JSON
- Built-in blueprint presets

## Included Blueprints

- AI API Starter
- Project Manager SaaS
- WordPress LMS Plugin

See blueprint docs: `blueprints/README.md`

## Run Locally

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## GitHub Pages Deploy

- Deployment is handled by GitHub Actions: `.github/workflows/deploy-pages.yml`
- Every push to `main` triggers build + deploy
- Vite base path is configured to `/project-visual-planner/`
- Live URL: `https://lonsdale201.github.io/project-visual-planner/`
