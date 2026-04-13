export type CommandName = "check" | "fix";
export type OutputFormat = "text" | "json";
export type Severity = "error";

export interface CliOptions {
  format?: OutputFormat;
  panguOff?: boolean;
  markdownlintOff?: boolean;
  configPath?: string;
  panguConfigPath?: string;
  rules?: string[];
  disable?: string[];
  stdin?: boolean;
  stdinFilepath?: string;
  quiet?: boolean;
}

export interface PanguConfig {
  pangu?: {
    enabled?: boolean;
    ignorePatterns?: string[];
    ignoreBlocks?: string[];
    reportLevel?: Severity;
    fixMode?: boolean;
    safeRangePolicy?: "conservative";
  };
}

export interface ResolvedOptions {
  command: CommandName;
  cwd: string;
  markdownlint: {
    enabled: boolean;
    config: Record<string, unknown>;
    rules?: string[];
    disable?: string[];
  };
  pangu: {
    enabled: boolean;
    ignorePatterns: string[];
    ignoreBlocks: string[];
    reportLevel: Severity;
    fixMode: boolean;
    safeRangePolicy: "conservative";
  };
  output: {
    format: OutputFormat;
    quiet: boolean;
  };
  input: {
    stdin: boolean;
    stdinFilepath?: string;
  };
}
