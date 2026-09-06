#!/usr/bin/env node
import path from 'node:path';
import { deriveExecutableFrontier } from './lib/schema-0.2.mjs';

const args = process.argv.slice(2);
const rootIndex = args.indexOf('--repository-root');
const storyIndex = args.indexOf('--story');
const root = path.resolve(rootIndex < 0 ? process.cwd() : args[rootIndex + 1]);
const storyId = storyIndex < 0 ? null : args[storyIndex + 1];

if (!storyId) {
  process.stderr.write('usage: derive-executable-frontier.mjs --story US-<slug> [--repository-root <path>]\n\nA story id is the directory name under .exorail/planning/epics/*/features/*/stories/.\nRun generate-projections.mjs to list the current ones in projections/WORK_INDEX.md.\n');
  process.exit(2);
}

try {
  process.stdout.write(`${JSON.stringify(deriveExecutableFrontier(root, storyId), null, 2)}\n`);
} catch (error) {
  process.stderr.write(`ERROR FRONTIER ${error.message}\n`);
  process.exitCode = 1;
}
