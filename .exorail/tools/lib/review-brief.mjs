import path from 'node:path';
import { collect, validate } from './schema-0.2.mjs';
import { deriveReviewReadiness } from './review-readiness.mjs';

const claim = (state, provenance, value) => ({ claim_state: state, provenance, value });
const relative = (record) => record.relative.replaceAll('\\', '/');
function openDecision(record) { return /\|[^\r\n|]*\|[^\r\n|]*\|\s*(?:open|pending)\s*\|/i.test(record.body); }

export function deriveReviewBrief(root, storyId, base, head) {
  const validated = validate(root);
  const records = validated.records;
  const story = records.find((record) => record.type === 'user_story' && record.data.id === storyId);
  if (!story) throw new Error('story_unresolved');
  const observation = deriveReviewReadiness(root, base, head);
  const tasks = records.filter((record) => record.type === 'task' && record.data.parent === storyId).sort((a, b) => a.data.id.localeCompare(b.data.id));
  const results = records.filter((record) => record.type === 'task_result' && tasks.some((task) => task.data.id === record.data.parent)).sort((a, b) => a.data.id.localeCompare(b.data.id));
  const taskLinks = tasks.map((task) => ({ task_id: task.data.id, path: relative(task), affected_paths: [...(task.data.affected_paths ?? [])].sort(), contract_path: records.find((record) => record.type === 'task_contract' && record.data.parent === task.data.id) ? relative(records.find((record) => record.type === 'task_contract' && record.data.parent === task.data.id)) : null }));
  const resultContext = results.map((result) => ({ result_id: result.data.id, path: relative(result), review_focus: result.data.review_focus === undefined ? null : claim('agent_declared', 'declared', result.data.review_focus), not_verified: result.data.not_verified === undefined ? null : claim('agent_declared', 'declared', result.data.not_verified), evidence_refs: (result.data.evidence ?? []).map((value) => claim('not_verified', 'declared', value)) }));
  const decisions = [story, ...tasks].filter(openDecision).map((record) => ({ path: relative(record), context: claim('human_decision_required', 'declared', 'open_or_pending_decision') }));
  return {
    contract: 'review-brief@1',
    story: { id: story.data.id, title: story.data.title, plan_revision: story.data.plan_revision, path: relative(story) },
    readiness: claim('mechanically_verified', 'git_linked', observation),
    declared_scope: claim('agent_declared', 'declared', taskLinks),
    result_context: resultContext,
    decision_context: decisions
  };
}

export function renderReviewBriefMarkdown(brief) {
  const readiness = brief.readiness.value; const scope = brief.declared_scope.value;
  const rows = scope.length ? scope.map((task) => `| ${task.task_id} | ${task.affected_paths.join(', ') || 'none'} | ${task.path} | ${task.contract_path ?? 'none'} |`).join('\n') : '| none | none | none | none |';
  const observed = readiness.observed_paths.length ? readiness.observed_paths.map((item) => `| ${item.status} | ${item.path} | mechanically_verified / git_linked |`).join('\n') : '| none | none | mechanically_verified / git_linked |';
  const context = brief.result_context.length ? brief.result_context.map((entry) => `| ${entry.result_id} | ${entry.review_focus?.value?.join('; ') ?? 'none declared'} | ${entry.not_verified?.value?.join('; ') ?? 'none declared'} | agent_declared / declared | ${entry.path} |`).join('\n') : '| none | none declared | none declared | agent_declared / declared | none |';
  const decisions = brief.decision_context.length ? brief.decision_context.map((entry) => `| ${entry.context.value} | human_decision_required / declared | ${entry.path} |`).join('\n') : '| none | human_decision_required / declared | none |';
  return `# Review Brief — ${brief.story.id}\n\nDerived, non-canonical review orientation. It grants no authority and causes no provider side effect.\n\n## Identity\n\n- Story: [${brief.story.id}](${brief.story.path}) — ${brief.story.title}\n- Plan revision: ${brief.story.plan_revision}\n- Base/head: ${readiness.base_sha} / ${readiness.head_sha}\n- Readiness: ${readiness.ready_for_review} (mechanically_verified / git_linked)\n- Reasons: ${readiness.reasons.join(', ') || 'none'}\n\n## Declared scope (agent_declared / declared)\n\n| Task | Declared paths | Task source | Contract source |\n| --- | --- | --- | --- |\n${rows}\n\n## Observed Git change (mechanically_verified / git_linked)\n\n| Status | Path | Claim |\n| --- | --- | --- |\n${observed}\n\n## Result context (agent_declared / declared)\n\n| Result | Review focus | Not verified | Claim | Source |\n| --- | --- | --- | --- | --- |\n${context}\n\n## Open decision context\n\n| Context | Claim | Source |\n| --- | --- | --- |\n${decisions}\n`;
}
