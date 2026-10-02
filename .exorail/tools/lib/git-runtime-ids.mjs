import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { collect } from './schema-0.2.mjs';
import { authority, commit, digest, documentAt, git, gitProcess, journalFile, lock, readJson, refValue, remoteValue, runtimeCommit, stop, validRemote, writeJson } from './git-runtime-primitives.mjs';

const prefixes = { epic: 'EP', feature: 'FEAT', story: 'US' };
function existingIds(root) {
  if (!existsSync(path.join(root, '.exorail'))) return [];
  const findings = []; const records = collect(root, findings);
  if (findings.some((f) => f.severity === 'ERROR')) stop('canonical_input_invalid');
  return records.map((r) => r.data.id);
}
export function reserveId(root, request) {
  if (request.remote) validRemote(request.remote);
  const prefix = prefixes[request.kind]; if (!prefix) stop('id_kind_invalid');
  if (!/^[a-z0-9][a-z0-9._:-]{0,119}$/i.test(request.owner ?? '')) stop('owner_invalid');
  authority(request, 'reserve-id', { kind: request.kind, owner: request.owner, remote: request.remote ?? 'none' });
  return lock(root, `id-request:${request.request_id}`, () => {
    const file = journalFile(root, request.request_id);
    const fingerprint = digest({ kind: request.kind, owner: request.owner, remote: request.remote ?? null, public_base_ref: request.public_base_ref ?? null, start: request.start ?? 1 });
    let journal = readJson(file);
    if (journal && journal.fingerprint !== fingerprint) stop('request_reused');
    const ids = new Set(existingIds(root));
    for (let attempt = 0; attempt < 32; attempt++) {
      if (!journal?.candidate) {
        const start = request.start ?? 1;
        if (!Number.isSafeInteger(start) || start < 1) stop('number_invalid');
        const lines = request.remote
          ? git(root, ['ls-remote', '--refs', request.remote, `refs/heads/reservations/${prefix}-*`])
          : git(root, ['for-each-ref', '--format=%(refname)', `refs/exorail/reservations/${prefix}-*`]);
        const numbers = [...lines.matchAll(new RegExp(`${prefix}-(\\d+)(?:\\s|$)`, 'gm'))].map((m) => Number(m[1]));
        const canonical = [...ids].flatMap((id) => { const m = id.match(new RegExp(`^${prefix}-(\\d+)$`)); return m ? [Number(m[1])] : []; });
        const number = Math.max(start, ...numbers.map((n) => n + 1), ...canonical.map((n) => n + 1));
        if (!Number.isSafeInteger(number)) stop('number_exhausted');
        const id = `${prefix}-${String(number).padStart(4, '0')}`;
        const ref = `${request.remote ? 'refs/heads/reservations' : 'refs/exorail/reservations'}/${id}`;
        let base;
        if (request.remote) {
          if (!request.public_base_ref?.startsWith('refs/heads/')) stop('public_base_required');
          base = remoteValue(root, request.remote, request.public_base_ref);
          if (!base) stop('public_base_missing');
          git(root, ['fetch', '--no-tags', request.remote, base]);
        } else base = commit(root, 'HEAD');
        const token = randomUUID();
        const tree = git(root, ['rev-parse', `${base}^{tree}`]);
        // The claim adds no unpublished tree: its unique request identity is in the message.
        const claim = git(root, ['-c', 'user.name=Exorail Runtime', '-c', 'user.email=runtime@example.invalid', 'commit-tree', tree, '-p', base], `${JSON.stringify({ contract: 'git-id-claim@1', id, owner: request.owner, request_id: request.request_id, token })}\n`);
        journal = { fingerprint, candidate: { id, ref, claim, token }, state: 'prepared' };
        writeJson(file, journal);
      }
      const c = journal.candidate;
      const observe = () => request.remote ? remoteValue(root, request.remote, c.ref) : refValue(root, c.ref);
      let observed = observe();
      if (!observed) {
        const r = request.remote
          ? gitProcess(root, ['push', '--porcelain', `--force-with-lease=${c.ref}:`, request.remote, `${c.claim}:${c.ref}`])
          : gitProcess(root, ['update-ref', c.ref, c.claim, '0'.repeat(c.claim.length)]);
        // An uncertain operation must be reconciled against the actual ref, never guessed green.
        observed = observe();
        if (!observed) stop('claim_not_observed', `exit=${r.status} signal=${r.signal ?? 'none'}`);
        if ((r.error || r.signal || r.status !== 0) && observed === c.claim) {
          journal.state = 'observed_after_uncertain_operation'; writeJson(file, journal);
          stop('claim_recovery_required', c.id);
        }
      }
      if (observed === c.claim) {
        journal.state = 'claimed'; writeJson(file, journal);
        return { contract: 'git-id-allocation@1', id: c.id, ref: c.ref, claim_sha: c.claim, owner: request.owner,
          globally_reserved: Boolean(request.remote), retention_guaranteed: false,
          retention_owner: request.remote ? 'remote administrator; external retention/protection policy required' : 'local repository owner' };
      }
      journal = { fingerprint, candidate: null, state: 'lost_contention' }; writeJson(file, journal);
    }
    stop('reservation_contention_exhausted');
  });
}
export function allocateTaskId(root, request) {
  if (!/^US-[a-z0-9][a-z0-9-]*$/i.test(request.story_id ?? '')) stop('story_id_invalid');
  authority(request, 'allocate-task-id', { story_id: request.story_id, owner: request.owner, remote: request.remote ?? 'none' });
  return lock(root, `task-id:${request.story_id}`, () => {
    const ref = `refs/exorail/runtime/task-ids/${request.story_id}`;
    const old = request.remote ? remoteValue(root, request.remote, ref) : refValue(root, ref);
    if (old && request.remote) git(root, ['fetch', '--no-tags', request.remote, old]);
    const stem = `TASK-${request.story_id.replace(/^US-/, 'us').toLowerCase()}-`;
    const state = old ? documentAt(root, old) : { contract: 'git-task-ordinals@1', story_id: request.story_id, owner: request.owner, requests: {}, last: 0 };
    if (!request.owner || state.owner !== request.owner) stop('coordinator_mismatch');
    journalFile(root, request.request_id);
    if (state.requests[request.request_id]) return { contract: 'git-task-id@1', id: state.requests[request.request_id], story_id: request.story_id };
    const known = existingIds(root).filter((id) => id.startsWith(stem)).map((id) => Number(id.slice(stem.length))).filter(Number.isSafeInteger);
    const ordinal = Math.max(state.last, ...known, 0) + 1;
    const id = `${stem}${String(ordinal).padStart(2, '0')}`;
    state.last = ordinal; state.requests[request.request_id] = id;
    const next = runtimeCommit(root, state, old);
    if (request.remote) {
      const r = gitProcess(root, ['push', '--porcelain', `--force-with-lease=${ref}:${old ?? ''}`, request.remote, `${next}:${ref}`]);
      const observed = remoteValue(root, request.remote, ref);
      if (r.error || r.signal || r.status !== 0 || observed !== next) stop('task_allocation_recovery_required');
    } else git(root, ['update-ref', ref, next, old ?? '0'.repeat(next.length)]);
    return { contract: 'git-task-id@1', id, story_id: request.story_id, ordinal_ref: ref, globally_unique_if_story_id_unique: true };
  });
}
