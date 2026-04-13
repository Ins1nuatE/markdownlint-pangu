import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

import { ConfigError } from "../shared/errors.js";
import type { PanguConfig } from "../shared/types.js";

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readPanguFile(path: string): Promise<PanguConfig> {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as PanguConfig;
  } catch (error) {
    throw new ConfigError(`Failed to load pangu config from ${path}`, { cause: error as Error });
  }
}

export async function loadPanguConfig(path?: string, cwd = process.cwd()): Promise<PanguConfig> {
  if (path) {
    return readPanguFile(path);
  }

  const defaultPath = join(cwd, ".markdownlint-pangu.json");

  if (!(await fileExists(defaultPath))) {
    return {};
  }

  return readPanguFile(defaultPath);
}
