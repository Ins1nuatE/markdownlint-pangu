export class CliUsageError extends Error {
  readonly code = "CLI_USAGE_ERROR";
}

export class ConfigError extends Error {
  readonly code = "CONFIG_ERROR";

  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ConfigError";
  }
}
