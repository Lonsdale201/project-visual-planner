# Project Visual Planner

Interactive node-based planner for architecture and workflow blueprints.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages deploy

- Deployment is handled by GitHub Actions (`.github/workflows/deploy-pages.yml`).
- Every push to `main` triggers build + deploy.
- App base path is configured for this repository: `/project-visual-planner/`.
- Expected Pages URL:
  `https://lonsdale201.github.io/project-visual-planner/`

