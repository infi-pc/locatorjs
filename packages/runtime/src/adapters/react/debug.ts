/**
 * LocatorJS Debug 模块
 * 用于调试源码定位流程，帮助排查跳转问题
 *
 * 启用方式：
 * 1. 浏览器控制台执行: window.__LOCATORJS_DEBUG__ = true
 * 2. 或在代码中调用: enableLocatorDebug()
 */

// 定位方式枚举
export const SourceMethod = {
  // 同步方式 (findDebugSource.ts)
  FIBER_DEBUG_SOURCE: "fiber._debugSource",
  ELEMENT_TYPE_SOURCE: "fiber.elementType._source",
  TYPE_SOURCE: "fiber.type._source",
  FIBER_DEBUG_SOURCE_ALT: "fiber.__debugSource",
  MEMOIZED_PROPS_SOURCE: "fiber.memoizedProps.__source",
  PENDING_PROPS_SOURCE: "fiber.pendingProps.__source",
  DEBUG_INFO_STACK: "fiber._debugInfo[].stack",
  TYPE_COMPONENT_SOURCE: "fiber.type.__componentSource",
  CACHE_HIT: "cache (之前异步解析的结果)",

  // 异步方式 (clickSourceResolver.ts)
  RENDERER_INTERFACE: "rendererInterfaces API (React DevTools 7.0.1+)",
  DEBUG_INFO: "_debugInfo (React 19 Server Components)",
  DEBUG_STACK: "_debugStack (React 19)",
  FUNCTION_META: "函数元数据 (__source/_source)",
  DEVTOOLS_RENDERERS: "React DevTools renderers (旧版 API)",
  SOURCE_URL: "函数 toString() sourceURL",
  TURBOPACK_ELEMENT: "Turbopack chunk (原生元素)",
  TURBOPACK_COMPONENT: "Turbopack chunk (组件名)",
} as const;

export type SourceMethodType = (typeof SourceMethod)[keyof typeof SourceMethod];

interface DebugInfo {
  method: SourceMethodType;
  fiberType: string;
  fiberTag: number;
  source: {
    fileName: string;
    lineNumber: number;
    columnNumber?: number;
  } | null;
  async: boolean;
  timestamp: number;
}

// 全局 debug 状态
let debugEnabled = false;
const debugHistory: DebugInfo[] = [];
const MAX_HISTORY = 50;

/**
 * 检查是否启用 debug 模式
 */
export function isDebugEnabled(): boolean {
  // 支持通过 window 全局变量控制
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== "undefined" && (window as any).__LOCATORJS_DEBUG__) {
    return true;
  }
  return debugEnabled;
}

/**
 * 启用 debug 模式
 */
export function enableLocatorDebug(): void {
  debugEnabled = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== "undefined") {
    (window as any).__LOCATORJS_DEBUG__ = true;
  }
  console.log(
    "%c[LocatorJS Debug] 已启用调试模式",
    "color: #4CAF50; font-weight: bold"
  );
  console.log("查看历史记录: window.__LOCATORJS_DEBUG_HISTORY__");
  console.log("禁用: window.__LOCATORJS_DEBUG__ = false 或 disableLocatorDebug()");
}

/**
 * 禁用 debug 模式
 */
export function disableLocatorDebug(): void {
  debugEnabled = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== "undefined") {
    (window as any).__LOCATORJS_DEBUG__ = false;
  }
  console.log(
    "%c[LocatorJS Debug] 已禁用调试模式",
    "color: #f44336; font-weight: bold"
  );
}

/**
 * 设置 debug 模式（供设置面板调用，静默模式）
 */
export function setDebugMode(enabled: boolean): void {
  debugEnabled = enabled;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== "undefined") {
    (window as any).__LOCATORJS_DEBUG__ = enabled;
  }
}

/**
 * 获取 Fiber 类型描述
 */
