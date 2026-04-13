import type { Diagnostic } from "./types.js";

export function formatText(diagnostics: Diagnostic[]): string {
  return diagnostics
    .map((diagnostic) => {
      return [
        `${diagnostic.filePath}:${diagnostic.line}:${diagnostic.column}`,
        diagnostic.source,
        diagnostic.rule,
        diagnostic.message,
      ].join(" ");
    })
    .join("\n");
}
