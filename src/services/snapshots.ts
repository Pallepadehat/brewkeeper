import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { Snapshot } from "../domain/types";

interface CommandResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

async function runCommand(cmd: string[]): Promise<CommandResult> {
  const proc = Bun.spawn({
    cmd,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return {
    ok: code === 0,
    stdout,
    stderr,
  };
}

function preferredSnapshotDir(): string {
  const home = process.env.HOME ?? process.cwd();
  return path.join(home, ".brewkeeper", "snapshots");
}

function fallbackSnapshotDir(): string {
  return path.join(process.cwd(), ".brewkeeper", "snapshots");
}

async function ensureSnapshotDir(): Promise<string> {
  const candidates = [preferredSnapshotDir(), fallbackSnapshotDir()];
  for (const candidate of candidates) {
    try {
      await mkdir(candidate, { recursive: true });
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }
  throw new Error("Unable to create snapshot directory.");
}

function buildSnapshotId(now: Date): string {
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
}

export async function createSnapshot(name?: string): Promise<Snapshot> {
  const snapshotDir = await ensureSnapshotDir();

  const now = new Date();
  const id = buildSnapshotId(now);
  const displayName = name && name.trim().length > 0 ? name.trim() : `snapshot-${id}`;
  const filePath = path.join(snapshotDir, `${displayName}.Brewfile`);

  const result = await runCommand(["brew", "bundle", "dump", "--force", "--file", filePath]);
  if (!result.ok) {
    throw new Error(result.stderr || "Failed to create Brewfile snapshot.");
  }

  return {
    id,
    name: displayName,
    path: filePath,
    createdAt: now.toISOString(),
  };
}

export async function listSnapshots(): Promise<Snapshot[]> {
  const snapshotDir = await ensureSnapshotDir();

  const entries = await readdir(snapshotDir, { withFileTypes: true });
  const brewfiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".Brewfile"));

  const snapshots = await Promise.all(
    brewfiles.map(async (entry) => {
      const filePath = path.join(snapshotDir, entry.name);
      const fileStat = await stat(filePath);
      return {
        id: entry.name.replace(/\.Brewfile$/, ""),
        name: entry.name.replace(/\.Brewfile$/, ""),
        path: filePath,
        createdAt: fileStat.mtime.toISOString(),
      } satisfies Snapshot;
    }),
  );

  snapshots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return snapshots;
}

export async function rollbackToSnapshot(snapshot: Snapshot): Promise<string> {
  const result = await runCommand(["brew", "bundle", "--file", snapshot.path]);
  if (!result.ok) {
    throw new Error(result.stderr || "Rollback failed.");
  }
  return result.stdout.trim() || `Rollback complete: ${snapshot.name}`;
}
