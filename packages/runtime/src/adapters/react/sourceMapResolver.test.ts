import { describe, expect, test } from "vitest";
import { decodeVLQ, parseMappings, fileUrlToPath } from "./sourceMapResolver";

describe("decodeVLQ", () => {
  test("decodes zero (A)", () => {
    const [value, nextIndex] = decodeVLQ("A", 0);
    expect(value).toBe(0);
    expect(nextIndex).toBe(1);
  });

  test("decodes positive values", () => {
    // 'C' = 2 -> value = 1 (positive)
    const [value] = decodeVLQ("C", 0);
    expect(value).toBe(1);
  });

  test("decodes negative values", () => {
    // 'D' = 3 -> value = -1 (negative, sign bit set)
    const [value] = decodeVLQ("D", 0);
    expect(value).toBe(-1);
  });

  test("decodes multi-character VLQ", () => {
    // 'gB' -> continuation bit set on first char
    // 'g' = 32 (index in base64), continuation=1, bits=0b00000 -> partial
    // Actually let's test with a known value
    // To encode 16: 16 << 1 = 32, which needs continuation
    // 32 = 0b100000 -> first char: continuation(1) | 0b00000 = 0b100000 = 32 = 'g'
    // remaining: 1 -> 0b00001 = 1 = 'B'
    const [value] = decodeVLQ("gB", 0);
    expect(value).toBe(16);
  });

  test("respects starting index", () => {
    const [value, nextIndex] = decodeVLQ("XAC", 1);
    expect(value).toBe(0); // 'A' = 0
    expect(nextIndex).toBe(2);
  });

  test("throws on unexpected end", () => {
    // 'g' has continuation bit set but string ends
    expect(() => decodeVLQ("g", 0)).toThrow("Unexpected end of VLQ");
  });

  test("throws on invalid character", () => {
    expect(() => decodeVLQ("!", 0)).toThrow("Invalid VLQ character");
  });
});

describe("parseMappings", () => {
  test("parses empty string", () => {
    const result = parseMappings("");
    expect(result).toEqual([]);
  });

  test("parses single semicolon (empty line)", () => {
    const result = parseMappings(";");
    // One empty line, then potentially another
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]).toEqual([]);
  });

  test("parses single segment with 4 fields", () => {
    // AAAA = generatedCol:0, sourceIdx:0, origLine:0, origCol:0
    const result = parseMappings("AAAA");
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(1);
    expect(result[0]![0]).toEqual({
      generatedColumn: 0,
      sourceIndex: 0,
      originalLine: 0,
      originalColumn: 0,
    });
  });

  test("parses multiple segments on same line", () => {
    // AAAA,CACA = two segments separated by comma
    const result = parseMappings("AAAA,CACA");
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(2);
    // First segment: 0,0,0,0
    expect(result[0]![0]!.generatedColumn).toBe(0);
    // Second segment: relative values added
    expect(result[0]![1]!.generatedColumn).toBe(1); // C=1 relative to 0
  });

  test("parses multiple lines", () => {
    // AAAA;AAAA = one segment per line
    const result = parseMappings("AAAA;AAAA");
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(1);
    expect(result[1]).toHaveLength(1);
    // Generated column resets per line, but source/line/column are relative across lines
    expect(result[1]![0]!.generatedColumn).toBe(0);
  });

  test("handles relative values correctly across segments", () => {
    // AACA = genCol:0, srcIdx:0, origLine:1, origCol:0
    // then ;AACA = genCol:0, srcIdx:0, origLine:+1=2, origCol:0
    const result = parseMappings("AACA;AACA");
    expect(result[0]![0]!.originalLine).toBe(1);
    expect(result[1]![0]!.originalLine).toBe(2); // 1 + 1 = 2
  });
});

describe("fileUrlToPath", () => {
  test("converts Unix file:// URL to path", () => {
    expect(fileUrlToPath("file:///Users/foo/bar.ts")).toBe(
      "/Users/foo/bar.ts"
    );
  });

  test("converts Windows file:// URL to path", () => {
    expect(fileUrlToPath("file:///C:/foo/bar.ts")).toBe("C:/foo/bar.ts");
  });

  test("decodes URL-encoded characters", () => {
    expect(fileUrlToPath("file:///Users/foo%40bar/baz.ts")).toBe(
      "/Users/foo@bar/baz.ts"
    );
  });

  test("passes through non-file:// URLs unchanged", () => {
    expect(fileUrlToPath("/Users/foo/bar.ts")).toBe("/Users/foo/bar.ts");
    expect(fileUrlToPath("https://example.com/foo.ts")).toBe(
      "https://example.com/foo.ts"
    );
  });

  test("handles file:// URL with spaces", () => {
    expect(fileUrlToPath("file:///Users/foo%20bar/baz.ts")).toBe(
      "/Users/foo bar/baz.ts"
    );
  });
});
