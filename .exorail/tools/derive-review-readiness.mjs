#!/usr/bin/env node
import path from 'node:path';
import { deriveReviewReadiness } from './lib/review-readiness.mjs';

const args = process.argv.slice(2);
const value = (name) => { const index = args.indexOf(name); return index < 0 ? null : args[index + 1] ?? null; };
const root = path.resolve(value('--repository-root') ?? process.cwd());
const base = value('--base-sha'); const head = value('--head-sha');
if (!base || !head) { process.stderr.write('usage: derive-review-readiness.mjs --base-sha <commit> --head-sha <commit> [--repository-root <path>] [--json]\n\nThe base sha is the reviewed_sha recorded in the Story Result; the head sha is the\ncommit under review. See .exorail/method/OPERATING_FLOW.md.\n'); process.exit(2); }
try {
  const observation = deriveReviewReadiness(root, base, head);
  if (args.includes('--json')) process.stdout.write(`${JSON.stringify(observation, null, 2)}\n`);
  else process.stdout.write(`ready_for_review=${observation.ready_for_review}\n${observation.reasons.map((reason) => `- ${reason}`).join('\n')}\n`);
  process.exitCode = observation.ready_for_review ? 0 : 1;
} catch (error) { process.stderr.write(`ERROR REVIEW_READINESS ${error.message}\n`); process.exitCode = 1; }
