import { Source, Fiber, RendererInterface } from "@locator/shared";
import { resolveOriginalPosition } from "./sourceMapResolver";
import {
  SourceMethod,
  logSourceFound,
  logSourceComplete,
  logError,
  isDebugEnabled,
} from "./debug";

/**
 * 基于点击位置的 Source 解析器
 * 用于 Next.js 15+ / React 19+ 使用新打包工具的环境
 *
 * 核心思路：
 * 1. 优先使用 React DevTools 7.0.1+ rendererInterfaces API
 * 2. 从 Fiber 获取组件 type（函数）
 * 3. 解析函数的 toString() 或相关元数据获取编译后位置
 * 4. 通过 source-map 反查原始位置
 * 5. 从 Turbopack chunk 代码中提取 jsxDEV 调用的 source 信息
 */

/**
 * 扩展的 DevTools Hook 类型（兼容 7.0.1+）
 */
type DevToolsHookWithInterfaces = {
  rendererInterfaces?: Map<number, RendererInterface>;
  renderers?: Map<number, unknown>;
};

// 缓存组件 type 到 source 的映射
const componentSourceCache = new WeakMap<object, Source | null>();

// 缓存 chunk 代码，避免重复请求
const chunkCodeCache = new Map<string, string>();

// 缓存组件名到 source 的映射（用于 Turbopack 方案）
const componentNameSourceCache = new Map<string, Source | null>();

// 缓存元素签名到 source 的映射（用于原生元素）
const elementSignatureSourceCache = new Map<string, Source | null>();

/**
 * 获取所有 chunk 代码（带缓存）
 */
async function getAllChunkCodes(): Promise<string[]> {
  const scripts = Array.from(
    document.querySelectorAll('script[src*="/_next/static/chunks"]')
  ) as HTMLScriptElement[];

  const codes: string[] = [];
  for (const script of scripts) {
    const src = script.src;
    if (!src) continue;

    let code = chunkCodeCache.get(src);
    if (!code) {
      try {
        const res = await fetch(src);
        if (!res.ok) continue;
        code = await res.text();
        chunkCodeCache.set(src, code);
      } catch {
        continue;
      }
    }
    codes.push(code);
  }
  return codes;
}

/**
 * 在 chunk 代码中搜索 source 信息（通用方法）
 * 从属性值位置向后搜索 fileName/lineNumber
 */
function extractSourceNearPosition(code: string, position: number): Source | null {
  // 从当前位置向后搜索 source 信息（在 1500 字符范围内）
  const searchRange = code.slice(position, position + 1500);
  const fileMatch = searchRange.match(/fileName:\s*"([^"]+)"/);
  const lineMatch = searchRange.match(/lineNumber:\s*(\d+)/);
  const colMatch = searchRange.match(/columnNumber:\s*(\d+)/);

  if (fileMatch?.[1] && lineMatch?.[1]) {
    return {
      fileName: fileMatch[1],
      lineNumber: parseInt(lineMatch[1], 10),
      columnNumber: colMatch?.[1] ? parseInt(colMatch[1], 10) : 0,
    };
  }
  return null;
}

/**
 * 从 Turbopack chunk 代码中提取原生元素（div/span 等）的 source 信息
 * 通过 className/id 进行精确匹配
 */
