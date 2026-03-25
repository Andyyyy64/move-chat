import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { getSessionFiles, encodeProjectPath } from './session.js';
import type { SessionMeta } from './session.js';

export interface BundleManifest {
  version: 1;
  sessionId: string;
  projectPath: string;
  encodedProjectDir: string;
  cwd: string;
  pid: number;
  startedAt: number;
  createdAt: string;
}

interface BundleData {
  manifest: BundleManifest;
  files: Record<string, string>; // relative path → base64 content
}

/**
 * Pack a session into a gzipped JSON bundle (Buffer).
 */
export function packSession(claudeDir: string, session: SessionMeta): Buffer {
  const sessionFiles = getSessionFiles(claudeDir, session);

  if (!existsSync(sessionFiles.conversationPath)) {
    throw new Error(`Conversation file not found: ${sessionFiles.conversationPath}`);
  }

  const files: Record<string, string> = {};

  // Conversation JSONL
  files['conversation.jsonl'] = readFileSync(sessionFiles.conversationPath).toString('base64');

  // Session meta
  if (existsSync(sessionFiles.sessionMetaPath)) {
    files['session.json'] = readFileSync(sessionFiles.sessionMetaPath).toString('base64');
  }

  // History entries for this session
  if (sessionFiles.historyEntries.length > 0) {
    files['history.jsonl'] = Buffer.from(sessionFiles.historyEntries.join('\n') + '\n').toString('base64');
  }

  // Subagent data (recursively)
  if (sessionFiles.subagentDir) {
    collectDir(sessionFiles.subagentDir, sessionFiles.subagentDir, files, 'subagents');
  }

  const manifest: BundleManifest = {
    version: 1,
    sessionId: session.sessionId,
    projectPath: session.cwd,
    encodedProjectDir: sessionFiles.encodedProjectDir,
    cwd: session.cwd,
    pid: session.pid,
    startedAt: session.startedAt,
    createdAt: new Date().toISOString(),
  };

  const bundleData: BundleData = { manifest, files };
  return gzipSync(Buffer.from(JSON.stringify(bundleData)));
}

function collectDir(baseDir: string, currentDir: string, files: Record<string, string>, prefix: string): void {
  for (const entry of readdirSync(currentDir)) {
    const fullPath = join(currentDir, entry);
    const relPath = `${prefix}/${relative(baseDir, fullPath)}`;

    if (statSync(fullPath).isDirectory()) {
      collectDir(baseDir, fullPath, files, prefix);
    } else {
      files[relPath] = readFileSync(fullPath).toString('base64');
    }
  }
}
