import type { LintError } from "markdownlint";

import type { Diagnostic } from "../diagnostics/types.js";

export function normalizeMarkdownlintResults(
  filePath: string,
  issues: LintError[],
): Diagnostic[] {
  return issues.map((issue) => ({
    source: "markdownlint",
    rule: issue.ruleNames[0] ?? "markdownlint/unknown",
    message: issue.errorDetail ?? issue.ruleDescription,
    severity: "error",
    filePath,
    line: issue.lineNumber,
    column: issue.errorRange?.[0] ?? 1,
    fixable: Boolean(issue.fixInfo),
  }));
}
