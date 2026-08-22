# Contributing

A pnpm + Turborepo monorepo. Node version is in `.nvmrc`.

```bash
pnpm install
pnpm build
pnpm dev      # all dev servers
pnpm check    # every gate: format, deps, lint, typecheck, tests
pnpm e2e      # Playwright suite (starts its own servers)
```

`pnpm check` is what CI runs, so green locally means green in CI. If it
complains about formatting or dependency versions, `pnpm check:fix`.

**[AGENTS.md](./AGENTS.md) is the full guide** — repo layout, the port map, what
enforces which rule, test conventions, and the known rough edges worth reading
before you hit them. It is written for both humans and coding agents;
`CLAUDE.md` is a symlink to it.

### Projects

- `packages/runtime` — injected into the page, draws the component overlays
- `packages/shared` — pure helpers, key bindings, editor-target resolution
- `packages/ui` — Solid components
- `packages/babel-jsx` — babel plugin adding source attributes to JSX
- `packages/webpack-loader` — wraps the babel plugin for webpack
- `packages/react-devtools-hook` — installs the React devtools global hook
- `packages/styled-system` — Panda CSS tokens and theme
- `packages/dev-config` — shared eslint presets and tsconfig bases
- `apps/extension` — the browser extension
- `apps/web` — [locatorjs.com](https://www.locatorjs.com)
- `apps/ui-lab` — component workbench
- `apps/playwright` — end-to-end suite
- `test-apps/*` — fixture apps the e2e suite drives