function getFiberTypeDesc(fiber: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = fiber as any;
  if (!f) return "null";

  const type = f.type;
  if (typeof type === "string") {
    return `<${type}>`; // 原生元素如 <div>
  }
  if (typeof type === "function") {
    return type.displayName || type.name || "Anonymous";
  }
  if (type && typeof type === "object") {
    // memo/forwardRef 等
    if (type.displayName) return type.displayName;
    if (type.render?.displayName) return type.render.displayName;
    if (type.render?.name) return type.render.name;
  }
  return "Unknown";
}

/**
 * 记录 debug 信息
 */
export function logSourceFound(
  method: SourceMethodType,
  fiber: unknown,
  source: { fileName: string; lineNumber: number; columnNumber?: number } | null,
  async = false
): void {
  if (!isDebugEnabled()) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = fiber as any;
  const fiberType = getFiberTypeDesc(fiber);
  const fiberTag = f?.tag ?? -1;

  const info: DebugInfo = {
    method,
    fiberType,
    fiberTag,
    source,
    async,
    timestamp: Date.now(),
  };

  // 添加到历史记录
  debugHistory.push(info);
  if (debugHistory.length > MAX_HISTORY) {
    debugHistory.shift();
  }

  // 暴露到 window
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== "undefined") {
    (window as any).__LOCATORJS_DEBUG_HISTORY__ = debugHistory;
  }

  // 控制台输出
  const asyncLabel = async ? "[异步]" : "[同步]";
  const methodColor = async ? "#2196F3" : "#4CAF50";

  if (source) {
    console.log(
      `%c[LocatorJS] ${asyncLabel} 源码定位成功`,
      `color: ${methodColor}; font-weight: bold`,
      "\n方式:", method,
      "\n组件:", fiberType,
      "\n位置:", `${source.fileName}:${source.lineNumber}:${source.columnNumber ?? 0}`
    );
  } else {
    console.log(
      `%c[LocatorJS] ${asyncLabel} 尝试方式: ${method}`,
      "color: #9E9E9E",
      `(${fiberType}) - 未找到`
    );
  }
}

/**
 * 记录定位开始
 */
export function logSourceStart(fiber: unknown, element?: HTMLElement): void {
  if (!isDebugEnabled()) return;

  const fiberType = getFiberTypeDesc(fiber);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fiberTag = (fiber as any)?.tag ?? -1;

  console.group(
    `%c[LocatorJS] 开始定位源码`,
    "color: #FF9800; font-weight: bold"
  );
  console.log("Fiber:", fiberType, `(tag: ${fiberTag})`);
  if (element) {
    console.log("DOM 元素:", element);
  }
  console.log("Fiber 对象:", fiber);
  console.groupEnd();
}

/**
 * 记录定位完成
 */
export function logSourceComplete(
  success: boolean,
  method?: SourceMethodType,
  source?: { fileName: string; lineNumber: number; columnNumber?: number } | null
): void {
  if (!isDebugEnabled()) return;

  if (success && source) {
    console.log(
      `%c[LocatorJS] ✅ 定位完成`,
      "color: #4CAF50; font-weight: bold",
      "\n最终方式:", method,
      "\n目标位置:", `${source.fileName}:${source.lineNumber}:${source.columnNumber ?? 0}`
    );
  } else {
    console.log(
      `%c[LocatorJS] ❌ 定位失败 - 所有方式均未找到源码`,
      "color: #f44336; font-weight: bold"
    );
  }
}

/**
 * 记录错误
 */
export function logError(method: SourceMethodType, error: unknown): void {
  if (!isDebugEnabled()) return;

  console.warn(
    `%c[LocatorJS] ⚠️ ${method} 出错:`,
    "color: #FF9800",
    error
  );
}

// 初始化时暴露到 window
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  w.__LOCATORJS_DEBUG_HISTORY__ = debugHistory;
  w.enableLocatorDebug = enableLocatorDebug;
  w.disableLocatorDebug = disableLocatorDebug;
}
