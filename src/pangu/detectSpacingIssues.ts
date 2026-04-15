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
  const rawFixed = (pangu as unknown as PanguLike).spacingText(text);
  const fixed = preserveOriginalSlashSpacing(text, rawFixed);
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

function preserveOriginalSlashSpacing(original: string, fixed: string): string {
  let nextOriginalSearchIndex = 0;
  let nextFixedSearchIndex = 0;
  let normalized = fixed;

  while (true) {
    const originalSlashIndex = original.indexOf("/", nextOriginalSearchIndex);
    const fixedSlashIndex = normalized.indexOf("/", nextFixedSearchIndex);
    if (originalSlashIndex === -1 || fixedSlashIndex === -1) {
      return normalized;
    }

    const originalSpan = getSlashSpacingSpan(original, originalSlashIndex);
    const fixedSpan = getSlashSpacingSpan(normalized, fixedSlashIndex);
    const replacement = original.slice(originalSpan.start, originalSpan.end);

    normalized =
      normalized.slice(0, fixedSpan.start) +
      replacement +
      normalized.slice(fixedSpan.end);

    nextOriginalSearchIndex = originalSlashIndex + 1;
    nextFixedSearchIndex = fixedSpan.start + replacement.length;
  }
}

function getSlashSpacingSpan(
  value: string,
  slashIndex: number,
): { start: number; end: number } {
  let start = slashIndex;
  let end = slashIndex + 1;

  while (start > 0 && value[start - 1] === " ") {
    start -= 1;
  }

  while (end < value.length && value[end] === " ") {
    end += 1;
  }

  return { start, end };
}
