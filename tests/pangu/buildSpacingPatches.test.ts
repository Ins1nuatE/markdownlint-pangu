import { describe, expect, it } from "vitest";

import { applyRangePatches } from "../../src/markdown/applyRangePatches.js";
import { collectSafeRanges } from "../../src/markdown/safeRanges.js";
import { buildSpacingPatches } from "../../src/pangu/buildSpacingPatches.js";

describe("buildSpacingPatches", () => {
  it("only patches safe slices and leaves code untouched", () => {
    const markdown = [
      "# 歡迎來到MarkdownWorld",
      "",
      "這是一個README文件。",
      "",
      "`const value = \"HelloWorld\"`",
    ].join("\n");

    const patches = buildSpacingPatches(markdown, collectSafeRanges(markdown));
    const fixed = applyRangePatches(markdown, patches);

    expect(fixed).toBe(
      [
        "# 歡迎來到 MarkdownWorld",
        "",
        "這是一個 README 文件。",
        "",
        "`const value = \"HelloWorld\"`",
      ].join("\n"),
    );
    expect(patches).toHaveLength(2);

    const paragraphStart = markdown.indexOf("這是一個README文件。");
    const paragraphEnd = paragraphStart + "這是一個README文件。".length;
    const readmePatch = patches.find(
      (patch) => patch.start === paragraphStart && patch.end === paragraphEnd,
    );

    expect(readmePatch).toEqual({
      start: paragraphStart,
      end: paragraphEnd,
      text: "這是一個 README 文件。",
    });
  });

  it("keeps original slash spacing while preserving other pangu fixes", () => {
    const markdown = "這是A/B測試";

    const patches = buildSpacingPatches(markdown, collectSafeRanges(markdown));
    const fixed = applyRangePatches(markdown, patches);

    expect(fixed).toBe("這是 A/B 測試");
    expect(patches).toHaveLength(1);
    expect(patches[0]?.text).toBe("這是 A/B 測試");
  });
});

describe("applyRangePatches", () => {
  it("throws when a patch range is out of bounds", () => {
    expect(() => {
      applyRangePatches("abc", [{ start: -1, end: 1, text: "x" }]);
    }).toThrow("invalid patch range");
  });

  it("throws when patch ranges overlap", () => {
    expect(() => {
      applyRangePatches("abcdef", [
        { start: 1, end: 4, text: "x" },
        { start: 3, end: 5, text: "y" },
      ]);
    }).toThrow("overlapping patch ranges");
  });
});
