// @vitest-environment jsdom
import { describe, expect, test, beforeEach, vi } from "vitest";
import {
  isDebugEnabled,
  enableLocatorDebug,
  disableLocatorDebug,
  setDebugMode,
  logSourceFound,
  SourceMethod,
} from "./debug";

describe("debug mode toggle", () => {
  beforeEach(() => {
    disableLocatorDebug();
    // Reset window flag
    (window as any).__LOCATORJS_DEBUG__ = false;
  });

  test("disabled by default after reset", () => {
    expect(isDebugEnabled()).toBe(false);
  });

  test("enableLocatorDebug enables debug mode", () => {
    enableLocatorDebug();
    expect(isDebugEnabled()).toBe(true);
  });

  test("disableLocatorDebug disables debug mode", () => {
    enableLocatorDebug();
    disableLocatorDebug();
    expect(isDebugEnabled()).toBe(false);
  });

  test("setDebugMode sets mode silently", () => {
    setDebugMode(true);
    expect(isDebugEnabled()).toBe(true);
    setDebugMode(false);
    expect(isDebugEnabled()).toBe(false);
  });

  test("window.__LOCATORJS_DEBUG__ flag syncs with enable/disable", () => {
    enableLocatorDebug();
    expect((window as any).__LOCATORJS_DEBUG__).toBe(true);
    disableLocatorDebug();
    expect((window as any).__LOCATORJS_DEBUG__).toBe(false);
  });

  test("respects window global when set externally", () => {
    (window as any).__LOCATORJS_DEBUG__ = true;
    expect(isDebugEnabled()).toBe(true);
  });
});

describe("logSourceFound", () => {
  beforeEach(() => {
    disableLocatorDebug();
    (window as any).__LOCATORJS_DEBUG__ = false;
    (window as any).__LOCATORJS_DEBUG_HISTORY__ = [];
  });

  test("does not log when debug disabled", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logSourceFound(
      SourceMethod.FIBER_DEBUG_SOURCE,
      { type: "div", tag: 5 },
      { fileName: "test.tsx", lineNumber: 10 }
    );
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test("logs when debug enabled", () => {
    enableLocatorDebug();
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logSourceFound(
      SourceMethod.FIBER_DEBUG_SOURCE,
      { type: "div", tag: 5 },
      { fileName: "test.tsx", lineNumber: 10 }
    );
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test("adds entry to debug history", () => {
    enableLocatorDebug();
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logSourceFound(
      SourceMethod.FIBER_DEBUG_SOURCE,
      { type: "div", tag: 5 },
      { fileName: "test.tsx", lineNumber: 10 }
    );
    const history = (window as any).__LOCATORJS_DEBUG_HISTORY__;
    expect(history.length).toBeGreaterThan(0);
    const last = history[history.length - 1];
    expect(last.method).toBe(SourceMethod.FIBER_DEBUG_SOURCE);
    expect(last.source.fileName).toBe("test.tsx");
    consoleSpy.mockRestore();
  });
});

describe("SourceMethod enum", () => {
  test("has expected sync methods", () => {
    expect(SourceMethod.FIBER_DEBUG_SOURCE).toBe("fiber._debugSource");
    expect(SourceMethod.CACHE_HIT).toBe("cache (previously async-resolved)");
  });

  test("has expected async methods", () => {
    expect(SourceMethod.RENDERER_INTERFACE).toContain("rendererInterfaces");
    expect(SourceMethod.TURBOPACK_ELEMENT).toContain("Turbopack");
  });
});
