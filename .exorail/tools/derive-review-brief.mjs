#!/usr/bin/env node
import path from 'node:path';
import { deriveReviewBrief, renderReviewBriefMarkdown } from './lib/review-brief.mjs';

const args = process.argv.slice(2); const value = (name) => { const index = args.indexOf(name); return index < 0 ? null : args[index + 1] ?? null; };
const root = path.resolve(value('--repository-root') ?? process.cwd()); const story = value('--story'); const base = value('--base-sha'); const head = value('--head-sha');
if (!story || !base || !head) { process.stderr.write('usage: derive-review-brief.mjs --story US-<slug> --base-sha <commit> --head-sha <commit> [--repository-root <path>] [--json]\n\nA story id is the directory name under .exorail/planning/epics/*/features/*/stories/.\nRun generate-projections.mjs to list the current ones in projections/WORK_INDEX.md.\nThe base sha is the reviewed_sha recorded in the Story Result; the head sha is the\ncommit under review. See .exorail/method/OPERATING_FLOW.md.\n'); process.exit(2); }
try { const brief = deriveReviewBrief(root, story, base, head); process.stdout.write(args.includes('--json') ? `${JSON.stringify(brief, null, 2)}\n` : renderReviewBriefMarkdown(brief)); } catch (error) { process.stderr.write(`ERROR REVIEW_BRIEF ${error.message}\n`); process.exitCode = 1; }
