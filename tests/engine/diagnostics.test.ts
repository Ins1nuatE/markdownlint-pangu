import { describe, expect, it } from "vitest";

import { formatJson } from "../../src/diagnostics/formatJson.js";
import { formatText } from "../../src/diagnostics/formatText.js";
import { mergeDiagnostics } from "../../src/diagnostics/mergeDiagnostics.js";
import { normalizeMarkdownlintResults } from "../../src/lint/normalizeMarkdownlintResults.js";
import { runMarkdownlint } from "../../src/lint/runMarkdownlint.js";

describe("mergeDiagnostics", () => {
  it("sorts diagnostics by file and position", () => {
    const merged = mergeDiagnostics([
      {
        source: "markdownlint",
        rule: "MD013",
        message: "Line length",
        severity: "error",
        filePath: "b.md",
        line: 3,
        column: 9,
        fixable: false,
      },
      {
        source: "pangu",
        rule: "pangu/spacing",
        message: "Insert spacing between CJK and Latin text",
        severity: "error",
        filePath: "a.md",
        line: 2,
        column: 6,
        fixable: true,
      },
      {
        source: "markdownlint",
        rule: "MD022",
        message: "Headings should be surrounded by blank lines",
        severity: "error",
        filePath: "a.md",
        line: 2,
        column: 1,
        fixable: true,
      },
      {
        source: "markdownlint",
        rule: "MD041",
        message: "First line in file should be a top level heading",
        severity: "error",
        filePath: "a.md",
        line: 5,
        column: 1,
        fixable: false,
      },
    ]);

    expect(
      merged.map((diagnostic) =>
        `${diagnostic.filePath}:${diagnostic.line}:${diagnostic.column}:${diagnostic.rule}`,
      ),
    ).toEqual([
      "a.md:2:1:MD022",
      "a.md:2:6:pangu/spacing",
      "a.md:5:1:MD041",
      "b.md:3:9:MD013",
    ]);
  });
});

describe("runMarkdownlint + normalizeMarkdownlintResults", () => {
  it("reads issues from markdownlint results and maps key fields", async () => {
    const filePath = "docs/example.md";
    const content = "# Title   \n";
    const results = await runMarkdownlint(filePath, content, {
      default: false,
      MD009: true,
    });
    const issues = results[filePath];

    expect(issues.length).toBeGreaterThan(0);

    const issue = issues[0];
    if (!issue) {
      throw new Error("expected markdownlint to return at least one issue");
    }

    const normalized = normalizeMarkdownlintResults(filePath, issues);
    const first = normalized[0];

    expect(first).toMatchObject({
      source: "markdownlint",
      rule: issue.ruleNames[0] ?? "markdownlint/unknown",
      message: issue.errorDetail ?? issue.ruleDescription,
      severity: "error",
      filePath,
      column: issue.errorRange?.[0] ?? 1,
      fixable: Boolean(issue.fixInfo),
    });
  });
});

describe("formatters", () => {
  it("formats diagnostics to text and handles empty input", () => {
    const diagnostics = [
      {
        source: "markdownlint" as const,
        rule: "MD009",
        message: "Trailing spaces",
        severity: "error" as const,
        filePath: "docs/example.md",
        line: 1,
        column: 8,
        fixable: true,
      },
    ];

    expect(formatText(diagnostics)).toBe("docs/example.md:1:8 markdownlint MD009 Trailing spaces");
    expect(formatText([])).toBe("");
  });

  it("formats diagnostics to json and handles empty input", () => {
    const diagnostics = [
      {
        source: "markdownlint" as const,
        rule: "MD009",
        message: "Trailing spaces",
        severity: "error" as const,
        filePath: "docs/example.md",
        line: 1,
        column: 8,
        fixable: true,
      },
    ];

    expect(formatJson(diagnostics)).toBe(
      [
        "[",
        "  {",
        '    "source": "markdownlint",',
        '    "rule": "MD009",',
        '    "message": "Trailing spaces",',
        '    "severity": "error",',
        '    "filePath": "docs/example.md",',
        '    "line": 1,',
        '    "column": 8,',
        '    "fixable": true',
        "  }",
        "]",
      ].join("\n"),
    );
    expect(formatJson([])).toBe("[]");
  });
});
