import { detectSpacingIssue } from "./detectSpacingIssues.js";

export interface RangePatch {
  start: number;
  end: number;
  text: string;
}

export interface DiagnosableRangePatch extends RangePatch {
  diagnosticOffset: number;
}

export function buildSpacingPatches(
  markdown: string,
  ranges: Array<{ start: number; end: number }>,
): RangePatch[] {
  return buildSpacingPatchesWithDiagnostics(markdown, ranges).map((patch) => ({
    start: patch.start,
    end: patch.end,
    text: patch.text,
  }));
}

export function buildSpacingPatchesWithDiagnostics(
  markdown: string,
  ranges: Array<{ start: number; end: number }>,
): DiagnosableRangePatch[] {
  const patches: DiagnosableRangePatch[] = [];

  for (const range of ranges) {
    const original = markdown.slice(range.start, range.end);
    const issue = detectSpacingIssue(original, range.start, range.end);
    if (!issue) {
      continue;
    }

    patches.push({
      start: range.start,
      end: range.end,
      text: issue.fixed,
      diagnosticOffset: issue.diagnosticOffset,
    });
  }

  return patches;
}
