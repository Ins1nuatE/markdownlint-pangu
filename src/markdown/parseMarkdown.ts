import type { Root } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { frontmatterFromMarkdown } from "mdast-util-frontmatter";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { mathFromMarkdown } from "mdast-util-math";
import { frontmatter } from "micromark-extension-frontmatter";
import { gfm } from "micromark-extension-gfm";
import { math } from "micromark-extension-math";

export function parseMarkdown(markdown: string): Root {
  return fromMarkdown(markdown, {
    extensions: [frontmatter(["yaml"]), gfm(), math()],
    mdastExtensions: [frontmatterFromMarkdown(["yaml"]), gfmFromMarkdown(), mathFromMarkdown()],
  });
}
