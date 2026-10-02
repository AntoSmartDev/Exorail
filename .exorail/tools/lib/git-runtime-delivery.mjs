import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { executionReceipts, openDecisionRequests, projectionNamesFor, validateForAdmission } from './schema-0.2.mjs';
import { deriveTaskReviewReadiness } from './task-review-readiness.mjs';
import { normalizedPatchIdentity } from './review-readiness.mjs';
import { ancestor, authority, clean, commit, git, gitProcess, localDirectory, lock, readJson, refValue, remoteValue, stop, validRef, writeJson } from './git-runtime-primitives.mjs';
import { boundStory, deployment, materialize, parentContext, parentWorkspace, readState, recordsAtWorkspace, saveState, tokenFile, worktrees } from './git-runtime-workspaces.mjs';
import { appendReceipt, commitGovernance, projections, syncPublishedWorkspace } from './git-runtime-integration.mjs';

function mergeDelivery(root, source, target, directory, message) {
  const candidate = path.join(directory, `deliver-${randomUUID()}`); git(root, ['worktree', 'add', '--detach', candidate, target]);
  if (ancestor(root, source, target)) return { candidate, next: target };
  const merged = gitProcess(candidate, ['merge', '--no-ff', '--no-commit', source]);
  if (merged.error || merged.signal || ![0, 1].includes(merged.status)) stop('merge_failed', candidate);
  const generated = new Set(projectionNamesFor(candidate).map((n) => `.exorail/projections/${n}`));
  const conflicts = git(candidate, ['diff', '--name-only', '--diff-filter=U', '-z']).split('\0').filter(Boolean);
  if (conflicts.some((p) => !generated.has(p))) stop('delivery_conflict', `${candidate}: ${conflicts.join(',')}`);
  projections(candidate); git(candidate, ['add', '--', ...generated]); git(candidate, ['commit', '-m', message]);
  if (validateForAdmission(candidate).length) stop('delivery_not_verified');
  return { candidate, next: commit(candidate, 'HEAD') };
}

