import type { Diagnostic } from "./types.js";

export function formatJson(diagnostics: Diagnostic[]): string {
  return JSON.stringify(diagnostics, null, 2);
}
