import fg from "fast-glob";

export async function expandMarkdownPaths(patterns: string[]): Promise<string[]> {
  return fg(patterns, {
    onlyFiles: true,
    unique: true,
  });
}
