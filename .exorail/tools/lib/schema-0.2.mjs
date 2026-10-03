import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { isAdmissionBlocking } from './findings.mjs';

export const findingMessages = {
  AG201: 'invalid canonical identity or parent type', AG202: 'artifact path is not canonical',
  AG203: 'reference is not a unique active canonical record', AG204: 'unregistered authoritative artifact',
  AG205: 'duplicate canonical authority', AG206: 'unsupported field or YAML grammar',
  AG207: 'UTF-8 BOM is prohibited', AG208: 'timestamp must be RFC 3339 UTC',
  AG209: 'link must resolve inside .exorail', AG210: 'required title or body section is missing',
  AG211: 'role identifier is invalid', AG212: 'risk must be low, medium, high, or critical',
  AG214: 'generic catch-all Story is forbidden', AG301: 'state transition is invalid',
  AG302: 'required task prerequisite is missing', AG303: 'completion evidence is missing or invalid',
  AG304: 'future task requires replanning', AG305: 'required timing actual is missing',
  AG306: 'timing evidence is incoherent', AG307: 'forecast value is invalid',
  AG401: 'child policy is more permissive', AG402: 'Story review boundary is not eligible under resolved Policy or current authority',
  AG403: 'parallel execution is not eligible', AG404: 'parallel dependency is unresolved',
  AG405: 'parallel work conflicts or lacks integration', AG501: 'projection is not generator-owned and current',
  AG502: 'adapter descriptor or capability activation contract is invalid', AG601: 'invalid canonical authority or review confirmation',
  AG603: 'acceptance references or Result criterion evidence are invalid',
  AG604: 'Story intake, derived readiness or dependency availability is invalid',
  AG605: 'resolver corroboration or exceptional Contract boundary is invalid',
  AG606: 'work receipt ordering, binding, integration or Story outcome lifecycle is invalid',
  AG607: 'execution contract, Run, External Action, Result relation or evidence lifecycle is invalid',
  AG608: 'typed Decision or Contract Challenge is invalid',
  AG609: 'execution isolation or dependency unlock is invalid',
  AG610: 'Episode capability is disabled for a live Episode',
  AG620: 'Task cannot enter executable work: add at least one observable acceptance criterion',
  AG621: 'Task cannot enter executable work: map each acceptance reference to a criterion in its parent Story',
  AG622: 'Task cannot enter executable work: add a Quality gate that names verification evidence.',
  AG623: 'Task cannot create attempt 4: record a replan, split, or human decision after attempt 3',
  AG624: 'Task attempt sequence is not resumable',
  AG625: 'Task cannot start another attempt after a terminal result candidate: use the existing review/acceptance route or a Decision/replan successor Task.',
  AG626: 'Ready Task has a current-revision execution Run: complete recovery, resume a failed attempt, supersede, or use the Result route according to its latest Run.',
  AG628: 'Task cannot start another current-revision attempt after cancelled or abandoned: supersede it and create a successor Task.'
};

export const typeInfo = {
  epic: { prefix: 'EP-', file: 'EPIC.md', headings: ['Outcome'], statuses: ['planned', 'active', 'completed', 'blocked', 'superseded'] },
  feature: { prefix: 'FEAT-', file: 'FEATURE.md', headings: ['Outcome', 'Scope boundaries'], statuses: ['planned', 'active', 'completed', 'blocked', 'superseded'] },
  user_story: { prefix: 'US-', file: 'STORY.md', headings: ['Description', 'Outcome', 'Acceptance criteria', 'Risks', 'Task backlog'], statuses: ['planned', 'ready', 'active', 'completed', 'blocked', 'replan-needed', 'superseded'] },
  task: { prefix: 'TASK-', file: 'TASK.md', headings: ['Intent', 'Expected outcome', 'Open questions', 'Acceptance', 'Handoff'], statuses: ['planned', 'ready', 'active', 'completed', 'blocked', 'replan-needed', 'superseded'] },
  task_contract: { prefix: 'TASK-', file: 'CONTRACT.md', headings: ['Technical scope', 'Verification', 'Handoff', 'Constraints'], statuses: ['ready', 'active', 'blocked'] },
  task_result: { prefix: 'TASK-', file: 'RESULT.md', headings: ['Outcome', 'Evidence', 'Timing', 'Handoff'], statuses: ['review_pending'] },
  context: { prefix: 'CTX-', file: null, headings: ['Boundary', 'Ubiquitous language'], statuses: ['active', 'retired'] },
  episode: { prefix: 'EP-', file: 'EPISODE.md', headings: ['Statement', 'Applicability', 'Relations'], statuses: ['active', 'superseded', 'retired'] },
  milestone: { prefix: 'MS-', file: 'MILESTONE.md', headings: ['Exit criteria'], statuses: ['planned', 'active', 'completed', 'blocked', 'superseded'] },
  adapter_profile: { prefix: 'ADAPTER-', file: null, headings: ['Contract'], statuses: ['active', 'retired'] },
  execution_run: { prefix: 'RUN-', file: null, headings: ['Outcome'], statuses: ['open', 'terminal'] },
  external_action: { prefix: 'ACT-', file: null, headings: ['Purpose'], statuses: ['proposed', 'authorized', 'applied', 'failed', 'cancelled'] }
};
const allowedFields = {
  epic: ['schema', 'id', 'type', 'title', 'status', 'risk', 'contexts', 'owner_role', 'owner_member_id', 'created_at_utc', 'updated_at_utc'],
  feature: ['schema', 'id', 'type', 'title', 'parent', 'status', 'risk', 'contexts', 'owner_role', 'owner_member_id', 'created_at_utc', 'updated_at_utc'],
  user_story: ['schema', 'id', 'type', 'title', 'parent', 'status', 'plan_revision', 'contexts', 'owner_role', 'reviewer_role', 'approval_owner_role', 'owner_member_id', 'assignee_member_id', 'reviewer_member_id', 'risk', 'execution_policy', 'parallel_eligible', 'affected_paths', 'dependencies', 'execution_mode', 'review_boundary', 'review_mode_confirmation', 'approval_authority', 'created_at_utc', 'updated_at_utc'],
  task: ['schema', 'id', 'type', 'title', 'parent', 'status', 'plan_revision', 'contexts', 'owner_role', 'reviewer_role', 'owner_member_id', 'assignee_member_id', 'reviewer_member_id', 'risk', 'depends_on', 'affected_paths', 'resources', 'execution', 'execution_mode', 'verification_profile', 'contract_required', 'forecast', 'acceptance_refs', 'task_acceptance_criteria', 'change_scope', 'execution_isolation', 'logical_regions', 'created_at_utc', 'updated_at_utc'],
  task_contract: ['schema', 'id', 'type', 'parent', 'status', 'based_on_plan_revision', 'verification_profile', 'implementation_paths', 'handoff_to', 'approval_authority', 'created_at_utc', 'updated_at_utc'],
  task_result: ['schema', 'id', 'type', 'parent', 'status', 'based_on_plan_revision', 'evidence', 'timing', 'acceptance_evidence', 'execution_run_id', 'scope_paths', 'review_focus', 'not_verified', 'completed_by_member_id', 'created_at_utc'],
  context: ['schema', 'id', 'type', 'title', 'name', 'status', 'owners', 'aliases', 'created_at_utc', 'updated_at_utc'],
  episode: ['schema', 'id', 'type', 'title', 'status', 'contexts', 'provenance', 'created_at_utc', 'updated_at_utc'],
  milestone: ['schema', 'id', 'type', 'title', 'status', 'stories', 'owner_role', 'owner_member_id', 'target_date_utc', 'created_at_utc', 'updated_at_utc'],
  adapter_profile: ['schema', 'id', 'type', 'title', 'status', 'family', 'contract_version', 'descriptor_revision', 'capabilities', 'created_at_utc', 'updated_at_utc'],
  execution_run: ['schema', 'id', 'type', 'work_id', 'plan_revision', 'attempt', 'execution_contract', 'governance_input_digest', 'adapter_id', 'adapter_descriptor_revision', 'external_ref', 'status', 'terminal_outcome', 'started_at_utc', 'completed_at_utc', 'terminal_evidence_refs', 'result_id'],
  external_action: ['schema', 'id', 'type', 'adapter_id', 'adapter_descriptor_revision', 'work_id', 'action_kind', 'target_ref', 'consequence', 'idempotency_key', 'status', 'authority_ref', 'external_ref', 'evidence_refs', 'created_at_utc', 'updated_at_utc']
};
const requiredFields = {
  epic: ['risk'], feature: ['parent'], user_story: ['parent', 'plan_revision', 'execution_policy', 'parallel_eligible'],
  task: ['parent', 'plan_revision', 'depends_on', 'affected_paths'],
  task_contract: ['parent', 'based_on_plan_revision', 'verification_profile', 'implementation_paths'],
  task_result: ['parent', 'based_on_plan_revision', 'evidence'],
  context: ['name', 'owners'], episode: ['contexts', 'provenance'], milestone: ['stories'], adapter_profile: ['family', 'contract_version', 'descriptor_revision', 'capabilities'],
  execution_run: ['work_id', 'plan_revision', 'attempt', 'execution_contract', 'governance_input_digest', 'status', 'started_at_utc', 'terminal_evidence_refs'],
  external_action: ['adapter_id', 'adapter_descriptor_revision', 'work_id', 'action_kind', 'target_ref', 'consequence', 'idempotency_key', 'status', 'authority_ref', 'external_ref', 'evidence_refs']
};

const executionContracts = new Set(['controlled-task@1']);
const standardAdapterFamilies = new Set(['integration', 'execution', 'projection']);
const standardCapabilities = new Map([
  ['integration.observe_facts@1', 'integration'], ['integration.consequential_side_effect@1', 'integration'],
  ['integration.retrieve_context@1', 'integration'],
  ['execution.durable@1', 'execution'], ['execution.observe@1', 'execution'], ['execution.pause_resume@1', 'execution'],
  ['execution.cancel@1', 'execution'], ['projection.render@1', 'projection']
]);

export function add(findings, id, severity = 'ERROR', detail = '') { findings.push({ severity, id, message: `AG${id.slice(2)}: ${findingMessages[id]}${detail ? ` (${detail})` : ''}` }); }
function observed(value) {
  if (value === undefined || value === null) return 'missing';
  if (value === '') return 'empty';
  return JSON.stringify(value);
}
function locus(relative, field, found, expected) { return `${relative}; field: ${field}; found: ${observed(found)}; expected: ${expected}`; }
function addLocus(findings, id, relative, field, found, expected) { add(findings, id, 'ERROR', locus(relative, field, found, expected)); }
export function slash(value) { return value.split(path.sep).join('/'); }
export function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
export function listFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(file) : [file];
  });
}

// The protocol accepts the deliberately restricted YAML subset declared by the manifest.
export function frontMatter(file, findings, relative = '') {
  const bytes = readFileSync(file);
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) { add(findings, 'AG207'); return null; }
  const text = bytes.toString('utf8').replace(/\r\n/g, '\n');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) { addLocus(findings, 'AG206', relative, 'front matter', text.split(/\r?\n/)[0] ?? '', 'a record opens with --- , a front matter block, and a closing --- line'); return null; }
  const data = {}; let nested = null;
  const lines = match[1].split(/\r?\n/);
  for (const [index, raw] of lines.entries()) {
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue;
    const indent = raw.match(/^ */)[0].length;
    const m = raw.trim().match(/^([a-z][a-z0-9_]*):\s*(.*?)\s*$/);
    if (!m || indent > 2 || (indent === 2 && !nested)) { addLocus(findings, 'AG206', relative, `front matter line ${index + 2}`, raw, indent > 2 || (indent === 2 && !nested) ? 'a top-level key, or two-space nesting under a key with an empty value' : 'one inline `key: value` per line; a list is JSON flow style and a block sequence is not read'); continue; }
    const [, key, literal] = m;
    if (indent === 0) {
      if (Object.hasOwn(data, key)) addLocus(findings, 'AG206', relative, `front matter line ${index + 2}`, key, 'each key appears once at its level');
      if (literal === '') { data[key] = {}; nested = key; }
      else { data[key] = parseValue(literal); nested = null; }
    } else { if (Object.hasOwn(data[nested], key)) addLocus(findings, 'AG206', relative, `front matter line ${index + 2}`, `${nested}.${key}`, 'each key appears once at its level'); else data[nested][key] = parseValue(literal); }
  }
  return { data, body: match[2], text };
}
function parseValue(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value.slice(1, -1);
  const unquoted = value;
  if (/^\[.*\]$/.test(unquoted)) { try { return JSON.parse(unquoted); } catch { return unquoted.slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean); } }
  if (unquoted === 'true') return true; if (unquoted === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(unquoted)) return Number(unquoted); return unquoted;
}
function value(data, dotted) { return dotted.split('.').reduce((current, key) => current && current[key], data); }
function isUtc(input) { return typeof input === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(input) && !Number.isNaN(Date.parse(input)); }
function all(values, allowed) { return values.every((item) => allowed.includes(item)); }

export function collect(root, findings) {
  const exo = path.join(root, '.exorail');
  const files = listFiles(exo).filter((file) => file.endsWith('.md') && isAuthoritativeArtifact(slash(path.relative(exo, file))));
  const records = [];
  for (const file of files) {
    const relative = slash(path.relative(exo, file));
    const parsed = frontMatter(file, findings, relative); if (!parsed) continue;
    const type = parsed.data.type; const info = typeInfo[type];
    if (!info) { add(findings, 'AG201', 'ERROR', relative); continue; }
    records.push({ ...parsed, file, relative, type, info });
  }
  return records;
}
function isAuthoritativeArtifact(relative) {
  return relative.startsWith('planning/') || relative.startsWith('adapters/') || relative.startsWith('episodes/') || relative.startsWith('runs/') || relative.startsWith('external-actions/');
}

