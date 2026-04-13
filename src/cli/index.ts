#!/usr/bin/env node
import { Command, InvalidArgumentError } from "commander";

import { runCheckCommand } from "./commands/check.js";
import { runFixCommand } from "./commands/fix.js";
import type { CliOptions, OutputFormat } from "../shared/types.js";
import { CliUsageError, ConfigError } from "../shared/errors.js";

const program = new Command();

program
  .name("markdownlint-pangu")
  .description("markdownlint wrapper with safe pangu spacing for Markdown")
  .version("0.1.0");

program
  .command("check")
  .description("Check Markdown files")
  .argument("[paths...]", "Markdown files or glob patterns")
  .option("--config <path>", "Path to markdownlint config")
  .option("--pangu-config <path>", "Path to pangu config file")
  .option("--format <text|json>", "Output format", parseOutputFormat, "text")
  .option("--pangu-off", "Disable pangu checks and fixes")
  .option("--markdownlint-off", "Disable markdownlint checks and fixes")
  .option("--quiet", "Do not print diagnostics")
  .option("--stdin", "Read Markdown content from stdin")
  .option("--stdin-filepath <path>", "Virtual file path used for stdin input")
  .option(
    "--rules <items>",
    "Only enable specified markdownlint rules (comma-separated)",
    parseCommaSeparatedList,
  )
  .option(
    "--disable <items>",
    "Disable markdownlint rules (comma-separated)",
    parseCommaSeparatedList,
  )
  .action(async (paths: string[], commandOptions: CommanderCliOptions) => {
    process.exitCode = await runCheckCommand({
      paths,
      cli: normalizeCliOptions(commandOptions),
    });
  });

program
  .command("fix")
  .description("Fix spacing and markdownlint issues")
  .argument("[paths...]", "Markdown files or glob patterns")
  .option("--config <path>", "Path to markdownlint config")
  .option("--pangu-config <path>", "Path to pangu config file")
  .option("--format <text|json>", "Output format", parseOutputFormat, "text")
  .option("--pangu-off", "Disable pangu checks and fixes")
  .option("--markdownlint-off", "Disable markdownlint checks and fixes")
  .option("--quiet", "Do not print diagnostics")
  .option("--stdin", "Read Markdown content from stdin")
  .option("--stdin-filepath <path>", "Virtual file path used for stdin input")
  .option(
    "--rules <items>",
    "Only enable specified markdownlint rules (comma-separated)",
    parseCommaSeparatedList,
  )
  .option(
    "--disable <items>",
    "Disable markdownlint rules (comma-separated)",
    parseCommaSeparatedList,
  )
  .action(async (paths: string[], commandOptions: CommanderCliOptions) => {
    process.exitCode = await runFixCommand({
      paths,
      cli: normalizeCliOptions(commandOptions),
    });
  });

void program.parseAsync().catch((error: unknown) => {
  if (error instanceof CliUsageError) {
    process.stderr.write(`${error.message}\n`);
    process.exit(2);
  }

  if (error instanceof ConfigError) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }

  if (error instanceof Error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }

  process.stderr.write("Unknown error\n");
  process.exit(1);
});

interface CommanderCliOptions {
  config?: string;
  panguConfig?: string;
  format?: OutputFormat;
  panguOff?: boolean;
  markdownlintOff?: boolean;
  quiet?: boolean;
  stdin?: boolean;
  stdinFilepath?: string;
  rules?: string[];
  disable?: string[];
}

function normalizeCliOptions(input: CommanderCliOptions): CliOptions {
  return {
    configPath: input.config,
    panguConfigPath: input.panguConfig,
    format: input.format,
    panguOff: input.panguOff,
    markdownlintOff: input.markdownlintOff,
    quiet: input.quiet,
    stdin: input.stdin,
    stdinFilepath: input.stdinFilepath,
    rules: input.rules,
    disable: input.disable,
  };
}

function parseOutputFormat(value: string): OutputFormat {
  if (value === "text" || value === "json") {
    return value;
  }

  throw new InvalidArgumentError("Expected --format to be one of: text, json");
}

function parseCommaSeparatedList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
