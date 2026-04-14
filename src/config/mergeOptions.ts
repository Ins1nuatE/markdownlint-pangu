import type { CliOptions, PanguConfig, ResolvedOptions } from "../shared/types.js";

interface MergeOptionsInput {
  command: "check" | "fix";
  cwd: string;
  cli: CliOptions;
  markdownlintConfig: Record<string, unknown>;
  panguConfig: PanguConfig;
}

export function mergeOptions(input: MergeOptionsInput): ResolvedOptions {
  const panguEnabledFromFile = input.panguConfig.pangu?.enabled ?? true;

  return {
    command: input.command,
    cwd: input.cwd,
    markdownlint: {
      enabled: !input.cli.markdownlintOff,
      config: input.markdownlintConfig,
      rules: input.cli.rules,
      disable: input.cli.disable,
    },
    pangu: {
      enabled: input.cli.panguOff ? false : panguEnabledFromFile,
      ignorePatterns: input.panguConfig.pangu?.ignorePatterns ?? [],
      ignoreBlocks: input.panguConfig.pangu?.ignoreBlocks ?? [],
    },
    output: {
      format: input.cli.format ?? "text",
      quiet: input.cli.quiet ?? false,
    },
    input: {
      stdin: input.cli.stdin ?? false,
      stdinFilepath: input.cli.stdinFilepath,
    },
  };
}