export function prepareTarget(root, request) {
  return lock(root, 'runtime-state', () => {
    const target = validRef(root, request.target_ref); const project = validRef(root, request.project_target_ref);
    if (!target.startsWith('refs/heads/feature/') || !project.startsWith('refs/heads/') || target === project) stop('feature_target_invalid');
    const base = commit(root, request.base_sha);
    authority(request, 'prepare-target', { target_ref: target, project_target_ref: project, base_sha: base });
    clean(root); if (refValue(root, project) !== base) stop('target_base_stale');
    const snapshot = readState(root); snapshot.state.targets ??= {};
    if (snapshot.state.targets[target]) {
      if (snapshot.state.targets[target].project_target_ref !== project || snapshot.state.targets[target].base !== base) stop('target_binding_mismatch');
      return { target_ref: target, prepared: true };
    }
    if (refValue(root, target)) stop('branch_collision');
    snapshot.state.targets[target] = { project_target_ref: project, base, feature_id: request.feature_id };
    saveState(root, snapshot.sha, snapshot.state, [{ ref: target, old: null, next: base }]);
    return { contract: 'git-feature-target@1', target_ref: target, project_target_ref: project, prepared: true };
  });
}
export function recoverStory(root, request) {
  return lock(root, 'runtime-state', () => {
    const snapshot = readState(root); const s = snapshot.state.stories[request.story_id]; const config = deployment(root);
    if (!s || !config) stop('shared_binding_required');
    authority(request, 'takeover-story', { story_id: s.id, previous_owner: s.owner, owner: request.owner, plan_revision: s.plan_revision, target_ref: s.target_ref, base_sha: s.base });
    if (!request.owner || Object.values(snapshot.state.operations).some((o) => o.story_id === s.id && o.state !== 'done')) stop('takeover_inspection_required', 'unfinished integration must be reconciled by its current owner');
    const updates = [];
    for (const b of [s, ...Object.values(s.tasks)]) {
      const sha = remoteValue(root, config.remote, b.ref); if (!sha) stop('remote_binding_missing', b.ref);
      git(root, ['fetch', '--no-tags', config.remote, sha]); const local = refValue(root, b.ref);
      if (local && local !== sha) stop('local_binding_diverged', b.ref);
      if (!local) updates.push({ ref: b.ref, sha });
    }
    // No local ref or worktree is overwritten. Dirty/colliding destinations stop takeover.
    const listed = worktrees(root);
    for (const b of [s, ...Object.values(s.tasks)]) {
      if (existsSync(b.path)) {
        const known = listed.find((w) => path.resolve(w.worktree) === path.resolve(b.path) && w.branch === b.ref);
        if (!known) stop('worktree_collision', b.path); clean(b.path);
      } else if (listed.some((w) => w.branch === b.ref)) stop('worktree_collision', b.ref);
    }
    s.owner = request.owner; s.token = randomUUID(); for (const t of Object.values(s.tasks)) t.owner = request.owner;
    saveState(root, snapshot.sha, snapshot.state);
    for (const u of updates) git(root, ['update-ref', u.ref, u.sha, '0'.repeat(u.sha.length)]);
    writeJson(tokenFile(root, s.id), { token: s.token });
    for (const b of [s, ...Object.values(s.tasks)]) materialize(root, { ...b, base: refValue(root, b.ref) });
    return { contract: 'git-story-recovery@1', story_id: s.id, owner: s.owner, story_sha: refValue(root, s.ref), recovered: true, untransferred_changes_recovered: false };
  });
}
export function publishTask(root, request) {
  return lock(root, 'runtime-state', () => {
    const { sha, state, s } = boundStory(root, request, 'publish-task'); const t = s.tasks[request.task_id]; const config = deployment(root);
    if (!t || !config) stop('shared_task_binding_required'); clean(t.path); const next = commit(t.path, 'HEAD');
    authority(request, 'publish-task', { task_id: t.id, reviewed_sha: next });
    if (request.reviewed_sha !== next) stop('reviewed_tip_moved'); const old = remoteValue(root, config.remote, t.ref);
    if (old) { git(root, ['fetch', '--no-tags', config.remote, old]); if (!ancestor(root, old, next)) stop('history_rewrite_refused'); }
    t.published_sha = next; saveState(root, sha, state, [{ ref: t.ref, old, next }]);
    return { contract: 'git-task-transfer@1', transferred: true, accepted: false, reviewed_sha: next };
  });
}
export function acceptStory(root, request) {
  return lock(root, 'runtime-state', () => {
    const { sha, state, s, story, records } = boundStory(root, request, 'accept-story'); clean(s.path);
    const reviewed = commit(s.path, 'HEAD');
    authority(request, 'accept-story', { reviewed_sha: reviewed });
    if (request.reviewed_sha !== reviewed || openDecisionRequests(story.body).length) stop('story_review_stale');
    const tasks = records.filter((r) => r.type === 'task' && r.data.parent === s.id && r.data.status !== 'superseded');
    if (!tasks.length || tasks.some((t) => t.data.status !== 'completed' || s.tasks[t.data.id]?.state !== 'integrated')) stop('story_work_incomplete');
    for (const t of tasks) {
      if (openDecisionRequests(t.body).length) stop('decision_open');
      const report = deriveTaskReviewReadiness(s.path, t.data.id, s.tasks[t.data.id].base, reviewed);
      if (!report.technical_ready) stop('story_task_not_verified', report.reasons.join(','));
    }
    const parsed = executionReceipts(story.body); if (parsed.invalid || parsed.items.some((r) => r.kind === 'story_acceptance' && Number(r.plan_revision) === s.plan_revision)) stop('story_acceptance_exists');
    const candidate = path.join(s.worktree_root, `accept-${randomUUID()}`); git(root, ['worktree', 'add', '--detach', candidate, reviewed]);
    let cs = recordsAtWorkspace(candidate).find((r) => r.data.id === s.id);
    if (story.data.review_boundary === 'story') for (const t of tasks) {
      const integration = parsed.items.find((r) => r.kind === 'task_integration' && r.work_id === t.data.id && Number(r.plan_revision) === s.plan_revision);
      if (!integration) stop('integration_receipt_missing');
      appendReceipt(candidate, cs, { ...integration, kind: 'task_acceptance', authority_ref: request.authority.reference });
      cs = recordsAtWorkspace(candidate).find((r) => r.data.id === s.id);
    }
    appendReceipt(candidate, cs, { kind: 'story_acceptance', work_id: s.id, attempt: 1, reviewed_sha: reviewed, patch_id: normalizedPatchIdentity(s.path, s.base, reviewed) ?? reviewed,
      plan_revision: s.plan_revision, authority_ref: request.authority.reference, integration_commit: 'none' });
    writeFileSync(cs.file, readFileSync(cs.file, 'utf8').replace(/^status: \w+$/m, 'status: completed'), 'utf8');
    const next = commitGovernance(candidate, cs, `Exorail human Story acceptance ${s.id}`);
    s.accepted_sha = reviewed; s.acceptance_commit = next;
    saveState(root, sha, state, [{ ref: s.ref, old: reviewed, next }]); syncPublishedWorkspace(root, s, reviewed, next);
    return { contract: 'git-story-acceptance@1', accepted: true, reviewed_sha: reviewed, acceptance_commit: next, delivered: false };
  });
}
export function deliverStory(root, request) {
  return lock(root, 'runtime-state', () => {
    const { sha, state, s, story } = boundStory(root, request, 'deliver-story'); clean(s.path);
    const source = commit(s.path, 'HEAD'); const target = commit(root, s.target_ref);
    authority(request, 'deliver-story', { reviewed_sha: source, expected_target_sha: target });
    if (request.reviewed_sha !== source || request.expected_target_sha !== target) stop('delivery_identity_stale');
    const receipt = executionReceipts(story.body).items.find((r) => r.kind === 'story_acceptance' && r.work_id === s.id && Number(r.plan_revision) === s.plan_revision);
    if (story.data.status !== 'completed' || !receipt || !ancestor(root, receipt.reviewed_sha, source)) stop('story_not_accepted');
    if (source !== s.acceptance_commit || receipt.reviewed_sha !== s.accepted_sha) stop('accepted_tip_moved');
    if (s.delivered_sha && ancestor(root, source, target)) return { delivered: true, target_sha: target, ...parentContext(root, s.target_ref, parentWorkspace(root, s.target_ref, s.worktree_root)) };
    const config = deployment(root);
    if (config && remoteValue(root, config.remote, s.target_ref) !== target) stop('target_remote_diverged');
    const destination = parentWorkspace(root, s.target_ref, s.worktree_root);
    const { candidate, next } = mergeDelivery(root, source, target, s.worktree_root, `Exorail deliver accepted Story ${s.id}`);
    if (!ancestor(root, receipt.reviewed_sha, next) || validateForAdmission(candidate).length) stop('delivery_not_verified');
    for (const other of Object.values(state.stories).filter((o) => o.target_ref === s.target_ref && o.delivered_sha)) if (!ancestor(root, other.delivered_sha, next)) stop('prior_delivery_lost');
    s.delivered_sha = next;
    saveState(root, sha, state, [{ ref: s.target_ref, old: target, next }]);
    syncPublishedWorkspace(root, { ref: s.target_ref, path: destination }, target, next);
    return { contract: 'git-story-delivery@1', delivered: true, accepted_sha: receipt.reviewed_sha, target_ref: s.target_ref, target_sha: next, feature_delivered: false, ...parentContext(root, s.target_ref, destination) };
  });
}
export function deliverFeature(root, request) {
  return lock(root, 'runtime-state', () => {
    const snapshot = readState(root); const binding = snapshot.state.targets?.[request.target_ref];
    if (!binding || binding.feature_id !== request.feature_id) stop('feature_target_unbound');
    const source = commit(root, request.target_ref); const target = commit(root, binding.project_target_ref);
    if (!Object.values(snapshot.state.stories).some((s) => s.target_ref === request.target_ref && s.delivered_sha === source)) stop('feature_aggregate_tip_moved');
    authority(request, 'deliver-feature', { feature_id: binding.feature_id, target_ref: request.target_ref, project_target_ref: binding.project_target_ref, reviewed_sha: source, expected_target_sha: target });
    if (request.reviewed_sha !== source || request.expected_target_sha !== target) stop('delivery_identity_stale');
    const s = Object.values(snapshot.state.stories).find((x) => x.target_ref === request.target_ref); if (!s) stop('feature_stories_missing');
    const observation = path.join(s.worktree_root, `feature-${randomUUID()}`); git(root, ['worktree', 'add', '--detach', observation, source]);
    const records = recordsAtWorkspace(observation); const stories = records.filter((r) => r.type === 'user_story' && r.data.parent === request.feature_id && r.data.status !== 'superseded');
    if (!stories.length || validateForAdmission(observation).length) stop('feature_not_verified');
    for (const story of stories) {
      const receipt = executionReceipts(story.body).items.find((r) => r.kind === 'story_acceptance' && r.work_id === story.data.id && Number(r.plan_revision) === story.data.plan_revision);
      if (story.data.status !== 'completed' || !receipt || !ancestor(root, receipt.reviewed_sha, source)) stop('feature_story_not_delivered', story.data.id);
    }
    const config = deployment(root);
    if (config && (remoteValue(root, config.remote, request.target_ref) !== source || remoteValue(root, config.remote, binding.project_target_ref) !== target)) stop('target_remote_diverged');
    const destination = parentWorkspace(root, binding.project_target_ref, s.worktree_root);
    const { next } = mergeDelivery(root, source, target, s.worktree_root, `Exorail deliver accepted Feature ${request.feature_id}`);
    for (const story of stories) {
      const receipt = executionReceipts(story.body).items.find((r) => r.kind === 'story_acceptance' && Number(r.plan_revision) === story.data.plan_revision);
      if (!ancestor(root, receipt.reviewed_sha, next)) stop('feature_story_ancestry_missing');
    }
    binding.delivered_sha = next; saveState(root, snapshot.sha, snapshot.state, [{ ref: binding.project_target_ref, old: target, next }]);
    syncPublishedWorkspace(root, { ref: binding.project_target_ref, path: destination }, target, next);
    return { contract: 'git-feature-delivery@1', delivered: true, target_ref: binding.project_target_ref, target_sha: next, ...parentContext(root, binding.project_target_ref, destination) };
  });
}
export function reconcileTransaction(root, request) {
  return lock(root, 'runtime-state', () => {
    if (!/^[a-f0-9]{40,64}$/.test(request.state_sha ?? '')) stop('state_sha_invalid');
    authority(request, 'reconcile-transaction', { state_sha: request.state_sha });
    const config = deployment(root); if (!config) stop('shared_binding_required');
    const journal = readJson(path.join(localDirectory(root), `transaction-${request.state_sha}.json`));
    if (!journal || remoteValue(root, config.remote, 'refs/exorail/runtime/state') !== journal.next) stop('transaction_inspection_required');
    for (const u of journal.updates) {
      if (remoteValue(root, config.remote, u.ref) !== u.next) stop('transaction_remote_diverged');
      const local = refValue(root, u.ref); if (local !== u.old && local !== u.next) stop('transaction_local_diverged');
      const checkout = worktrees(root).find((w) => w.branch === u.ref);
      if (checkout && local === u.old) clean(checkout.worktree);
    }
    const previous = refValue(root, 'refs/exorail/runtime/state');
    git(root, ['update-ref', '--stdin'], `start\n${journal.updates.filter((u) => refValue(root, u.ref) !== u.next).map((u) => `update ${u.ref} ${u.next} ${u.old ?? '0'.repeat(u.next.length)}\n`).join('')}update refs/exorail/runtime/state ${journal.next} ${previous ?? '0'.repeat(journal.next.length)}\nprepare\ncommit\n`);
    for (const u of journal.updates) {
      const checkout = worktrees(root).find((w) => w.branch === u.ref); if (checkout && u.old) syncPublishedWorkspace(root, { ref: u.ref, path: checkout.worktree }, u.old, u.next);
    }
    return { contract: 'git-transaction-reconciliation@1', reconciled: true, state_sha: journal.next, accepted: false };
  });
}
