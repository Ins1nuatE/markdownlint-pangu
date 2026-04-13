import type { Content, Image, ImageReference, Link, Root, Text } from "mdast";

import { parseMarkdown } from "./parseMarkdown.js";

export interface TextRange {
  start: number;
  end: number;
}

const SAFE_TEXT_PARENTS = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "listItem",
  "tableCell",
  "emphasis",
  "strong",
  "delete",
  "link",
]);

const DENY_ANCESTOR_TYPES = new Set([
  "footnoteDefinition",
  "definition",
  "code",
  "inlineCode",
  "math",
  "inlineMath",
  "html",
]);

export function collectSafeRanges(markdown: string): TextRange[] {
  const tree = parseMarkdown(markdown);
  const ranges: TextRange[] = [];

  walkNode(tree, [], markdown, ranges);

  return ranges.sort((left, right) => left.start - right.start);
}

function walkNode(
  node: Root | Content,
  ancestors: Array<Root | Content>,
  markdown: string,
  ranges: TextRange[],
): void {
  if (node.type === "text") {
    collectTextRange(node, ancestors, ranges);
  }

  if (node.type === "image" || node.type === "imageReference") {
    collectImageAltRange(node, ancestors, markdown, ranges);
  }

  if (!("children" in node) || !Array.isArray(node.children)) {
    return;
  }

  const nextAncestors = [...ancestors, node];
  for (const child of node.children as Content[]) {
    walkNode(child, nextAncestors, markdown, ranges);
  }
}

function collectTextRange(node: Text, ancestors: Array<Root | Content>, ranges: TextRange[]): void {
  const parent = ancestors.at(-1);
  if (!parent || !SAFE_TEXT_PARENTS.has(parent.type)) {
    return;
  }

  if (hasDenyAncestor(ancestors)) {
    return;
  }

  if (parent.type === "link" && isAutolinkText(parent, node)) {
    return;
  }

  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (start == null || end == null) {
    return;
  }

  ranges.push({ start, end });
}

function collectImageAltRange(
  node: Image | ImageReference,
  ancestors: Array<Root | Content>,
  markdown: string,
  ranges: TextRange[],
): void {
  if (!node.alt || hasDenyAncestor(ancestors)) {
    return;
  }

  const range = extractImageAltRange(markdown, node);
  if (!range) {
    return;
  }

  ranges.push(range);
}

function hasDenyAncestor(ancestors: Array<Root | Content>): boolean {
  return ancestors.some((ancestor) => DENY_ANCESTOR_TYPES.has(ancestor.type));
}

function isAutolinkText(parent: Link, node: Text): boolean {
  if (parent.url !== node.value) {
    return false;
  }

  const parentStart = parent.position?.start.offset;
  const parentEnd = parent.position?.end.offset;
  const textStart = node.position?.start.offset;
  const textEnd = node.position?.end.offset;
  if (parentStart == null || parentEnd == null || textStart == null || textEnd == null) {
    return false;
  }

  return parentStart === textStart && parentEnd === textEnd;
}

function extractImageAltRange(markdown: string, node: Image | ImageReference): TextRange | null {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (start == null || end == null) {
    return null;
  }

  const imageSource = markdown.slice(start, end);
  if (!imageSource.startsWith("![")) {
    return null;
  }

  const altStartOffset = 2;
  const altEndOffset = findImageAltEnd(imageSource, altStartOffset);
  if (altEndOffset <= altStartOffset) {
    return null;
  }

  return {
    start: start + altStartOffset,
    end: start + altEndOffset,
  };
}

function findImageAltEnd(source: string, from: number): number {
  for (let index = from; index < source.length; index += 1) {
    if (source[index] === "]" && !isEscapedByOddBackslashes(source, index)) {
      return index;
    }
  }

  return -1;
}

function isEscapedByOddBackslashes(source: string, index: number): boolean {
  let backslashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && source[cursor] === "\\"; cursor -= 1) {
    backslashCount += 1;
  }

  return backslashCount % 2 === 1;
}
