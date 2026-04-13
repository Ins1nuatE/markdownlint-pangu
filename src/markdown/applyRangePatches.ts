import type { RangePatch } from "../pangu/buildSpacingPatches.js";

export function applyRangePatches(input: string, patches: RangePatch[]): string {
  for (const patch of patches) {
    if (patch.start < 0 || patch.start > patch.end || patch.end > input.length) {
      throw new RangeError(
        `invalid patch range: start=${patch.start}, end=${patch.end}, inputLength=${input.length}`,
      );
    }
  }

  const ascending = [...patches].sort((left, right) => {
    if (left.start !== right.start) {
      return left.start - right.start;
    }

    return left.end - right.end;
  });

  for (let index = 1; index < ascending.length; index += 1) {
    if (ascending[index - 1].end > ascending[index].start) {
      throw new Error("overlapping patch ranges are not allowed");
    }
  }

  const sorted = [...ascending].reverse();
  let output = input;

  for (const patch of sorted) {
    output = `${output.slice(0, patch.start)}${patch.text}${output.slice(patch.end)}`;
  }

  return output;
}
