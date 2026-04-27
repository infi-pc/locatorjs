# Contributing

Repo is based on Workspaces and Turborepo

### Develop

To develop all apps and packages, run the following command:

```
pnpm dev
```

### Projects

- `apps/extension`: Chrome/Firefox browser extension
- `packages/runtime`: runtime - the part which is included in bundle and shows the bounding boxes of all components
- `packages/babel-jsx`: babel plugin used by the extension build to tag JSX elements
- `packages/react-devtools-hook`: hook injected into the page to access React fiber data
- `packages/shared`: shared types and constants (editor URL templates, renderers)

### Build

To build all apps and packages, run the following command:

```
pnpm build
```
