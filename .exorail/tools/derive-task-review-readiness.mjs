#!/usr/bin/env node
import path from 'node:path';
import { deriveTaskReviewReadiness } from './lib/task-review-readiness.mjs';

const args = process.argv.slice(2);
const usage = 'usage: derive-task-review-readiness.mjs --task TASK-<slug> --base-sha <commit> --head-sha <checked-head> [--repository-root <path>] [--json]\nRead .exorail/method/OPERATING_FLOW.md, then use the Task id and reviewed Git range from canonical planning and integration records.\n';
function failUsage(message) {
  process.stderr.write(`ERROR TASK_REVIEW_READINESS ${message}\n${usage}`);
  process.exit(2);
}
function parseArguments(input) {
  const values = new Map();
  let json = false;
  for (let index = 0; index < input.length; index += 1) {
    const arg = input[index];
    if (arg === '--json') {
      if (json) failUsage('argument supplied more than once: --json');
      json = true;
      continue;
    }
    if (!['--task', '--base-sha', '--head-sha', '--repository-root'].includes(arg)) failUsage(`unknown argument ${arg}`);
    const value = input[index + 1];
    if (!value || value.startsWith('--')) failUsage(`missing value for ${arg}`);
    if (values.has(arg)) failUsage(`argument supplied more than once: ${arg}`);
    values.set(arg, value);
    index += 1;
  }
  for (const required of ['--task', '--base-sha', '--head-sha']) if (!values.has(required)) failUsage(`missing required ${required}`);
  return { values, json };
}
const { values, json } = parseArguments(args);
const task = values.get('--task'); const base = values.get('--base-sha'); const head = values.get('--head-sha'); const root = path.resolve(values.get('--repository-root') ?? process.cwd());
try { const observation = deriveTaskReviewReadiness(root, task, base, head); process.stdout.write(json ? `${JSON.stringify(observation, null, 2)}\n` : `technical_ready=${observation.technical_ready}\n${observation.reasons.map((reason) => `- ${reason}`).join('\n')}\n`); process.exitCode = observation.technical_ready ? 0 : 1; } catch (error) { process.stderr.write(`ERROR TASK_REVIEW_READINESS ${error.message}\n`); process.exitCode = 1; }
