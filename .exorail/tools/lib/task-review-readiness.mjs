import { spawnSync } from 'node:child_process';
import { classifyTaskGovernance, normalizedPatchIdentity, observedPaths, reviewPrerequisites } from './review-readiness.mjs';
import { openDecisionRequests } from './schema-0.2.mjs';

const git = (root, args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
const resolveCommit = (root, value) => { const r = git(root, ['rev-parse', '--verify', `${value}^{commit}`]); return r.status === 0 ? r.stdout.trim() : null; };
const ancestor = (root, older, newer) => git(root, ['merge-base', '--is-ancestor', older, newer]).status === 0;
const receiptRows = (story) => {
  const match = story.body.match(/^## Execution receipts\s*\r?\n([\s\S]*?)(?=^##\s|(?![\s\S]))/m);
  if (!match) return [];
  const lines = match[1].split(/\r?\n/).filter((line) => line.trim().startsWith('|'));
  const fields = ['receipt_id', 'kind', 'work_id', 'attempt', 'reviewed_sha', 'patch_id', 'plan_revision', 'authority_ref', 'recorded_at_utc', 'integration_commit'];
  if (lines.length < 2 || lines[0].split('|').map((x) => x.trim()).filter(Boolean).join('|') !== fields.join('|')) return [];
  return lines.slice(2).map((line) => Object.fromEntries(fields.map((field, index) => [field, line.split('|').map((x) => x.trim()).filter(Boolean)[index]])));
};
const result = (task, base, head, reasons, extra = {}) => ({ contract: 'task-review-readiness@1', task_id: task?.data?.id ?? 'none', base_sha: base ?? 'none', reviewed_sha: 'none', head_sha: head ?? 'none', patch_id: 'none', technical_ready: reasons.length === 0, reasons: [...new Set(reasons)].sort(), observed_paths: [], governance_paths: [], ...extra });

export function deriveTaskReviewReadiness(root, taskId, baseInput, headInput) {
  const prerequisites = reviewPrerequisites(root); const records = prerequisites.records;
  const task = records.find((record) => record.type === 'task' && record.data.id === taskId);
  const base = resolveCommit(root, baseInput); const head = resolveCommit(root, headInput); const checked = resolveCommit(root, 'HEAD');
  const reasons = [...prerequisites.reasons];
  if (!task) reasons.push('task_unresolved');
  if (!base) reasons.push('base_unresolved');
  if (!head) reasons.push('head_unresolved');
  if (head && checked && head !== checked) reasons.push('head_not_checked_head');
  // Repository-wide invalidity is reported alongside Task evidence.  It must
  // not hide a broken receipt → Run → Result link that this observation owns.
  if (!task || !base || !head) return result(task, base, head, reasons);
  const story = records.find((record) => record.type === 'user_story' && record.data.id === task.data.parent);
  const results = records.filter((record) => record.type === 'task_result' && record.data.parent === taskId && Number(record.data.based_on_plan_revision) === Number(task.data.plan_revision));
  if (results.length !== 1) return result(task, base, head, ['evidence_missing']);
  const taskResult = results[0]; const runs = records.filter((record) => record.type === 'execution_run' && record.data.id === taskResult.data.execution_run_id && record.data.work_id === taskId);
  if (runs.length !== 1 || !story) return result(task, base, head, ['evidence_missing']);
  const run = runs[0]; const receipts = receiptRows(story).filter((receipt) => receipt.kind === 'task_integration' && receipt.work_id === taskId && Number(receipt.attempt) === Number(run.data.attempt) && Number(receipt.plan_revision) === Number(taskResult.data.based_on_plan_revision));
  if (receipts.length !== 1) return result(task, base, head, ['evidence_missing']);
  const receipt = receipts[0];
  if (!ancestor(root, base, receipt.reviewed_sha)) reasons.push('base_not_ancestor');
  const changes = observedPaths(root, base, receipt.reviewed_sha);
  const scope = classifyTaskGovernance(changes, records, [task]);
  reasons.push(...scope.scope_findings);
  if (openDecisionRequests(task.body).length) reasons.push('task_decision_open');
  if (openDecisionRequests(story.body).length) reasons.push('story_decision_open');
  const patch = normalizedPatchIdentity(root, base, receipt.reviewed_sha);
  const observedIdentity = patch ?? receipt.reviewed_sha;
  const receiptIdentity = receipt.patch_id || receipt.reviewed_sha;
  if (observedIdentity !== receiptIdentity) reasons.push('rebase_mismatch');
  const resultGitPath = `.exorail/${taskResult.relative.replaceAll('\\', '/')}`;
  const atIntegration = git(root, ['rev-parse', `${receipt.integration_commit}:${resultGitPath}`]); const atHead = git(root, ['rev-parse', `${head}:${resultGitPath}`]);
  if (atIntegration.status !== 0 || atHead.status !== 0 || atIntegration.stdout.trim() !== atHead.stdout.trim() || !ancestor(root, receipt.integration_commit, head)) reasons.push('evidence_missing');
  return { ...result(task, base, head, reasons, { reviewed_sha: receipt.reviewed_sha, patch_id: patch ?? receipt.reviewed_sha, observed_paths: changes, governance_paths: scope.governance_paths }), technical_ready: reasons.length === 0 };
}