async function extractSourceFromTurbopackChunksForElement(
  tagName: string,
  className?: string,
  id?: string
): Promise<Source | null> {
  // 构建缓存 key
  const cacheKey = `${tagName}:${className || ""}:${id || ""}`;
  if (elementSignatureSourceCache.has(cacheKey)) {
    return elementSignatureSourceCache.get(cacheKey) ?? null;
  }

  // 没有 className 和 id 则无法精确匹配
  if (!className && !id) {
    elementSignatureSourceCache.set(cacheKey, null);
    return null;
  }

  try {
    const codes = await getAllChunkCodes();

    // 收集所有可能的搜索模式
    const searchPatterns: string[] = [];
    if (id) {
      searchPatterns.push(id);
    }
    if (className) {
      // 分割所有类名，每个都可以作为搜索关键词
      const classes = className.split(/\s+/).filter(c => c.length > 2);
      searchPatterns.push(...classes);
    }

    if (searchPatterns.length === 0) {
      elementSignatureSourceCache.set(cacheKey, null);
      return null;
    }

    for (const code of codes) {
      for (const pattern of searchPatterns) {
        // 在代码中搜索属性值
        let searchIndex = 0;
        while (searchIndex < code.length) {
          const attrIndex = code.indexOf(`"${pattern}"`, searchIndex);
          if (attrIndex === -1) break;

          // 向前搜索确认是 jsxDEV 调用（在 800 字符范围内）
          const startRange = Math.max(0, attrIndex - 800);
          const beforeAttr = code.slice(startRange, attrIndex);

          // 检查是否是 jsxDEV("tagName", 或类似调用
          // 支持多种 Turbopack 格式:
          // - ["jsxDEV"])("div",
          // - jsxDEV("div",
          // - (0, _jsxDevRuntime.jsxDEV)("div",
          // - _jsx("div",
          const jsxPatterns = [
            new RegExp(`\\["jsxDEV"\\]\\)\\("${tagName}",[^}]*$`),
            new RegExp(`jsxDEV\\("${tagName}",[^}]*$`),
            new RegExp(`\\.jsxDEV\\)\\("${tagName}",[^}]*$`),
            new RegExp(`_jsx\\("${tagName}",[^}]*$`),
            new RegExp(`jsx\\("${tagName}",[^}]*$`),
          ];

          const hasJsxCall = jsxPatterns.some(p => p.test(beforeAttr));

          if (hasJsxCall) {
            const source = extractSourceNearPosition(code, attrIndex);
            if (source) {
              elementSignatureSourceCache.set(cacheKey, source);
              return source;
            }
          }

          searchIndex = attrIndex + 1;
        }
      }
    }

    elementSignatureSourceCache.set(cacheKey, null);
    return null;
  } catch {
    return null;
  }
}

/**
 * 从 Turbopack chunk 代码中提取 jsxDEV 调用的 source 信息
 * 适用于 React 19 + Turbopack 环境，Fiber 上没有 _debugSource 的情况
 */
async function extractSourceFromTurbopackChunks(
  componentName: string
): Promise<Source | null> {
  // 检查缓存
  if (componentNameSourceCache.has(componentName)) {
    return componentNameSourceCache.get(componentName) ?? null;
  }

  try {
    const codes = await getAllChunkCodes();

    for (const code of codes) {
      // 搜索多种组件调用模式:
      // - (ComponentName,
      // - jsxDEV(ComponentName,
      // - ["jsxDEV"])(ComponentName,
      const searchPatterns = [
        `(${componentName},`,
        `jsxDEV(${componentName},`,
        `jsx(${componentName},`,
      ];

      for (const pattern of searchPatterns) {
        let searchIndex = 0;
        while (searchIndex < code.length) {
          const callIndex = code.indexOf(pattern, searchIndex);
          if (callIndex === -1) break;

          const source = extractSourceNearPosition(code, callIndex);
          if (source) {
            componentNameSourceCache.set(componentName, source);
            return source;
          }

          searchIndex = callIndex + 1;
        }
      }
    }

    // 未找到，缓存 null
    componentNameSourceCache.set(componentName, null);
    return null;
  } catch {
    return null;
  }
}

/**
 * 清除 Turbopack chunk 缓存
 * 用于开发时 HMR 更新后刷新缓存
 */
export function clearTurbopackCache(): void {
  chunkCodeCache.clear();
  componentNameSourceCache.clear();
  elementSignatureSourceCache.clear();
}

/**
 * 获取第一个 rendererInterface（默认取第一个，处理多 react-dom 实例情况）
 */
function getFirstRendererInterface(): { rendererID: number; rendererInterface: RendererInterface } | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ as DevToolsHookWithInterfaces | undefined;
  if (!hook?.rendererInterfaces || hook.rendererInterfaces.size === 0) {
    return null;
  }

  const entries = Array.from(hook.rendererInterfaces.entries());
  const firstEntry = entries[0];
  if (!firstEntry) {
    return null;
  }
  const [rendererID, rendererInterface] = firstEntry;
  return { rendererID, rendererInterface };
}

/**
 * 解析 inspectElement 返回的 source 信息
 * React DevTools 返回格式可能是：
 * - 数组: [componentName, fileName, lineNumber, columnNumber]
 * - 对象: { fileName, lineNumber, columnNumber }
 */
