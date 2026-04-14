import { formatJson } from "../../diagnostics/formatJson.js";
import { formatText } from "../../diagnostics/formatText.js";
import { mergeDiagnostics } from "../../diagnostics/mergeDiagnostics.js";
import type { Diagnostic } from "../../diagnostics/types.js";
import { loadMarkdownlintConfig } from "../../config/loadMarkdownlintConfig.js";
import { loadPanguConfig } from "../../config/loadPanguConfig.js";
import { mergeOptions } from "../../config/mergeOptions.js";
import { runFix } from "../../engine/runFix.js";
import { CliUsageError } from "../../shared/errors.js";
import { readStdin, readUtf8, writeUtf8 } from "../../shared/fs.js";
import { expandMarkdownPaths } from "../../shared/glob.js";
import type { CliOptions, ResolvedOptions } from "../../shared/types.js";

interface FixCommandInput {
  paths: string[];
  cli: CliOptions;
}

export async function runFixCommand(input: FixCommandInput): Promise<number> {
  const options = await resolveOptions(input.cli);

  const diagnostics = options.input.stdin
    ? await runFixFromStdin(options, input.paths)
    : await runFixFromFiles(options, input.paths);

  return diagnostics.length > 0 ? 1 : 0;
}

async function resolveOptions(cli: CliOptions): Promise<ResolvedOptions> {
  const cwd = process.cwd();
  const markdownlintConfig = await loadMarkdownlintConfig(cli.configPath, cwd);
  const panguConfig = await loadPanguConfig(cli.panguConfigPath, cwd);

  return mergeOptions({
    command: "fix",
    cwd,
    cli,
    markdownlintConfig,
    panguConfig,
  });
}

async function runFixFromStdin(options: ResolvedOptions, paths: string[]): Promise<Diagnostic[]> {
  if (paths.length > 0) {
    throw new CliUsageError("Do not pass file paths when using --stdin.");
  }

  if (!options.input.stdinFilepath) {
    throw new CliUsageError("--stdin requires --stdin-filepath <path>.");
  }

  const content = await readStdin();
  const result = await runFix({
    filePath: options.input.stdinFilepath,
    content,
    options,
  });

  process.stdout.write(result.fixedContent);
  writeDiagnostics(result.recheckDiagnostics, options, process.stderr);

  return result.recheckDiagnostics;
}

async function runFixFromFiles(options: ResolvedOptions, patterns: string[]): Promise<Diagnostic[]> {
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
    const result = await runFix({
      filePath,
      content,
      options,
    });

    if (result.recheckDiagnostics.length === 0 && result.fixedContent !== content) {
      await writeUtf8(filePath, result.fixedContent);
    }

    diagnostics.push(...result.recheckDiagnostics);
  }

  const merged = mergeDiagnostics(diagnostics);
  writeDiagnostics(merged, options, process.stdout);
  return merged;
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
