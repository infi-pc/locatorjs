<img src="src/assets/img/icon-128.png" width="64"/>

# Install

[Install extension from Chrome Web Store](https://chrome.google.com/webstore/detail/locatorjs/npbfdllefekhdplbkdigpncggmojpefi) (works for Chrome, Brave, Opera and Edge)

[Install extension from Firefox Add-ons](https://addons.mozilla.org/cs/firefox/addon/locatorjs/)

# Requirements

**Extension should work automatically dev mode in all modern stacks** (NextJS, Create React App, Vite, etc).
They automatically include [babel-preset-react](https://babeljs.io/docs/en/babel-preset-react) which includes [babel-plugin-transform-react-jsx-source](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx-source). Non-babel stacks use similar alternatives.
If you don't have [babel-plugin-transform-react-jsx-source](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx-source), you should set it up manually.

# Troubleshooting

## Broken source info

It doesn't show any "bouding boxes" when holding alt/option and moving mouse on the page. (plus you might see error in extension's Popup)

- **Make sure you are running your project in development mode.**
- If you have **custom webpack config or anything using Babel** make sure you have [babel-preset-react](https://babeljs.io/docs/en/babel-preset-react) preset or [babel-plugin-transform-react-jsx-source](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx-source) plugin.
- You may check `process.env.NODE_ENV` if it is `development`

## Broken links

When I click on a component's bounding box, it doesn't go to editor

- It is possible that your editor doesn't have registered URL handler. Check browser console for errors. If you get something like `Failed to launch 'vscode://...24:11' because the scheme does not have a registered handler.`, try reinstalling your editor.

## Debug Mode

如果遇到跳转位置不正确或跳转报错的问题，可以启用 Debug 模式来排查：

### 启用方式

1. **设置面板开关**（推荐）：点击 LocatorJS 图标打开设置，开启 "Debug Mode" 开关
2. **控制台命令**：`window.__LOCATORJS_DEBUG__ = true` 或 `enableLocatorDebug()`

### 控制台输出

启用后，点击元素时控制台会显示：

```
[LocatorJS] 开始定位源码
  Fiber: <div> (tag: 5)
  DOM 元素: <div class="xxx">...</div>

[LocatorJS] [同步] 源码定位成功
  方式: fiber._debugSource
  组件: <div>
  位置: /app/page.tsx:15:0

[LocatorJS] ✅ 定位完成
  最终方式: fiber._debugSource
  目标位置: /app/page.tsx:15:0
```

### 支持的定位方式

| 类型 | 方式 |
|------|------|
| 同步 | `fiber._debugSource`、`elementType._source`、`type._source`、`memoizedProps.__source`、`_debugInfo` |
| 异步 | `rendererInterfaces API` (React DevTools 7.0.1+)、`Turbopack chunk`、`source-map` 反查 |

### 查看历史记录

```javascript
window.__LOCATORJS_DEBUG_HISTORY__
```

# Development

## Run extension locally

```bash
# 开发模式（Chrome）
pnpm dev

# 开发模式（Firefox）
pnpm dev:firefox
```

## Build & Release

### 使用 Node 脚本（推荐）

```bash
# 打包 Chrome 版本（自动构建依赖 + 扩展 + zip）
pnpm run release:node

# 打包 Firefox 版本
pnpm run release:node:firefox

# 打包所有版本
pnpm run release:node:all

# 跳过依赖构建（仅重新打包扩展）
node utils/release.js --skip-runtime
```

### 分步构建

```bash
# 1. 构建依赖包（按顺序）
cd ../../packages/shared && pnpm build && cd -
cd ../../packages/runtime && pnpm build && cd -

# 2. 构建扩展
pnpm build              # Chrome
pnpm build:firefox      # Firefox

# 3. 打包 zip
pnpm pack:chrome        # -> build/chrome.zip
pnpm pack:firefox       # -> build/artifacts_firefox/
```

### 构建注意事项

- **包依赖顺序**：`shared` → `runtime` → `extension`
- 修改 `shared` 包类型定义后，需要先构建 `shared`，再构建 `runtime`
- TypeScript 类型错误可能是因为依赖包未重新构建，实际构建时会正常工作

### 产物位置

| 版本 | 构建目录 | 打包文件 |
|------|----------|----------|
| Chrome | `build/production_chrome/` | `build/chrome.zip` |
| Firefox | `build/production_firefox/` | `build/artifacts_firefox/*.zip` |

## Load unpacked extension

**Chrome:**
1. 打开 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `build/production_chrome` 目录

**Firefox:**
1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击「临时载入附加组件」
3. 选择 `build/production_firefox/manifest.json`

# Contributing

To develop of contribute to this project [continue here](./../../contributing.md)
构建扩展：
<!-- cd apps/extension && pnpm run release:chrome -->

debug:
 window.__LOCATORJS_DEBUG__ = true