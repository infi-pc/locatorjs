import { Source } from "@locator/shared";

/**
 * Source Map 解析器
 * 用于 Next.js 15+ / React 19+ 使用 Turbopack 打包的环境
 * 当传统 _debugSource 方式失效时，通过 source-map 反查原始位置
 */

// source-map 缓存：url -> 解析后的 map 数据
const sourceMapCache = new Map<string, SourceMapConsumer | null>();

// 正在加载的 source-map Promise 缓存，避免重复请求
const loadingPromises = new Map<string, Promise<SourceMapConsumer | null>>();

// 简化的 Source Map Consumer 接口
interface SourceMapConsumer {
  originalPositionFor(pos: {
    line: number;
    column: number;
  }): { source: string | null; line: number | null; column: number | null };
  destroy?: () => void;
}

interface RawSourceMap {
  version: number;
  sources: string[];
  sourcesContent?: string[];
  mappings: string;
  names?: string[];
  file?: string;
  sourceRoot?: string;
}

// Indexed Source Map 格式（Turbopack 使用）
interface IndexedSourceMap {
  version: number;
  sources: string[]; // 顶层为空
  sections: Array<{
    offset: { line: number; column: number };
    map: RawSourceMap;
  }>;
}

// VLQ 解码表
const VLQ_BASE_SHIFT = 5;
const VLQ_BASE = 1 << VLQ_BASE_SHIFT;
const VLQ_BASE_MASK = VLQ_BASE - 1;
const VLQ_CONTINUATION_BIT = VLQ_BASE;

const charToInt: Record<string, number> = {};
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  .split("")
  .forEach((char, i) => {
    charToInt[char] = i;
  });

/**
 * 解码 VLQ 编码的值
 */
