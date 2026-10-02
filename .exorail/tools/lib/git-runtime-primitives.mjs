import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, renameSync } from 'node:fs';
import path from 'node:path';

export const digest = (value) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
export function stop(reason, detail = '') { throw Object.assign(new Error(`${reason}${detail ? `: ${detail}` : ''}`), { reason }); }
export function gitProcess(root, args, input) {
  return spawnSync('git', ['-c', 'core.longpaths=true', '-c', 'core.autocrlf=false', '-c', 'core.eol=lf', ...args], { cwd: root, input, encoding: 'utf8', timeout: 30_000,
    maxBuffer: 32 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
}
export function git(root, args, input) {
  const r = gitProcess(root, args, input);
  if (r.error || r.signal || r.status !== 0) stop('git_failed', `${args[0]} exit=${r.status} signal=${r.signal ?? 'none'} ${r.error?.message ?? r.stderr.trim()}`);
  return r.stdout.trim();
}
export function commit(root, value) {
  if (typeof value !== 'string' || !value || value.startsWith('-') || /[\r\n\0]/.test(value)) stop('commit_invalid');
  return git(root, ['rev-parse', '--verify', `${value}^{commit}`]);
}
export function validRef(root, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('refs/') || /codex/i.test(ref)) stop('ref_invalid', String(ref));
  git(root, ['check-ref-format', ref]); return ref;
}
export function refValue(root, ref) {
  validRef(root, ref);
  const rows = git(root, ['for-each-ref', '--format=%(refname) %(objectname)', ref]).split(/\r?\n/);
  const exact = rows.find((row) => row.startsWith(`${ref} `));
  return exact ? exact.slice(ref.length + 1) : null;
}
export function remoteValue(root, remote, ref) {
  validRemote(remote); validRef(root, ref);
  const lines = git(root, ['ls-remote', '--refs', remote, ref]).split(/\r?\n/).filter(Boolean);
  if (lines.length > 1) stop('remote_ref_ambiguous');
  return lines.length ? lines[0].split(/\s+/)[0] : null;
}
export function validRemote(remote) {
  if (typeof remote !== 'string' || !remote || remote.startsWith('-') || /[\r\n\0]/.test(remote)) stop('remote_invalid');
}
export function authority(request, action, bindings = {}) {
  const a = request.authority;
  if (!a || !/^user:[a-z0-9][a-z0-9._:-]*$/i.test(a.reference ?? '') || !Array.isArray(a.actions) || !a.actions.includes(action)) stop('authority_missing', action);
  for (const [key, value] of Object.entries(bindings)) if (a.bindings?.[key] !== value) stop('authority_binding_mismatch', key);
  return a.reference;
}
export function localDirectory(root) {
  const common = path.resolve(root, git(root, ['rev-parse', '--git-common-dir']));
  const directory = path.join(common, 'exorail-runtime'); mkdirSync(directory, { recursive: true }); return directory;
}
export function lock(root, name, operation) {
  const file = path.join(localDirectory(root), `${digest(name)}.lock`);
  try { writeFileSync(file, JSON.stringify({ name, pid: process.pid }), { flag: 'wx', encoding: 'utf8' }); }
  catch (e) { if (e.code === 'EEXIST') stop('coordinator_busy', 'inspect retained lock; never delete to retry blindly'); throw e; }
  try { return operation(); } finally { unlinkSync(file); }
}
export function inspectLock(root) {
  const file = path.join(localDirectory(root), `${digest('runtime-state')}.lock`);
  if (!existsSync(file)) return { present: false };
  const text = readFileSync(file, 'utf8'); return { present: true, ...JSON.parse(text), lock_digest: digest(text) };
}
export function recoverLock(root, request) {
  const observed = inspectLock(root); if (!observed.present) stop('lock_missing');
  authority(request, 'recover-lock', { lock_digest: observed.lock_digest, pid: observed.pid });
  if (request.lock_digest !== observed.lock_digest || request.pid !== observed.pid) stop('lock_observation_stale');
  try { process.kill(observed.pid, 0); stop('lock_owner_live'); }
  catch (error) { if (error.code !== 'ESRCH') throw error; }
  const file = path.join(localDirectory(root), `${digest('runtime-state')}.lock`);
  if (digest(readFileSync(file, 'utf8')) !== observed.lock_digest) stop('lock_observation_stale');
  renameSync(file, `${file}.retired-${randomUUID()}`);
  return { retired: true, accepted: false, previous_pid: observed.pid };
}
export function journalFile(root, requestId) {
  if (typeof requestId !== 'string' || !/^[a-z0-9][a-z0-9._:-]{0,119}$/i.test(requestId)) stop('request_id_invalid');
  return path.join(localDirectory(root), `request-${digest(requestId)}.json`);
}
export function readJson(file) { return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null; }
export function writeJson(file, value) { writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
export function runtimeCommit(root, document, parent = null) {
  const blob = git(root, ['hash-object', '-w', '--stdin'], `${JSON.stringify(document)}\n`);
  const tree = git(root, ['mktree'], `100644 blob ${blob}\tstate.json\n`);
  return git(root, ['-c', 'user.name=Exorail Runtime', '-c', 'user.email=runtime@example.invalid', 'commit-tree', tree, ...(parent ? ['-p', parent] : [])], `Exorail operational binding; not acceptance\ntransaction ${randomUUID()}\n`);
}
export function documentAt(root, sha) { return JSON.parse(git(root, ['show', `${sha}:state.json`])); }
export function ancestor(root, older, newer) {
  const r = gitProcess(root, ['merge-base', '--is-ancestor', older, newer]);
  if (r.error || r.signal || ![0, 1].includes(r.status)) stop('git_failed', 'ancestry observation');
  return r.status === 0;
}
export function clean(root) {
  if (git(root, ['status', '--porcelain=v1', '--untracked-files=all'])) stop('workspace_dirty', root);
  for (const marker of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD']) if (existsSync(path.resolve(root, git(root, ['rev-parse', '--git-path', marker])))) stop('git_operation_in_progress', marker);
}
