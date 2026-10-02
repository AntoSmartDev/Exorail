import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { collect, deriveExecutableFrontier, deriveGovernanceInputDigest, evaluateTaskAdmission } from './schema-0.2.mjs';
import { ancestor, authority, clean, commit, digest, documentAt, git, gitProcess, journalFile, localDirectory, lock, readJson, refValue, remoteValue, runtimeCommit, stop, validRef, writeJson } from './git-runtime-primitives.mjs';
import { crossStoryAdmission } from './git-runtime-admission.mjs';

export const stateRef = 'refs/exorail/runtime/state';
export const deployment = (root) => readJson(path.join(localDirectory(root), 'shared.json'));
export const tokenFile = (root, storyId) => path.join(localDirectory(root), `owner-${digest(storyId)}.json`);
function portableState(state) {
  const portable = structuredClone(state);
  for (const s of Object.values(portable.stories)) { delete s.path; delete s.worktree_root; for (const t of Object.values(s.tasks)) delete t.path; }
  for (const o of Object.values(portable.operations)) delete o.path;
  return portable;
}
function hydrate(state, config) {
  if (!config) return state;
  for (const s of Object.values(state.stories)) {
    s.worktree_root = config.worktree_root; s.path = path.join(config.worktree_root, `s-${digest(s.id).slice(0, 12)}`);
    for (const t of Object.values(s.tasks)) t.path = path.join(config.worktree_root, `t-${digest(t.id).slice(0, 12)}-${t.attempt}`);
  }
  for (const [id, o] of Object.entries(state.operations)) o.path = path.join(config.worktree_root, `i-${digest(o.candidate_key ?? id).slice(0, 12)}`);
  return state;
}
export function readState(root) {
  const config = deployment(root);
  const sha = config ? remoteValue(root, config.remote, stateRef) : refValue(root, stateRef);
  if (sha && config) git(root, ['fetch', '--no-tags', config.remote, sha]);
  return { sha, state: hydrate(sha ? documentAt(root, sha) : { contract: 'git-runtime-state@1', stories: {}, operations: {}, targets: {} }, config) };
}
export function saveState(root, previous, state, updates = []) {
  const config = deployment(root);
  for (const update of updates) for (const s of Object.values(state.stories)) if (update.ref === s.ref) s.head_sha = update.next;
  const next = runtimeCommit(root, config ? portableState(state) : state, previous);
  const zero = '0'.repeat(next.length);
  if (config) {
    if (!config.authority?.actions.includes('publish-runtime')) stop('remote_authority_missing');
    for (const u of updates) {
      if (!config.authority.actions.includes('publish-target') || !config.allowed_refs.some((prefix) => prefix.endsWith('/') ? u.ref.startsWith(prefix) : u.ref === prefix)) stop('remote_target_not_authorized', u.ref);
      if (u.old && !ancestor(root, u.old, u.next)) stop('history_rewrite_refused', u.ref);
    }
    const transaction = path.join(localDirectory(root), `transaction-${next}.json`);
    writeJson(transaction, { previous, next, updates, state: 'prepared' });
    const r = gitProcess(root, ['push', '--atomic', '--porcelain', `--force-with-lease=${stateRef}:${previous ?? ''}`, ...updates.map((u) => `--force-with-lease=${u.ref}:${u.old ?? ''}`), config.remote, `${next}:${stateRef}`, ...updates.map((u) => `${u.next}:${u.ref}`)]);
    const observed = remoteValue(root, config.remote, stateRef);
    if (r.error || r.signal || r.status !== 0 || observed !== next) stop('remote_transaction_refused', `exit=${r.status}; inspect ${transaction}; no forced retry`);
    writeJson(transaction, { previous, next, updates, state: 'remote_observed' });
  }
  const localPrevious = refValue(root, stateRef);
  const localUpdates = updates.filter((u) => refValue(root, u.ref) !== u.next);
  git(root, ['update-ref', '--stdin'], `start\n${localUpdates.map((u) => `update ${u.ref} ${u.next} ${u.old ?? zero}\n`).join('')}update ${stateRef} ${next} ${config ? (localPrevious ?? zero) : (previous ?? zero)}\nprepare\ncommit\n`);
  return next;
}
export function connectShared(root, request) {
  authority(request, 'connect-shared', { remote: request.remote, worktree_root: request.worktree_root });
  authority(request, 'publish-runtime', { remote: request.remote, worktree_root: request.worktree_root });
  if (!Array.isArray(request.allowed_refs) || !request.allowed_refs.length) stop('remote_ref_scope_required');
  for (const ref of request.allowed_refs) validRef(root, ref.endsWith('/') ? `${ref}scope-probe` : ref);
  const directory = safeWorkspaceRoot(root, request.worktree_root);
  clean(root);
  const existing = deployment(root);
  if (existing && (existing.remote !== request.remote || existing.worktree_root !== directory)) stop('shared_binding_mismatch');
  const remoteSha = remoteValue(root, request.remote, stateRef); const localSha = refValue(root, stateRef);
  if (localSha && !existing && remoteSha !== localSha) stop('local_state_requires_reconciliation');
  const config = { remote: request.remote, worktree_root: directory, allowed_refs: request.allowed_refs, authority: request.authority };
  writeJson(path.join(localDirectory(root), 'shared.json'), config);
  if (!remoteSha) {
    try { saveState(root, null, { contract: 'git-runtime-state@1', stories: {}, operations: {}, targets: {} }); }
    catch (error) { writeJson(path.join(localDirectory(root), 'shared.json'), null); throw error; }
  } else {
    // An actual changed journal tests atomic support even when the remote already exists.
    const snapshot = readState(root); saveState(root, snapshot.sha, snapshot.state);
  }
  return { contract: 'git-shared-connection@1', shared: true, remote: request.remote, atomic_required: true };
}
export function recordsAtWorkspace(root) {
  const findings = []; const records = collect(root, findings);
  if (findings.some((f) => f.severity === 'ERROR')) stop('canonical_input_invalid'); return records;
}
export function taskPlanDigest(task) {
  const { status, created_at_utc, updated_at_utc, ...plan } = task.data;
  const sections = ['Intent', 'Expected outcome', 'Acceptance', 'Quality gate', 'Contract requirement'].map((h) => task.body.match(new RegExp(`^## ${h}\\s*\\r?\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, 'm'))?.[1]?.trim() ?? '');
  return digest({ plan, sections });
}
export function worktrees(root) {
  return git(root, ['worktree', 'list', '--porcelain']).split(/\r?\n\r?\n/).filter(Boolean).map((block) => {
    const rows = block.split(/\r?\n/); return Object.fromEntries(rows.map((r) => { const i = r.indexOf(' '); return i < 0 ? [r, true] : [r.slice(0, i), r.slice(i + 1)]; }));
  });
}
function safeWorkspaceRoot(root, requested) {
  if (typeof requested !== 'string' || !path.isAbsolute(requested)) stop('worktree_root_required');
  const resolved = path.resolve(requested); const repo = realpathSync(root);
  const relation = path.relative(repo, resolved);
  if (!relation || (!relation.startsWith('..') && !path.isAbsolute(relation))) stop('worktree_root_inside_repository');
  // Existing symlinks/junctions are not silently followed into another owner's checkout.
  for (let p = resolved; p !== path.dirname(p); p = path.dirname(p)) if (existsSync(p) && lstatSync(p).isSymbolicLink()) stop('worktree_root_symlink');
  return resolved;
}
export function materialize(root, binding) {
  const listed = worktrees(root);
  const byPath = listed.find((w) => path.resolve(w.worktree) === path.resolve(binding.path));
  const byBranch = listed.find((w) => w.branch === binding.ref);
  const currentRef = refValue(root, binding.ref);
  if (byPath) {
    if (byPath.branch !== binding.ref || byBranch?.worktree !== byPath.worktree) stop('worktree_collision', binding.path);
    clean(binding.path); if (commit(binding.path, 'HEAD') !== currentRef) stop('worktree_head_mismatch');
    if (!currentRef) stop('binding_ref_missing'); return;
  }
  if (byBranch || existsSync(binding.path)) stop('worktree_collision', binding.path);
  if (currentRef !== binding.base) stop('branch_collision', binding.ref);
  git(root, ['worktree', 'add', binding.path, binding.ref.replace(/^refs\/heads\//, '')]);
  clean(binding.path); if (commit(binding.path, 'HEAD') !== binding.base) stop('worktree_head_mismatch');
}
export function parentWorkspace(root, ref, directory) {
  const existing = worktrees(root).find((w) => w.branch === ref);
  const destination = path.resolve(existing?.worktree ?? path.join(directory, `p-${digest(ref).slice(0, 12)}`));
  materialize(root, { ref, path: destination, base: commit(root, ref) });
  return destination;
}
export function parentContext(root, ref, workspace) {
  clean(workspace);
  if (git(workspace, ['symbolic-ref', 'HEAD']) !== ref || commit(workspace, 'HEAD') !== commit(root, ref)) stop('parent_context_mismatch');
  return { active_workspace: workspace, active_branch: ref, active_sha: commit(workspace, 'HEAD'), caller_navigation_required: true };
}
export function boundStory(root, request, action) {
  const snapshot = readState(root); const s = snapshot.state.stories[request.story_id];
  if (!s) stop('story_binding_missing');
  authority(request, action, { story_id: s.id, owner: s.owner, plan_revision: s.plan_revision, target_ref: s.target_ref, base_sha: s.base });
  if (request.owner !== s.owner) stop('coordinator_mismatch');
  if (deployment(root)) {
    if (readJson(tokenFile(root, s.id))?.token !== s.token) stop('coordinator_token_stale');
    if (remoteValue(root, deployment(root).remote, s.ref) !== refValue(root, s.ref)) stop('story_remote_diverged');
  }
  const records = recordsAtWorkspace(s.path); const story = records.find((r) => r.data.id === s.id && r.type === 'user_story');
  if (!story || story.data.plan_revision !== s.plan_revision) stop('plan_revision_stale');
  return { ...snapshot, s, story, records };
}
function startWaveInside(root, request) {
  const { sha, state, s, records } = boundStory(root, request, 'start-wave');
  clean(s.path); const head = commit(s.path, 'HEAD');
  if (request.expected_story_sha !== head) stop('story_head_stale');
  const frontier = deriveExecutableFrontier(s.path, s.id);
  const candidates = frontier.eligible.filter((id) => !Object.values(s.tasks).some((t) => t.id === id));
  const bindings = [];
  crossStoryAdmission(root, state, records, s, candidates.map((id) => records.find((r) => r.data.id === id)));
  for (const id of candidates) {
    const task = records.find((r) => r.data.id === id);
    const admitted = evaluateTaskAdmission(s.path, id, 'initial');
    if (!admitted.admitted) stop('task_not_admitted', `${id}: ${admitted.reasons.join(',')}`);
    const ref = validRef(root, `refs/heads/task/${id}/attempt-1`);
    if (refValue(root, ref)) stop('branch_collision', ref);
    const binding = { id, title: task.data.title, ref, base: head, attempt: 1, owner: s.owner,
      plan_revision: s.plan_revision, scope_digest: taskPlanDigest(task), scope: task.data, governance_input_digest: deriveGovernanceInputDigest(s.path, id), path: path.join(s.worktree_root, `t-${digest(id).slice(0, 12)}-1`), state: 'prepared' };
    if (existsSync(binding.path)) stop('worktree_collision', binding.path);
    s.tasks[id] = binding; bindings.push(binding);
  }
  saveState(root, sha, state, bindings.map((b) => ({ ref: b.ref, next: head, old: null })));
  // Bindings/ref creation is recorded before worktree creation so a partial start is resumable.
  for (const binding of Object.values(s.tasks).filter((t) => t.state === 'prepared')) materialize(root, binding);
  return { contract: 'git-wave-start@1', story_id: s.id, story_sha: head, prepared: bindings.map((b) => ({ task_id: b.id, branch: b.ref, worktree: b.path, base_sha: b.base })), blocked: frontier.blocked };
}
export function startWave(root, request) { return lock(root, 'runtime-state', () => startWaveInside(root, request)); }
export function startStory(root, request) {
  return lock(root, 'runtime-state', () => {
    if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(request.slug ?? '')) stop('slug_invalid');
    if (!/^[a-z0-9][a-z0-9._:-]{0,119}$/i.test(request.owner ?? '')) stop('owner_invalid');
    const target = validRef(root, request.target_ref);
    if (!target.startsWith('refs/heads/')) stop('target_invalid');
    const base = commit(root, request.base_sha);
    authority(request, 'start-story', { story_id: request.story_id, owner: request.owner, plan_revision: request.plan_revision, target_ref: target, base_sha: base });
    authority(request, 'start-wave', { story_id: request.story_id, owner: request.owner, plan_revision: request.plan_revision, target_ref: target, base_sha: base });
    let { sha, state } = readState(root);
    let s = state.stories[request.story_id];
    if (!s) {
      clean(root);
      if (refValue(root, target) !== base) stop('target_base_stale');
      if (deployment(root) && remoteValue(root, deployment(root).remote, target) !== base) stop('target_remote_diverged');
      const directory = safeWorkspaceRoot(root, request.worktree_root);
      let planRoot = root;
      if (commit(root, 'HEAD') !== base) {
        planRoot = path.join(directory, `plan-${randomUUID()}`);
        git(root, ['worktree', 'add', '--detach', planRoot, base]);
      }
      const records = recordsAtWorkspace(planRoot); const story = records.find((r) => r.type === 'user_story' && r.data.id === request.story_id);
      if (!story || story.data.plan_revision !== request.plan_revision) stop('story_plan_unresolved');
      const frontier = deriveExecutableFrontier(planRoot, request.story_id);
      if (!frontier.eligible.length) stop('wave_empty', JSON.stringify(frontier.blocked));
      const ref = validRef(root, `refs/heads/story/${story.data.parent}/${story.data.id}-${request.slug}`);
      if (refValue(root, ref)) stop('branch_collision', ref);
      if (deployment(root) && deployment(root).worktree_root !== directory) stop('shared_worktree_root_mismatch');
      s = { id: story.data.id, title: story.data.title, feature_id: story.data.parent, owner: request.owner, plan_revision: request.plan_revision,
        ref, base, head_sha: base, target_ref: target, delivery_target_ref: state.targets?.[target]?.project_target_ref ?? target, story_path: `.exorail/${story.relative.replaceAll('\\', '/')}`,
        token: randomUUID(), path: path.join(directory, `s-${digest(story.data.id).slice(0, 12)}`), worktree_root: directory, tasks: {}, authority_ref: request.authority.reference };
      crossStoryAdmission(root, state, records, s, frontier.eligible.map((id) => records.find((r) => r.data.id === id)));
      if (existsSync(s.path)) stop('worktree_collision', s.path);
      state.stories[s.id] = s;
      saveState(root, sha, state, [{ ref, next: base, old: null }]);
      writeJson(tokenFile(root, s.id), { token: s.token });
    } else if (s.base !== base || s.owner !== request.owner || s.plan_revision !== request.plan_revision || s.target_ref !== target || s.authority_ref !== request.authority.reference || s.worktree_root !== path.resolve(request.worktree_root)) stop('story_binding_mismatch');
    materialize(root, { ...s, base: s.base });
    const result = startWaveInside(root, { ...request, expected_story_sha: commit(s.path, 'HEAD') });
    return { ...result, contract: 'git-story-start@1', story_branch: s.ref, story_worktree: s.path, target_ref: s.target_ref };
  });
}
export function observeRuntime(root) {
  const { sha, state } = readState(root); const listed = worktrees(root);
  return { contract: 'git-runtime-observation@1', state_sha: sha ?? 'none', stories: Object.values(state.stories).map((s) => ({
    story_id: s.id, feature_id: s.feature_id, title: s.title, target_ref: s.target_ref, branch: s.ref, head_sha: refValue(root, s.ref), owner: s.owner,
    worktree: listed.find((w) => w.branch === s.ref)?.worktree ?? 'absent', tasks: Object.values(s.tasks).map((t) => ({ task_id: t.id, title: t.title, branch: t.ref, attempt: t.attempt, base_sha: t.base, head_sha: refValue(root, t.ref), state: t.state,
      worktree: listed.find((w) => w.branch === t.ref)?.worktree ?? 'absent', dirty: existsSync(t.path) ? Boolean(git(t.path, ['status', '--porcelain=v1'])) : null }))
  })) };
}
