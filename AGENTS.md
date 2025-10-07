# Repository Guidelines

## Project Structure & Module Organization
- `nodes/Capacities/*.ts` houses the TypeScript descriptions and helpers that surface Capacities resources in n8n; keep new operations grouped by resource and export them through `ResourceDescription.ts`.
- `credentials/CapacitiesApi.credentials.ts` defines the shared bearer-token credential; extend it when additional auth fields are required.
- `dist/` contains the compiled JavaScript that ships to npm. Never edit generated files directly—run a build instead. `index.js` simply exposes the built bundles.
- Top-level configs such as `tsconfig.json`, `.eslintrc.js`, and `.prettierrc.js` govern compilation, linting, and formatting; keep changes coordinated.

## Build, Test, and Development Commands
```bash
npm install            # install dependencies
npm run dev            # TypeScript watch build for local iteration
npm run build          # clean, compile, and copy image assets into dist/
npm run lint           # run ESLint against nodes, credentials, and package.json
npm test               # alias for npm run lint, used by CI
npm run format         # apply Prettier to nodes/ and credentials/
```
Stick to one package manager per branch; npm and pnpm lockfiles are both tracked.

## Coding Style & Naming Conventions
- Source uses tabs (width 2) and single quotes, enforced by Prettier (`npm run format`).
- Favor descriptive PascalCase for node classes, camelCase for helpers, and snake_case only for API field mirrors.
- Follow `eslint-plugin-n8n-nodes-base` guidance; lint warnings usually mean the node will not pass community review.
- Place shared helpers in `GeneralFunctions.ts` and reuse translation strings to avoid duplicate copy.

## Testing Guidelines
- Treat linting as the first test gate; run `npm run lint` before every push.
- For new operations, add n8n credential tests when possible by enhancing the `test` block in the credential file.
- Document any manual smoke tests in the PR when UI flows change.

## Commit & Pull Request Guidelines
- Use short, imperative commit subjects (e.g., `Add save daily note action`); dependency bumps follow the existing `Bump package from X to Y` pattern.
- Each PR should include: summary of node changes, screenshots or exported workflows when UI is affected, and links to any Capacities API issues.
- Confirm `dist/` is rebuilt or explicitly state when the build will be handled post-merge to keep npm artifacts in sync.

## Security & Configuration Tips
- Never commit bearer tokens; rely on n8n credential storage and reference them through `capacitiesApi`.
- Validate new endpoints against `https://api.capacities.io` rates and update request defaults if base URLs change.
