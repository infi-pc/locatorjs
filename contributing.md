# Contributing

A pnpm + Turborepo monorepo. Node version is in `.nvmrc`.

```bash
pnpm install
pnpm build
pnpm dev      # all dev servers
pnpm check    # format, deps, suppressions, lint, typecheck, tests
pnpm package-contract # build, pack and import every public package
pnpm e2e      # Playwright suite (starts its own servers)
```

`pnpm check` is CI's main quality gate. Packaging and end-to-end behavior have
their own CI jobs, represented locally by `pnpm package-contract` and
`pnpm e2e`. If the main check complains about formatting or dependency
versions, run `pnpm check:fix`.

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
- `packages/dev-config` — shared eslint, TypeScript and Vitest configuration
- `packages/locatorjs` — compatibility package re-exporting `@locator/runtime`
- `apps/extension` — the browser extension
- `apps/web` — [locatorjs.com](https://www.locatorjs.com)
- `apps/ui-lab` — component workbench
- `apps/playwright` — end-to-end suite
- `test-apps/*` — fixture apps the e2e suite drives
