# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo 结构

pnpm + Turborepo 的 monorepo，只保留 Chrome/Firefox 扩展相关代码。Node ≥22，pnpm 8.7.5。工作区 `apps/*`、`packages/*`（见 `pnpm-workspace.yaml`）。

- `apps/extension`：Chrome / Firefox 扩展（webpack + Solid + stitches）。五个 page：`Background`（service worker）、`Content`（content script 桥接）、`Hook`（MAIN world 注入 runtime）、`ClientUI`（扩展悬浮 UI）、`Popup`（设置面板）。构建脚本 `utils/build.js` / `utils/webserver.js` / `utils/release.js`。manifest v3 给 Chrome，v2 给 Firefox。
- `packages/runtime`：注入页面的运行时 UI（SolidJS + Tailwind，Shadow DOM 渲染），负责划框、选择、弹跳转面板。构建有 3 条并行链：`babel`（TS/TSX → JS）、`tsc`（.d.ts）、`tailwind`（生成 CSS），再由 `scripts/wrapCSS.js` 把 CSS 包进 `_generated_styles.ts` 供运行时注入。入口 `src/index.ts` 导出 `setup()`；扩展环境下 `src/initRuntime.ts` 会自挂到 `document.body` 里的 Shadow Root `#locatorjs-wrapper`。
- `packages/babel-jsx`：Babel 插件，给 JSX 加位置信息（`data-locatorjs-id` 或路径），并生成 `FileStorage`（组件/表达式/styled 定义）。扩展 `.babelrc` 通过 `@locator/babel-jsx/dist` 在自身构建时引用它。
- `packages/react-devtools-hook`：在页面安装/复用 `__REACT_DEVTOOLS_GLOBAL_HOOK__`，给 runtime 提供 fiber 访问能力（见 `src/installReactDevtoolsHook.ts`、`autoInstallDevtoolsHook.ts`）。
- `packages/shared`：跨包共享的类型与常量，最重要的是 `allTargets`（编辑器 URL 模板：vscode / webstorm / cursor / windsurf / antigravity）、`Renderer` 校验、`sharedOptionsStore`。
- `packages/dev-config`：共享 `tsconfig.base.json` / `tsconfig.nextjs.json` / `tsconfig.react-library.json` 与 ESLint 预设。

## 核心数据流（排错先看这里）

1. 扩展 Hook 在 MAIN world 注入 `@locator/runtime`，`initRuntime()` 建 Shadow DOM 容器并启动 adapter。
2. Adapter 分支位于 `packages/runtime/src/adapters/{jsx,react,svelte,vue}`；React 路径用 `react-devtools-hook` 抓 fiber，`clickSourceResolver.ts` / `findDebugSource.ts` / `sourceMapResolver.ts` 解析源码位置。
3. `shared/allTargets` 的 URL 模板 + `projectPath` → 浏览器用 `location.href = 'vscode://…'` 触发编辑器跳转。

扩展的调试开关：`window.__LOCATORJS_DEBUG__ = true`（或 Popup 的 Debug Mode 开关），历史记录在 `window.__LOCATORJS_DEBUG_HISTORY__`。详见 `apps/extension/README.md`。

## 常用命令

根目录（所有命令走 Turbo）：

```bash
pnpm dev          # 所有包并行 watch
pnpm build        # 全量构建，遵循 ^build 依赖顺序
pnpm lint         # 仅 runtime/extension 有 lint
pnpm test         # 跑各包 vitest / jest
pnpm ts           # 仅类型检查（--noEmit）
pnpm format       # prettier 全仓
pnpm dependency-versions        # 检查跨包依赖版本一致
pnpm dependency-versions:fix
pnpm clean        # 清 node_modules / dist / .turbo（concurrently）
```

单包命令（`cd packages/runtime && pnpm …`）：`dev`、`build`、`test`、`test:dev`、`ts`、`lint`。`babel-jsx` 用 jest；`runtime` 用 vitest（`vitest run` / `vitest watch`）。跑单个 vitest 用例：`pnpm --filter @locator/runtime test -- <pattern>`；单个 jest 用例：`pnpm --filter @locator/babel-jsx test -- -t "<title>"`。

## 扩展构建（apps/extension）

依赖顺序严格：`shared` → `runtime` → `extension`。只改 `shared` 类型时先 `pnpm --filter @locator/shared build`，否则 runtime 引用到的是旧 `.d.ts`，`pnpm ts` 会误报。

```bash
pnpm --filter locatorjs-extension dev            # Chrome 开发（webserver）
pnpm --filter locatorjs-extension dev:firefox    # Firefox 开发
pnpm --filter locatorjs-extension release:node   # 一键：构建依赖+扩展+zip（推荐）
pnpm --filter locatorjs-extension release:node:all
node apps/extension/utils/release.js --skip-runtime   # 只重新打包扩展
```

产物：`apps/extension/build/production_chrome/`（+ `chrome.zip`）、`apps/extension/build/production_firefox/`（+ `artifacts_firefox/`）。

加载未打包扩展：Chrome `chrome://extensions` 开开发者模式 → 加载已解压 → 选 `build/production_chrome`。Firefox `about:debugging#/runtime/this-firefox` → 临时载入 → 选 `build/production_firefox/manifest.json`。

## 新增编辑器跳转目标

1. 在 `packages/shared/src/index.ts` 的 `allTargets` 加一条（URL 模板用 `${projectPath}${filePath}:${line}:${column}`）。
2. 重新 build `shared` 和 `runtime`；无需改 runtime 代码——UI 会自动渲染新按钮。
3. 重跑 `release:node` 重新打包扩展。

## 已知坑

- `pnpm ts` 报 `@locator/shared` 类型错 → 多半是 `shared` 未重新 build，跑 `pnpm --filter @locator/shared build` 解决。
- `babel-jsx` 的 `env` 判断用 `process.env.BABEL_ENV || NODE_ENV || 'development'`——首次 dev build `NODE_ENV` 可能为空，这里是故意 fallback。
