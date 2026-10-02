import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { executionReceipts, openDecisionRequests, projectionNamesFor, validateForAdmission } from './schema-0.2.mjs';
import { classifyTaskGovernance, normalizedPatchIdentity, observedPaths } from './review-readiness.mjs';
import { deriveTaskReviewReadiness } from './task-review-readiness.mjs';
import { ancestor, authority, clean, commit, digest, git, gitProcess, journalFile, lock, refValue, stop } from './git-runtime-primitives.mjs';
import { boundStory, parentContext, readState, recordsAtWorkspace, saveState, taskPlanDigest } from './git-runtime-workspaces.mjs';

const fields = ['receipt_id', 'kind', 'work_id', 'attempt', 'reviewed_sha', 'patch_id', 'plan_revision', 'authority_ref', 'recorded_at_utc', 'integration_commit'];
export function projections(root, check = false) {
  const r = spawnSync(process.execPath, [path.join(root, '.exorail/tools/generate-projections.mjs'), '--repository-root', root, ...(check ? ['--check'] : [])], { cwd: root, encoding: 'utf8', timeout: 30_000 });
  if (r.error || r.signal || r.status !== 0) stop('projection_failed', r.stderr || String(r.error));
}
export function appendReceipt(root, story, receipt) {
  const parsed = executionReceipts(story.body); if (parsed.invalid) stop('receipt_invalid');
  if (parsed.items.some((r) => r.kind === receipt.kind && r.work_id === receipt.work_id && Number(r.attempt) === Number(receipt.attempt) && Number(r.plan_revision) === Number(receipt.plan_revision))) stop('receipt_duplicate');
  const previousTime = parsed.items.at(-1)?.recorded_at_utc;
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const row = { ...receipt, receipt_id: `ER-${String(parsed.items.length + 1).padStart(4, '0')}`, recorded_at_utc: previousTime && previousTime > now ? previousTime : now };
  const rows = [...parsed.items, row];
  const section = `## Execution receipts\n\n| ${fields.join(' | ')} |\n| ${fields.map(() => '---').join(' | ')} |\n${rows.map((r) => `| ${fields.map((f) => r[f]).join(' | ')} |`).join('\n')}\n\n`;
  const text = readFileSync(story.file, 'utf8');
  const pattern = /^## Execution receipts\s*\r?\n[\s\S]*?(?=^##\s|(?![\s\S]))/m;
  writeFileSync(story.file, pattern.test(text) ? text.replace(pattern, section) : `${text.trimEnd()}\n\n${section}`, 'utf8');
  return row;
}
function admissionExceptTerminalStory(root, story) {
  // A Task branch may finish the last active child before the coordinator records the
  // already-supported blocked-Story/whole-review route in the merge candidate.
  const tasks = recordsAtWorkspace(root).filter((r) => r.type === 'task' && r.data.parent === story.data.id);
  const terminal = tasks.length && tasks.every((r) => ['completed', 'superseded'].includes(r.data.status));
  const blocking = validateForAdmission(root).filter((f) => !(
    (f.id === 'AG301' && f.message.includes(`${story.relative}; field: child Task statuses;`)) ||
    (terminal && f.id === 'AG604' && f.message.endsWith(`(${story.relative})`))));
  if (blocking.length) stop('workflow_invalid', blocking.map((f) => f.message).join('\n'));
}
function holdTerminalStory(root, story) {
  const tasks = recordsAtWorkspace(root).filter((r) => r.type === 'task' && r.data.parent === story.data.id && r.data.status !== 'superseded');
  if (['ready', 'active'].includes(story.data.status) && !tasks.some((r) => ['ready', 'active', 'blocked'].includes(r.data.status))) {
    let text = readFileSync(story.file, 'utf8').replace(/^status: (?:ready|active)$/m, 'status: blocked');
    if (!/^## Decision record$/m.test(text)) text += '\n## Decision record\n\n- blocker: Task execution is finished; whole-Story review or dependent Task refinement is pending.\n- next action: The coordinator checks the aggregate and the owner reviews it, or refines the next eligible Task.\n- resume when: The next executable Task is ready or the owner accepts the complete Story.\n';
    writeFileSync(story.file, text, 'utf8');
  }
}
export function taskReview(root, request, action = 'review-task') {
  const context = boundStory(root, request, action); const { s } = context; const t = s.tasks[request.task_id];
  if (!t) stop('task_binding_missing');
  if (!existsSync(t.path)) stop('task_worktree_missing'); clean(t.path);
  const head = commit(t.path, 'HEAD');
  if (refValue(root, t.ref) !== head || (request.reviewed_sha && request.reviewed_sha !== head)) stop('reviewed_tip_moved');
  if (!ancestor(root, t.base, head)) stop('base_not_ancestor');
  const records = recordsAtWorkspace(t.path); const task = records.find((r) => r.type === 'task' && r.data.id === t.id); const story = records.find((r) => r.type === 'user_story' && r.data.id === s.id);
  if (!task || !story || taskPlanDigest(task) !== t.scope_digest) stop('task_plan_stale');
  const currentTask = context.records.find((r) => r.type === 'task' && r.data.id === t.id);
  if (!currentTask || taskPlanDigest(currentTask) !== t.scope_digest) stop('task_plan_stale');
  if (task.data.status !== 'completed') stop('task_not_completed');
  const results = records.filter((r) => r.type === 'task_result' && r.data.parent === t.id && r.data.based_on_plan_revision === s.plan_revision);
  if (results.length !== 1) stop('result_missing');
  const result = results[0]; const run = records.find((r) => r.type === 'execution_run' && r.data.id === result.data.execution_run_id && r.data.work_id === t.id && r.data.attempt === t.attempt);
  if (!run || run.data.governance_input_digest !== t.governance_input_digest || run.data.status !== 'terminal' || run.data.terminal_outcome !== 'result_candidate' || run.data.result_id !== result.data.id) stop('run_result_binding_invalid');
  admissionExceptTerminalStory(t.path, story); projections(t.path, true);
  if (openDecisionRequests(task.body).length || openDecisionRequests(story.body).length || openDecisionRequests(context.story.body).length) stop('decision_open');
  // Strict process observation precedes the shared scope/patch derivations, whose
  // historical APIs otherwise return an empty observation on a failed Git diff.
  git(t.path, ['diff', '--name-status', t.base, head]); git(t.path, ['diff', '--binary', t.base, head]);
  const changes = observedPaths(t.path, t.base, head); const classified = classifyTaskGovernance(changes, records, [task]);
  if (classified.scope_findings.length) stop('scope_escape', classified.scope_findings.join(','));
  const allowed = new Set(records.filter((r) => r.data.id === t.id || (['task_result', 'task_contract'].includes(r.type) && r.data.parent === t.id) || (r.type === 'execution_run' && r.data.work_id === t.id)).map((r) => `.exorail/${r.relative.replaceAll('\\', '/')}`));
  if (classified.governance_paths.some((p) => !allowed.has(p.path))) stop('shared_governance_modified');
  const patch = normalizedPatchIdentity(t.path, t.base, head) ?? head;
  if (request.patch_id && request.patch_id !== patch) stop('patch_mismatch');
  return { ...context, t, task, result, report: { contract: 'git-task-premerge-review@1', technical_ready: true, task_id: t.id, base_sha: t.base, reviewed_sha: head, patch_id: patch, plan_revision: s.plan_revision, observed_paths: changes } };
}
export function reviewTask(root, request) { return taskReview(root, request).report; }
function receiptFor(s, t, report, kind, authorityRef, integration = 'none') { return { kind, work_id: t.id, attempt: t.attempt, reviewed_sha: report.reviewed_sha, patch_id: report.patch_id, plan_revision: s.plan_revision, authority_ref: authorityRef, integration_commit: integration }; }
export function commitGovernance(root, story, message) {
  projections(root); const generated = projectionNamesFor(root).map((n) => `.exorail/projections/${n}`);
  git(root, ['add', '--', `.exorail/${story.relative.replaceAll('\\', '/')}`, ...generated]);
  const blocking = validateForAdmission(root); if (blocking.length) stop('candidate_invalid', blocking.map((f) => f.message).join('\n'));
  git(root, ['commit', '-m', message]); return commit(root, 'HEAD');
}
export function syncPublishedWorkspace(root, s, old, next) {
  if (refValue(root, s.ref) !== next) stop('story_head_stale');
  const index = git(s.path, ['write-tree']); const oldTree = git(root, ['rev-parse', `${old}^{tree}`]); const nextTree = git(root, ['rev-parse', `${next}^{tree}`]);
  if (index === nextTree) { clean(s.path); return; }
  if (index !== oldTree || git(s.path, ['diff-files', '--name-only']) || git(s.path, ['ls-files', '--others', '--exclude-standard'])) stop('workspace_recovery_conflict');
  // Two-tree checkout refuses to overwrite unrelated edits; never use reset --hard.
  git(s.path, ['read-tree', '-u', '-m', old, next]); clean(s.path);
}
export function acceptTask(root, request) {
  return lock(root, 'runtime-state', () => {
    const { sha, state, s, t, report } = taskReview(root, request, 'accept-task');
    authority(request, 'accept-task', { task_id: t.id, reviewed_sha: report.reviewed_sha });
    if (s.tasks[t.id].state === 'integrated') stop('task_already_integrated');
    clean(s.path); const old = commit(s.path, 'HEAD'); if (request.expected_story_sha !== old) stop('story_head_stale');
    const story = recordsAtWorkspace(s.path).find((r) => r.data.id === s.id);
    const prior = executionReceipts(story.body).items.find((r) => r.kind === 'task_acceptance' && r.work_id === t.id && Number(r.attempt) === t.attempt && Number(r.plan_revision) === s.plan_revision);
    if (prior) { if (prior.reviewed_sha !== report.reviewed_sha || prior.patch_id !== report.patch_id) stop('acceptance_stale'); return { contract: 'git-task-acceptance@1', recorded: true, story_sha: old }; }
    if (story.data.review_boundary !== 'task') stop('acceptance_boundary_story', 'accept the aggregate at Story boundary');
    appendReceipt(s.path, story, receiptFor(s, t, report, 'task_acceptance', request.authority.reference));
    const next = commitGovernance(s.path, story, `Exorail human Task acceptance ${t.id}`);
    t.acceptance_sha = next; saveState(root, sha, state, [{ ref: s.ref, old, next }]);
    return { contract: 'git-task-acceptance@1', recorded: true, task_id: t.id, story_sha: next, grants_story_acceptance: false };
  });
}
function prepareInside(root, request) {
  journalFile(root, request.request_id);
  const fingerprint = digest({ story_id: request.story_id, task_id: request.task_id, reviewed_sha: request.reviewed_sha, patch_id: request.patch_id, expected_story_sha: request.expected_story_sha });
  let context = boundStory(root, request, 'integrate-task');
  const existing = context.state.operations[request.request_id];
  if (existing) {
    if (existing.fingerprint !== fingerprint) stop('request_reused');
    if (['prepared', 'published', 'done'].includes(existing.state)) return { ...context, operation: existing };
    if (existing.state !== 'preparing' || (existing.recoveries ?? 0) >= 3) stop('integration_inspection_required', existing.path);
    // Rebuild from the exact reviewed source and original destination. Never
    // reuse a partially merged or manually resolved candidate; retain it intact.
  }
  context = taskReview(root, request, 'integrate-task'); const { sha, state, s, t, report } = context;
  if (!request.reviewed_sha || !request.patch_id) stop('review_identity_required');
  clean(s.path); const old = commit(s.path, 'HEAD'); if (old !== request.expected_story_sha) stop('story_head_stale');
  const parsed = executionReceipts(context.story.body); if (parsed.invalid) stop('receipt_invalid');
  if (context.story.data.review_boundary === 'task' && !parsed.items.some((r) => r.kind === 'task_acceptance' && r.work_id === t.id && r.reviewed_sha === report.reviewed_sha && r.patch_id === report.patch_id && Number(r.plan_revision) === s.plan_revision && Number(r.attempt) === t.attempt)) stop('task_acceptance_missing');
  const recoveries = existing ? (existing.recoveries ?? 0) + 1 : 0;
  const candidate_key = recoveries ? `${request.request_id}:${recoveries}` : request.request_id;
  const operation = { fingerprint, story_id: s.id, task_id: t.id, old, reviewed_sha: report.reviewed_sha, patch_id: report.patch_id, recoveries, candidate_key,
    retained_candidates: existing ? [...(existing.retained_candidates ?? []), existing.candidate_key ?? request.request_id] : [],
    path: path.join(s.worktree_root, `i-${digest(candidate_key).slice(0, 12)}`), state: 'preparing' };
  if (existsSync(operation.path)) stop('candidate_path_collision');
  state.operations[request.request_id] = operation; saveState(root, sha, state);
  git(root, ['worktree', 'add', '--detach', operation.path, old]);
  const merged = gitProcess(operation.path, ['merge', '--no-ff', '--no-commit', report.reviewed_sha]);
  if (merged.error || merged.signal || ![0, 1].includes(merged.status)) stop('merge_failed', operation.path);
  const conflicts = git(operation.path, ['diff', '--name-only', '--diff-filter=U', '-z']).split('\0').filter(Boolean);
  const generated = new Set(projectionNamesFor(operation.path).map((n) => `.exorail/projections/${n}`));
  if (conflicts.some((p) => !generated.has(p))) stop('merge_conflict', `${operation.path}: ${conflicts.join(',')}`);
  projections(operation.path); git(operation.path, ['add', '--', ...generated]);
  git(operation.path, ['commit', '-m', `Exorail integrate reviewed Task ${t.id}`]);
  const integration = commit(operation.path, 'HEAD');
  if (!ancestor(root, report.reviewed_sha, integration)) stop('reviewed_ancestry_missing');
  const resultPath = `.exorail/${context.result.relative.replaceAll('\\', '/')}`;
  if (git(root, ['rev-parse', `${integration}:${resultPath}`]) !== git(root, ['rev-parse', `${report.reviewed_sha}:${resultPath}`])) stop('result_changed_in_merge');
  const candidateStory = recordsAtWorkspace(operation.path).find((r) => r.data.id === s.id);
  holdTerminalStory(operation.path, candidateStory);
  appendReceipt(operation.path, candidateStory, receiptFor(s, t, report, 'task_integration', request.authority.reference, integration));
  const next = commitGovernance(operation.path, candidateStory, `Exorail integration receipt ${t.id}`);
  const verified = deriveTaskReviewReadiness(operation.path, t.id, t.base, next);
  if (!verified.technical_ready) stop('integration_not_verified', verified.reasons.join(','));
  const latest = readState(root); operation.state = 'prepared'; operation.integration_commit = integration; operation.next = next;
  latest.state.operations[request.request_id] = operation; saveState(root, latest.sha, latest.state);
  return { ...latest, s: latest.state.stories[s.id], operation };
}
export function prepareTaskIntegration(root, request) { return lock(root, 'runtime-state', () => { const { operation } = prepareInside(root, request); return { contract: 'git-integration-candidate@1', prepared: true, accepted: false, ...operation }; }); }
export function integrateTask(root, request) {
  return lock(root, 'runtime-state', () => {
    let { s, operation } = prepareInside(root, request);
    if (operation.state === 'prepared') {
      taskReview(root, request, 'integrate-task');
      clean(s.path); if (commit(s.path, 'HEAD') !== operation.old) stop('story_head_stale');
      if (refValue(root, s.tasks[request.task_id].ref) !== operation.reviewed_sha) stop('reviewed_tip_moved');
      const latest = readState(root); operation.state = 'published'; latest.state.operations[request.request_id] = operation;
      saveState(root, latest.sha, latest.state, [{ ref: s.ref, old: operation.old, next: operation.next }]);
    }
    const current = commit(s.path, 'HEAD');
    if (operation.state === 'done' && ancestor(root, operation.next, current)) clean(s.path);
    else syncPublishedWorkspace(root, s, operation.old, operation.next);
    const observed = deriveTaskReviewReadiness(s.path, request.task_id, s.tasks[request.task_id].base, commit(s.path, 'HEAD'));
    if (!observed.technical_ready) stop('integration_not_verified', observed.reasons.join(','));
    const latest = readState(root); latest.state.stories[s.id].tasks[request.task_id].state = 'integrated';
    latest.state.operations[request.request_id].state = 'done'; saveState(root, latest.sha, latest.state);
    return { contract: 'git-task-integration@1', integrated: true, task_id: request.task_id, reviewed_sha: operation.reviewed_sha, integration_commit: operation.integration_commit, story_sha: operation.next, human_story_accepted: false, ...parentContext(root, s.ref, s.path) };
  });
}
