import pangu from "pangu";

export interface SpacingIssue {
  original: string;
  fixed: string;
  start: number;
  end: number;
  diagnosticOffset: number;
}

interface PanguLike {
  spacingText(text: string): string;
}

export function detectSpacingIssue(text: string, start: number, end: number): SpacingIssue | null {
  const fixed = (pangu as unknown as PanguLike).spacingText(text);
  if (fixed === text) {
    return null;
  }
  const firstDiffIndex = findFirstDiffIndex(text, fixed);

  return {
    original: text,
    fixed,
    start,
    end,
    diagnosticOffset: start + firstDiffIndex,
  };
}

function findFirstDiffIndex(original: string, fixed: string): number {
  const limit = Math.min(original.length, fixed.length);
  for (let index = 0; index < limit; index += 1) {
    if (original[index] !== fixed[index]) {
      return index;
    }
  }

  return limit;
}
