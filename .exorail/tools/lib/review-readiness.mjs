import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { isAdmissionBlocking } from './findings.mjs';
import { collect, validate, openDecisionRequests } from './schema-0.2.mjs';

const generatedPrefixes = ['.exorail/projections/'];

function git(root, args, input = undefined) {
  return spawnSync('git', args, { cwd: root, input, encoding: 'utf8' });
}
function commit(root, value) {
  const result = git(root, ['rev-parse', '--verify', `${value}^{commit}`]);
  return result.status === 0 ? result.stdout.trim() : null;
}
export function normalizedPatchIdentity(root, base, head) {
  const diff = git(root, ['diff', '--binary', base, head]);
  if (diff.status !== 0 || !diff.stdout) return null;
  const identity = git(root, ['patch-id', '--stable'], diff.stdout);
  const match = identity.stdout.match(/^([a-f0-9]{40,64})\s/m);
  return identity.status === 0 && match ? match[1] : null;
}
export function observedPaths(root, base, head) {
  const result = git(root, ['diff', '--name-status', '-M', '--find-renames', base, head]);
  if (result.status !== 0) return [];
  return result.stdout.split(/\r?\n/).filter(Boolean).flatMap((line) => {
    const cells = line.split('\t'); const status = cells[0];
    const names = cells.slice(1).filter(Boolean);
    return names.map((name) => ({ path: name.replaceAll('\\', '/'), status }));
  }).sort((a, b) => `${a.path}:${a.status}`.localeCompare(`${b.path}:${b.status}`));
}
export function scopeFindings(changes, tasks) {
  const declared = tasks.flatMap((task) => (task.data.affected_paths ?? []).map((owned) => ({ task_id: task.data.id, path: owned.replaceAll('\\', '/').toLowerCase() })));
  const findings = [];
  for (const change of changes) {
    const observed = change.path.toLowerCase();
    if (generatedPrefixes.some((prefix) => observed.startsWith(prefix))) continue;
    const owned = declared.some((item) => observed === item.path || observed.startsWith(`${item.path}/`) || item.path.startsWith(`${observed}/`));
    if (!owned) findings.push(`scope_escape:${change.status}:${change.path}`);
  }
  return [...new Set(findings)].sort();
}
export function classifyTaskGovernance(changes, records, tasks) {
  const byId = new Map(records.map((record) => [record.data.id, record]));
  const taskIds = new Set(tasks.map((task) => task.data.id));
  const ownedRecords = new Set();
  for (const taskId of taskIds) {
    const task = byId.get(taskId);
    if (!task) continue;
    ownedRecords.add(task);
    for (const record of records) {
      if (['task_contract', 'task_result'].includes(record.type) && record.data.parent === taskId) ownedRecords.add(record);
      if (record.type === 'execution_run' && record.data.work_id === taskId) ownedRecords.add(record);
    }
    let ancestor = byId.get(task.data.parent);
    while (ancestor && ['user_story', 'feature', 'epic'].includes(ancestor.type)) {
      ownedRecords.add(ancestor);
      ancestor = byId.get(ancestor.data.parent);
    }
  }
  const governance = new Set([...ownedRecords].map((record) => `.exorail/${record.relative}`.toLowerCase()));
  const governance_paths = changes.filter((change) => governance.has(change.path.toLowerCase()));
  const nonGovernanceChanges = changes.filter((change) => !governance.has(change.path.toLowerCase()));
  return { governance_paths, scope_findings: scopeFindings(nonGovernanceChanges, tasks) };
}
function receiptIdentities(records) {
  const identities = [];
  for (const record of records.filter((item) => item.type === 'user_story')) {
    const lines = record.body.split(/\r?\n/).filter((line) => line.trim().startsWith('|'));
    const header = lines.find((line) => line.includes('patch_id') && line.includes('reviewed_sha'));
    if (!header) continue;
    const fields = header.split('|').map((cell) => cell.trim()).filter(Boolean);
    for (const line of lines.slice(lines.indexOf(header) + 2)) {
      const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
      if (cells.length !== fields.length) continue;
      const row = Object.fromEntries(fields.map((field, index) => [field, cells[index]]));
      if (row.patch_id) identities.push({ patch_id: row.patch_id, reviewed_sha: row.reviewed_sha ?? 'none' });
    }
  }
  return identities;
}
export function referenceStaleness(records, patchIdentity, reviewedSha) {
  const identities = receiptIdentities(records);
  if (!identities.length) return false;
  return patchIdentity
    ? !identities.some((item) => item.patch_id === patchIdentity)
    : !identities.some((item) => item.reviewed_sha === reviewedSha);
}
function hasOpenDecision(records) {
  return records.some((record) => openDecisionRequests(record.body).length > 0);
}
export function reviewPrerequisites(root) {
  const reasons = [];
  const workflow = validate(root).findings.filter(isAdmissionBlocking);
  if (workflow.length) reasons.push('workflow_invalid');
  const projectionTool = path.join(root, '.exorail/tools/generate-projections.mjs');
  if (!existsSync(projectionTool) || spawnSync(process.execPath, [projectionTool, '--repository-root', root, '--check'], { cwd: root, encoding: 'utf8' }).status !== 0) reasons.push('projection_stale');
  const findings = []; const records = collect(root, findings);
  if (findings.length) reasons.push('canonical_input_invalid');
  return { reasons, records };
}
export function deriveReviewReadiness(root, baseInput, headInput) {
  const base = commit(root, baseInput); const head = commit(root, headInput);
  const reasons = [];
  if (!base) reasons.push('base_unresolved');
  if (!head) reasons.push('head_unresolved');
  if (!base || !head) return { contract: 'review-readiness@1', base_sha: base ?? 'none', head_sha: head ?? 'none', ready_for_review: false, reasons, observed_paths: [], governance_paths: [], patch_identity: 'none', patch_identity_kind: 'none' };
  // Admission validation, not full validation: a stale projection already has
  // its own reason below. Counting it here too reported `workflow_invalid` for
  // a project whose records are valid, which is both wrong and less specific
  // than the signal it duplicated.
  const prerequisites = reviewPrerequisites(root);
  reasons.push(...prerequisites.reasons); const records = prerequisites.records;
  const changes = observedPaths(root, base, head);
  const scope = classifyTaskGovernance(changes, records, records.filter((record) => record.type === 'task'));
  reasons.push(...scope.scope_findings);
  const patch = normalizedPatchIdentity(root, base, head);
  if (referenceStaleness(records, patch, head)) reasons.push(patch ? 'stale_patch_identity' : 'stale_reviewed_sha_fallback');
  if (hasOpenDecision(records)) reasons.push('open_decision');
  const stableReasons = [...new Set(reasons)].sort();
  return { contract: 'review-readiness@1', base_sha: base, head_sha: head, ready_for_review: stableReasons.length === 0, reasons: stableReasons, observed_paths: changes, governance_paths: scope.governance_paths, patch_identity: patch ?? head, patch_identity_kind: patch ? 'patch_id' : 'reviewed_sha_fallback' };
}