function parseInspectElementSource(source: unknown): { fileName: string; lineNumber: number; columnNumber: number } | null {
  if (!source) return null;

  // 数组格式: [componentName, fileName, lineNumber, columnNumber]
  if (Array.isArray(source) && source.length >= 3) {
    const [, fileName, lineNumber, columnNumber] = source;
    if (typeof fileName === 'string' && typeof lineNumber === 'number') {
      return {
        fileName,
        lineNumber,
        columnNumber: typeof columnNumber === 'number' ? columnNumber : 0,
      };
    }
  }

  // 对象格式: { fileName, lineNumber, columnNumber }
  if (typeof source === 'object' && source !== null) {
    const src = source as Record<string, unknown>;
    if (typeof src.fileName === 'string' && typeof src.lineNumber === 'number') {
      return {
        fileName: src.fileName,
        lineNumber: src.lineNumber,
        columnNumber: typeof src.columnNumber === 'number' ? src.columnNumber : 0,
      };
    }
  }

  return null;
}

/**
 * 通过 React DevTools 7.0.1+ rendererInterfaces API 获取 DOM 节点的源码位置
 * 这是最直接的方式，优先使用
 *
 * 返回的是编译后位置，需要后续通过 source-map 反查原始位置
 */
export function getSourceViaRendererInterface(domElement: HTMLElement): Source | null {
  const renderer = getFirstRendererInterface();
  if (!renderer) {
    return null;
  }

  const { rendererID, rendererInterface } = renderer;

  try {
    // 1. 从 DOM 获取 React 内部元素 ID
    const elementID = rendererInterface.getElementIDForHostInstance(domElement as any);
    if (!elementID) {
      return null;
    }

    // 2. 使用 inspectElement 获取详细信息（包含 source）
    const inspectedElement = rendererInterface.inspectElement(
      rendererID,   // requestID
      elementID,    // id
      null,         // path
      true          // forceFullData - 强制获取完整数据
    );

    if (inspectedElement?.value?.source) {
      const parsed = parseInspectElementSource(inspectedElement.value.source);
      if (parsed) {
        return parsed;
      }
    }

    // 3. 备用方案：通过 getElementSourceFunctionById 获取组件函数
    if (rendererInterface.getElementSourceFunctionById) {
      const sourceFunc = rendererInterface.getElementSourceFunctionById(elementID);
      if (sourceFunc) {
        // 检查函数上的 __source 属性
        const funcAny = sourceFunc as any;
        if (funcAny.__source) {
          return {
            fileName: funcAny.__source.fileName,
            lineNumber: funcAny.__source.lineNumber,
            columnNumber: funcAny.__source.columnNumber ?? 0,
          };
        }
        if (funcAny._source) {
          return {
            fileName: funcAny._source.fileName,
            lineNumber: funcAny._source.lineNumber,
            columnNumber: funcAny._source.columnNumber ?? 0,
          };
        }
      }
    }
  } catch (e) {
    // 静默失败，回退到其他方法
    if (process.env.NODE_ENV === 'development') {
      console.debug('[LocatorJS] getSourceViaRendererInterface error:', e);
    }
  }

  return null;
}

/**
 * 通过 Fiber 和 rendererInterfaces API 获取源码位置
 * 适用于已有 Fiber 但需要获取源码的场景
 */
export function getSourceViaRendererInterfaceByFiber(fiber: Fiber): Source | null {
  const renderer = getFirstRendererInterface();
  if (!renderer) {
    return null;
  }

  const { rendererID, rendererInterface } = renderer;

  try {
    // 尝试从 fiber.stateNode 获取 DOM 元素
    const stateNode = fiber.stateNode;
    if (stateNode instanceof HTMLElement) {
      return getSourceViaRendererInterface(stateNode);
    }

    // 对于函数组件，stateNode 为 null，尝试从子节点获取
    let childFiber = fiber.child;
    while (childFiber) {
      if (childFiber.stateNode instanceof HTMLElement) {
        const elementID = rendererInterface.getElementIDForHostInstance(childFiber.stateNode as any);
        if (elementID) {
          const inspectedElement = rendererInterface.inspectElement(
            rendererID,
            elementID,
            null,
            true
          );
          if (inspectedElement?.value?.source) {
            const parsed = parseInspectElementSource(inspectedElement.value.source);
            if (parsed) {
              return parsed;
            }
          }
        }
      }
      childFiber = childFiber.sibling;
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[LocatorJS] getSourceViaRendererInterfaceByFiber error:', e);
    }
  }

  return null;
}

/**
 * 从函数的 toString() 中提取 sourceURL 注释
 * 某些打包工具会在函数末尾添加 //# sourceURL=xxx
 */
