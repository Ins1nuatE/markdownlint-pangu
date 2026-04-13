import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const spawnOptions = {
  cwd: process.cwd(),
  encoding: "utf8" as const,
};

describe("CLI check/fix", () => {
  beforeAll(() => {
    const build = spawnSync("npm", ["run", "build"], spawnOptions);
    expect(build.status).toBe(0);
  });

  it("checks and fixes a Markdown file", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "markdownlint-pangu-cli-"));
    const filePath = join(cwd, "README.md");

    await writeFile(filePath, "# 歡迎來到MarkdownWorld\n\n這是一個README文件。", "utf8");

    const check = spawnSync(
      "node",
      ["dist/cli/index.js", "check", filePath],
      spawnOptions,
    );
    expect(check.status).toBe(1);
    expect(check.stdout).toContain("pangu/spacing");

    const fix = spawnSync(
      "node",
      ["dist/cli/index.js", "fix", filePath],
      spawnOptions,
    );
    expect(fix.status).toBe(0);

    const content = await readFile(filePath, "utf8");
    expect(content).toContain("歡迎來到 MarkdownWorld");
    expect(content).toContain("README 文件");
  });

  it("checks markdown from stdin", () => {
    const result = spawnSync(
      "node",
      [
        "dist/cli/index.js",
        "check",
        "--stdin",
        "--stdin-filepath",
        "README.md",
      ],
      {
        ...spawnOptions,
        input: "# 歡迎來到MarkdownWorld\n",
      },
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("pangu/spacing");
  });

  it("prints machine-readable diagnostics with --format json", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "markdownlint-pangu-cli-json-"));
    const filePath = join(cwd, "README.md");

    await writeFile(filePath, "# 歡迎來到MarkdownWorld\n", "utf8");

    const result = spawnSync(
      "node",
      ["dist/cli/index.js", "check", filePath, "--format", "json"],
      spawnOptions,
    );

    expect(result.status).toBe(1);

    const parsed = JSON.parse(result.stdout) as Array<{
      source: string;
      rule: string;
      filePath: string;
    }>;

    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0]?.source).toBe("pangu");
    expect(parsed[0]?.rule).toBe("pangu/spacing");
    expect(parsed[0]?.filePath).toBe(filePath);
  });

  it("applies --rules to markdownlint checks", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "markdownlint-pangu-cli-rules-"));
    const filePath = join(cwd, "RULES.md");

    await writeFile(filePath, "# Title\n\nLine with trailing space \n", "utf8");

    const baseline = spawnSync(
      "node",
      ["dist/cli/index.js", "check", "--pangu-off", filePath],
      spawnOptions,
    );
    expect(baseline.status).toBe(1);
    expect(baseline.stdout).toContain("MD009");

    const withRules = spawnSync(
      "node",
      ["dist/cli/index.js", "check", "--pangu-off", "--rules", "MD041", filePath],
      spawnOptions,
    );

    expect(withRules.status).toBe(0);
    expect(withRules.stdout).not.toContain("MD009");
  });

  it("applies --disable to markdownlint checks", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "markdownlint-pangu-cli-disable-"));
    const filePath = join(cwd, "DISABLE.md");

    await writeFile(filePath, "# Title\n\nLine with trailing space \n", "utf8");

    const baseline = spawnSync(
      "node",
      ["dist/cli/index.js", "check", "--pangu-off", filePath],
      spawnOptions,
    );
    expect(baseline.status).toBe(1);
    expect(baseline.stdout).toContain("MD009");

    const withDisable = spawnSync(
      "node",
      ["dist/cli/index.js", "check", "--pangu-off", "--disable", "MD009", filePath],
      spawnOptions,
    );

    expect(withDisable.status).toBe(0);
    expect(withDisable.stdout).not.toContain("MD009");
  });

  it("keeps fix --stdin stdout clean from diagnostics", () => {
    const result = spawnSync(
      "node",
      [
        "dist/cli/index.js",
        "fix",
        "--stdin",
        "--stdin-filepath",
        "README.md",
        "--markdownlint-off",
      ],
      {
        ...spawnOptions,
        input: "# 歡迎來到MarkdownWorld\n",
      },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("# 歡迎來到 MarkdownWorld\n");
    expect(result.stdout).not.toContain("pangu/spacing");
    expect(result.stderr).toBe("");
  });
});
