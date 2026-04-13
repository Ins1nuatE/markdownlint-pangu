import { readFile, writeFile } from "node:fs/promises";

export async function readUtf8(path: string): Promise<string> {
  return readFile(path, "utf8");
}

export async function writeUtf8(path: string, content: string): Promise<void> {
  await writeFile(path, content, "utf8");
}

export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}
