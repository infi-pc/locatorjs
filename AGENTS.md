# AGENTS.md

## Cursor Cloud specific instructions

### Overview

LocatorJS is a pnpm + Turborepo monorepo that produces a browser extension and several npm packages for click-to-source developer tooling. No databases, Docker, or external services are required.

### Key commands

All standard commands are in the root `package.json` and documented in `contributing.md`:

- `pnpm dev` — start all packages/apps in parallel dev/watch mode
- `pnpm build` — build everything (required before lint/test since they depend on build outputs)
- `pnpm lint` — ESLint across packages that define a `lint` script
- `pnpm test` — unit tests via Vitest (`packages/runtime`) and Jest (`packages/babel-jsx`)

### Non-obvious caveats

- **Build before lint/test**: `turbo.json` declares `lint` depends on `^build` and `test` depends on `build`. Always run `pnpm build` (or let Turborepo handle it) before running lint or test in isolation.
- **SolidJS import warnings in Next.js apps**: The `next-14` and `apps/web` builds emit `Attempted import error: 'setStyleProperty' is not exported from 'solid-js/web'` warnings. These are expected and do not cause build failures — the runtime package uses SolidJS internally but these imports are tree-shaken in non-Solid contexts.
- **Demo apps for manual testing**: The `apps/vite-react-project` app (port 3343) is the easiest way to manually test the LocatorJS runtime. Hold Alt and hover over components to see outlines. Other demo apps run on ports 3345–3352.
- **Extension dev**: `apps/extension` uses webpack; `pnpm dev` in that package starts a webpack-dev-server. The built extension output goes to `apps/extension/build/`.
- **Package manager**: pnpm 8.7.5 (pinned via `packageManager` field). Node.js >= 22 required.