function extractSourceURL(funcStr: string): string | null {
  const match = funcStr.match(/\/\/[#@]\s*sourceURL=(.+?)(?:\s|$)/);
  return match && match[1] ? match[1] : null;
}

/**
 * 从 React 19+ 的 _debugInfo 中提取 stack 信息
 */
function extractSourceFromDebugInfo(fiber: Fiber): Source | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fiberAny = fiber as any;

  if (!fiberAny._debugInfo || !Array.isArray(fiberAny._debugInfo)) {
    return null;
  }

  for (const info of fiberAny._debugInfo) {
    // React Server Components 的 stack 信息
    if (info.stack && typeof info.stack === "string") {
      // 解析 stack 获取第一个有效的位置
      // 格式: "at ComponentName (file:line:column)"
      const match = info.stack.match(
        /at\s+\S+\s+\(([^:]+):(\d+):(\d+)\)/
      );
      if (match) {
        return {
          fileName: match[1],
          lineNumber: parseInt(match[2], 10),
          columnNumber: parseInt(match[3], 10),
        };
      }

      // 另一种格式: "ComponentName@file:line:column"
      const firefoxMatch = info.stack.match(
        /\S+@([^:]+):(\d+):(\d+)/
      );
      if (firefoxMatch) {
        return {
          fileName: firefoxMatch[1],
          lineNumber: parseInt(firefoxMatch[2], 10),
          columnNumber: parseInt(firefoxMatch[3], 10),
        };
      }
    }

    // 某些情况下 _debugInfo 包含 owner 信息
    if (info.owner && typeof info.owner === "object") {
      const ownerSource = extractSourceFromDebugInfo(info.owner);
      if (ownerSource) {
        return ownerSource;
      }
    }
  }

  return null;
}

/**
 * 从组件函数的元数据中获取 source
 * 某些构建工具会在函数上附加 __source 或类似属性
 */
function extractSourceFromFunctionMeta(
  type: unknown
): Source | null {
  if (typeof type !== "function" && typeof type !== "object") {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typeAny = type as any;

  // 检查各种可能的 source 属性
  const sourceKeys = [
    "__source",
    "_source",
    "__componentSource",
    "$$source",
    "__debugSource",
  ];

  for (const key of sourceKeys) {
    if (typeAny[key]) {
      const src = typeAny[key];
      if (src.fileName && src.lineNumber) {
        return {
          fileName: src.fileName,
          lineNumber: src.lineNumber,
          columnNumber: src.columnNumber,
        };
      }
    }
  }

  return null;
}

/**
 * 尝试从 React DevTools hook 获取 source 信息
 */
function getSourceFromDevTools(fiber: Fiber): Source | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) {
    return null;
  }

  try {
    // React DevTools 可能提供 inspectElement API
    const renderers = hook.renderers;
    if (renderers) {
      for (const renderer of renderers.values()) {
        // 某些版本的 React DevTools 提供获取 source 的方法
        if (renderer.getSourceForFiber) {
          const source = renderer.getSourceForFiber(fiber);
          if (source) {
            return source;
          }
        }
      }
    }
  } catch {
    // 忽略错误
  }

  return null;
}

/**
 * 解析 Fiber 的 _debugStack（如果存在）
 * React 19 开发模式下可能包含组件栈
 */
function parseDebugStack(fiber: Fiber): Source | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fiberAny = fiber as any;

  // React 19 可能使用 _debugStack
  const stack = fiberAny._debugStack || fiberAny.__debugStack;
  if (!stack) {
    return null;
  }

  // 尝试解析 stack 字符串
  if (typeof stack === "string") {
    const lines = stack.split("\n");
    for (const line of lines) {
      // 跳过 React 内部的 frames
      if (line.includes("react-dom") || line.includes("react.")) {
        continue;
      }

      // Chrome 格式
      const chromeMatch = line.match(
        /at\s+\S+\s+\((.+?):(\d+):(\d+)\)/
      );
      if (chromeMatch && chromeMatch[1] && chromeMatch[2] && chromeMatch[3]) {
        return {
          fileName: chromeMatch[1],
          lineNumber: parseInt(chromeMatch[2], 10),
          columnNumber: parseInt(chromeMatch[3], 10),
        };
      }

      // Firefox 格式
      const firefoxMatch = line.match(
        /\S+@(.+?):(\d+):(\d+)/
      );
      if (firefoxMatch && firefoxMatch[1] && firefoxMatch[2] && firefoxMatch[3]) {
        return {
          fileName: firefoxMatch[1],
          lineNumber: parseInt(firefoxMatch[2], 10),
          columnNumber: parseInt(firefoxMatch[3], 10),
        };
      }
    }
  }

  return null;
}

