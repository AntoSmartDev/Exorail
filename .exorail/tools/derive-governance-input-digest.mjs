#!/usr/bin/env node
import path from 'node:path';
import { hasErrors, writeFindings } from './lib/findings.mjs';
import {
  collect,
  deriveExecutableFrontier,
  deriveGovernanceInputDigest,
  evaluateTaskAdmission,
  validate
} from './lib/schema-0.2.mjs';

const usage = 'usage: derive-governance-input-digest.mjs --task TASK-<slug> [--repository-root <path>]\nRead .exorail/method/OPERATING_FLOW.md, then use the Task id from canonical planning records.\n';

function failUsage(message) {
  process.stderr.write(`ERROR DIGEST ${message}\n${usage}`);
  process.exit(2);
}

function parseArguments(args) {
  const values = new Map();
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!['--task', '--repository-root'].includes(key)) failUsage(`unknown argument ${key}`);
    const value = args[index + 1];
    if (!value || value.startsWith('--')) failUsage(`missing value for ${key}`);
    if (values.has(key)) failUsage(`argument supplied more than once: ${key}`);
    values.set(key, value);
    index += 1;
  }
  if (!values.has('--task')) failUsage('missing required --task');
  return values;
}

function correctionFor(root, task, admission) {
  if (task.data.status === 'active' && admission.latest_attempt === 'none') {
    // No Run exists at this revision, so no attempt, Result or receipt is
    // immutable yet and nothing has to be superseded. Either the dispatch never
    // started, or a Runtime dispatch is in flight and records its Run when it
    // completes; the two routes differ and the command cannot tell them apart.
    return 'this Task is active with no Run at its current revision: if no dispatch started, return it to ready and derive an initial digest; if a Runtime dispatch is in flight, wait for it to record its Run rather than deriving another digest. Nothing is superseded: no attempt, Result or receipt exists yet';
  }
  const frontier = deriveExecutableFrontier(root, task.data.parent);
  const entry = frontier.blocked.find((item) => item.task_id === task.data.id);
  const reasons = entry?.reasons ?? [];
  if (reasons.includes('status_blocked')) {
    if (admission.latest_attempt === 'none') return 'resolve the recorded Decision or Challenge, then return this Task to ready before deriving an initial digest';
    if (admission.reasons.includes('open_attempt_exists')) return 'resolve the recorded Decision or Challenge, then return this Task to active; the existing open Run continues and needs no new digest';
    if (!admission.reasons.includes('latest_attempt_not_terminal_failed')) return 'resolve the recorded Decision or Challenge, then return this Task to active and derive its retry digest';
    return 'resolve the recorded Decision or Challenge, then return this Task to active and follow the terminal-Run recovery route';
  }
  const sequential = reasons.find((reason) => reason.startsWith('sequential_wait:'));
  if (sequential) return `wait for ${sequential.slice('sequential_wait:'.length)} to finish its sequential slice before deriving this initial digest: a sequential Story offers only its first eligible Task and selects it by identifier order, not by the order its ## Task backlog lists, so keep the Tasks that follow light until this slice completes`;
  if (reasons.includes('remediation_exhausted:attempts_1_to_3')) return 'record a Decision, replan, or split this Task before creating another attempt';
  if (reasons.some((reason) => reason.startsWith('supersession_required:terminal_'))) return 'resolve a Decision or Challenge with a protected user: authority reference, supersede this Task, then derive the digest for its ready successor';
  if (admission.reasons.includes('open_attempt_exists')) return 'wait until the current open Run reaches a terminal outcome before deriving a retry digest';
  if (admission.reasons.includes('attempt_limit_exhausted')) return 'record a Decision, replan, or split this Task; attempt 4 is not available';
  if (admission.reasons.some((reason) => reason.startsWith('status_not_ready:'))) return 'derive an initial digest only for a ready Task with no current-revision Run';
  if (task.data.status === 'planned') return 'refine this planned Task until it is ready before deriving an initial digest';
  if (admission.reasons.some((reason) => reason.startsWith('status_not_active:'))) return 'derive a retry digest only for an active Task after a terminal failed Run';
  return 'resolve the reported admission condition, then derive the digest again';
}

const values = parseArguments(process.argv.slice(2));
const taskId = values.get('--task');
const root = path.resolve(values.get('--repository-root') ?? process.cwd());
const validation = validate(root);
if (hasErrors(validation.findings)) {
  writeFindings(validation.findings, { stdout: process.stderr, root });
  process.exit(1);
}

const records = collect(root, []);
const task = records.find((record) => record.type === 'task' && record.data.id === taskId);
if (!task) {
  process.stderr.write(`ERROR DIGEST unknown Task ${taskId}\n`);
  process.exit(1);
}

const mode = task.data.status === 'ready' ? 'initial' : 'retry';
let admission;
try {
  admission = evaluateTaskAdmission(root, taskId, mode);
} catch (error) {
  if (error.findings) writeFindings(error.findings, { stdout: process.stderr, root });
  else process.stderr.write(`ERROR DIGEST ${error.message}\n`);
  process.exit(1);
}

if (!admission.admitted) {
  process.stderr.write(`REFUSED DIGEST ${taskId}: ${admission.reasons.join(', ')}. Correction: ${correctionFor(root, task, admission)}.\n`);
  process.exit(1);
}

if (mode === 'initial') {
  const frontier = deriveExecutableFrontier(root, task.data.parent);
  if (!frontier.eligible.includes(taskId)) {
    process.stderr.write(`REFUSED DIGEST ${taskId}: ${(frontier.blocked.find((item) => item.task_id === taskId)?.reasons ?? ['not_in_executable_frontier']).join(', ')}. Correction: ${correctionFor(root, task, admission)}.\n`);
    process.exit(1);
  }
}

process.stdout.write(`${JSON.stringify({
  contract: 'governance-input-digest@1',
  work_id: taskId,
  adapter_id: 'none',
  governance_input_digest: deriveGovernanceInputDigest(root, taskId, 'none')
}, null, 2)}\n`);
