import { access } from "node:fs/promises";
import { join } from "node:path";

import { readConfig } from "markdownlint/promise";

import { ConfigError } from "../shared/errors.js";

const DEFAULT_MARKDOWNLINT_FILES = [".markdownlint.json"];

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadFromPath(path: string): Promise<Record<string, unknown>> {
  try {
    return await readConfig(path);
  } catch (error) {
    throw new ConfigError(`Failed to load markdownlint config from ${path}`, { cause: error as Error });
  }
}

async function findDefaultConfigPath(cwd: string): Promise<string | undefined> {
  for (const candidate of DEFAULT_MARKDOWNLINT_FILES) {
    const candidatePath = join(cwd, candidate);
    if (await fileExists(candidatePath)) {
      return candidatePath;
    }
  }
  return undefined;
}

export async function loadMarkdownlintConfig(path?: string, cwd = process.cwd()): Promise<Record<string, unknown>> {
  if (path) {
    return loadFromPath(path);
  }

  const discovered = await findDefaultConfigPath(cwd);
  if (!discovered) {
    return {};
  }

  return loadFromPath(discovered);
}