/**
 * 主函数：从 Fiber 获取组件的原始源码位置
 * 支持异步 source-map 解析
 */
export async function resolveSourceFromFiber(
  fiber: Fiber
): Promise<Source | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fiberAny = fiber as any;
  const debug = isDebugEnabled();

  // 1. 检查缓存（仅当 type 是对象时使用 WeakMap）
  if (fiberAny.type && typeof fiberAny.type === 'object' && componentSourceCache.has(fiberAny.type)) {
    const cached = componentSourceCache.get(fiberAny.type) ?? null;
    if (debug && cached) {
      logSourceFound(SourceMethod.CACHE_HIT, fiber, cached, true);
    }
    return cached;
  }

  // 2. [优先] 通过 React DevTools 7.0.1+ rendererInterfaces API 获取
  // 这是最直接可靠的方式，但返回的是编译后位置，需要 source-map 反查
  try {
    const rendererInterfaceSource = getSourceViaRendererInterfaceByFiber(fiber);
    if (rendererInterfaceSource && rendererInterfaceSource.fileName) {
      // 尝试通过 source-map 反查原始位置
      const resolved = await resolveOriginalPosition(
        rendererInterfaceSource.fileName,
        rendererInterfaceSource.lineNumber,
        rendererInterfaceSource.columnNumber ?? 0
      );

      const finalSource = resolved || rendererInterfaceSource;
      if (fiberAny.type && typeof fiberAny.type === 'object') {
        componentSourceCache.set(fiberAny.type, finalSource);
      }
      if (debug) {
        logSourceFound(SourceMethod.RENDERER_INTERFACE, fiber, finalSource, true);
        logSourceComplete(true, SourceMethod.RENDERER_INTERFACE, finalSource);
      }
      return finalSource;
    }
  } catch (e) {
    if (debug) logError(SourceMethod.RENDERER_INTERFACE, e);
  }

  // 3. 从 _debugInfo 获取（React 19 Server Components）
  try {
    const debugInfoSource = extractSourceFromDebugInfo(fiber);
    if (debugInfoSource && debugInfoSource.fileName) {
      // 尝试通过 source-map 反查原始位置
      const resolved = await resolveOriginalPosition(
        debugInfoSource.fileName,
        debugInfoSource.lineNumber,
        debugInfoSource.columnNumber ?? 0
      );
      if (resolved && fiberAny.type && typeof fiberAny.type === 'object') {
        componentSourceCache.set(fiberAny.type, resolved);
      }
      if (debug && resolved) {
        logSourceFound(SourceMethod.DEBUG_INFO, fiber, resolved, true);
        logSourceComplete(true, SourceMethod.DEBUG_INFO, resolved);
      }
      return resolved;
    }
  } catch (e) {
    if (debug) logError(SourceMethod.DEBUG_INFO, e);
  }

  // 4. 从 _debugStack 解析
  try {
    const debugStackSource = parseDebugStack(fiber);
    if (debugStackSource && debugStackSource.fileName) {
      const resolved = await resolveOriginalPosition(
        debugStackSource.fileName,
        debugStackSource.lineNumber,
        debugStackSource.columnNumber ?? 0
      );
      if (resolved && fiberAny.type && typeof fiberAny.type === 'object') {
        componentSourceCache.set(fiberAny.type, resolved);
      }
      if (debug && resolved) {
        logSourceFound(SourceMethod.DEBUG_STACK, fiber, resolved, true);
        logSourceComplete(true, SourceMethod.DEBUG_STACK, resolved);
      }
      return resolved;
    }
  } catch (e) {
    if (debug) logError(SourceMethod.DEBUG_STACK, e);
  }

  // 5. 从组件函数元数据获取
  try {
    const metaSource = extractSourceFromFunctionMeta(fiberAny.type);
    if (metaSource && metaSource.fileName) {
      const resolved = await resolveOriginalPosition(
        metaSource.fileName,
        metaSource.lineNumber,
        metaSource.columnNumber ?? 0
      );
      if (resolved && fiberAny.type && typeof fiberAny.type === 'object') {
        componentSourceCache.set(fiberAny.type, resolved);
      }
      if (debug && resolved) {
        logSourceFound(SourceMethod.FUNCTION_META, fiber, resolved, true);
        logSourceComplete(true, SourceMethod.FUNCTION_META, resolved);
      }
      return resolved;
    }
  } catch (e) {
    if (debug) logError(SourceMethod.FUNCTION_META, e);
  }

  // 6. 从 React DevTools renderers 获取（旧版 API）
  try {
    const devToolsSource = getSourceFromDevTools(fiber);
    if (devToolsSource && devToolsSource.fileName) {
      const resolved = await resolveOriginalPosition(
        devToolsSource.fileName,
        devToolsSource.lineNumber,
        devToolsSource.columnNumber ?? 0
      );
      if (resolved && fiberAny.type && typeof fiberAny.type === 'object') {
        componentSourceCache.set(fiberAny.type, resolved);
      }
      if (debug && resolved) {
        logSourceFound(SourceMethod.DEVTOOLS_RENDERERS, fiber, resolved, true);
        logSourceComplete(true, SourceMethod.DEVTOOLS_RENDERERS, resolved);
      }
      return resolved;
    }
  } catch (e) {
    if (debug) logError(SourceMethod.DEVTOOLS_RENDERERS, e);
  }

  // 7. 尝试从函数的 toString 中提取 sourceURL
  if (typeof fiberAny.type === "function") {
    try {
      const funcStr = fiberAny.type.toString();
      const sourceURL = extractSourceURL(funcStr);
      if (sourceURL) {
        // sourceURL 通常是完整路径，但可能需要解析
        const resolved: Source = {
          fileName: sourceURL,
          lineNumber: 1, // 无法确定具体行号
          columnNumber: 0,
        };
        componentSourceCache.set(fiberAny.type, resolved);
        if (debug) {
          logSourceFound(SourceMethod.SOURCE_URL, fiber, resolved, true);
          logSourceComplete(true, SourceMethod.SOURCE_URL, resolved);
        }
        return resolved;
      }
    } catch (e) {
      if (debug) logError(SourceMethod.SOURCE_URL, e);
    }
  }

  // 8. [Turbopack 方案] 从 chunk 代码中提取 jsxDEV 调用的 source 信息
  // 适用于 React 19 + Next.js 15 + Turbopack 环境
  const isNativeElement = typeof fiberAny.type === "string";
  const componentName = typeof fiberAny.type === "function" ? fiberAny.type.name : null;

  if (isNativeElement) {
    // 原生元素（div/span 等）：尝试用标签名 + 属性精确匹配
    const tagName = fiberAny.type as string;
    const props = fiberAny.memoizedProps || {};
    try {
      const turbopackSource = await extractSourceFromTurbopackChunksForElement(
        tagName,
        props.className,
        props.id
      );
      if (turbopackSource) {
        if (debug) {
          logSourceFound(SourceMethod.TURBOPACK_ELEMENT, fiber, turbopackSource, true);
          logSourceComplete(true, SourceMethod.TURBOPACK_ELEMENT, turbopackSource);
        }
        return turbopackSource;
      }
    } catch (e) {
      if (debug) logError(SourceMethod.TURBOPACK_ELEMENT, e);
    }
  } else if (componentName && componentName !== "Anonymous") {
    try {
      const turbopackSource = await extractSourceFromTurbopackChunks(componentName);
      if (turbopackSource) {
        // Turbopack 方案获取的是组件使用位置（已经是原始路径，无需 source-map 转换）
        if (fiberAny.type && typeof fiberAny.type === "object") {
          componentSourceCache.set(fiberAny.type, turbopackSource);
        }
        if (debug) {
          logSourceFound(SourceMethod.TURBOPACK_COMPONENT, fiber, turbopackSource, true);
          logSourceComplete(true, SourceMethod.TURBOPACK_COMPONENT, turbopackSource);
        }
        return turbopackSource;
      }
    } catch (e) {
      if (debug) logError(SourceMethod.TURBOPACK_COMPONENT, e);
    }
  }

  // 9. 缓存 null 结果，避免重复查找（仅当 type 是对象时）
  if (fiberAny.type && typeof fiberAny.type === 'object') {
    componentSourceCache.set(fiberAny.type, null);
  }

  return null;
}

/**
 * 同步版本：仅从缓存获取（用于非异步上下文）
 */
export function getSourceFromCache(fiber: Fiber): Source | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fiberAny = fiber as any;

  if (fiberAny.type && typeof fiberAny.type === 'object' && componentSourceCache.has(fiberAny.type)) {
    return componentSourceCache.get(fiberAny.type) ?? null;
  }

  return null;
}

/**
 * 清除组件 source 缓存
 */
export function clearComponentSourceCache(): void {
  // WeakMap 无法清除，创建新的
  // 实际上 WeakMap 会自动回收不再引用的键
}
