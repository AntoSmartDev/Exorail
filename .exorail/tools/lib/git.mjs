import { spawnSync } from 'node:child_process';

export function runGit(args, { cwd = process.cwd(), timeout = 30_000 } = {}) {
  return spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    timeout
  });
}

export function getGitRoot(cwd) {
  const result = runGit(['rev-parse', '--show-toplevel'], { cwd });
  if (result.status !== 0) {
    return { ok: false, error: result.stderr || result.stdout };
  }
  return { ok: true, root: result.stdout.trim() };
}
