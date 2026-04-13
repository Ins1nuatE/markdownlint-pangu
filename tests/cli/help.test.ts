import { spawnSync } from "node:child_process";
import { beforeAll, describe, expect, it } from "vitest";

const spawnOptions = {
  cwd: process.cwd(),
  encoding: "utf8",
};

describe("CLI smoke tests", () => {
  beforeAll(() => {
    const buildResult = spawnSync("npm", ["run", "build"], spawnOptions);

    if (buildResult.status !== 0) {
      throw new Error(
        `npm run build failed: ${buildResult.stderr ?? buildResult.stdout}`,
      );
    }
  });

  it("prints help with check and fix commands from dist", () => {
    const result = spawnSync(
      "node",
      ["dist/cli/index.js", "--help"],
      spawnOptions,
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("markdownlint-pangu");
    expect(result.stdout).toContain("check");
    expect(result.stdout).toContain("fix");
  });

  it("fails fast when check has no input", () => {
    const result = spawnSync("node", ["dist/cli/index.js", "check"], spawnOptions);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("No input paths");
  });
});
