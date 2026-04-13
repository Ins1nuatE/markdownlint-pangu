export type DiagnosticSource = "markdownlint" | "pangu";

export interface Diagnostic {
  source: DiagnosticSource;
  rule: string;
  message: string;
  severity: "error";
  filePath: string;
  line: number;
  column: number;
  fixable: boolean;
}