export function validate(root) {
  const findings = []; const exo = path.join(root, '.exorail');
  if (!existsSync(exo)) { add(findings, 'AG204'); return { findings, records: [] }; }
  validateAuthority(root, findings); const records = collect(root, findings); const byId = new Map(); const policy = resolvedPolicy(root); readCapabilityActivations(root, findings); const team = readTeam(root, findings);
  for (const record of records) {
    const { data, type, info, relative, body } = record;
    if (data.schema !== '0.2') add(findings, 'AG601');
    for (const key of Object.keys(data)) if (!allowedFields[type].includes(key) && !key.startsWith('x_')) addLocus(findings, 'AG206', relative, key, data[key], `a field this ${type} declares, or an x_ prefixed extension`);
    for (const key of requiredFields[type]) if (data[key] === undefined) { const missing = type === 'task_result' ? 'AG303' : type === 'milestone' ? 'AG203' : 'AG206'; if (missing === 'AG206') addLocus(findings, 'AG206', relative, key, undefined, `a value: every ${type} declares ${key}`); else add(findings, missing, 'ERROR', `${relative}:${key}`); }
    if (typeof data.id !== 'string' || !data.id.startsWith(info.prefix)) add(findings, 'AG201', 'ERROR', relative);
    if (!info.statuses.includes(data.status)) addLocus(findings, 'AG301', relative, 'status', data.status, `one of ${info.statuses.join(', ')}`);
    if (type === 'execution_run') { if (!isUtc(data.started_at_utc)) addLocus(findings, 'AG208', relative, 'started_at_utc', data.started_at_utc, 'an RFC 3339 UTC timestamp, for example 2026-09-20T09:00:00Z'); }
    else if (!isUtc(data.created_at_utc)) addLocus(findings, 'AG208', relative, 'created_at_utc', data.created_at_utc, 'an RFC 3339 UTC timestamp, for example 2026-09-20T09:00:00Z');
    else if (type !== 'task_result' && !isUtc(data.updated_at_utc)) addLocus(findings, 'AG208', relative, 'updated_at_utc', data.updated_at_utc, 'an RFC 3339 UTC timestamp, for example 2026-09-20T09:00:00Z');
    if (!['task_contract', 'task_result', 'execution_run', 'external_action'].includes(type) && (typeof data.title !== 'string' || !data.title.trim() || data.title.length > 120)) addLocus(findings, 'AG210', relative, 'title', data.title, 'a non-empty string title of at most 120 characters');
    if (byId.has(data.id)) add(findings, 'AG205'); else byId.set(data.id, record);
    for (const heading of info.headings) if (!hasRequiredSection(body, heading)) addLocus(findings, 'AG210', relative, `## ${heading}`, sectionText(body, heading), `a non-empty ## ${heading} section`);
    validateLinks(record, exo, findings);
    if (!canonicalPath(relative, data, type)) addLocus(findings, 'AG202', relative, 'path', relative, canonicalPathShape(type, data.id));
    if (data.risk && !['low', 'medium', 'high', 'critical'].includes(data.risk)) add(findings, 'AG212');
    for (const key of ['owner_role', 'reviewer_role', 'approval_owner_role', 'handoff_to']) if (data[key] !== undefined && !isRole(data[key])) add(findings, 'AG211', 'ERROR', relative);
    for (const key of ['owner_member_id', 'assignee_member_id', 'reviewer_member_id', 'completed_by_member_id']) if (data[key] !== undefined && !team.members.has(data[key])) add(findings, 'AG211', 'ERROR', `${relative}:${key}`);
    validateActiveMemberAssignment(data, team, findings, relative);
    if (type === 'context' && (!data.name || !Array.isArray(data.owners) || !data.owners.length || !data.owners.every(isRole))) add(findings, 'AG211', 'ERROR', relative);
  }
  for (const record of records) validateRecord(record, byId, findings, policy);
  validateTaskRunLifecycle(records, findings);
  validateRunAndActionUniqueness(records, findings);
  validateProjections(root, records, team.members, findings);
  return { findings: dedupe(findings), records };
}
function validateAuthority(root, findings) {
  const exo = path.join(root, '.exorail');
  for (const base of ['planning', 'adapters', 'episodes', 'runs', 'external-actions']) for (const file of listFiles(path.join(exo, base)).filter((x) => x.endsWith('.md'))) {
    const relative = slash(path.relative(exo, file));
    if (!isCanonicalAuthorityPath(relative)) add(findings, 'AG204');
  }
}
function isCanonicalAuthorityPath(relative) {
  return /^planning\/contexts\/CTX-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(relative)
    || /^planning\/milestones\/MS-[a-z0-9]+(?:-[a-z0-9]+)*\/MILESTONE\.md$/.test(relative)
    || /^planning\/epics\/EP-[a-z0-9]+(?:-[a-z0-9]+)*(?:\/features\/FEAT-[a-z0-9]+(?:-[a-z0-9]+)*(?:\/stories\/US-[a-z0-9]+(?:-[a-z0-9]+)*(?:\/tasks\/TASK-[a-z0-9]+(?:-[a-z0-9]+)*\/(?:TASK|CONTRACT|RESULT)|\/STORY)|\/FEATURE)|\/EPIC)\.md$/.test(relative)
    || /^adapters\/ADAPTER-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(relative)
    || /^runs\/RUN-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(relative)
    || /^external-actions\/ACT-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(relative)
    || /^episodes\/EP-\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*\/EPISODE\.md$/.test(relative);
}
function validateLinks(record, exo, findings) {
  for (const match of record.body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0].trim();
    if (!target) continue;
    if (/^[a-z]+:/i.test(target) || path.isAbsolute(target)) { add(findings, 'AG209'); continue; }
    const resolved = path.resolve(path.dirname(record.file), target);
    if (!slash(path.relative(exo, resolved)) || slash(path.relative(exo, resolved)).startsWith('..') || !existsSync(resolved)) add(findings, 'AG209');
  }
}
function canonicalPathShape(type, id) {
  const slug = String(id || '<slug>').replace(/^(EP|FEAT|US|TASK|MS|CTX|ADAPTER|RUN|ACT)-/, '').replace(/:(contract|result)$/, '');
  const shapes = {
    context: `planning/contexts/CTX-${slug}.md`, milestone: `planning/milestones/MS-${slug}/MILESTONE.md`,
    epic: `planning/epics/EP-${slug}/EPIC.md`, feature: 'planning/epics/EP-<slug>/features/FEAT-<slug>/FEATURE.md',
    user_story: 'planning/epics/EP-<slug>/features/FEAT-<slug>/stories/US-<slug>/STORY.md',
    task: '.../stories/US-<slug>/tasks/TASK-<slug>/TASK.md',
    task_contract: '.../tasks/TASK-<slug>/CONTRACT.md', task_result: '.../tasks/TASK-<slug>/RESULT.md',
    adapter_profile: `adapters/ADAPTER-${slug}.md`, execution_run: `runs/RUN-${slug}.md`,
    external_action: `external-actions/ACT-${slug}.md`, episode: `episodes/${id}-<slug>/EPISODE.md`
  };
  return shapes[type] ? `${shapes[type]}, with the slug this record declares` : 'the canonical path for this record type';
}
function canonicalPath(relative, data, type) {
  const id = data.id || ''; const slug = id.replace(/^(EP|FEAT|US|TASK|MS|CTX|ADAPTER|RUN|ACT)-/, '').replace(/:(contract|result)$/, '');
  const patterns = {
    context: new RegExp(`^planning/contexts/CTX-${slug}\\.md$`), milestone: new RegExp(`^planning/milestones/MS-${slug}/MILESTONE\\.md$`),
    epic: new RegExp(`^planning/epics/EP-${slug}/EPIC\\.md$`), feature: /\/features\/FEAT-[a-z0-9-]+\/FEATURE\.md$/,
    user_story: /\/stories\/US-[a-z0-9-]+\/STORY\.md$/, task: /\/tasks\/TASK-[a-z0-9-]+\/TASK\.md$/,
    task_contract: /\/tasks\/TASK-[a-z0-9-]+\/CONTRACT\.md$/, task_result: /\/tasks\/TASK-[a-z0-9-]+\/RESULT\.md$/,
    adapter_profile: new RegExp(`^adapters/ADAPTER-${slug}\\.md$`),
    execution_run: new RegExp(`^runs/RUN-${slug}\\.md$`), external_action: new RegExp(`^external-actions/ACT-${slug}\\.md$`),
    episode: new RegExp(`^episodes/${id}-[a-z0-9]+(?:-[a-z0-9]+)*\\/EPISODE\\.md$`)
  };
  return patterns[type]?.test(relative) ?? false;
}
function validateRecord(record, byId, findings, policy) {
  const { data, type, body, relative } = record; const parent = data.parent && byId.get(data.parent);
  if (['blocked', 'superseded'].includes(data.status) && !hasRequiredSection(body, 'Decision record')) addLocus(findings, 'AG301', relative, 'Decision record', 'missing', `a Decision record while status is ${data.status}`);
  if (['feature', 'user_story', 'task', 'task_contract', 'task_result'].includes(type) && !parent) add(findings, 'AG201', 'ERROR', relative);
  const expectedParents = { feature: 'epic', user_story: 'feature', task: 'user_story', task_contract: 'task', task_result: 'task' };
  if (expectedParents[type] && parent?.type !== expectedParents[type]) add(findings, 'AG201', 'ERROR', relative);
  for (const context of asArray(data.contexts)) if (!byId.has(context) || byId.get(context).data.status === 'retired') add(findings, 'AG203');
  if (type === 'user_story') {
    validateStoryExecution(data, body, byId, findings, relative, policy, record.file);
    if (!Number.isInteger(data.plan_revision) || data.plan_revision < 1) add(findings, 'AG304');
    if (!all([data.execution_mode], ['sequential', 'parallel']) || !all([data.review_boundary], ['task', 'story']) || !all([data.execution_policy?.verification_profile], ['minimal', 'standard', 'full'])) add(findings, 'AG401', 'ERROR', relative);
    const tasks = [...byId.values()].filter((x) => x.type === 'task' && x.data.parent === data.id);
    if (data.status === 'ready' && !tasks.length) add(findings, 'AG302');
    if (data.status === 'active' && !tasks.some((task) => ['ready', 'active', 'blocked'].includes(task.data.status))) addLocus(findings, 'AG301', relative, 'child Task statuses', tasks.map((task) => `${task.data.id}:${task.data.status}`), 'at least one child Task in ready, active, or blocked state');
    if (data.status === 'completed' && !tasks.filter((task) => task.data.status !== 'superseded').every((task) => task.data.status === 'completed')) add(findings, 'AG303');
  }
  if (type === 'user_story' || type === 'task') validateDecisionRequests(record, byId, findings);
  if (type === 'task') {
    validateTaskExecution(record, parent, byId, findings);
    if (parent && !['completed', 'superseded'].includes(data.status) && data.plan_revision !== parent.data.plan_revision) add(findings, 'AG304');
    const profile = parent?.data.execution_policy?.verification_profile;
    if (data.execution_mode !== undefined || data.verification_profile !== undefined) {
      if (!['sequential', 'parallel'].includes(parent?.data.execution_mode) || !['sequential', 'parallel'].includes(data.execution_mode) || !['minimal', 'standard', 'full'].includes(profile) || !['minimal', 'standard', 'full'].includes(data.verification_profile)) add(findings, 'AG401', 'ERROR', relative);
      if ((parent.data.execution_mode === 'sequential' && data.execution_mode !== 'sequential') || rank(data.verification_profile) < rank(profile)) add(findings, 'AG401', 'ERROR', relative);
    }
    if (data.forecast !== undefined && (!all([value(data, 'forecast.effort_band')], ['XS', 'S', 'M', 'L', 'XL']) || !all([value(data, 'forecast.confidence')], ['low', 'medium', 'high']))) add(findings, 'AG307', 'ERROR', relative);
    if (policy.forecastRequired && data.forecast === undefined) add(findings, 'AG307', 'ERROR', relative);
    const contract = [...byId.values()].find((x) => x.type === 'task_contract' && x.data.parent === data.id);
    if (data.contract_required !== undefined && !['required', 'not_required'].includes(data.contract_required)) add(findings, 'AG302');
    if (data.contract_required === 'required' && ['ready', 'active', 'blocked'].includes(data.status) && !contract) add(findings, 'AG302');
    if (data.status === 'completed') { const result = [...byId.values()].find((x) => x.type === 'task_result' && x.data.parent === data.id); if (!result || !Array.isArray(result.data.evidence) || !result.data.evidence.length) add(findings, 'AG303'); const missingReceipts = ['task_acceptance', 'task_integration'].filter((kind) => !hasExecutionReceipt(parent?.body ?? '', data.id, kind, data.plan_revision)); if (parent?.data.status === 'completed' && missingReceipts.length) addLocus(findings, 'AG606', relative, 'Task completion receipts', missingReceipts.map((kind) => `missing ${kind}`), `task_acceptance and task_integration for plan revision ${data.plan_revision}`); }
    if (isParallelMember(data) && (!parent?.data.parallel_eligible || parent?.data.execution_mode !== 'parallel')) add(findings, 'AG403', 'ERROR', relative);
    if (isParallelMember(data)) {
      const wave = [...byId.values()].filter((x) => x.type === 'task' && x.data.parent === data.parent && isParallelMember(x.data));
      const siblings = wave.filter((x) => x.data.id !== data.id);
      if (siblings.some((sibling) => waveConflict(data, sibling.data))) add(findings, 'AG405', 'ERROR', relative);
      const closeouts = [...byId.values()].filter((x) => x.type === 'task' && x.data.parent === data.parent && !isParallelMember(x.data) && wave.every((member) => asArray(x.data.depends_on).includes(member.data.id)));
      if (wave.length < 2 || !closeouts.length) add(findings, 'AG405', 'ERROR', relative);
    }
    const receipts = executionReceipts(parent?.body ?? '').items;
    for (const dep of asArray(data.depends_on)) if (['ready', 'active'].includes(data.status) && !dependencyReleased(parent, byId.get(dep), byId, receipts)) add(findings, 'AG404', 'ERROR', relative);
  }
  if (type === 'task_contract') { const task = parent; if (!task || !['ready', 'active', 'blocked', 'completed'].includes(task.data.status) || data.based_on_plan_revision !== task.data.plan_revision || !asArray(data.implementation_paths).every((p) => asArray(task.data.affected_paths).includes(p))) add(findings, 'AG302'); }
  if (type === 'task_result') { if (!parent || data.based_on_plan_revision !== parent.data.plan_revision || !Array.isArray(data.evidence) || !data.evidence.length) add(findings, 'AG303'); validateReviewContext(data, findings, relative); validateResultExecution(record, parent, byId, findings); validateTiming(record, findings, policy); }
  if (type === 'milestone') validateMilestone(record, byId, findings);
  if (type === 'adapter_profile') validateAdapter(data, findings);
  if (type === 'execution_run') validateExecutionRun(data, byId, findings, relative);
  if (type === 'external_action') validateExternalAction(data, byId, findings, relative);
  if (type === 'context' && data.status === 'retired' && [...byId.values()].some((x) => x.data.status !== 'completed' && asArray(x.data.contexts).includes(data.id))) add(findings, 'AG203');
  if (type === 'episode') validateEpisode(record, byId, findings);
  if (type === 'epic' || type === 'feature') validateContainer(record, byId, findings);
  if (type === 'user_story' && /generic|catch.?all/i.test(`${data.title} ${body}`) && !/\S/.test(body.match(/^## Acceptance criteria\s*\n([\s\S]*?)(?=^##|$)/m)?.[1] ?? '')) add(findings, 'AG214');
}
function validateDecisionRequests(record, byId, findings) {
  const requests = decisionRequests(record.body); if (requests.invalid) { addLocus(findings, 'AG608', record.relative, 'Decision requests table', 'malformed', 'the shipped header, separator, and complete table rows'); return; }
  const story = record.type === 'user_story' ? record : byId.get(record.data.parent); const seen = new Set();
  const triggers = ['repository_mismatch', 'unverifiable_acceptance', 'missing_dependency_or_boundary', 'unavoidable_scope_expansion', 'concrete_risk', 'task_not_atomic', 'materially_simpler_or_safer_solution'];
  const resolutions = ['plan_confirmed', 'clarification_recorded', 'plan_revision_required', 'task_split_required', 'blocked_or_deferred'];
  for (const request of requests.items) {
    const open = !request.resolution && !request.authority_ref;
    const revision = Number(request.plan_revision);
    const row = decisionRequestIssue(request, story, seen, open, revision, resolutions);
    if (row) { addLocus(findings, 'AG608', record.relative, row.field, row.found, row.expected); continue; }
    seen.add(request.request_id);
    if (open && record.type === 'task' && record.data.status !== 'blocked') { addLocus(findings, 'AG608', record.relative, 'status', record.data.status, 'blocked while a Task request is open'); continue; }
    if (request.kind === 'decision') {
      if (request.trigger) addLocus(findings, 'AG608', record.relative, 'Decision request trigger', request.trigger, 'empty for a Decision');
      else if (open && record.type === 'user_story' && record.data.status === 'ready') addLocus(findings, 'AG608', record.relative, 'status', record.data.status, 'a non-ready Story while a Decision is open');
      continue;
    }
    if (record.type !== 'task') { addLocus(findings, 'AG608', record.relative, 'Challenge host type', record.type, 'task'); continue; }
    if (!triggers.includes(request.trigger)) { addLocus(findings, 'AG608', record.relative, 'Challenge trigger', request.trigger, `one of ${triggers.join(', ')}`); continue; }
    const hasTaskOutcome = [...byId.values()].some((item) => item.type === 'task_result' && item.data.parent === record.data.id) || ['task_acceptance', 'task_integration', 'result_adoption'].some((kind) => hasExecutionReceipt(story.body, record.data.id, kind, story.data.plan_revision));
    if (open && (record.data.status !== 'blocked' || hasTaskOutcome)) addLocus(findings, 'AG608', record.relative, hasTaskOutcome ? 'Task outcome' : 'status', hasTaskOutcome ? 'Result or current-plan receipt exists' : record.data.status, hasTaskOutcome ? 'no Result or receipt while a Challenge is open' : 'blocked while a Challenge is open');
  }
}
function decisionRequestIssue(request, story, seen, open, revision, resolutions) {
  if (!story) return { field: 'parent Story', found: 'missing', expected: 'an existing parent Story' };
  if (!request.request_id) return { field: 'request_id', found: request.request_id, expected: 'a non-empty unique request id' };
  if (seen.has(request.request_id)) return { field: 'request_id', found: request.request_id, expected: 'a request id not used by an earlier row' };
  if (!['decision', 'challenge'].includes(request.kind)) return { field: 'kind', found: request.kind, expected: 'decision or challenge' };
  for (const field of ['evidence', 'impact', 'options', 'recommendation', 'requested_decision']) if (!request[field]) return { field, found: request[field], expected: 'a non-empty value' };
  if (!Number.isInteger(revision) || revision < 1) return { field: 'plan_revision', found: request.plan_revision, expected: 'a positive integer' };
  if (open ? revision !== story.data.plan_revision : revision > story.data.plan_revision) return { field: 'plan_revision', found: request.plan_revision, expected: open ? `the current Story plan revision ${story.data.plan_revision}` : `no later than current Story plan revision ${story.data.plan_revision}` };
  if (!isUtc(request.recorded_at_utc)) return { field: 'recorded_at_utc', found: request.recorded_at_utc, expected: 'a UTC timestamp' };
  if (!open && !resolutions.includes(request.resolution)) return { field: 'resolution', found: request.resolution, expected: `one of ${resolutions.join(', ')}` };
  if (!open && !isAuthorityReference(request.authority_ref)) return { field: 'authority_ref', found: request.authority_ref, expected: 'a user: authority reference' };
  if ((request.resolution === '') !== (request.authority_ref === '')) return { field: request.resolution === '' ? 'resolution' : 'authority_ref', found: request.resolution === '' ? request.resolution : request.authority_ref, expected: 'both resolution and authority_ref empty, or both populated' };
  return null;
}
function decisionRequests(body) {
  const section = body.match(/^## Decision requests\s*\r?\n([\s\S]*?)(?=^##\s|(?![\s\S]))/m); if (!section) return { items: [], invalid: false };
  const lines = section[1].split(/\r?\n/); if (lines.some((line) => line.trim() && !line.trim().startsWith('|'))) return { items: [], invalid: true };
  const rows = lines.filter((line) => line.trim().startsWith('|')); const expected = ['request_id', 'kind', 'trigger', 'evidence', 'impact', 'options', 'recommendation', 'requested_decision', 'resolution', 'authority_ref', 'plan_revision', 'recorded_at_utc'];
  const cells = (line) => { const value = line.trim(); return value.startsWith('|') && value.endsWith('|') ? value.slice(1, -1).split('|').map((cell) => cell.trim()) : []; };
  const separator = (line) => cells(line).length === expected.length && cells(line).every((cell) => /^:?-{3,}:?$/.test(cell));
  if (rows.length < 2 || cells(rows[0]).join('|') !== expected.join('|') || !separator(rows[1])) return { items: [], invalid: true };
  const dataRows = rows.slice(2); if (dataRows.some((line) => cells(line).length !== expected.length)) return { items: [], invalid: true };
  const items = dataRows.map((line) => Object.fromEntries(expected.map((key, index) => [key, cells(line)[index]])));
  return { items, invalid: items.some((item) => Object.values(item).some((value) => /[\r\n]/.test(value))) };
}
function validateEpisode(record, byId, findings) {
  const { data, body, relative } = record;
  if (!/^EP-\d{4}$/.test(data.id)) add(findings, 'AG201', 'ERROR', relative);
  const root = path.dirname(path.dirname(path.dirname(path.dirname(record.file))));
  if (!episodeEnabled(root)) add(findings, 'AG610', 'ERROR', relative);
  const sourceResult = value(data, 'provenance.source_result');
  if (typeof sourceResult !== 'string' || byId.get(sourceResult)?.type !== 'task_result') add(findings, 'AG203', 'ERROR', relative);
  if (data.status === 'active' && (!sourceResult || !hasRequiredSection(body, 'Applicability'))) add(findings, 'AG303', 'ERROR', relative);
  const successor = body.match(/^\s*-\s*superseded by:\s*`?(EP-\d{4})`?\s*$/mi)?.[1];
  if (data.status === 'superseded' && (!successor || successor === data.id || byId.get(successor)?.type !== 'episode' || byId.get(successor)?.data.status !== 'active')) addLocus(findings, 'AG301', relative, 'superseded by', successor, 'a different active Episode id');
  const directory = path.dirname(record.file);
  if (listFiles(directory).length !== 1 || !existsSync(path.join(directory, 'EPISODE.md'))) add(findings, 'AG204', 'ERROR', relative);
}
function episodeEnabled(root) {
  const config = path.join(root, '.exorail', 'WORKFLOW_CONFIG.md');
  return existsSync(config) && /^- episode:\s*`?enabled`?(?:\s+#.*)?\s*$/mi.test(readFileSync(config, 'utf8'));
}
function resolvedPolicy(root) {
  const file = path.join(root, '.exorail', 'WORKFLOW_CONFIG.md');
  const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const setting = (name, fallback) => text.match(new RegExp(`^- ${name}:\\s*\`?([^\`\\r\\n#]+)\`?`, 'mi'))?.[1].trim() ?? fallback;
  return {
    allowedReviewBoundaries: setting('allowed review boundaries', 'task').split(',').map((item) => item.trim()).filter(Boolean),
    storyBoundaryAuthorityRequired: setting('Story-boundary authority', 'required') === 'required',
    timingRequired: setting('timing evidence', 'optional') === 'required',
    forecastRequired: setting('Task forecast', 'optional') === 'required',
    allowedExecutionIsolation: setting('allowed execution isolation', 'parallel_safe,parallel_hunk_disjoint,sequential_only').split(',').map((item) => item.trim()).filter(Boolean)
  };
}
function readCapabilityActivations(root, findings = null) {
  const file = path.join(root, '.exorail', 'WORKFLOW_CONFIG.md');
  const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const section = text.match(/^## Capability activation\s*\r?\n([\s\S]*?)(?=^##\s|(?![\s\S]))/m);
  if (!section) return [];
  const lines = section[1].split(/\r?\n/).filter((line) => line.trim().startsWith('|'));
  const cells = (line) => { const value = line.trim(); return value.startsWith('|') && value.endsWith('|') ? value.slice(1, -1).split('|').map((cell) => cell.trim()) : []; };
  const invalid = () => { if (findings) add(findings, 'AG502', 'ERROR', 'WORKFLOW_CONFIG.md:Capability activation'); return []; };
  if (lines.length < 2 || cells(lines[0]).join('|') !== 'capability|mode|adapter_ids' || cells(lines[1]).length !== 3 || !cells(lines[1]).every((cell) => /^:?-{3,}:?$/.test(cell))) return invalid();
  const rows = []; const seen = new Set();
  for (const line of lines.slice(2)) {
    const values = cells(line); if (values.length !== 3) return invalid();
    const [capability, mode, adapterList] = values;
    const adapterIds = adapterList === 'none' ? [] : adapterList.split(',').map((item) => item.trim()).filter(Boolean);
    if (!/^(?:[a-z][a-z0-9]*|x-[a-z0-9-]+)\.[a-z][a-z0-9_]*@\d+$/.test(capability) || !['disabled', 'manual', 'on_demand'].includes(mode) || seen.has(capability) || new Set(adapterIds).size !== adapterIds.length || adapterIds.some((id) => !/^ADAPTER-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))) return invalid();
    seen.add(capability); rows.push({ capability, mode, adapter_ids: adapterIds });
  }
  return rows;
}
export function readTeam(root, findings) {
  const file = path.join(root, '.exorail', 'TEAM.json');
  if (!existsSync(file)) return { members: new Map() };
  try {
    const data = JSON.parse(readFileSync(file, 'utf8')); const members = new Map();
    if (data.schema !== '0.2' || !Array.isArray(data.members)) throw new Error('shape');
    for (const member of data.members) {
      if (!/^[a-z][a-z0-9_-]*$/.test(member.member_id ?? '') || members.has(member.member_id) || typeof member.display_name !== 'string' || !member.display_name.trim() || !['active', 'inactive'].includes(member.status) || !Array.isArray(member.roles) || !member.roles.every(isRole)) throw new Error('member');
      members.set(member.member_id, member);
    }
    return { members };
  } catch { add(findings, 'AG211', 'ERROR', 'TEAM.json'); return { members: new Map() }; }
}
function isAuthorityReference(input) { return typeof input === 'string' && /^user:[a-z0-9][a-z0-9._:-]*$/i.test(input); }
function hasNewExecutionFields(data) {
  return ['execution_mode', 'review_boundary', 'review_mode_confirmation', 'approval_authority'].some((key) => data[key] !== undefined);
}
function validateStoryExecution(data, body, byId, findings, relative, policy, recordFile) {
  if (!hasNewExecutionFields(data)) return;
  if (!['sequential', 'parallel'].includes(data.execution_mode) || !['task', 'story'].includes(data.review_boundary)) add(findings, 'AG604', 'ERROR', relative);
  if (data.approval_authority !== undefined && !isAuthorityReference(data.approval_authority)) add(findings, 'AG601');
  const confirmation = data.review_mode_confirmation;
  if (!policy.allowedReviewBoundaries.includes(data.review_boundary)) add(findings, 'AG402', 'ERROR', relative);
  if (data.review_boundary === 'story' && policy.storyBoundaryAuthorityRequired) {
    if (!confirmation || confirmation.boundary !== 'story' || confirmation.plan_revision !== data.plan_revision || !isUtc(confirmation.confirmed_at_utc) || !isAuthorityReference(confirmation.authority_ref) || !data.approval_owner_role) add(findings, 'AG402', 'ERROR', relative);
  }
  const tasks = [...byId.values()].filter((x) => x.type === 'task' && x.data.parent === data.id);
  if (['ready', 'active'].includes(data.status)) {
    if (!tasks.length || tasks.some((task) => /generic|catch.?all/i.test(task.data.title ?? ''))) add(findings, 'AG604', 'ERROR', relative);
    if (!tasks.some((task) => task.data.plan_revision === data.plan_revision && ['planned', 'ready', 'active', 'blocked'].includes(task.data.status))) add(findings, 'AG604', 'ERROR', relative);
  }
  const receipts = executionReceipts(body);
  const receiptIssue = receipts.invalid
    ? { field: 'Execution receipts table', found: 'malformed', expected: 'the shipped receipt header, separator, and complete rows' }
    : receiptSequenceIssue(receipts.items, data, byId, recordFile);
  if (receiptIssue) addLocus(findings, 'AG606', relative, receiptIssue.field, receiptIssue.found, receiptIssue.expected);
}
export function executionReceipts(body) {
  const section = body.match(/^## Execution receipts\s*\r?\n([\s\S]*?)(?=^##\s|(?![\s\S]))/m);
  if (!section) return { items: [], invalid: false };
  const rows = section[1].split(/\r?\n/).filter((line) => line.trim().startsWith('|'));
  if (rows.length < 2) return { items: [], invalid: true };
  const header = rows[0].split('|').map((cell) => cell.trim()).filter(Boolean);
  const expected = ['receipt_id', 'kind', 'work_id', 'attempt', 'reviewed_sha', 'patch_id', 'plan_revision', 'authority_ref', 'recorded_at_utc', 'integration_commit'];
  if (header.join('|') !== expected.join('|') || !/^\|\s*:?-{3,}/.test(rows[1])) return { items: [], invalid: true };
  const items = rows.slice(2).map((line) => Object.fromEntries(expected.map((key, index) => [key, line.split('|').map((cell) => cell.trim()).filter(Boolean)[index]])));
  return { items, invalid: items.some((item) => Object.values(item).some((value) => !value || /[|\r\n]/.test(value))) };
}
function receiptSequenceIssue(items, story, byId, recordFile) {
  if (!items.length) return story.status === 'completed' ? { field: 'Execution receipts', found: 'empty', expected: 'Story completion receipts' } : null;
  const seen = new Set(); const seenBindings = new Set(); let previousTimestamp = 0; let expectedId = 1;
  for (const [index, receipt] of items.entries()) {
    const storyReceipt = receipt.kind === 'story_acceptance'; const task = byId.get(receipt.work_id);
    const row = `Execution receipts row ${index + 1}`;
    if (receipt.receipt_id !== `ER-${String(expectedId).padStart(4, '0')}`) return { field: `${row}.receipt_id`, found: receipt.receipt_id, expected: `ER-${String(expectedId).padStart(4, '0')}` };
    if (seen.has(receipt.receipt_id)) return { field: `${row}.receipt_id`, found: receipt.receipt_id, expected: 'a receipt id not used by an earlier row' };
    if (!['task_acceptance', 'task_integration', 'result_adoption', 'story_acceptance'].includes(receipt.kind)) return { field: `${row}.kind`, found: receipt.kind, expected: 'task_acceptance, task_integration, result_adoption, or story_acceptance' };
    if (storyReceipt ? receipt.work_id !== story.id : task?.data.parent !== story.id) return { field: `${row}.work_id`, found: receipt.work_id, expected: storyReceipt ? `Story id ${story.id}` : 'a Task whose parent is this Story' };
    if (!Number.isInteger(Number(receipt.attempt)) || Number(receipt.attempt) < 1) return { field: `${row}.attempt`, found: receipt.attempt, expected: 'a positive integer' };
    if (!isCommitSha(receipt.reviewed_sha)) return { field: `${row}.reviewed_sha`, found: receipt.reviewed_sha, expected: 'a commit SHA' };
    if (!isCommitSha(receipt.patch_id)) return { field: `${row}.patch_id`, found: receipt.patch_id, expected: 'a commit SHA' };
    if (!Number.isInteger(Number(receipt.plan_revision)) || Number(receipt.plan_revision) < 1 || Number(receipt.plan_revision) > story.plan_revision) return { field: `${row}.plan_revision`, found: receipt.plan_revision, expected: `a positive integer no greater than Story plan revision ${story.plan_revision}` };
    if (!isAuthorityReference(receipt.authority_ref)) return { field: `${row}.authority_ref`, found: receipt.authority_ref, expected: 'a user: authority reference' };
    if (!isUtc(receipt.recorded_at_utc)) return { field: `${row}.recorded_at_utc`, found: receipt.recorded_at_utc, expected: 'a UTC timestamp' };
    if (Date.parse(receipt.recorded_at_utc) < previousTimestamp) return { field: `${row}.recorded_at_utc`, found: receipt.recorded_at_utc, expected: 'a timestamp not earlier than the preceding receipt' };
    const integration = integrationCommitIssue(receipt, items.slice(0, index), story.review_boundary);
    if (integration) return { field: `${row}.integration_commit`, found: receipt.integration_commit, expected: integration };
    const binding = `${receipt.kind}:${receipt.work_id}:${receipt.attempt}:${receipt.plan_revision}`;
    if (seenBindings.has(binding)) return { field: `${row} binding`, found: binding, expected: 'a kind/work/attempt/revision combination not used by an earlier row' };
    if (!storyReceipt && receipt.kind !== 'result_adoption' && Number(receipt.plan_revision) === story.plan_revision && task.data.plan_revision !== Number(receipt.plan_revision)) return { field: `${row}.plan_revision`, found: receipt.plan_revision, expected: `Task ${task.data.id} plan revision ${task.data.plan_revision}` };
    const taskRuns = !storyReceipt && receipt.kind !== 'result_adoption' ? [...byId.values()].filter((record) => record.type === 'execution_run' && record.data.work_id === receipt.work_id && record.data.plan_revision === Number(receipt.plan_revision)) : [];
    if (taskRuns.length && !taskRuns.some((run) => run.data.attempt === Number(receipt.attempt))) return { field: `${row}.attempt`, found: receipt.attempt, expected: `an attempt recorded for Task ${receipt.work_id} at plan revision ${receipt.plan_revision}` };
    seen.add(receipt.receipt_id); expectedId += 1; previousTimestamp = Date.parse(receipt.recorded_at_utc);
    seenBindings.add(binding);
  }
  const current = items.filter((receipt) => Number(receipt.plan_revision) === story.plan_revision);
  const storyAcceptance = current.filter((receipt) => receipt.kind === 'story_acceptance' && receipt.work_id === story.id);
  if (story.status === 'completed' && (storyAcceptance.length !== 1 || current.at(-1) !== storyAcceptance[0])) return { field: 'Story acceptance placement', found: storyAcceptance.map((receipt) => receipt.receipt_id), expected: 'exactly one current-plan story_acceptance receipt as the final current receipt' };
  if (storyAcceptance.length) {
    const repositoryRoot = recordFile.slice(0, recordFile.lastIndexOf(`${path.sep}.exorail${path.sep}`));
    const aggregate = storyAcceptance[0].reviewed_sha;
    for (const receipt of current.filter((item) => ['task_integration', 'result_adoption'].includes(item.kind))) if (!gitContains(repositoryRoot, receipt.integration_commit, aggregate)) return { field: `${receipt.receipt_id}.integration_commit`, found: receipt.integration_commit, expected: `a commit reachable from Story acceptance reviewed_sha ${aggregate}` };
  }
  if (story.status === 'completed') for (const task of [...byId.values()].filter((item) => item.type === 'task' && item.data.parent === story.id && item.data.status !== 'superseded')) {
    const rows = current.filter((receipt) => receipt.work_id === task.data.id);
    const missing = ['task_acceptance', 'task_integration'].filter((kind) => !rows.some((receipt) => receipt.kind === kind));
    if (!rows.some((receipt) => receipt.kind === 'result_adoption') && missing.length) return { field: `Task ${task.data.id} completion receipts`, found: missing.map((kind) => `missing ${kind}`), expected: 'result_adoption, or both task_acceptance and task_integration for the current plan revision' };
  }
  return null;
}
function isCommitSha(value) { return /^[a-f0-9]{7,64}$/i.test(value ?? ''); }
// Acceptance and integration retain one meaning each. Acceptance always records
// its reviewed commit in `reviewed_sha`; only integration/adoption rows carry an
// `integration_commit`, independently of the selected review boundary.
function integrationCommitIssue(receipt, earlier, boundary) {
  if (receipt.kind === 'story_acceptance') return receipt.integration_commit === 'none' ? null : 'none for story_acceptance';
  if (receipt.kind === 'task_integration') {
    if (!isCommitSha(receipt.integration_commit)) return 'a commit SHA for task_integration';
    if (boundary === 'task' && !earlier.some((prior) => prior.kind === 'task_acceptance' && prior.work_id === receipt.work_id && prior.attempt === receipt.attempt && prior.plan_revision === receipt.plan_revision)) return 'an earlier matching task_acceptance under task review boundary';
    return null;
  }
  if (receipt.kind === 'result_adoption') return isCommitSha(receipt.integration_commit) ? null : 'a commit SHA for result_adoption';
  const integrated = earlier.find((prior) => prior.kind === 'task_integration' && prior.work_id === receipt.work_id && prior.attempt === receipt.attempt && prior.plan_revision === receipt.plan_revision);
  if (boundary === 'task') return !integrated && receipt.integration_commit === 'none' ? null : 'none until task_integration is recorded under task review boundary';
  return integrated ? (receipt.integration_commit === integrated.integration_commit ? null : `matching task_integration commit ${integrated.integration_commit}`) : (receipt.integration_commit === 'none' ? null : 'none before task_integration is recorded');
}
function gitContains(repositoryRoot, ancestor, aggregate) { return spawnSync('git', ['merge-base', '--is-ancestor', ancestor, aggregate], { cwd: repositoryRoot, encoding: 'utf8' }).status === 0; }
function hasExecutionReceipt(body, workId, kind, planRevision) { return executionReceipts(body).items.some((receipt) => receipt.work_id === workId && receipt.kind === kind && Number(receipt.plan_revision) === planRevision); }
function dependencyReleased(story, upstream, byId, receipts) {
  if (!story || !upstream || upstream.type !== 'task' || upstream.data.status !== 'completed') return false;
  const result = [...byId.values()].find((record) => record.type === 'task_result' && record.data.parent === upstream.data.id);
  if (!result || !Array.isArray(result.data.evidence) || !result.data.evidence.length) return false;
  const rows = receipts.filter((receipt) => receipt.work_id === upstream.data.id);
  if (rows.some((receipt) => receipt.kind === 'result_adoption' && Number(receipt.plan_revision) === Number(story.data.plan_revision))) return true;
  const revision = Number(upstream.data.plan_revision);
  const integrated = rows.some((receipt) => receipt.kind === 'task_integration' && Number(receipt.plan_revision) === revision);
  const accepted = rows.some((receipt) => receipt.kind === 'task_acceptance' && Number(receipt.plan_revision) === revision);
  return integrated && (story.data.review_boundary === 'story' || accepted);
}
function validateTaskExecution(record, parent, byId, findings) {
  const { data, relative } = record;
  // A light planned Task is valid backlog. The threshold becomes fail-closed
  // only when its state claims that executable work may start.
  if (data.status === 'ready' || data.status === 'active') validateTaskReadiness(record, parent, findings);
  const usesExecution = ['execution', 'acceptance_refs', 'task_acceptance_criteria', 'change_scope', 'execution_isolation', 'logical_regions'].some((key) => data[key] !== undefined);
  if (!usesExecution) return;
  if (!executionContracts.has(data.execution?.contract)) addLocus(findings, 'AG607', relative, 'execution.contract', data.execution?.contract, `one of ${[...executionContracts].join(', ')}`);
  if (!data.execution || typeof data.execution !== 'object' || Array.isArray(data.execution) || Object.keys(data.execution).some((key) => key !== 'contract')) addLocus(findings, 'AG607', relative, 'execution', data.execution, 'a nested block whose only key is contract');
  const acceptanceRefs = asArray(data.acceptance_refs);
  if (!acceptanceRefs.length || acceptanceRefs.some((ref) => typeof ref !== 'string' || !/^(US-.*-AC-|TASK-AC-)/.test(ref))) addLocus(findings, 'AG603', relative, 'acceptance_refs', data.acceptance_refs, 'a non-empty inline list of criterion references, each starting US-<slug>-AC- or TASK-AC-');
  const scope = data.change_scope || {};
  const exceptional = ['externally_consequential', 'destructive', 'security_sensitive', 'data_sensitive', 'migration', 'public_api', 'architecture', 'parallel_integration'].includes(scope.change_class) || ['high', 'critical'].includes(scope.risk) || scope.material_replan === true;
  if (!scope || !['routine', 'externally_consequential', 'destructive', 'security_sensitive', 'data_sensitive', 'migration', 'public_api', 'architecture', 'parallel_integration'].includes(scope.change_class) || !['low', 'medium', 'high', 'critical'].includes(scope.risk) || !Array.isArray(scope.corroborated_paths)) add(findings, 'AG605');
  if (exceptional && data.contract_required !== 'required') add(findings, 'AG605');
  const contract = [...byId.values()].find((x) => x.type === 'task_contract' && x.data.parent === data.id);
  if (data.contract_required === 'required' && (!contract || !isAuthorityReference(contract.data.approval_authority))) add(findings, 'AG605');
  const narrativeContractRequired = contractRequirementClaim(record.body);
  if (narrativeContractRequired && narrativeContractRequired !== data.contract_required) addLocus(findings, 'AG605', relative, 'Contract requirement.contract_required', narrativeContractRequired, `front matter contract_required ${data.contract_required}`);
  if (!['parallel_safe', 'parallel_hunk_disjoint', 'sequential_only'].includes(data.execution_isolation)) add(findings, 'AG609', 'ERROR', relative);
  if (data.execution_isolation === 'parallel_hunk_disjoint' && (!Array.isArray(data.logical_regions) || !data.logical_regions.length)) add(findings, 'AG609', 'ERROR', relative);
  const receipts = executionReceipts(parent?.body ?? '').items;
  for (const dependency of asArray(data.depends_on)) {
    if (['ready', 'active'].includes(data.status) && !dependencyReleased(parent, byId.get(dependency), byId, receipts)) add(findings, 'AG609', 'ERROR', relative);
  }
  if (parent?.data.execution_mode === 'parallel' && data.execution_isolation === 'sequential_only' && data.status === 'active') {
    const activeWriters = [...byId.values()].filter((x) => x.type === 'task' && x.data.parent === data.parent && x.data.id !== data.id && x.data.status === 'active');
    if (activeWriters.length) add(findings, 'AG609', 'ERROR', relative);
  }
}
function sectionText(body, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const section = body.match(new RegExp(`^## ${escaped}\\s*\\r?\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, 'm'));
  return section?.[1]?.trim() ?? '';
}
function contractRequirementClaim(body) {
  const live = sectionText(body, 'Contract requirement').replace(/```[\s\S]*?```/g, ' ').replace(/<!--[\s\S]*?(?:-->|$)/g, ' ');
  return live.match(/`contract_required`\s+is\s+`(required|not_required)`\s*:/i)?.[1] ?? null;
}
function observableCriterion(value) {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase().replace(/[.!?]+$/g, '');
  const emptyOrGeneric = new Set(['done', 'works', 'improved', 'tests pass', 'tbd', 'todo', 'none']);
  // A criterion is not observable merely because it is long.  It must name
  // something a reader can inspect; otherwise "tests pass" and "run tests"
  // are interchangeable placeholders with different punctuation.
  return normalized.length >= 12
    && !emptyOrGeneric.has(normalized)
    && /\b(output|result|report|evidence|receipt|response|status|artifact|record|file|listing|diff|assertion)\b/i.test(value);
}
function qualityGateNamesEvidence(value) {
  return observableCriterion(value)
    && /\b(run|verify|inspect|assert|check|compare|review|execute)\b/i.test(value);
}
function storyCriterionIds(story) {
  return new Set([...sectionText(story?.body ?? '', 'Acceptance criteria').matchAll(/\b(US-[A-Za-z0-9-]+-AC-[A-Za-z0-9-]+)\b/g)].map((match) => match[1]));
}
function validateTaskReadiness(record, parent, findings) {
  for (const id of taskReadinessFailures(record, parent)) {
    if (id.locus) addLocus(findings, id.id, record.relative, id.field, id.found, id.expected);
    else add(findings, id.id, 'ERROR', record.relative);
  }
}
function taskReadinessFailures(record, parent) {
  const failures = [];
  const criteria = asArray(record.data.task_acceptance_criteria);
  if (!criteria.length) failures.push({ id: 'AG620', locus: true, field: 'task_acceptance_criteria', found: criteria, expected: 'at least one observable acceptance criterion' });
  else {
    const index = criteria.findIndex((criterion) => !observableCriterion(criterion));
    if (index >= 0) failures.push({ id: 'AG620', locus: true, field: `task_acceptance_criteria[${index + 1}]`, found: criteria[index], expected: 'a non-generic criterion of at least 12 characters that names an observable output, result, report, evidence, receipt, response, status, artifact, record, file, listing, diff, or assertion' });
  }
  const knownStoryCriteria = storyCriterionIds(parent);
  const references = asArray(record.data.acceptance_refs);
  if (!references.length || references.some((reference) => typeof reference !== 'string' || !knownStoryCriteria.has(reference))) failures.push({ id: 'AG621' });
  const acceptance = sectionText(record.body, 'Acceptance');
  const qualityGate = sectionText(record.body, 'Quality gate');
  if (!observableCriterion(acceptance)) failures.push({ id: 'AG622', locus: true, field: 'Acceptance', found: acceptance, expected: 'an observable Acceptance section that names an inspectable output, result, report, evidence, receipt, response, status, artifact, record, file, listing, diff, or assertion' });
  else if (!qualityGateNamesEvidence(qualityGate)) failures.push({ id: 'AG622', locus: true, field: 'Quality gate', found: qualityGate, expected: 'an observable Quality gate that names verification evidence and a run, verify, inspect, assert, check, compare, review, or execute action' });
  return failures;
}
function validateResultExecution(record, parent, byId, findings) {
  const { data, relative } = record;
  const usesExecution = ['acceptance_evidence', 'execution_run_id', 'scope_paths'].some((key) => data[key] !== undefined);
  if (!usesExecution) return;
  if (!Array.isArray(data.acceptance_evidence) || !data.acceptance_evidence.length || data.acceptance_evidence.some((item) => typeof item !== 'string')) addLocus(findings, 'AG603', relative, 'acceptance_evidence', data.acceptance_evidence, 'a non-empty inline list of strings naming the evidence for each acceptance reference');
  if (parent.data.execution?.contract && data.execution_run_id === undefined) addLocus(findings, 'AG607', relative, 'execution_run_id', undefined, 'the id of the Run this Result closes, because its Task declares an execution contract');
  if (data.execution_run_id !== undefined) { const run = byId.get(data.execution_run_id); if (!run || run.type !== 'execution_run' || run.data.work_id !== parent.data.id || run.data.status !== 'terminal' || run.data.terminal_outcome !== 'result_candidate' || run.data.result_id !== data.id) addLocus(findings, 'AG607', relative, 'execution_run_id', data.execution_run_id, `a terminal result_candidate Run for Task ${parent.data.id} whose result_id is ${data.id}`); }
  if (!Array.isArray(data.scope_paths) || data.scope_paths.some((entry) => !asArray(parent.data.affected_paths).includes(entry))) addLocus(findings, 'AG607', relative, 'scope_paths', data.scope_paths, `an inline list drawn from the Task's affected_paths: ${JSON.stringify(asArray(parent.data.affected_paths))}`);
}
function validateReviewContext(data, findings, relative) {
  const validList = (value, allowEmpty) => Array.isArray(value) && (allowEmpty || value.length > 0) && value.every((item) => typeof item === 'string' && item.trim().length > 0);
  if (data.review_focus !== undefined && !validList(data.review_focus, false)) addLocus(findings, 'AG206', relative, 'review_focus', data.review_focus, 'a non-empty inline list of non-empty strings');
  if (data.not_verified !== undefined && !validList(data.not_verified, true)) addLocus(findings, 'AG206', relative, 'not_verified', data.not_verified, 'an inline list of non-empty strings, possibly empty');
}
function validateContainer(record, byId, findings) {
  const childType = record.type === 'epic' ? 'feature' : 'user_story';
  const children = [...byId.values()].filter((x) => x.type === childType && x.data.parent === record.data.id);
  if (record.data.status === 'active' && !children.some((child) => ['ready', 'active', 'blocked'].includes(child.data.status))) addLocus(findings, 'AG301', record.relative, `${childType} child statuses`, children.map((child) => `${child.data.id}:${child.data.status}`), `at least one ${childType} child in ready, active, or blocked state`);
  if (record.data.status === 'completed' && !children.length) add(findings, 'AG303');
  if (record.data.status === 'completed' && !children.every((child) => child.data.status === 'completed')) add(findings, 'AG303');
}
function overlaps(left, right) { return left.some((item) => right.includes(item)); }
function carriesWork(type) { return type === 'epic' || type === 'feature' || type === 'user_story' || type === 'task'; }
// A Task joins its Story's parallel wave through its derived isolation. The
// optional execution_mode override still counts, so a Task that declares only
// the override is a member too.
function isParallelMember(data) { return data.execution_mode === 'parallel' || data.execution_isolation === 'parallel_safe' || data.execution_isolation === 'parallel_hunk_disjoint'; }
// Two wave members conflict on a shared resource, and on a shared path unless
// both are hunk-disjoint and declare non-overlapping logical regions. Runtime
// workspace and branch bindings are deliberately outside the canonical model.
export function waveConflict(left, right) {
  if (overlaps(asArray(left.resources), asArray(right.resources))) return true;
  if (!overlaps(asArray(left.affected_paths), asArray(right.affected_paths))) return false;
  const hunkDisjoint = left.execution_isolation === 'parallel_hunk_disjoint' && right.execution_isolation === 'parallel_hunk_disjoint';
  return !(hunkDisjoint && asArray(left.logical_regions).length && asArray(right.logical_regions).length && !overlaps(asArray(left.logical_regions), asArray(right.logical_regions)));
}
function validateMilestone(record, byId, findings) {
  const stories = asArray(record.data.stories);
  if (!stories.length || new Set(stories).size !== stories.length || stories.some((id) => byId.get(id)?.type !== 'user_story')) add(findings, 'AG203');
  if (record.data.target_date_utc && !isUtc(record.data.target_date_utc)) addLocus(findings, 'AG208', record.relative, 'target_date_utc', record.data.target_date_utc, 'an RFC 3339 UTC timestamp, for example 2026-09-20T09:00:00Z');
  if (record.data.status === 'active' && !stories.some((id) => ['ready', 'active', 'blocked'].includes(byId.get(id)?.data.status))) addLocus(findings, 'AG301', record.relative, 'Story statuses', stories.map((id) => `${id}:${byId.get(id)?.data.status ?? 'missing'}`), 'at least one listed Story in ready, active, or blocked state');
  if (record.data.status === 'completed' && !stories.every((id) => byId.get(id)?.data.status === 'completed')) add(findings, 'AG303');
}
function validateAdapter(data, findings) {
  const opaque = /^x-[a-z0-9]+(?:-[a-z0-9]+)+$/.test(data.family ?? '');
  if ((!standardAdapterFamilies.has(data.family) && !opaque) || !Number.isInteger(data.descriptor_revision) || data.descriptor_revision < 1 || !/^\d+$/.test(String(data.contract_version ?? '')) || !Array.isArray(data.capabilities) || new Set(data.capabilities).size !== data.capabilities.length) { add(findings, 'AG502'); return; }
  for (const capability of data.capabilities) {
    const standardNamespace = /^(integration|execution|projection)\./.test(capability);
    if (!/^(?:[a-z][a-z0-9]*|x-[a-z0-9-]+)\.[a-z][a-z0-9_]*@\d+$/.test(capability) || (standardNamespace && (!standardCapabilities.has(capability) || standardCapabilities.get(capability) !== data.family))) add(findings, 'AG502');
  }
}
function validateExecutionRun(data, byId, findings, relative) {
  const task = byId.get(data.work_id); const adapter = data.adapter_id === 'none' ? null : byId.get(data.adapter_id);
  const paired = (data.adapter_id === 'none') === (data.adapter_descriptor_revision === 'none');
  const historicalDescriptor = data.adapter_id === 'none' || (adapter && adapter.type === 'adapter_profile' && Number.isInteger(data.adapter_descriptor_revision) && data.adapter_descriptor_revision >= 1 && data.adapter_descriptor_revision <= adapter.data.descriptor_revision);
  if (!task || task.type !== 'task' || data.plan_revision !== task.data.plan_revision || !Number.isInteger(data.attempt) || data.attempt < 1 || !executionContracts.has(data.execution_contract) || !/^execution-governance-input@1:[a-f0-9]{64}$/.test(data.governance_input_digest ?? '') || !paired || !historicalDescriptor) add(findings, 'AG607', 'ERROR', relative);
  if (data.status === 'open' && (data.terminal_outcome !== 'none' || data.completed_at_utc !== 'none' || data.result_id !== 'none')) add(findings, 'AG607', 'ERROR', relative);
  if (data.status === 'terminal' && (!['result_candidate', 'failed', 'cancelled', 'abandoned'].includes(data.terminal_outcome) || !isUtc(data.completed_at_utc) || Date.parse(data.completed_at_utc) < Date.parse(data.started_at_utc))) add(findings, 'AG607', 'ERROR', relative);
  if (data.terminal_outcome === 'result_candidate' && byId.get(data.result_id)?.type !== 'task_result') add(findings, 'AG607', 'ERROR', relative);
}
function validateExternalAction(data, byId, findings, relative) {
  const adapter = byId.get(data.adapter_id); const work = byId.get(data.work_id);
  const historicalDescriptor = adapter && adapter.type === 'adapter_profile' && adapter.data.family === 'integration' && Number.isInteger(data.adapter_descriptor_revision) && data.adapter_descriptor_revision >= 1 && data.adapter_descriptor_revision <= adapter.data.descriptor_revision;
  if (!historicalDescriptor || !work || !['task', 'user_story', 'feature', 'epic'].includes(work.type) || !['consequential', 'destructive'].includes(data.consequence) || typeof data.idempotency_key !== 'string' || data.idempotency_key === 'none' || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(data.idempotency_key)) add(findings, 'AG607', 'ERROR', relative);
  if (['authorized', 'applied', 'failed'].includes(data.status) && !isAuthorityReference(data.authority_ref)) add(findings, 'AG601', 'ERROR', relative);
  if (data.status === 'applied' && (typeof data.external_ref !== 'string' || data.external_ref === 'none')) add(findings, 'AG607', 'ERROR', relative);
}
function validateRunAndActionUniqueness(records, findings) {
  const bySlice = new Map();
  for (const run of records.filter((record) => record.type === 'execution_run')) {
    const key = `${run.data.work_id}:${run.data.plan_revision}`;
    if (!bySlice.has(key)) bySlice.set(key, []);
    bySlice.get(key).push(run);
  }
  for (const [slice, runs] of bySlice) {
    const attempts = runs.map((run) => run.data.attempt);
    if (attempts.some((attempt) => attempt >= 4)) add(findings, 'AG623', 'ERROR', `${slice}: attempt 4 or greater`);
    if (new Set(attempts).size !== attempts.length) { add(findings, 'AG624', 'ERROR', `${slice}: duplicate attempt number`); continue; }
    const ordered = [...runs].sort((left, right) => left.data.attempt - right.data.attempt);
    for (let index = 0; index < ordered.length; index += 1) {
      const run = ordered[index];
      if (run.data.attempt !== index + 1) { add(findings, 'AG624', 'ERROR', `${slice}: skipped predecessor before attempt ${run.data.attempt}`); break; }
      if (index > 0 && ordered[index - 1].data.status !== 'terminal') { add(findings, 'AG624', 'ERROR', `${slice}: predecessor attempt ${ordered[index - 1].data.attempt} is not terminal`); break; }
      if (index > 0 && ordered[index - 1].data.terminal_outcome === 'result_candidate') { add(findings, 'AG625', 'ERROR', `${slice}: attempt ${run.data.attempt} follows a terminal result candidate`); break; }
      if (index > 0 && ['cancelled', 'abandoned'].includes(ordered[index - 1].data.terminal_outcome)) { add(findings, 'AG628', 'ERROR', `${slice}: attempt ${run.data.attempt} follows terminal ${ordered[index - 1].data.terminal_outcome}`); break; }
    }
  }
  const actions = records.filter((record) => record.type === 'external_action').map((record) => record.data.idempotency_key);
  if (new Set(actions).size !== actions.length) add(findings, 'AG607');
}
function validateTaskRunLifecycle(records, findings) {
  for (const task of records.filter((record) => record.type === 'task')) {
    const attempts = attemptsFor(task, records);
    if (task.data.status === 'ready' && attempts.length) {
      const latest = attempts.at(-1);
      const recovery = latest.data.status === 'open'
        ? 'complete the transition to active'
        : latest.data.terminal_outcome === 'failed'
          ? 'restore active and use retry admission'
          : latest.data.terminal_outcome === 'result_candidate'
            ? 'use the existing Result/review route'
            : 'supersede the Task and create a successor';
      addLocus(findings, 'AG626', task.relative, 'status/current-revision execution Runs', 'ready with recorded Run', recovery);
    }
  }
}
function validateTiming(record, findings, policy) {
  const t = record.data.timing;
  if (!t || Object.keys(t).length === 0) { if (policy.timingRequired) add(findings, 'AG305'); return; }
  const minutes = ['active_minutes', 'blocked_minutes', 'review_wait_minutes']; const intervals = timingIntervals(record.body);
  const timingError = (field, found, expected) => addLocus(findings, 'AG306', record.relative, field, found, expected);
  if (!isUtc(t.started_at_utc)) { timingError('timing.started_at_utc', t.started_at_utc, 'an RFC 3339 UTC timestamp'); return; }
  if (!isUtc(t.completed_at_utc) || Date.parse(t.completed_at_utc) < Date.parse(t.started_at_utc)) { timingError('timing.completed_at_utc', t.completed_at_utc, `an RFC 3339 UTC timestamp no earlier than ${t.started_at_utc}`); return; }
  if (!Number.isInteger(t.remediation_attempts) || t.remediation_attempts < 0 || t.remediation_attempts > 3) { timingError('timing.remediation_attempts', t.remediation_attempts, 'an integer from 0 through 3'); return; }
  const invalidMinutes = minutes.find((key) => !Number.isInteger(t[key]) || t[key] < 0);
  if (invalidMinutes) { timingError(`timing.${invalidMinutes}`, t[invalidMinutes], 'a non-negative whole minute count'); return; }
  if (intervals.invalid) { timingError('Timing intervals', 'malformed or incomplete table', 'rows with kind, started_at_utc and completed_at_utc'); return; }
  if (!intervals.items.length && minutes.some((key) => t[key] !== 0)) { timingError('Timing intervals', 'missing', 'interval rows whose whole-minute sums match timing totals'); return; }
  let previous = Date.parse(t.started_at_utc); const sums = { active: 0, blocked: 0, review_wait: 0 };
  for (const interval of intervals.items) {
    const start = Date.parse(interval.started_at_utc); const end = Date.parse(interval.completed_at_utc);
    if (!['active', 'blocked', 'review_wait'].includes(interval.kind) || !isUtc(interval.started_at_utc) || !isUtc(interval.completed_at_utc) || !Number.isFinite(start) || !Number.isFinite(end) || start < previous || end < start || end > Date.parse(t.completed_at_utc)) { timingError('Timing intervals', interval, `ordered ${interval.kind} rows within ${t.started_at_utc} through ${t.completed_at_utc}`); return; }
    sums[interval.kind] += (end - start) / 60000; previous = end;
  }
  const mismatched = [['active', 'active_minutes'], ['blocked', 'blocked_minutes'], ['review_wait', 'review_wait_minutes']].find(([kind, field]) => sums[kind] !== t[field]);
  if (mismatched) { const [kind, field] = mismatched; timingError(`timing.${field}`, t[field], `the computed ${kind} interval sum: ${sums[kind]}`); }
}
function timingIntervals(body) {
  const section = body.match(/^## Timing intervals\s*\r?\n([\s\S]*?)(?=^##\s|(?![\s\S]))/m);
  if (!section) return { items: [], invalid: false };
  const rows = section[1].split(/\r?\n/).filter((line) => line.trim().startsWith('|'));
  if (rows.length < 2) return { items: [], invalid: true };
  const expected = ['kind', 'started_at_utc', 'completed_at_utc'];
  const cells = (line) => line.split('|').map((cell) => cell.trim()).filter(Boolean);
  if (cells(rows[0]).join('|') !== expected.join('|') || !/^\|\s*:?-{3,}/.test(rows[1])) return { items: [], invalid: true };
  const items = rows.slice(2).map((line) => Object.fromEntries(expected.map((key, index) => [key, cells(line)[index]])));
  return { items, invalid: items.some((item) => !item.kind || !item.started_at_utc || !item.completed_at_utc || Object.values(item).some((value) => /[|\r\n]/.test(value))) };
}
function validateProjections(root, records, team, findings) {
  const projectionRoot = path.join(root, '.exorail', 'projections'); if (!existsSync(projectionRoot)) return;
  const episodeIndex = path.join(projectionRoot, 'EPISODE_INDEX.md');
  if (!episodeEnabled(root) && existsSync(episodeIndex)) addLocus(findings, 'AG501', 'projections/EPISODE_INDEX.md', 'projection', 'left over while episodes are disabled', 'no EPISODE_INDEX.md until episodes are enabled and generated');
  for (const name of projectionNamesFor(root)) { const file = path.join(projectionRoot, name); const relative = `projections/${name}`; if (!existsSync(file)) { addLocus(findings, 'AG501', relative, 'projection', 'missing', 'current generator-owned content'); continue; } const expected = projectionContent(name, records, team); if (readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== expected) addLocus(findings, 'AG501', relative, 'projection', 'stale or manually edited content', 'current generator-owned content'); }
}
function asArray(value) { return Array.isArray(value) ? value : []; }
function isRole(value) { return typeof value === 'string' && /^[a-z][a-z0-9_-]*$/.test(value); }
function hasRequiredSection(body, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const section = body.match(new RegExp(`^## ${escaped}\\s*\\r?\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, 'm'));
  return Boolean(section && /\S/.test(section[1]));
}
function rank(value) { return ['none', 'sequential', 'parallel'].includes(value) ? ['none', 'sequential', 'parallel'].indexOf(value) : ['minimal', 'standard', 'full'].indexOf(value); }
function dedupe(findings) { return findings.filter((f, index) => findings.findIndex((other) => other.id === f.id && other.severity === f.severity && other.message === f.message) === index); }

// Admission validation, for the derivations that authorize or recommend the
// next execution. It is deliberately narrower than `validate`: everything whose
// subject is canonical state blocks, and a stale generated artifact does not.
// `findings.mjs` owns that distinction; see `isAdmissionBlocking`.
export function validateForAdmission(root) {
  return validate(root).findings.filter(isAdmissionBlocking);
}

export function deriveExecutableFrontier(root, storyId) {
  // The frontier decides which work may start, so it is the operational
  // derivation that most needs admission. Gating it on `collect` alone checked
  // only that the records parse: every lifecycle, dependency, policy, revision
  // and receipt rule was absent here, so the frontier could -- and did --
  // report eligible work on state the validator rejects.
  const blocking = validateForAdmission(root);
  if (blocking.length) {
    const error = new Error(`workflow_invalid: ${blocking.map((finding) => finding.id).join(', ')}`);
    error.reason = 'workflow_invalid'; error.findings = blocking;
    throw error;
  }
  const findings = []; const records = collect(root, findings);
  if (findings.some((finding) => finding.severity === 'ERROR')) throw new Error('canonical input is not readable');
  const story = records.find((record) => record.type === 'user_story' && record.data.id === storyId);
  // Repeating the caller's argument back at them is not an answer when the
  // reason it does not resolve is that there are no Stories at all. A reader
  // asking what can start needs to be told which of the two situations they
  // are in, and where to go next in each.
  if (!story) {
    const stories = records.filter((record) => record.type === 'user_story').map((record) => record.data.id).sort();
    if (stories.length === 0) throw new Error(`unknown Story ${storyId}: this workspace has no Story records yet. Create one under .exorail/planning/epics/<epic>/features/<feature>/stories/, following .exorail/method/PROJECT_SETUP.md`);
    throw new Error(`unknown Story ${storyId}: this workspace has ${stories.join(', ')}`);
  }
  const tasks = storyTasks(story, records);
  const receipts = executionReceipts(story.body).items;
  // A proposed blocking decision prevents the affected Task from becoming
  // ready. The frontier is the surface OPERATING_FLOW.md names for launch, so
  // it must report that, or the launch surface contradicts the launch rule.
  //
  // Openness is an empty `resolution` cell: the Decision requests table has no
  // status word to match on, which is why a predicate looking for one never
  // fires on a real record.
  // Scope matters: a Story-hosted question blocks every Task under it, which
  // the method documents as deliberate and coarse. A question hosted by one
  // Task blocks that Task alone. Testing both together blocked siblings that
  // had nothing to do with the question.
  const storyDecisionOpen = openDecisionRequests(story.body).length > 0;
  const eligible = []; const blocked = [];
  // `blocked` Tasks belong in this surface, not outside it. A Task hosting an
  // open Decision request must itself be `blocked` -- the validator requires
  // it -- so filtering the candidate set to planned/ready made the
  // `decision_request_open` reason below unreachable for a Task-hosted
  // question: it could only ever fire on state the validator rejects. The
  // launch surface then answered "what can start" while staying silent about
  // work that exists and cannot, which is the half an operator needs a reason
  // for.
  for (const task of tasks.filter((record) => ['planned', 'ready', 'blocked'].includes(record.data.status))) {
    const reasons = [];
    if (task.data.status === 'blocked') reasons.push('status_blocked');
    reasons.push(...sharedAdmissionReasons(task, story, records, { tasks, receipts, storyDecisionOpen }));
    (reasons.length ? blocked : eligible).push(reasons.length ? { task_id: task.data.id, reasons } : task.data.id);
  }
  for (const task of tasks.filter((record) => record.data.status === 'active')) {
    const attempts = attemptsFor(task, records); const latest = attempts.at(-1);
    if (remediationExhausted(task, records)) blocked.push({ task_id: task.data.id, reasons: ['remediation_exhausted:attempts_1_to_3'] });
    else if (latest?.data.status === 'terminal' && ['cancelled', 'abandoned'].includes(latest.data.terminal_outcome)) blocked.push({ task_id: task.data.id, reasons: [`supersession_required:terminal_${latest.data.terminal_outcome}`] });
  }
  // Dependency order already removes unavailable work. A sequential Story adds
  // the missing rule for independently ready work: only its first eligible
  // Task is offered until that slice advances through the existing lifecycle.
  if (story.data.execution_mode === 'sequential' && eligible.length > 1) {
    const first = eligible[0];
    for (const taskId of eligible.slice(1)) blocked.push({ task_id: taskId, reasons: [`sequential_wait:${first}`] });
    eligible.splice(1);
  }
  const inputDigest = sha256([story.text, ...tasks.map((task) => task.text), JSON.stringify(receipts)].join('\n'));
  return {
    contract: 'executable-frontier@1', story_id: storyId, plan_revision: story.data.plan_revision,
    review_boundary: story.data.review_boundary, eligible, blocked,
    delegation_capabilities_by_task: Object.fromEntries(eligible.map((taskId) => [taskId, executionContracts.has(byIdTaskContract(tasks, taskId)) ? ['execution.durable@1', 'execution.observe@1'] : []])), input_digest: inputDigest
  };
}
function byIdTaskContract(tasks, taskId) { return tasks.find((task) => task.data.id === taskId)?.data.execution?.contract; }
function storyTasks(story, records) { return records.filter((record) => record.type === 'task' && record.data.parent === story.data.id).sort((left, right) => left.data.id.localeCompare(right.data.id)); }
function attemptsFor(task, records) {
  return records.filter((record) => record.type === 'execution_run' && record.data.work_id === task.data.id && record.data.plan_revision === task.data.plan_revision)
    .sort((left, right) => left.data.attempt - right.data.attempt);
}
function remediationExhausted(task, records) {
  const attempts = attemptsFor(task, records);
  return attempts.length === 3 && attempts.every((attempt) => attempt.data.status === 'terminal' && attempt.data.terminal_outcome !== 'result_candidate');
}
function sharedAdmissionReasons(task, story, records, { tasks = storyTasks(story, records), receipts = executionReceipts(story.body).items, storyDecisionOpen = openDecisionRequests(story.body).length > 0 } = {}) {
  const byId = new Map(records.map((record) => [record.data.id, record])); const reasons = [];
  if (storyDecisionOpen || openDecisionRequests(task.body).length > 0) reasons.push('decision_request_open');
  if (task.data.plan_revision !== story.data.plan_revision) reasons.push('revision_stale');
  if (task.data.execution?.contract && !executionContracts.has(task.data.execution.contract)) reasons.push('execution_contract_unavailable');
  for (const dependency of asArray(task.data.depends_on)) if (!dependencyReleased(story, tasks.find((candidate) => candidate.data.id === dependency), byId, receipts)) reasons.push(`dependency_unavailable:${dependency}`);
  for (const failure of taskReadinessFailures(task, story)) reasons.push(`readiness_incomplete:${failure.id}`);
  return reasons;
}
function evaluateAdmission(task, story, records, mode) {
  const attempts = attemptsFor(task, records); const latest = attempts.at(-1);
  const reasons = sharedAdmissionReasons(task, story, records);
  if (mode === 'initial') {
    if (task.data.status !== 'ready') reasons.unshift(`status_not_ready:${task.data.status}`);
    if (attempts.length) reasons.unshift('current_revision_run_exists');
  } else if (mode === 'retry') {
    if (task.data.status !== 'active') reasons.unshift(`status_not_active:${task.data.status}`);
    if (!latest || latest.data.status !== 'terminal' || latest.data.terminal_outcome !== 'failed') reasons.unshift('latest_attempt_not_terminal_failed');
    if (attempts.some((attempt) => attempt.data.status === 'open')) reasons.unshift('open_attempt_exists');
    if (attempts.length >= 3) reasons.unshift('attempt_limit_exhausted');
  } else reasons.unshift(`unsupported_admission_mode:${mode}`);
  return { admitted: reasons.length === 0, mode, reasons, latest_attempt: latest?.data.id ?? 'none' };
}
export function evaluateTaskAdmission(root, taskId, mode) {
  const blocking = validateForAdmission(root);
  if (blocking.length) {
    const error = new Error(`workflow_invalid: ${blocking.map((finding) => finding.id).join(', ')}`);
    error.reason = 'workflow_invalid'; error.findings = blocking; throw error;
  }
  const findings = []; const records = collect(root, findings);
  const task = records.find((record) => record.type === 'task' && record.data.id === taskId);
  const story = task && records.find((record) => record.type === 'user_story' && record.data.id === task.data.parent);
  if (findings.some((finding) => finding.severity === 'ERROR') || !task || !story) throw new Error('task admission inputs are invalid');
  return evaluateAdmission(task, story, records, mode);
}

export function deriveCapabilityResolution(root, capability, bindings = new Map(), { required = false, manualRequested = false } = {}) {
  const findings = []; const records = collect(root, findings); const activations = readCapabilityActivations(root, findings);
  if (findings.length) return { contract: 'capability-resolution@1', capability, mode: 'disabled', required, candidates: [], eligible_adapter_ids: [], selected_adapter_id: 'none', available: false, reason: 'invalid_project_state' };
  const activation = activations.find((item) => item.capability === capability);
  const base = { contract: 'capability-resolution@1', capability, mode: activation?.mode ?? 'disabled', required, candidates: [], eligible_adapter_ids: [], selected_adapter_id: 'none', available: false, reason: 'capability_disabled' };
  if (!activation || activation.mode === 'disabled') return base;
  if (activation.mode === 'manual' && !manualRequested) return { ...base, reason: 'manual_request_required' };
  const expectedFamily = standardCapabilities.get(capability);
  if (!expectedFamily) return { ...base, reason: 'capability_conformance_mismatch' };
  const candidates = []; const eligible = [];
  for (const adapterId of activation.adapter_ids) {
    const descriptor = records.find((record) => record.type === 'adapter_profile' && record.data.id === adapterId);
    const binding = bindings instanceof Map ? bindings.get(adapterId) : bindings?.[adapterId];
    let reason = 'eligible';
    if (!descriptor || descriptor.data.status !== 'active' || descriptor.data.family !== expectedFamily || !descriptor.data.capabilities.includes(capability)) reason = 'capability_conformance_mismatch';
    else if (!binding) reason = 'binding_unavailable';
    else if (binding.conformant !== true || !asArray(binding.live_capabilities).includes(capability)) reason = 'capability_conformance_mismatch';
    else if (binding.health?.available !== true) reason = 'adapter_unhealthy';
    candidates.push({ adapter_id: adapterId, eligible: reason === 'eligible', reason });
    if (reason === 'eligible') eligible.push(adapterId);
  }
  if (!eligible.length) return { ...base, candidates, reason: required ? 'required_capability_unavailable' : candidates[0]?.reason ?? 'binding_unavailable' };
  return { ...base, candidates, eligible_adapter_ids: eligible, selected_adapter_id: eligible[0], available: true, reason: 'selected' };
}

export function deriveEffectiveConfiguration(root, taskId, capability, bindings = new Map(), options = {}) {
  const findings = []; const records = collect(root, findings); const task = records.find((record) => record.type === 'task' && record.data.id === taskId); const story = task && records.find((record) => record.type === 'user_story' && record.data.id === task.data.parent);
  if (findings.length || !task || !story) throw new Error('effective configuration inputs are invalid');
  const policy = resolvedPolicy(root); const activations = readCapabilityActivations(root); const resolution = deriveCapabilityResolution(root, capability, bindings, options);
  const activation = activations.find((item) => item.capability === capability) ?? null;
  const inputs = {
    story: { id: story.data.id, plan_revision: story.data.plan_revision, review_boundary: story.data.review_boundary },
    task: { id: task.data.id, plan_revision: task.data.plan_revision, execution_contract: task.data.execution?.contract },
    policy: normalizedRunPolicy(policy, story.data.review_boundary), activation, capability
  };
  return {
    contract: 'effective-configuration@1', work_id: taskId,
    values: {
      review_boundary: { value: story.data.review_boundary, source: `Story:${story.data.id}:revision:${story.data.plan_revision}`, precedence: 1 },
      execution_contract: { value: task.data.execution?.contract ?? 'none', source: `Task:${task.data.id}:revision:${task.data.plan_revision}`, precedence: 2 },
      capability_activation: { value: resolution.mode, source: activations.some((item) => item.capability === capability) ? 'project Policy' : 'fail-closed default', precedence: 3 },
      selected_adapter_id: { value: resolution.selected_adapter_id, source: resolution.available ? 'ordered capability activation' : resolution.reason, precedence: 6 }
    },
    capability_resolution: resolution,
    input_digest: sha256(stableSerialize(inputs))
  };
}

export function deriveGovernanceInputDigest(root, taskId, adapterId = 'none') {
  const findings = []; const records = collect(root, findings); const task = records.find((record) => record.type === 'task' && record.data.id === taskId); const story = task && records.find((record) => record.type === 'user_story' && record.data.id === task.data.parent);
  if (findings.length || !task || !story) throw new Error('governance input is invalid');
  const policy = resolvedPolicy(root); const descriptor = adapterId === 'none' ? null : records.find((record) => record.type === 'adapter_profile' && record.data.id === adapterId);
  if (adapterId !== 'none' && !descriptor) throw new Error(`unknown adapter ${adapterId}`);
  const requiredCapabilities = executionContracts.has(task.data.execution?.contract) ? ['execution.durable@1', 'execution.observe@1'] : [];
  const activations = descriptor ? readCapabilityActivations(root).filter((activation) => requiredCapabilities.includes(activation.capability) && activation.adapter_ids.includes(adapterId)).map((activation) => ({ capability: activation.capability, mode: activation.mode, adapter_ids: activation.adapter_ids })).sort((left, right) => left.capability.localeCompare(right.capability)) : [];
  if (descriptor && (descriptor.data.status !== 'active' || descriptor.data.family !== 'execution' || requiredCapabilities.some((capability) => !descriptor.data.capabilities.includes(capability) || !activations.some((activation) => activation.capability === capability)))) throw new Error(`adapter ${adapterId} is not activated for the delegated execution contract`);
  const input = {
    contract: 'execution-governance-input@1',
    story: { id: story.data.id, plan_revision: story.data.plan_revision, review_boundary: story.data.review_boundary, execution_policy: { verification_profile: story.data.execution_policy?.verification_profile } },
    task: {
      id: task.data.id, plan_revision: task.data.plan_revision, execution_contract: task.data.execution?.contract,
      acceptance_refs: sorted(task.data.acceptance_refs), affected_paths: sorted(task.data.affected_paths), contexts: sorted(task.data.contexts), depends_on: sorted(task.data.depends_on),
      change_scope: task.data.change_scope ? { change_class: task.data.change_scope.change_class, risk: task.data.change_scope.risk, corroborated_paths: sorted(task.data.change_scope.corroborated_paths), material_replan: task.data.change_scope.material_replan ?? false } : null,
      execution_isolation: task.data.execution_isolation
    },
    policy: normalizedRunPolicy(policy, story.data.review_boundary),
    activations,
    descriptor: descriptor ? { id: descriptor.data.id, descriptor_revision: descriptor.data.descriptor_revision } : null
  };
  return `execution-governance-input@1:${sha256(stableSerialize(input))}`;
}

// Runtime derives this dispatch envelope at invocation time.  It deliberately
// carries neither a local binding nor a Core-write/authority channel: those
// remain on the host side of the adapter boundary.
export function buildInvocationEnvelope(root, taskId, capability, bindings = new Map(), options = {}) {
  const findings = []; const records = collect(root, findings);
  const task = records.find((record) => record.type === 'task' && record.data.id === taskId);
  const story = task && records.find((record) => record.type === 'user_story' && record.data.id === task.data.parent);
  if (findings.length || !task || !story) throw new Error('invocation envelope inputs are invalid');
  const mode = task.data.status === 'ready' ? 'initial' : task.data.status === 'active' ? 'retry' : 'initial';
  const admission = evaluateTaskAdmission(root, taskId, mode);
  if (!admission.admitted) throw new Error(`work ${taskId} is not admitted for ${mode}: ${admission.reasons.join(', ')}`);
  const frontier = deriveExecutableFrontier(root, story.data.id);
  if (mode === 'initial' && !frontier.eligible.includes(taskId)) throw new Error(`work ${taskId} is not in the executable frontier`);
  const resolution = deriveCapabilityResolution(root, capability, bindings, options);
  const selected = resolution.available ? resolution.selected_adapter_id : 'none';
  if (options.requireAdapter === true && selected === 'none') throw new Error(`required capability is unavailable: ${resolution.reason}`);
  const policy = normalizedRunPolicy(resolvedPolicy(root), story.data.review_boundary);
  const digest = deriveGovernanceInputDigest(root, taskId, selected);
  return {
    contract: 'execution-invocation-envelope@1',
    work: { id: task.data.id, plan_revision: task.data.plan_revision, execution_contract: task.data.execution?.contract ?? 'none' },
    story: { id: story.data.id, plan_revision: story.data.plan_revision, review_boundary: story.data.review_boundary },
    acceptance_refs: sorted(task.data.acceptance_refs), dependencies: sorted(task.data.depends_on),
    allowed_scope_paths: sorted(task.data.affected_paths), consumed_policy: policy,
    capability_resolution: resolution, selected_adapter_id: selected,
    frontier, admission, governance_input_digest: digest
  };
}

function normalizedRunPolicy(policy, reviewBoundary) {
  const value = { allowed_execution_isolation: sorted(policy.allowedExecutionIsolation), timing_evidence: policy.timingRequired ? 'required' : 'optional' };
  if (reviewBoundary === 'story') { value.allowed_review_boundaries = sorted(policy.allowedReviewBoundaries); value.story_boundary_authority = policy.storyBoundaryAuthorityRequired ? 'required' : 'optional'; }
  return value;
}
function sorted(value) { return asArray(value).map((item) => typeof item === 'object' ? stableSerialize(item) : item).sort(); }
function stableSerialize(value) {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function validateActiveMemberAssignment(data, team, findings, relative) {
  if (data.assignee_member_id !== undefined && ['ready', 'active'].includes(data.status) && team.members.get(data.assignee_member_id)?.status !== 'active') add(findings, 'AG211', 'ERROR', `${relative}:assignee_member_id must be active for ready or active work`);
}

export const projectionNames = ['WORK_INDEX.md', 'STORY_INDEX.md', 'MILESTONE_FORECAST.md', 'DEPENDENCY_GRAPH.md', 'TEAM_VIEW.md', 'RESUMPTION.md'];
export function projectionNamesFor(root) { return episodeEnabled(root) ? [...projectionNames, 'EPISODE_INDEX.md'] : projectionNames; }
export function projectionContent(name, records, team = new Map()) {
  const selectors = {
    'WORK_INDEX.md': ['epic', 'feature', 'user_story', 'task'], 'STORY_INDEX.md': ['user_story', 'task'],
    'MILESTONE_FORECAST.md': ['milestone'], 'DEPENDENCY_GRAPH.md': ['user_story', 'task'],
    'TEAM_VIEW.md': ['epic', 'feature', 'user_story', 'task', 'task_result'],
    'RESUMPTION.md': ['epic', 'feature', 'user_story', 'task', 'task_result', 'execution_run'],
    'EPISODE_INDEX.md': ['episode']
  };
  const rows = records.filter((record) => selectors[name]?.includes(record.type)).sort((a, b) => a.data.id.localeCompare(b.data.id));
  const canonicalInputDigest = sha256(rows.map((record) => `${record.type}:${record.data.id}:${sha256(record.text)}`).join('\n'));
  const inputDigest = sha256(`projection@1:${name}\nexorail-node@1\n${canonicalInputDigest}`);
  const manifest = `projection_contract_version: 1\ngenerator_id: exorail-node\ngenerator_version: 1\ncanonical_input_digest: ${canonicalInputDigest}\ninput_digest: ${inputDigest}`;
  if (name === 'RESUMPTION.md') return resumptionContent(rows, manifest);
  const headings = { 'WORK_INDEX.md': 'Work Index', 'STORY_INDEX.md': 'Story Index', 'MILESTONE_FORECAST.md': 'Milestone Forecast', 'DEPENDENCY_GRAPH.md': 'Dependency Graph', 'TEAM_VIEW.md': 'Team View', 'EPISODE_INDEX.md': 'Episode Index' };
  if (name === 'TEAM_VIEW.md') return teamViewContent(rows, manifest, team);
  const selected = rows;
  return `---\nschema: "0.2"\nid: PROJ-${name.replace('.md', '').toLowerCase().replaceAll('_', '-')}\ntype: projection\nstatus: generated\ngenerated_at_utc: 1970-01-01T00:00:00Z\n${manifest}\n---\n# ${headings[name]}\n\nGenerated projection. Canonical artifacts remain authoritative.\n\n| ID | Type | Status | Parent |\n| --- | --- | --- | --- |\n${selected.map((r) => `| ${r.data.id} | ${r.type} | ${r.data.status} | ${r.data.parent ?? 'none'} |`).join('\n')}\n`;
}
function teamViewContent(rows, manifest, team) {
  const assignmentFields = [['owner_member_id', 'owner'], ['assignee_member_id', 'assignee'], ['reviewer_member_id', 'reviewer'], ['completed_by_member_id', 'completed_by']];
  const roleFields = [['owner_role', 'owner'], ['reviewer_role', 'reviewer'], ['approval_owner_role', 'approval_owner']];
  const assignments = rows.flatMap((record) => assignmentFields.filter(([key]) => record.data[key] !== undefined).map(([key, relation]) => ({ member_id: record.data[key], relation, record }))).sort((a, b) => `${a.member_id}:${a.record.data.id}:${a.relation}`.localeCompare(`${b.member_id}:${b.record.data.id}:${b.relation}`));
  const roleRows = rows.flatMap((record) => roleFields.filter(([key]) => record.data[key] !== undefined).map(([key, relation]) => ({ role: record.data[key], relation, record }))).sort((a, b) => `${a.role}:${a.record.data.id}:${a.relation}`.localeCompare(`${b.role}:${b.record.data.id}:${b.relation}`));
  const members = [...team.values()].sort((a, b) => a.member_id.localeCompare(b.member_id));
  const memberTable = members.length ? members.map((member) => `| ${member.member_id} | ${member.display_name} | ${member.status} | ${member.roles.join(', ') || 'none'} |`).join('\n') : '| none | none | none | none |';
  const assignmentTable = assignments.length ? assignments.map(({ member_id, relation, record }) => `| ${member_id} | ${team.get(member_id)?.display_name ?? 'unresolved'} | ${relation} | ${record.data.id} | ${record.type} | ${record.data.status} |`).join('\n') : '| none | none | none | none | none | none |';
  const roleTable = roleRows.length ? roleRows.map(({ role, relation, record }) => `| ${role} | ${relation} | ${record.data.id} | ${record.type} | ${record.data.status} |`).join('\n') : '| none | none | none | none | none |';
  return `---\nschema: "0.2"\nid: PROJ-team-view\ntype: projection\nstatus: generated\ngenerated_at_utc: 1970-01-01T00:00:00Z\n${manifest}\n---\n# Team View\n\nGenerated projection. Canonical artifacts remain authoritative. Member attribution is repository-declared, not identity proof or authority.\n\n## Members\n\n| Member ID | Display name | Status | Declared roles |\n| --- | --- | --- | --- |\n${memberTable}\n\n## Member attribution\n\n| Member ID | Display name | Relation | Work ID | Type | Status |\n| --- | --- | --- | --- | --- | --- |\n${assignmentTable}\n\n## Role routing\n\n| Role | Relation | Work ID | Type | Status |\n| --- | --- | --- | --- | --- |\n${roleTable}\n`;
}
function resumptionContent(records, manifest) {
  const rows = records.filter((row) => !['task_result', 'execution_run'].includes(row.type));
  const tasks = rows.filter((row) => row.type === 'task');
  // Only the hierarchy carries work. A Context, Milestone, Episode or Adapter
  // Profile whose status is `active` is catalogued, not in progress; counting
  // one as current work named a catalogue entry as the position, kept the
  // Story fallback below unreachable, and told a finished project to continue
  // a Task that no longer existed.
  const current = rows.filter((row) => carriesWork(row.type) && ['ready', 'active', 'blocked', 'replan-needed'].includes(row.data.status));
  const results = records.filter((row) => row.type === 'task_result');
  const runs = records.filter((row) => row.type === 'execution_run');
  const currentRows = current.length ? current : rows.filter((row) => row.type === 'user_story' && !['completed', 'superseded'].includes(row.data.status));
  const lines = (items, render, empty = 'none') => items.length ? items.map(render).join('\n') : `- ${empty}`;
  // Decision requests are hosted by a Task and by its Story; scanning only
  // Tasks made every Story-level decision invisible. Resolved ones stay out:
  // this section reports what blocks, and a resolved request is history.
  const hosts = [...tasks, ...records.filter((row) => row.type === 'user_story')];
  const decisions = hosts.flatMap((host) => decisionRequests(host.body).items.filter((request) => !request.resolution).map((request) => ({ host, request })));
  // A Result is immutable and its only status is review_pending, so the receipt
  // ledger, not the Result, says what is still owed.
  const authority = (result) => {
    const task = records.find((row) => row.data.id === result.data.parent);
    const story = task && records.find((row) => row.data.id === task.data.parent);
    if (!task || !story) return 'human review';
    // A superseded Task's Result is history: it was delivered and then replaced,
    // often because a human refused it. Reporting 'human review' here told a
    // resuming session to review work that had already been reviewed and
    // rejected, permanently, since this projection lists every Result.
    if (task.data.status === 'superseded') return 'none; a derived successor route is listed below';
    const accepted = hasExecutionReceipt(story.body, task.data.id, 'task_acceptance', task.data.plan_revision);
    const integrated = hasExecutionReceipt(story.body, task.data.id, 'task_integration', task.data.plan_revision);
    if (accepted && integrated) return 'none; accepted and integrated';
    return accepted ? 'Story-base integration' : 'human review';
  };
  const sibling = tasks.filter((task) => ['planned', 'ready', 'active'].includes(task.data.status) && asArray(task.data.depends_on).every((dependency) => { const upstream = records.find((row) => row.data.id === dependency); const story = records.find((row) => row.data.id === task.data.parent); return upstream?.data.status === 'completed' && hasExecutionReceipt(story?.body ?? '', dependency, 'task_integration', upstream.data.plan_revision); }));
  const adoptions = records.filter((row) => row.type === 'user_story').flatMap((story) => executionReceipts(story.body).items.filter((receipt) => receipt.kind === 'result_adoption').map((receipt) => `${receipt.work_id}:${receipt.plan_revision}`));
  // The optional chaining used to stop after the first access, so a completed
  // Task whose parent Story does not resolve crashed the generator with a raw
  // TypeError. That is the first command the entry contract gives a returning
  // reader, which made a broken parent link the most complete way to be left
  // alone: no finding, no next action, a Node stack trace.
  //
  // A projection reports what it can derive. An unresolvable parent is a
  // validation defect and `validate-workflow.mjs` is what names it; here it is
  // simply not adoption evidence.
  const adoption = (task) => { const story = records.find((row) => row.data.id === task.data.parent); if (!story || task.data.status !== 'completed' || task.data.plan_revision === story.data.plan_revision) return null; return adoptions.includes(`${task.data.id}:${story.data.plan_revision}`) ? 'adopted in current plan; source revision is not representable' : 'historical evidence; human decision required'; };
  const section = (title, body) => `## ${title}\n\n${body}`;
  const superseded = (row) => row.data.status === 'superseded' ? ' (superseded)' : '';
  const revisions = lines(rows.filter((row) => row.data.plan_revision !== undefined), (row) => `- ${row.data.id}: revision ${row.data.plan_revision}${superseded(row)}`);
  const adoptionState = lines(tasks.map(adoption).filter(Boolean), (value) => `- adoption: ${value}`, 'adoption: none');
  return [
    `---\nschema: "0.2"\nid: PROJ-resumption\ntype: projection\nstatus: generated\ngenerated_at_utc: 1970-01-01T00:00:00Z\n${manifest}\n---\n# Resumption\n\nGenerated from exact canonical inputs. Runtime Git observations are not persisted here.`,
    section('Current position', lines(currentRows, (row) => `- ${row.data.id}: ${row.data.status} (${row.relative})`)),
    section('Results and authority', lines(results, (row) => `- ${row.data.parent}: Result ${row.data.status}; next authority is ${authority(row)}`)),
    section('Decisions and blockers', lines(decisions, ({ host, request }) => `- ${host.data.id}: ${request.kind} ${request.request_id}; requested decision: ${request.requested_decision}; resume when resolved`)),
    // An open human decision outranks every per-record action. Rendering rows
    // while a Decision request is open sent a reader off to run a command when
    // the truth was that a person had to answer first: the surface named the
    // request elsewhere and never said it was what stood in the way.
    section('Next safe action', resumptionRoutes(records).map((item) => `- ${renderRoute(item)}`).join('\n')),
    section('Supersession routes', lines(tasks.filter((task) => task.data.status === 'superseded'), (task) => `- ${renderRoute(nextRoute(task, records))}`)),
    section('Available sibling work', lines(sibling, (row) => `- ${row.data.id}: ${row.data.status}`)),
    section('Revisions and adoption', `${revisions}\n\n${adoptionState}`),
    section('Execution runs', lines(runs, (run) => `- ${run.data.id}: ${run.data.status}; outcome ${run.data.terminal_outcome}; work ${run.data.work_id}`))
  ].join('\n\n') + '\n';
}
// An empty next action is the one output this surface may never give. A reader
// looking for what to do next and finding `none` has been told nothing, and a
// cold run reached exactly that: no planning records, five sections reading
// `none`, and no way to tell a finished project from a stuck one.
//
// Five states, one answer each. A question is owed only for what cannot be
// derived -- intent, priority, acceptance, authority. Asking for what the
// repository already knows teaches a reader to ignore questions, which would
// destroy the mechanism this installs.
// The question a reader is owed when only a person can answer: what is needed,
// who can answer it, and why the repository cannot. Stated once and used from
// both the empty and the populated case, because a reader blocked on a human
// decision is in the same position either way.
// The routes for one repository state, in the order they are rendered. This is
// the interface a check reads: it is exported so the structure can be validated
// directly, rather than inferred back out of the Markdown it produces.
//
// Cardinality belongs to the route list, not to the record count. An open
// human decision outranks every per-record action and yields exactly one
// question however many records are waiting; an empty or finished repository
// yields exactly one answer and no records at all.
export function resumptionRoutes(records) {
  // Sorted here rather than relying on the caller's order, so that the routes
  // a check reads and the routes the projection renders are the same list.
  const rows = records
    .filter((row) => !['task_result', 'execution_run'].includes(row.type))
    .slice()
    .sort((left, right) => String(left.data.id).localeCompare(String(right.data.id)));
  const tasks = rows.filter((row) => row.type === 'task');
  const current = rows.filter((row) => carriesWork(row.type) && ['ready', 'active', 'blocked', 'replan-needed'].includes(row.data.status));
  const currentRows = current.length ? current : rows.filter((row) => row.type === 'user_story' && !['completed', 'superseded'].includes(row.data.status));
  const hosts = [...tasks, ...rows.filter((row) => row.type === 'user_story')];
  const decisions = hosts.flatMap((host) => decisionRequests(host.body).items.filter((request) => !request.resolution).map((request) => ({ host, request })));
  // An open human decision outranks every per-record action. Rendering rows
  // while a Decision request is open sent a reader off to run a command when
  // the truth was that a person had to answer first: the surface named the
  // request elsewhere and never said it was what stood in the way.
  // A Result waiting for human review outranks planning guidance. It does not
  // replace it: work that is genuinely ready stays listed underneath, so the
  // reader sees the act that is owed first and the work that can proceed next.
  if (decisions.length > 0) return [humanDecisionRoute(decisions)];
  const pending = pendingAcceptance(records);
  const rest = currentRows.length === 0 ? [emptyRoute(records, decisions)] : currentRows.map((row) => nextRoute(row, records));
  return pending.length > 0 ? [pendingReviewRoute(pending, records), ...rest] : rest;
}

// A route is a structured object, and the Markdown below is rendered from it.
// Three cold reviews defeated a check that tried to read semantics back out of
// rendered text: whether a sentence is an instruction, whether a path in it is
// real, whether a later clause withdraws it. None of that is decidable from
// prose. It is decidable from the parts the answer was built out of, so the
// parts are what exists and the text is what is derived.
//
//   kind                 execute | recover | human_question | closed
//   subject              the record this answer is filed under, or null
//   imperative           what to do, as an instruction
//   reason               why, where a reader owes an explanation
//   required_condition   what must become true, where the route ends somewhere
//   targets              every record, section, command, document or field the
//                        answer refers to -- declared, not mined from the text
//
// A target's `mode` is `read` or `write` and belongs to the route, not to a
// phrase in the sentence: an answer that says "record what it needs in
// `## Decision record`" is naming a section that does not exist yet on purpose,
// and that intent must not be inferred from the words it happens to use.
function route(kind, { subject = null, imperative, reason = null, required_condition = null, targets = [] }) {
  return { kind, subject, imperative, reason, required_condition, targets };
}
const target = {
  record: (value) => ({ kind: 'record', value, mode: 'read' }),
  command: (value) => ({ kind: 'command', value, mode: 'read' }),
  section: (value, within, mode) => ({ kind: 'section', value, within, mode }),
  field: (value, within) => ({ kind: 'field', value, within, mode: 'write' }),
  document: (value, says) => ({ kind: 'document', value, says, mode: 'read' })
};

// The renderer, and the only place a route becomes prose.
export function renderRoute(item) {
  const reason = item.reason ? `: ${item.reason}` : '';
  const condition = item.required_condition ? `. ${item.required_condition}` : '';
  const tail = item.targets
    .filter((entry) => entry.kind === 'document' && entry.says)
    .map((entry) => `. \`${entry.value}\` ${entry.says}`)
    .join('');
  return `${item.subject ? `${item.subject}: ` : ''}${item.imperative}${reason}${condition}${tail}`;
}

const FLOW = '.exorail/method/OPERATING_FLOW.md';
const STRUCTURE = '.exorail/method/STRUCTURE_REFERENCE.md';
const SETUP = '.exorail/method/PROJECT_SETUP.md';
const FINDINGS = '.exorail/method/FINDINGS.md';
const FRONTIER = '.exorail/tools/derive-executable-frontier.mjs';

// The question a reader is owed when only a person can answer: what is needed,
// who can answer it, and why the repository cannot. Stated once and used from
// both the empty and the populated case, because a reader blocked on a human
// decision is in the same position either way.
function humanDecisionRoute(decisions) {
  const { host, request } = decisions[0];
  const more = decisions.length > 1 ? ` (${decisions.length - 1} further request${decisions.length === 2 ? '' : 's'} ${decisions.length === 2 ? 'is' : 'are'} open)` : '';
  return route('human_question', {
    imperative: 'a human decision is required before anything can proceed',
    reason: `${host.data.id} raised ${request.request_id} and asks ${request.requested_decision}${more}`,
    required_condition: `Who answers: the holder of \`user:\` authority for this repository. Why it is not derivable: the records state the options, not which one is chosen. Record the answer as the request's \`resolution\` and \`authority_ref\` in ${host.relative}`,
    targets: [target.record(host.relative), target.field('resolution', host.relative), target.field('authority_ref', host.relative)]
  });
}

// A Result keeps review_pending for life; acceptance lives in the receipt
// ledger. What is owed is therefore a missing task_acceptance receipt at this
// revision, not the Result's own status.
// The frontier's own release predicate, read for a Story that has nothing
// current. Telling that Story to "plan the work" was right while one of its
// light Tasks could be refined, and wrong when every one of them depends on
// output not yet accepted: refining such a Task to ready is refused with
// AG609, and P-1's guidance deliberately leaves those Tasks light until their
// predecessor completes. Two derived views of one state must not disagree, so
// this reads dependencyReleased exactly as sharedAdmissionReasons does. It
// returns the held Tasks and what holds each, or null when any light Task has
// no unreleased dependency and planning is the right answer.
function heldByDependency(story, records) {
  const tasks = storyTasks(story, records);
  const light = tasks.filter((task) => task.data.status === 'planned');
  if (light.length === 0) return null;
  const byId = new Map(records.map((record) => [record.data.id, record]));
  const receipts = executionReceipts(story.body).items;
  const holds = light.map((task) => ({ task, upstream: asArray(task.data.depends_on).filter((dependency) => !dependencyReleased(story, tasks.find((candidate) => candidate.data.id === dependency), byId, receipts)) }));
  return holds.every((hold) => hold.upstream.length > 0) ? holds : null;
}

function pendingAcceptance(records) {
  return records.filter((row) => {
    if (row.type !== 'task_result' || row.data.status !== 'review_pending') return false;
    const task = records.find((item) => item.type === 'task' && item.data.id === row.data.parent);
    const story = task && records.find((item) => item.type === 'user_story' && item.data.id === task.data.parent);
    if (!task || !story) return false;
    return !hasExecutionReceipt(story.body, task.data.id, 'task_acceptance', Number(row.data.based_on_plan_revision));
  });
}

function pendingReviewRoute(pending, records) {
  const first = pending[0];
  const task = records.find((row) => row.type === 'task' && row.data.id === first.data.parent);
  const story = task ? records.find((row) => row.type === 'user_story' && row.data.id === task.data.parent) : undefined;
  const more = pending.length > 1 ? ` (${pending.length - 1} further Result${pending.length === 2 ? '' : 's'} ${pending.length === 2 ? 'is' : 'are'} also waiting)` : '';
  return route('human_question', {
    subject: first.data.parent,
    imperative: `review the Result recorded for ${first.data.parent} and accept or refuse it`,
    reason: `its Result is review_pending, so the work is delivered and not yet accepted${more}`,
    required_condition: 'Who acts: the holder of `user:` authority. Acceptance is recorded as a task_acceptance receipt in the Story, and integration as task_integration; neither is derivable from the records',
    targets: [target.record(first.relative), ...(story ? [target.section('## Execution receipts', story.relative, 'write')] : [])]
  });
}

function emptyRoute(records, decisions) {
  if (decisions.length > 0) return humanDecisionRoute(decisions);
  const work = records.filter((row) => carriesWork(row.type));
  const planned = work.filter((row) => row.type === 'user_story' || row.type === 'task');
  if (work.length === 0) {
    // Bootstrap, not closure. An empty repository has nothing to resume, but it
    // is not finished: it is missing a baseline and a first Story, and the
    // answer names both. Filing it as `closed` made the beginning of a project
    // and the end of one the same kind of answer, which is the distinction this
    // rule exists to keep.
    return route('recover', {
      imperative: 'no planning records exist yet, so there is nothing to resume',
      required_condition: `Start at \`${SETUP}\` to establish the baseline, then create the first Story`,
      targets: [target.document(SETUP)]
    });
  }
  // Closure is delivery-led: completed Stories/Tasks close a slice even while
  // their Epic or Feature remains active for later evolution. A hierarchy with
  // no delivery records (for example a superseded Epic before Feature choice)
  // is terminal only when its remaining containers are terminal too.
  const terminal = planned.length
    ? planned.every((row) => ['completed', 'superseded'].includes(row.data.status))
    : work.every((row) => ['completed', 'superseded'].includes(row.data.status));
  if (terminal) {
    const features = records.filter((row) => row.type === 'feature' && row.data.status !== 'superseded');
    if (features.length === 1) return route('closed', {
      imperative: 'all recorded work is complete',
      reason: 'this is closure, not a block',
      required_condition: `Begin a subsequent change by creating a new Story under ${features[0].relative}`,
      targets: [target.record(features[0].relative), target.document(FLOW, 'states how a Story begins')]
    });
    return route('human_question', {
      imperative: 'choose which Feature receives the subsequent change',
      reason: 'all recorded work is complete, but a human must select the Feature for the next Story',
      required_condition: 'Who answers: the holder of `user:` authority. Why it is not derivable: the completed hierarchy has zero or multiple canonical Features. Materialize the answer by creating the new Story beneath the selected Feature',
      targets: [...features.map((feature) => target.record(feature.relative)), target.document(FLOW, 'states how a Story begins')]
    });
  }
  const held = planned.filter((row) => !['completed', 'superseded'].includes(row.data.status));
  return route('recover', {
    imperative: `no work is currently executable, and ${held.length} record${held.length === 1 ? '' : 's'} remain${held.length === 1 ? 's' : ''} open`,
    reason: held.map((row) => `${row.data.id} (${row.data.status}) in ${row.relative}`).join(', '),
    required_condition: 'Open the canonical record of each and give it the next state its own status calls for -- a `planned` record owes acceptance criteria, a `blocked` one owes a resolved Decision record, and a `replan-needed` one owes Tasks at the current plan revision',
    targets: [...held.map((row) => target.record(row.relative)), target.document(FLOW, 'states each of those in full')]
  });
}

// `carriesWork` admits Epic and Feature as well as Story and Task, so every
// branch below is reached by four record types, not two. A third cold review
// found an `active` Epic being told to continue "the Task" and pointed at the
// Story's acceptance section -- the wrong record type, naming a section its
// own file does not contain. The parallel-wave fix that removed Context and
// Milestone from the frontier left these two in with the identical fault.
const RECORD_NOUN = { epic: 'Epic', feature: 'Feature', user_story: 'Story', task: 'Task' };
const CHILD_NOUN = { epic: 'Feature', feature: 'Story', user_story: 'Task' };
const OUTCOME_SECTION = { epic: '## Outcome', feature: '## Outcome', user_story: '## Acceptance criteria', task: '## Acceptance' };
function recordNoun(type) { return RECORD_NOUN[type] ?? 'record'; }
// `a ${noun}` printed "a Epic". The article belongs to the word it precedes.
function withArticle(word) { return `${/^[AEIOU]/i.test(word) ? 'an' : 'a'} ${word}`; }

// The Story a `--story` argument may name. A Task's is its parent; a Story is
// its own; above that there is none, and passing the Epic's id would produce a
// command that fails, which is a route a reader cannot follow.
// A blank `parent:` parses to an empty mapping, not to null, so `?? null` let
// it through and the command read `--story [object Object]`. Only a non-empty
// scalar is an id.
function idOrNull(value) { return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null; }
// The `--story` argument has to name a Story that is actually there. Guarding
// only the empty parent left a Task whose parent had been deleted, or whose
// parent was an Epic, emitting `--story US-ghost` or `--story EP-tool` -- a
// command that fails, which is the shape of route this rule exists to stop.
function storyScope(row, records) {
  const resolves = (id) => id !== null && records.some((candidate) => candidate.type === 'user_story' && candidate.data.id === id);
  if (row.type === 'task') { const parent = idOrNull(row.data.parent); return resolves(parent) ? parent : null; }
  if (row.type === 'user_story') return idOrNull(row.data.id);
  return null;
}
function firstChild(row, records, type) {
  return records
    .filter((candidate) => candidate.type === type && candidate.data.parent === row.data.id && candidate.data.status !== 'superseded')
    .sort((left, right) => left.data.id.localeCompare(right.data.id))[0] ?? null;
}
function supersessionContext(row, records) {
  const decisionRecord = sectionText(row.body ?? '', 'Decision record');
  const successorId = decisionRecord.match(/^\s*-\s*successor Task:\s*`?(TASK-[A-Za-z0-9-]+)`?\s*$/mi)?.[1] ?? null;
  const revision = Number(decisionRecord.match(/^\s*-\s*successor plan revision:\s*`?(\d+)`?\s*$/mi)?.[1]);
  const decisionId = decisionRecord.match(/^\s*-\s*resolved (?:typed )?(?:Decision|Challenge):\s*`?([A-Za-z]+-[A-Za-z0-9-]+)`?\s*$/mi)?.[1] ?? null;
  const authority = decisionRecord.match(/^\s*-\s*protected authority:\s*`?(user:[^\s`]+)`?\s*$/mi)?.[1] ?? null;
  const story = records.find((candidate) => candidate.type === 'user_story' && candidate.data.id === row.data.parent) ?? null;
  const successor = (successorId && records.find((candidate) => candidate.type === 'task' && candidate.data.id === successorId)) ?? null;
  const requests = [row, story].filter(Boolean).flatMap((host) => decisionRequests(host.body).items);
  const decision = (decisionId && requests.find((request) => request.request_id === decisionId && request.resolution && request.authority_ref === authority)) ?? null;
  const valid = Boolean(
    story
    && successor
    && successor.data.parent === story.data.id
    && successor.data.plan_revision === story.data.plan_revision
    && successor.data.plan_revision === revision
    && decision
  );
  return { authority, decisionId, decisionRecord, revision, story, successor, valid };
}

export function nextRoute(row, records) {
  const noun = recordNoun(row.type);
  const child = CHILD_NOUN[row.type] ?? 'child record';
  const holdsDecisions = row.type === 'user_story' || row.type === 'task';
  if (row.type === 'task' && row.data.status === 'superseded') {
    const context = supersessionContext(row, records);
    if (context.valid) return route('recover', {
      subject: row.data.id,
      imperative: `from ${row.relative}, continue successor Task in ${context.successor.relative}`,
      reason: `${context.decisionId} resolved under ${context.authority} preserves this Task as superseded at revision ${row.data.plan_revision}`,
      required_condition: `The successor carries current Story revision ${context.story.data.plan_revision} and begins its own attempt 1`,
      targets: [target.record(row.relative), target.section('## Decision record', row.relative, 'read'), target.record(context.successor.relative), target.document(FLOW, 'states the replan and supersession route')]
    });
    return route('recover', {
      subject: row.data.id,
      imperative: `complete the supersession route in ${row.relative}`,
      reason: 'the preserved Task has no resolved Decision record that identifies a same-Story successor at the current revision',
      required_condition: 'Name the successor Task, current Story revision, resolved typed Decision or Challenge, and its protected authority before resuming work',
      targets: [target.record(row.relative), target.section('## Decision record', row.relative, 'write'), target.document(FLOW, 'states the replan and supersession route')]
    });
  }
  if (row.type === 'task' && remediationExhausted(row, records)) {
    return route('recover', {
      subject: row.data.id,
      imperative: `record a replan, split, or human Decision for ${row.relative}`,
      reason: `attempts 1 through 3 are terminal without a Result candidate, so this Task slice cannot start attempt 4`,
      required_condition: 'Name the failed criterion and evidence, then resolve the protected Decision before creating a successor Task',
      targets: [target.record(row.relative), target.section('## Decision record', row.relative, 'write'), target.document(FLOW, 'states the replan and supersession route')]
    });
  }
  if (row.type === 'task' && row.data.status === 'active') {
    const latest = attemptsFor(row, records).at(-1);
    if (latest?.data.status === 'terminal' && ['cancelled', 'abandoned'].includes(latest.data.terminal_outcome)) {
      return route('recover', {
        subject: row.data.id,
        imperative: `supersede ${row.relative} and create a successor Task`,
        reason: `its latest current-revision Run is terminal ${latest.data.terminal_outcome}, so the same Task cannot start another attempt`,
        required_condition: 'Record the resolved Decision or Challenge, protected authority, successor Task and current Story revision before resuming work',
        targets: [target.record(row.relative), target.section('## Decision record', row.relative, 'write'), target.document(FLOW, 'states the replan and supersession route')]
      });
    }
  }
  // Naming the state is not naming the recovery. "Start only after current
  // guards pass" told a reader they were blocked and left them to discover by
  // what, which is the shape of answer PA09 exists to stop.
  if (row.data.status === 'blocked') {
    // A blocked record whose `## Decision record` was never written is itself a
    // finding, and sending a reader to read a section that is not there is the
    // dead end this rule exists to stop. The two cases are different answers.
    const written = /^## Decision record\s*$/m.test(row.body ?? '');
    return holdsDecisions
      ? (written
        ? route('recover', {
          subject: row.data.id,
          imperative: `resolve the blocker recorded in ${row.relative}`,
          reason: 'its `## Decision record` states what is required',
          targets: [target.record(row.relative), target.section('## Decision record', row.relative, 'read'), target.document(FLOW, 'names who may resolve it')]
        })
        : route('recover', {
          subject: row.data.id,
          imperative: `write the blocker into a \`## Decision record\` section of ${row.relative}`,
          reason: `it is \`blocked\` and holds no Decision record, so what stands in the way is recorded nowhere a reader can find`,
          required_condition: 'State what is required and who may supply it, then resolve it there',
          targets: [target.record(row.relative), target.section('## Decision record', row.relative, 'write'), target.document(FLOW, 'names who may resolve it')]
        }))
      : route('recover', {
        subject: row.data.id,
        imperative: `resolve the blocker beneath ${row.relative}`,
        reason: `${withArticle(noun)} holds no Decision record of its own, so the blocker is recorded on the Story or Task under it`,
        targets: [target.record(row.relative), target.document(FLOW, 'names who may resolve it')]
      });
  }
  if (row.data.status === 'ready') {
    const scope = storyScope(row, records);
    if (scope) {
      return route('execute', {
        subject: row.data.id,
        imperative: `run \`${FRONTIER} --story ${scope}\` to see which guard or dependency is unmet`,
        // The record the reader is standing on, named. The command alone told
        // them what to type and not which record it was about.
        reason: `${row.relative} is \`ready\` and waiting on one`,
        required_condition: 'It starts once they pass',
        targets: [target.record(row.relative), target.command(FRONTIER)]
      });
    }
    return row.type === 'task'
      ? route('recover', {
        subject: row.data.id,
        imperative: `record the parent Story of ${row.relative}`,
        reason: `its \`parent\` field ${idOrNull(row.data.parent) === null ? 'is empty' : `names ${row.data.parent}, which is no Story in this repository`}, so no frontier can be derived for it and \`ready\` names no runnable work`,
        targets: [target.record(row.relative), target.field('parent', row.relative), target.document(STRUCTURE, 'states which parent each record owes')]
      })
      : route('recover', {
        subject: row.data.id,
        imperative: `bring a ${child} beneath ${row.relative} to \`ready\``,
        reason: `${withArticle(noun)} carries no executable frontier of its own, so \`ready\` recorded here names no runnable work`,
        targets: [target.record(row.relative), target.document(FLOW, `states which statuses ${withArticle(noun)} may carry`)]
      });
  }
  if (row.data.status === 'active') {
    return row.type === 'task'
      ? route('execute', {
        subject: row.data.id,
        imperative: `continue the active Task in ${row.relative}`,
        reason: `its \`${OUTCOME_SECTION.task}\` section states the condition its Result must satisfy`,
        targets: [target.record(row.relative), target.section(OUTCOME_SECTION.task, row.relative, 'read'), target.document(FLOW, 'states what an active Task owes before its Result is accepted')]
      })
      : (() => {
        const childType = row.type === 'epic' ? 'feature' : row.type === 'feature' ? 'user_story' : 'task';
        const downstream = firstChild(row, records, childType);
        const scope = row.type === 'user_story' ? storyScope(row, records) : null;
        return route('recover', {
        subject: row.data.id,
        imperative: downstream
          ? (scope ? `from ${row.relative}, run \`${FRONTIER} --story ${scope}\` for ${downstream.relative}` : `from ${row.relative}, continue ${recordNoun(childType)} in ${downstream.relative}`)
          : `create a ${child} under ${row.relative}`,
        reason: `the ${noun}'s \`${OUTCOME_SECTION[row.type]}\` section states what its children together must satisfy`,
        targets: [target.record(row.relative), ...(downstream ? [target.record(downstream.relative)] : []), ...(scope ? [target.command(FRONTIER)] : []), target.section(OUTCOME_SECTION[row.type], row.relative, 'read'), target.document(FLOW, 'states how work moves through the level below it')]
      });
      })();
  }
  if (row.data.status === 'replan-needed') return replanRoute(row, records);

  // `planned` is not an edge case: it is the ordinary state of everything the
  // moment a Story is written, and it reached a reader as "inspect canonical
  // record" -- a phrase that names neither what is missing nor how to supply
  // it. A cold review found it precisely because it is not the literal `none`
  // the prohibition catches, so it slipped past a rule written to stop it.
  if (row.data.status === 'planned') {
    const owed = 'acceptance criteria carrying an observable condition, a reference to the Story criterion it serves, and its scope and dependencies';
    if (row.type === 'task') {
      return route('recover', {
        subject: row.data.id,
        imperative: `refine ${row.relative} until it is ready`,
        reason: `it needs ${owed}`,
        targets: [target.record(row.relative), target.document(FLOW, 'states what a Task owes before it may start')]
      });
    }
    if (row.type === 'user_story') {
      const held = heldByDependency(row, records);
      if (held) {
        const upstream = [...new Set(held.flatMap((hold) => hold.upstream))];
        const waiting = held.map((hold) => hold.task.data.id);
        return route('recover', {
          subject: row.data.id,
          imperative: `wait for ${upstream.join(', ')} to be accepted and integrated before refining ${waiting.join(', ')}`,
          reason: `every Task left to plan under it builds on output that is not yet accepted and integrated, so refining one to ready now is refused with AG609`,
          required_condition: `A dependency is released by a task_acceptance and a task_integration receipt for the upstream Task in this Story's Execution receipts; \`${FRONTIER} --story ${row.data.id}\` reports each hold as dependency_unavailable`,
          targets: [target.record(row.relative), target.command(FRONTIER)]
        });
      }
      return route('recover', {
        subject: row.data.id,
        imperative: `plan the work under ${row.relative}`,
        reason: 'no Task beneath it is ready to start',
        required_condition: `A Task becomes ready with ${owed}`,
        targets: [target.record(row.relative), target.document(FLOW, 'states what a Task owes before it may start')]
      });
    }
    return route('recover', {
      subject: row.data.id,
      imperative: `plan the work under ${row.relative}`,
      reason: `no ${child} beneath it is ready to start, and work becomes executable only in a Task`,
      required_condition: `A Task becomes ready with ${owed}`,
      targets: [target.record(row.relative), target.document(FLOW, 'states what each level owes before the level below it may start')]
    });
  }

  return route('recover', {
    subject: row.data.id,
    imperative: `read ${row.relative}`,
    reason: `its status \`${row.data.status}\` has no derived route, which is itself the finding`,
    required_condition: holdsDecisions
      ? `Record what it needs in the ${noun}'s \`## Decision record\``
      : `${withArticle(noun).replace(/^a/, 'A').replace(/^an/, 'An')} holds no Decision record of its own, so record what it needs on the Story or Task beneath it`,
    targets: holdsDecisions
      ? [target.record(row.relative), target.section('## Decision record', row.relative, 'write'), target.document(FINDINGS, 'states how a finding is corrected')]
      : [target.record(row.relative), target.document(FINDINGS, 'states how a finding is corrected')]
  });
}
// A replan is not finished when the Story still says replan-needed; it is
// finished when a current-revision Task can start. Report the step that is
// actually missing instead of the work already done.
// These four answers read `replan or supersede future work`, `resume the Story
// lifecycle` and `make a current-revision Task ready` -- three phrases naming a
// state and no route, which is the defect the `planned` branch twenty lines
// above was corrected for. A second cold review found them here, in the same
// function, untouched by that correction. `replan-needed` is not an edge case
// either: it is what a Story becomes the moment its plan materially changes.
// A blank `plan_revision:` in the frontmatter does not parse to an empty
// string -- it parses to an empty mapping, and interpolating that printed
// `carries the current plan revision [object Object]` into an instruction.
// Anything that is not a number or a non-empty scalar is a missing revision.
function isRevision(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  return typeof value === 'string' && value.trim().length > 0;
}

function replanRoute(row, records) {
  const says = 'states which applies';
  const missingRevision = (why) => route('recover', {
    subject: row.data.id,
    imperative: `record a \`plan_revision\` on ${row.relative}`,
    reason: `it is \`replan-needed\` with no revision ${why}`,
    targets: [target.record(row.relative), target.field('plan_revision', row.relative), target.document(STRUCTURE, 'states the field'), target.document(FLOW, says)]
  });
  if (row.type !== 'user_story') {
    // The Story's revision, not the Task's own: naming the Task's would tell a
    // reader the number they already have and not the one they must reach.
    const story = records.find((candidate) => candidate.type === 'user_story' && candidate.data.id === row.data.parent);
    const at = story?.data.plan_revision ?? null;
    if (!isRevision(row.data.plan_revision)) return missingRevision('recorded, so there is no gap to close and nothing to compare against its Story');
    return route('recover', {
      subject: row.data.id,
      imperative: `replan or supersede ${row.relative}`,
      reason: `it carries plan revision ${row.data.plan_revision}${at === null ? ', and its Story is not readable from here' : `, while ${story.data.id} is at ${at}`}`,
      required_condition: 'Either bring it to the current revision or set its status to `superseded`',
      targets: [target.record(row.relative), target.document(FLOW, says)]
    });
  }
  // `<unset>` was reaching the reader inside an instruction -- "carries the
  // current plan revision <unset>, so nothing can be started" tells a person to
  // act on a placeholder. A missing revision is its own finding and has its own
  // route.
  if (!isRevision(row.data.plan_revision)) return missingRevision('to replan towards, so no Task can be told which revision to carry');
  const live = records.filter((task) => task.type === 'task' && task.data.parent === row.data.id && task.data.status !== 'superseded');
  const currentRevision = live.filter((task) => task.data.plan_revision === row.data.plan_revision);
  if (!currentRevision.length) {
    return route('recover', {
      subject: row.data.id,
      imperative: `replan the work under ${row.relative}`,
      reason: `no Task beneath it carries the current plan revision ${row.data.plan_revision}, so nothing can be started`,
      required_condition: 'Create the Tasks that revision requires, or mark the outdated ones `superseded`',
      targets: [target.record(row.relative), target.document(FLOW, says)]
    });
  }
  const startable = currentRevision.filter((task) => ['ready', 'active', 'blocked'].includes(task.data.status));
  if (startable.length > 0) {
    return route('recover', {
      subject: row.data.id,
      imperative: `clear \`replan-needed\` on ${row.relative}`,
      reason: `the replan is done, because ${startable.map((task) => `${task.data.id} (${task.data.status})`).join(', ')} already carr${startable.length === 1 ? 'ies' : 'y'} plan revision ${row.data.plan_revision}`,
      required_condition: 'Return the Story to `active` and resume',
      targets: [target.record(row.relative), target.document(FLOW, says)]
    });
  }
  return route('recover', {
    subject: row.data.id,
    imperative: `make a Task ready under ${row.relative}`,
    reason: `${currentRevision.map((task) => `${task.data.id} (${task.data.status})`).join(', ')} carr${currentRevision.length === 1 ? 'ies' : 'y'} the current plan revision but none can start yet`,
    required_condition: 'A Task becomes ready with acceptance criteria carrying an observable condition, a reference to the Story criterion it serves, and its scope and dependencies',
    targets: [target.record(row.relative), target.document(FLOW, says)]
  });
}

export function openDecisionRequests(body) {
  // Template scaffolding lives inside HTML comments and carries an example row
  // with an empty resolution cell. Read as live, every Story created from the
  // shipped template would report an open Decision request and the frontier
  // would block all work in a new project. Commented scaffolding is not content.
  const lines = body.replace(/<!--[\s\S]*?-->/g, '').split('\n');
  const start = lines.findIndex((line) => line.trim().toLowerCase().startsWith('## decision request'));
  if (start === -1) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('## '));
  const rows = (end === -1 ? rest : rest.slice(0, end)).filter((line) => line.trim().startsWith('|'));
  if (rows.length < 2) return [];
  const header = cells(rows[0]).map((cell) => cell.toLowerCase());
  const idIndex = header.indexOf('request_id');
  const resolutionIndex = header.indexOf('resolution');
  if (idIndex === -1 || resolutionIndex === -1) return [];
  return rows.slice(2)
    .map((row) => cells(row))
    .filter((row) => row[idIndex] && row.length > resolutionIndex && row[resolutionIndex] === '')
    .map((row) => row[idIndex]);
}

function cells(row) {
  return row.split('|').slice(1, -1).map((cell) => cell.trim());
}
