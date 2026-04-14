import { applyFixes } from "markdownlint";

import { runCheck } from "./runCheck.js";
import { runMarkdownlint } from "../lint/runMarkdownlint.js";
import { applyRangePatches } from "../markdown/applyRangePatches.js";
import { collectSafeRanges } from "../markdown/safeRanges.js";
import { buildSpacingPatches } from "../pangu/buildSpacingPatches.js";
import { filterIgnoredRanges } from "../pangu/filterIgnoredRanges.js";
import type { ResolvedOptions } from "../shared/types.js";

interface RunFixInput {
  filePath: string;
  content: string;
  options: ResolvedOptions;
}

interface RunFixResult {
  fixedContent: string;
  recheckDiagnostics: Awaited<ReturnType<typeof runCheck>>["diagnostics"];
}

export async function runFix(input: RunFixInput): Promise<RunFixResult> {
  const spacingPatches = input.options.pangu.enabled
    ? buildSpacingPatches(
        input.content,
        filterIgnoredRanges(input.content, collectSafeRanges(input.content), {
          ignorePatterns: input.options.pangu.ignorePatterns,
          ignoreBlocks: input.options.pangu.ignoreBlocks,
        }),
      )
    : [];

  const afterPangu = applyRangePatches(input.content, spacingPatches);

  let fixedContent = afterPangu;
  if (input.options.markdownlint.enabled) {
    const lintResults = await runMarkdownlint(
      input.filePath,
      fixedContent,
      input.options.markdownlint.config,
      {
        rules: input.options.markdownlint.rules,
        disable: input.options.markdownlint.disable,
      },
    );
    fixedContent = applyFixes(fixedContent, lintResults[input.filePath] ?? []);
  }

  const recheck = await runCheck({
    filePath: input.filePath,
    content: fixedContent,
    options: {
      ...input.options,
      command: "check",
    },
  });

  return {
    fixedContent,
    recheckDiagnostics: recheck.diagnostics,
  };
}
