import path from 'node:path';
import { deriveExecutableFrontier, frontMatter, executionReceipts, waveConflict } from './schema-0.2.mjs';
import { ancestor, commit, digest, git, localDirectory, stop } from './git-runtime-primitives.mjs';
import { writeFileSync } from 'node:fs';

export function storyAt(root, sha, relative) {
  const text = git(root, ['show', `${sha}:${relative}`]);
  const file = path.join(localDirectory(root), `observed-${digest(text)}.md`);
  writeFileSync(file, `${text}\n`, 'utf8'); const findings = [];
  const parsed = frontMatter(file, findings, relative);
  if (!parsed || findings.some((f) => f.severity === 'ERROR')) stop('observed_story_invalid');
  return parsed;
}
// Normalization belongs to this opt-in cross-Story path. Legacy wave verdicts
// are unchanged; their semantic conflict owner still decides resources/regions.
export function crossStoryConflict(left, right) {
  const normalize = (p) => {
    if (typeof p !== 'string' || !p || path.posix.isAbsolute(p.replaceAll('\\', '/')) || p.split(/[\\/]/).includes('..') || /[:*?\[\]{}]/.test(p)) stop('scope_path_indeterminate', String(p));
    return p.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/+$/, '').toLowerCase();
  };
  const l = (left.affected_paths ?? []).map(normalize); const r = (right.affected_paths ?? []).map(normalize);
  const common = l.some((a) => r.some((b) => a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)));
  return waveConflict({ ...left, affected_paths: common ? ['shared'] : [] }, { ...right, affected_paths: common ? ['shared'] : [] });
}
export function crossStoryAdmission(root, state, records, current, candidates) {
  const stories = new Map(records.filter((r) => r.type === 'user_story').map((r) => [r.data.id, r]));
  const visited = new Set(); const visiting = new Set();
  const walk = (id) => {
    if (visiting.has(id)) stop('story_dependency_cycle', id);
    if (visited.has(id)) return;
    const story = stories.get(id); if (!story) stop('story_dependency_unknown', id);
    visiting.add(id); for (const dep of story.data.dependencies ?? []) walk(dep); visiting.delete(id); visited.add(id);
  };
  walk(current.id);
  const target = commit(root, current.target_ref);
  for (const id of stories.get(current.id).data.dependencies ?? []) {
    const upstream = stories.get(id); const observed = storyAt(root, target, `.exorail/${upstream.relative.replaceAll('\\', '/')}`);
    const receipt = executionReceipts(observed.body).items.find((r) => r.kind === 'story_acceptance' && r.work_id === id && Number(r.plan_revision) === observed.data.plan_revision);
    if (observed.data.status !== 'completed' || observed.data.plan_revision !== upstream.data.plan_revision || !receipt || !ancestor(root, receipt.reviewed_sha, target)) stop('story_dependency_unreleased', id);
  }
  const reservations = Object.values(state.stories).filter((s) => s.id !== current.id && s.delivery_target_ref === current.delivery_target_ref && !s.delivered_sha)
    .flatMap((s) => Object.values(s.tasks).filter((t) => t.state !== 'integrated').map((t) => ({ id: t.id, data: t.scope })));
  for (const task of records.filter((r) => r.type === 'task' && r.data.parent !== current.id && r.data.status === 'active')) {
    const registered = Object.values(state.stories).find((s) => s.id === task.data.parent)?.tasks[task.data.id];
    if (!registered || JSON.stringify(registered.scope) !== JSON.stringify(task.data)) stop('manual_active_unreconciled', task.data.id);
  }
  const releasedStory = (id) => (stories.get(id)?.data.dependencies ?? []).every((upstreamId) => {
    const upstream = stories.get(upstreamId); if (!upstream) stop('story_dependency_unknown', upstreamId);
    if (upstream.data.status !== 'completed') return false;
    const observed = storyAt(root, target, `.exorail/${upstream.relative.replaceAll('\\', '/')}`);
    const receipt = executionReceipts(observed.body).items.find((r) => r.kind === 'story_acceptance' && r.work_id === upstreamId && Number(r.plan_revision) === observed.data.plan_revision);
    return observed.data.status === 'completed' && observed.data.plan_revision === upstream.data.plan_revision && receipt && ancestor(root, receipt.reviewed_sha, target);
  });
  const first = records[0]; const marker = `${path.sep}.exorail${path.sep}`;
  const planningRoot = first.file.slice(0, first.file.lastIndexOf(marker));
  const eligibleIds = new Set([...stories.values()].filter((r) => r.data.id !== current.id && releasedStory(r.data.id))
    .flatMap((r) => deriveExecutableFrontier(planningRoot, r.data.id).eligible));
  const eligible = records.filter((r) => r.type === 'task' && r.data.parent !== current.id && eligibleIds.has(r.data.id));
  // A known ready scope participates even before another coordinator reserves it.
  // A conflict blocks the affected wave; disjoint Stories remain concurrent.
  for (const candidate of candidates) for (const other of [...reservations, ...eligible]) {
    if (!other.data) stop('reserved_scope_missing', other.id);
    if (crossStoryConflict(candidate.data, other.data)) stop('cross_story_conflict', `${candidate.data.id}:${other.data.id}`);
  }
  return true;
}
