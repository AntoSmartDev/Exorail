#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { reserveId, allocateTaskId } from './lib/git-runtime-ids.mjs';
import { connectShared, startStory, startWave, observeRuntime } from './lib/git-runtime-workspaces.mjs';
import { reviewTask, acceptTask, prepareTaskIntegration, integrateTask } from './lib/git-runtime-integration.mjs';
import { prepareTarget, recoverStory, publishTask, acceptStory, deliverStory, deliverFeature, reconcileTransaction } from './lib/git-runtime-delivery.mjs';
import { inspectLock, recoverLock } from './lib/git-runtime-primitives.mjs';

const args = process.argv.slice(2); let root = process.cwd(); let requestFile;
try {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--repository-root' && args[i + 1]) root = path.resolve(args[++i]);
    else if (args[i] === '--request' && args[i + 1]) requestFile = path.resolve(args[++i]);
    else if (args[i] !== '--json') throw new Error(`unknown argument ${args[i]}`);
  }
  if (!requestFile) throw new Error('usage: git-runtime.mjs --request <approved-request.json> [--repository-root <path>] [--json]; read .exorail/tools/README.md');
} catch (error) { process.stderr.write(`${error.message}\n`); process.exit(2); }
try {
  const request = JSON.parse(readFileSync(requestFile, 'utf8'));
  const routes = { 'reserve-id': reserveId, 'allocate-task-id': allocateTaskId, 'start-story': startStory, 'start-wave': startWave, status: observeRuntime,
    'review-task': reviewTask, 'accept-task': acceptTask, 'prepare-integration': prepareTaskIntegration, 'integrate-task': integrateTask,
    'connect-shared': connectShared, 'prepare-target': prepareTarget, 'recover-story': recoverStory, 'publish-task': publishTask, 'accept-story': acceptStory, 'deliver-story': deliverStory,
    'deliver-feature': deliverFeature, 'reconcile-transaction': reconcileTransaction, 'inspect-lock': inspectLock, 'recover-lock': recoverLock };
  if (!routes[request.action]) throw Object.assign(new Error('action_unknown'), { reason: 'action_unknown' });
  process.stdout.write(`${JSON.stringify(routes[request.action](root, request), null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, reason: error.reason ?? 'request_failed', detail: error.message })}\n`); process.exitCode = 1;
}
