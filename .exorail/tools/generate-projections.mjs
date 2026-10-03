#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { collect, projectionContent, projectionNamesFor, readTeam } from './lib/schema-0.2.mjs';

const args = process.argv.slice(2); const rootIndex = args.indexOf('--repository-root');
const root = path.resolve(rootIndex < 0 ? process.cwd() : args[rootIndex + 1]); const check = args.includes('--check');
const findings = []; const records = collect(root, findings); const team = readTeam(root, findings); let stale = false;
if (findings.some((finding) => finding.severity === 'ERROR')) { console.error('cannot generate projections from invalid canonical input'); process.exit(1); }
const episodeIndex = path.join(root, '.exorail', 'projections', 'EPISODE_INDEX.md');
if (!projectionNamesFor(root).includes('EPISODE_INDEX.md') && existsSync(episodeIndex)) {
  if (check) { console.error('stale projection: EPISODE_INDEX.md'); stale = true; }
  else unlinkSync(episodeIndex);
}
for (const name of projectionNamesFor(root)) {
  const target = path.join(root, '.exorail', 'projections', name); const content = projectionContent(name, records, team.members);
  if (check) { if (!existsSync(target) || readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== content) { console.error(`stale projection: ${name}`); stale = true; } }
  else { mkdirSync(path.dirname(target), { recursive: true }); writeFileSync(target, content, 'utf8'); console.log(`generated projections/${name}`); }
}
process.exitCode = stale ? 1 : 0;
