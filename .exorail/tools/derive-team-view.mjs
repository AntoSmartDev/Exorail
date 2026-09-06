#!/usr/bin/env node
import path from 'node:path';
import { deriveTeamView, localIdentity, teamViewMarkdown } from './lib/team-view.mjs';

const args = process.argv.slice(2);
const value = (name) => { const index = args.indexOf(name); return index < 0 ? null : args[index + 1] ?? null; };
const root = path.resolve(value('--repository-root') ?? process.cwd());
const member = value('--member'); const local = args.includes('--local');
if (local && member) { process.stderr.write('ERROR TEAM_VIEW choose either --local or --member\n'); process.exit(2); }
try {
  const binding = local ? localIdentity(root) : null;
  if (binding?.state === 'missing') {
    const output = { contract: 'team-view@1', scope: 'member', member_id: null, state: 'local_identity_missing', message: 'Create ignored .exorail/local/identity.json with one member_id to query local work.' };
    process.stdout.write(args.includes('--json') ? `${JSON.stringify(output, null, 2)}\n` : 'Local identity is not configured. Create ignored .exorail/local/identity.json with one member_id.\n');
  } else if (binding?.state === 'invalid') {
    process.stderr.write('ERROR TEAM_VIEW local_identity_invalid\n'); process.exitCode = 1;
  } else {
    const view = deriveTeamView(root, local ? binding.member_id : member);
    process.stdout.write(args.includes('--json') ? `${JSON.stringify(view, null, 2)}\n` : teamViewMarkdown(view));
  }
} catch (error) { process.stderr.write(`ERROR TEAM_VIEW ${error.message}\n`); process.exitCode = 1; }
