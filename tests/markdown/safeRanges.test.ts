import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { collectSafeRanges } from "../../src/markdown/safeRanges.js";

describe("collectSafeRanges", () => {
  it("includes visible text but excludes code and front matter", async () => {
    const markdown = await readFile("tests/fixtures/markdown/safe-ranges.md", "utf8");
    const ranges = collectSafeRanges(markdown);
    const slices = ranges.map((range) => markdown.slice(range.start, range.end));

    expect(slices.some((slice) => slice.includes("MarkdownWorld"))).toBe(true);
    expect(slices.some((slice) => slice.includes("README文档"))).toBe(true);
    expect(slices.some((slice) => slice.includes("项目主页Homepage"))).toBe(true);
    expect(slices.some((slice) => slice.includes("不要处理CodeSpan"))).toBe(false);
    expect(slices.some((slice) => slice.includes("不要处理CodeFence"))).toBe(false);
    expect(slices.some((slice) => slice.includes("title: test"))).toBe(false);
  });

  it("skips autolink url text", () => {
    const markdown = "访问 https://example.com/HelloWorld";
    const ranges = collectSafeRanges(markdown);
    const slices = ranges.map((range) => markdown.slice(range.start, range.end));

    expect(slices.some((slice) => slice.includes("访问"))).toBe(true);
    expect(slices.some((slice) => slice.includes("https://example.com/HelloWorld"))).toBe(false);
  });

  it("skips footnote definition text", () => {
    const markdown = "正文[^1]\n\n[^1]: 脚注Footnote文本";
    const ranges = collectSafeRanges(markdown);
    const slices = ranges.map((range) => markdown.slice(range.start, range.end));

    expect(slices.some((slice) => slice.includes("正文"))).toBe(true);
    expect(slices.some((slice) => slice.includes("脚注Footnote文本"))).toBe(false);
  });

  it("includes image alt text", () => {
    const markdown = "![图片AltText](https://example.com/a.png)";
    const ranges = collectSafeRanges(markdown);
    const slices = ranges.map((range) => markdown.slice(range.start, range.end));

    expect(slices.some((slice) => slice.includes("图片AltText"))).toBe(true);
  });

  it("includes image reference alt text but skips definition url", () => {
    const markdown = "![图片AltText][logo]\n\n[logo]: https://example.com/a.png";
    const ranges = collectSafeRanges(markdown);
    const slices = ranges.map((range) => markdown.slice(range.start, range.end));

    expect(slices.some((slice) => slice.includes("图片AltText"))).toBe(true);
    expect(slices.some((slice) => slice.includes("https://example.com/a.png"))).toBe(false);
  });

  it("supports image alt ending with escaped closing bracket", () => {
    const markdown = String.raw`![foo\\\\](u)`;
    const ranges = collectSafeRanges(markdown);
    const slices = ranges.map((range) => markdown.slice(range.start, range.end));

    expect(slices.some((slice) => slice === String.raw`foo\\\\`)).toBe(true);
  });
});
