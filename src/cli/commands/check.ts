import { formatJson } from "../../diagnostics/formatJson.js";
import { formatText } from "../../diagnostics/formatText.js";
import { mergeDiagnostics } from "../../diagnostics/mergeDiagnostics.js";
import type { Diagnostic } from "../../diagnostics/types.js";
import { runCheck } from "../../engine/runCheck.js";
import { loadMarkdownlintConfig } from "../../config/loadMarkdownlintConfig.js";
import { loadPanguConfig } from "../../config/loadPanguConfig.js";
import { mergeOptions } from "../../config/mergeOptions.js";
import { CliUsageError } from "../../shared/errors.js";
import { readStdin, readUtf8 } from "../../shared/fs.js";
import { expandMarkdownPaths } from "../../shared/glob.js";
import type { CliOptions, ResolvedOptions } from "../../shared/types.js";

interface CheckCommandInput {
  paths: string[];
  cli: CliOptions;
}

export async function runCheckCommand(input: CheckCommandInput): Promise<number> {
  const options = await resolveOptions(input.cli);

  const diagnostics = options.input.stdin
    ? await runCheckFromStdin(options, input.paths)
    : await runCheckFromFiles(options, input.paths);

  writeDiagnostics(diagnostics, options, process.stdout);
  return diagnostics.length > 0 ? 1 : 0;
}

async function resolveOptions(cli: CliOptions): Promise<ResolvedOptions> {
  const cwd = process.cwd();
  const markdownlintConfig = await loadMarkdownlintConfig(cli.configPath, cwd);
  const panguConfig = await loadPanguConfig(cli.panguConfigPath, cwd);

  return mergeOptions({
    command: "check",
    cwd,
    cli,
    markdownlintConfig,
    panguConfig,
  });
}

async function runCheckFromStdin(options: ResolvedOptions, paths: string[]): Promise<Diagnostic[]> {
  if (paths.length > 0) {
    throw new CliUsageError("Do not pass file paths when using --stdin.");
  }

  if (!options.input.stdinFilepath) {
    throw new CliUsageError("--stdin requires --stdin-filepath <path>.");
  }

  const content = await readStdin();
  const result = await runCheck({
    filePath: options.input.stdinFilepath,
    content,
    options,
  });

  return result.diagnostics;
}

async function runCheckFromFiles(options: ResolvedOptions, patterns: string[]): Promise<Diagnostic[]> {
  if (patterns.length === 0) {
    throw new CliUsageError("No input paths. Pass files/globs or use --stdin.");
  }

  const filePaths = await expandMarkdownPaths(patterns);
  if (filePaths.length === 0) {
    throw new CliUsageError("No files matched the provided patterns.");
  }

  const diagnostics: Diagnostic[] = [];
  for (const filePath of filePaths) {
    const content = await readUtf8(filePath);
    const result = await runCheck({
      filePath,
      content,
      options,
    });
    diagnostics.push(...result.diagnostics);
  }

  return mergeDiagnostics(diagnostics);
}

function writeDiagnostics(
  diagnostics: Diagnostic[],
  options: ResolvedOptions,
  stream: NodeJS.WriteStream,
): void {
  if (options.output.quiet) {
    return;
  }

  if (options.output.format === "json") {
    stream.write(`${formatJson(diagnostics)}\n`);
    return;
  }

  if (diagnostics.length > 0) {
    stream.write(`${formatText(diagnostics)}\n`);
  }
}
