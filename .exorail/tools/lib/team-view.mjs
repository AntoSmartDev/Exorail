import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { isAdmissionBlocking } from './findings.mjs';
import { readTeam, validate } from './schema-0.2.mjs';

const assignmentFields = [
  ['owner_member_id', 'owner'], ['assignee_member_id', 'assignee'],
  ['reviewer_member_id', 'reviewer'], ['completed_by_member_id', 'completed_by']
];

export function localIdentity(root) {
  const file = path.join(root, '.exorail', 'local', 'identity.json');
  if (!existsSync(file)) return { state: 'missing' };
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    if (!/^[a-z][a-z0-9_-]*$/.test(data.member_id ?? '')) throw new Error('member_id');
    return { state: 'available', member_id: data.member_id };
  } catch { return { state: 'invalid' }; }
}

export function deriveTeamView(root, memberId = null) {
  // Attribution reporting is diagnostic: it answers "who owns what", which is
  // most useful while something is wrong. Refusing on every ERROR meant a
  // project with valid records and one stale projection was told its workflow
  // was invalid -- a wrong diagnosis for a correct project. Admission
  // validation keeps the canonical-state refusal and drops the generated-
  // artifact one.
  const { findings, records } = validate(root);
  if (findings.filter(isAdmissionBlocking).length) throw new Error('workflow_invalid');
  const team = readTeam(root, []).members;
  if (memberId !== null && !team.has(memberId)) throw new Error('member_unresolved');
  const members = [...team.values()].filter((member) => memberId === null || member.member_id === memberId).sort((a, b) => a.member_id.localeCompare(b.member_id));
  const assignments = records.flatMap((record) => assignmentFields.filter(([key]) => record.data[key] !== undefined).map(([key, relation]) => ({ member_id: record.data[key], relation, work_id: record.data.id, type: record.type, status: record.data.status }))).filter((row) => memberId === null || row.member_id === memberId).sort((a, b) => `${a.member_id}:${a.work_id}:${a.relation}`.localeCompare(`${b.member_id}:${b.work_id}:${b.relation}`));
  return {
    contract: 'team-view@1',
    scope: memberId === null ? 'team' : 'member',
    member_id: memberId,
    members: members.map((member) => ({ member_id: member.member_id, display_name: member.display_name, status: member.status, roles: [...member.roles] })),
    assignments
  };
}

export function teamViewMarkdown(view) {
  const members = view.members.length ? view.members.map((member) => `| ${member.member_id} | ${member.display_name} | ${member.status} | ${member.roles.join(', ') || 'none'} |`).join('\n') : '| none | none | none | none |';
  const assignments = view.assignments.length ? view.assignments.map((assignment) => `| ${assignment.member_id} | ${assignment.relation} | ${assignment.work_id} | ${assignment.type} | ${assignment.status} |`).join('\n') : '| none | none | none | none | none |';
  return `# ${view.scope === 'member' ? 'My Work' : 'Team View'}\n\nDerived local view. Canonical records remain authoritative; member attribution is not identity proof or authority.\n\n## Members\n\n| Member ID | Display name | Status | Declared roles |\n| --- | --- | --- | --- |\n${members}\n\n## Attribution\n\n| Member ID | Relation | Work ID | Type | Status |\n| --- | --- | --- | --- | --- |\n${assignments}\n`;
}