function decodeVLQ(encoded: string, index: number): [number, number] {
  let result = 0;
  let shift = 0;
  let continuation: boolean;

  do {
    const char = encoded[index++];
    if (char === undefined) {
      throw new Error("Unexpected end of VLQ");
    }
    const digit = charToInt[char];
    if (digit === undefined) {
      throw new Error(`Invalid VLQ character: ${char}`);
    }
    continuation = (digit & VLQ_CONTINUATION_BIT) !== 0;
    result += (digit & VLQ_BASE_MASK) << shift;
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  // 符号位在最低位
  const isNegative = result & 1;
  result >>= 1;
  return [isNegative ? -result : result, index];
}

interface MappingSegment {
  generatedColumn: number;
  sourceIndex: number;
  originalLine: number;
  originalColumn: number;
}

/**
 * 解析 source map mappings 字符串
 * 返回按行组织的映射数组
 */
function parseMappings(mappings: string): MappingSegment[][] {
  const lines: MappingSegment[][] = [];

  let generatedColumn = 0;
  let sourceIndex = 0;
  let originalLine = 0;
  let originalColumn = 0;

  let currentLine: MappingSegment[] = [];
  let i = 0;

  while (i < mappings.length) {
    const char = mappings[i];

    if (char === ";") {
      lines.push(currentLine);
      currentLine = [];
      generatedColumn = 0;
      i++;
    } else if (char === ",") {
      i++;
    } else {
      // 解析一个 segment
      let value: number;

      // 1. generated column (相对于上一个 segment)
      [value, i] = decodeVLQ(mappings, i);
      generatedColumn += value;

      // 检查是否有更多字段
      if (i < mappings.length && mappings[i] !== "," && mappings[i] !== ";") {
        // 2. source index
        [value, i] = decodeVLQ(mappings, i);
        sourceIndex += value;

        // 3. original line
        [value, i] = decodeVLQ(mappings, i);
        originalLine += value;

        // 4. original column
        [value, i] = decodeVLQ(mappings, i);
        originalColumn += value;

        // 5. name index (可选，忽略)
        if (i < mappings.length && mappings[i] !== "," && mappings[i] !== ";") {
          [, i] = decodeVLQ(mappings, i);
        }

        currentLine.push({
          generatedColumn,
          sourceIndex,
          originalLine,
          originalColumn,
        });
      }
    }
  }

  // 不要忘记最后一行
  if (currentLine.length > 0 || mappings.endsWith(";")) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * 创建简易 Source Map Consumer（普通格式）
 */
function createBasicSourceMapConsumer(rawMap: RawSourceMap): SourceMapConsumer {
  const parsedMappings = parseMappings(rawMap.mappings);

  return {
    originalPositionFor(pos: { line: number; column: number }) {
      // line 是 1-based，转为 0-based 索引
      const lineIndex = pos.line - 1;
      const segments = parsedMappings[lineIndex];

      if (!segments || segments.length === 0) {
        return { source: null, line: null, column: null };
      }

      // 二分查找最接近的 segment
      let low = 0;
      let high = segments.length - 1;

      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        const midSegment = segments[mid];
        if (midSegment && midSegment.generatedColumn <= pos.column) {
          low = mid;
        } else {
          high = mid - 1;
        }
      }

      const segment = segments[low];
      if (!segment || segment.generatedColumn > pos.column) {
        return { source: null, line: null, column: null };
      }

      const source = rawMap.sources[segment.sourceIndex];
      if (!source) {
        return { source: null, line: null, column: null };
      }

      // 处理 sourceRoot
      const fullSource = rawMap.sourceRoot
        ? `${rawMap.sourceRoot}${source}`
        : source;

      return {
        source: fullSource,
        line: segment.originalLine + 1, // 转回 1-based
        column: segment.originalColumn,
      };
    },
  };
}

/**
 * 创建 Indexed Source Map Consumer（Turbopack 格式）
 * sections 按 offset 排序，每个 section 有自己的 map
 */
function createIndexedSourceMapConsumer(indexedMap: IndexedSourceMap): SourceMapConsumer {
  // 预解析所有 section 的 mappings
  const sectionConsumers = indexedMap.sections.map(section => ({
    offset: section.offset,
    consumer: createBasicSourceMapConsumer(section.map),
    map: section.map,
  }));

  return {
    originalPositionFor(pos: { line: number; column: number }) {
      // 找到包含该位置的 section（从后往前找，找第一个 offset <= pos 的）
      let targetSection: typeof sectionConsumers[0] | null = null;
      for (let i = sectionConsumers.length - 1; i >= 0; i--) {
        const section = sectionConsumers[i];
        if (!section) continue;
        // offset.line 是 0-based，pos.line 是 1-based
        const sectionStartLine = section.offset.line + 1;
        if (pos.line >= sectionStartLine) {
          // 如果在同一行，还需要检查 column
          if (pos.line === sectionStartLine && pos.column < section.offset.column) {
            continue;
          }
          targetSection = section;
          break;
        }
      }

      if (!targetSection) {
        return { source: null, line: null, column: null };
      }

      // 计算相对于 section 的位置
      const relativePos = {
        line: pos.line - targetSection.offset.line,
        column: pos.line === targetSection.offset.line + 1
          ? pos.column - targetSection.offset.column
          : pos.column,
      };

      return targetSection.consumer.originalPositionFor(relativePos);
    },
  };
}

/**
 * 创建 Source Map Consumer（自动检测格式）
 */
function createSourceMapConsumer(map: RawSourceMap | IndexedSourceMap): SourceMapConsumer {
  // 检测是否是 Indexed Source Map
  if ('sections' in map && Array.isArray(map.sections)) {
    return createIndexedSourceMapConsumer(map as IndexedSourceMap);
  }
  return createBasicSourceMapConsumer(map as RawSourceMap);
}

/**
 * 从 URL 加载 source map
 */
async function loadSourceMap(
  mapUrl: string
): Promise<SourceMapConsumer | null> {
  // 检查缓存
  if (sourceMapCache.has(mapUrl)) {
    return sourceMapCache.get(mapUrl) ?? null;
  }

  // 检查是否正在加载
  const existing = loadingPromises.get(mapUrl);
  if (existing) {
    return existing;
  }

  const loadPromise = (async () => {
    try {
      const response = await fetch(mapUrl);
      if (!response.ok) {
        sourceMapCache.set(mapUrl, null);
        return null;
      }

      const rawMap: RawSourceMap = await response.json();
      const consumer = createSourceMapConsumer(rawMap);
      sourceMapCache.set(mapUrl, consumer);
      return consumer;
    } catch {
      sourceMapCache.set(mapUrl, null);
      return null;
    } finally {
      loadingPromises.delete(mapUrl);
    }
  })();

  loadingPromises.set(mapUrl, loadPromise);
  return loadPromise;
}

/**
 * 从 JS 文件 URL 推断 source map URL
 */
function inferSourceMapUrl(jsUrl: string): string | null {
  // 处理各种打包工具的 source map 命名规则
  if (jsUrl.endsWith(".js")) {
    return `${jsUrl}.map`;
  }
  return null;
}

/**
 * 解析 Error stack trace 获取调用位置
 * 支持 Chrome/Firefox/Safari 格式
 */
interface StackFrame {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  functionName?: string;
}

function parseStackTrace(stack: string): StackFrame[] {
  const frames: StackFrame[] = [];
  const lines = stack.split("\n");

  for (const line of lines) {
    // Chrome 格式: "    at functionName (file:line:column)"
    // 或 "    at file:line:column"
    const chromeMatch = line.match(
      /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/
    );
    if (chromeMatch) {
      const [, funcName, fileName, lineStr, colStr] = chromeMatch;
      if (fileName && lineStr && colStr) {
        frames.push({
          functionName: funcName,
          fileName,
          lineNumber: parseInt(lineStr, 10),
          columnNumber: parseInt(colStr, 10),
        });
      }
      continue;
    }

    // Firefox 格式: "functionName@file:line:column"
    const firefoxMatch = line.match(/^(.+?)@(.+?):(\d+):(\d+)$/);
    if (firefoxMatch) {
      const [, funcName, fileName, lineStr, colStr] = firefoxMatch;
      if (fileName && lineStr && colStr) {
        frames.push({
          functionName: funcName,
          fileName,
          lineNumber: parseInt(lineStr, 10),
          columnNumber: parseInt(colStr, 10),
        });
      }
    }
  }

  return frames;
}

/**
 * 过滤掉 LocatorJS 自身和 React 内部的 stack frames
 */
function filterRelevantFrames(frames: StackFrame[]): StackFrame[] {
  return frames.filter((frame) => {
    const fileName = frame.fileName.toLowerCase();
    // 排除 LocatorJS 自身
    if (fileName.includes("locator")) return false;
    // 排除 React 内部
    if (fileName.includes("react-dom")) return false;
    if (fileName.includes("react.development")) return false;
    if (fileName.includes("react.production")) return false;
    return true;
  });
}

/**
 * 尝试从 stack trace 获取组件源码位置
 * 这是核心函数，用于无法获取 _debugSource 的环境
 */
export async function resolveSourceFromStack(): Promise<Source | null> {
  try {
    // 生成一个 Error 获取 stack trace
    const error = new Error();
    const stack = error.stack;
    if (!stack) return null;

    const frames = parseStackTrace(stack);
    const relevantFrames = filterRelevantFrames(frames);

    if (relevantFrames.length === 0) return null;

    // 取第一个相关的 frame（通常是组件渲染位置）
    const frame = relevantFrames[0];
    if (!frame) return null;

    const mapUrl = inferSourceMapUrl(frame.fileName);

    if (!mapUrl) {
      // 没有 source map，直接返回编译后的位置
      return {
        fileName: frame.fileName,
        lineNumber: frame.lineNumber,
        columnNumber: frame.columnNumber,
      };
    }

    // 加载并解析 source map
    const consumer = await loadSourceMap(mapUrl);
    if (!consumer) {
      return {
        fileName: frame.fileName,
        lineNumber: frame.lineNumber,
        columnNumber: frame.columnNumber,
      };
    }

    const original = consumer.originalPositionFor({
      line: frame.lineNumber,
      column: frame.columnNumber,
    });

    if (original.source && original.line) {
      return {
        fileName: original.source,
        lineNumber: original.line,
        columnNumber: original.column ?? undefined,
      };
    }

    return {
      fileName: frame.fileName,
      lineNumber: frame.lineNumber,
      columnNumber: frame.columnNumber,
    };
  } catch {
    return null;
  }
}

/**
 * 将 file:// URL 转换为本地路径
 * file:///Users/foo/bar.ts -> /Users/foo/bar.ts
 * file:///C:/foo/bar.ts -> C:/foo/bar.ts (Windows)
 */
function fileUrlToPath(fileUrl: string): string {
  if (!fileUrl.startsWith('file://')) {
    return fileUrl;
  }

  // 移除 file:// 前缀
  let path = fileUrl.slice(7);

  // URL 解码（处理 %40 -> @ 等）
  try {
    path = decodeURIComponent(path);
  } catch {
    // 解码失败则保持原样
  }

  // Windows 路径处理：file:///C:/foo -> C:/foo
  if (path.match(/^\/[A-Za-z]:\//)) {
    path = path.slice(1);
  }

  return path;
}

/**
 * 从指定的编译后位置反查原始位置
 */
export async function resolveOriginalPosition(
  compiledUrl: string,
  line: number,
  column: number
): Promise<Source | null> {
  const mapUrl = inferSourceMapUrl(compiledUrl);
  if (!mapUrl) {
    return { fileName: compiledUrl, lineNumber: line, columnNumber: column };
  }

  const consumer = await loadSourceMap(mapUrl);
  if (!consumer) {
    return { fileName: compiledUrl, lineNumber: line, columnNumber: column };
  }

  const original = consumer.originalPositionFor({ line, column });

  if (original.source && original.line) {
    // 转换 file:// URL 为本地路径
    const fileName = fileUrlToPath(original.source);
    return {
      fileName,
      lineNumber: original.line,
      columnNumber: original.column ?? undefined,
    };
  }

  return { fileName: compiledUrl, lineNumber: line, columnNumber: column };
}

/**
 * 预加载页面上所有 chunk 的 source map（可选优化）
 */
export async function preloadSourceMaps(): Promise<void> {
  // 查找页面上所有的 script 标签
  const scripts = document.querySelectorAll('script[src*=".js"]');
  const loadPromises: Promise<void>[] = [];

  scripts.forEach((script) => {
    const src = script.getAttribute("src");
    if (src && src.includes("/_next/")) {
      const mapUrl = `${src}.map`;
      loadPromises.push(
        loadSourceMap(mapUrl).then(() => {
          /* ignore result */
        })
      );
    }
  });

  await Promise.all(loadPromises);
}

/**
 * 清除 source map 缓存
 */
export function clearSourceMapCache(): void {
  sourceMapCache.clear();
  loadingPromises.clear();
}
