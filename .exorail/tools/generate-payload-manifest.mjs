#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const payloadRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(payloadRoot, 'PAYLOAD_MANIFEST.json');
const check = process.argv.slice(2).includes('--check');
const textExtensions = new Set(['.md', '.mjs', '.json']);

function collect(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const relative = path.posix.join(prefix, entry.name);
      if (relative === 'PAYLOAD_MANIFEST.json') return [];
      const fullPath = path.join(directory, entry.name);
      return entry.isDirectory() ? collect(fullPath, relative) : [relative];
    })
    .sort((left, right) => left.localeCompare(right));
}

function entryFor(relativePath) {
  const bytes = readFileSync(path.join(payloadRoot, relativePath));
  const kind = textExtensions.has(path.extname(relativePath)) ? 'text' : 'binary';
  const content = kind === 'text' ? Buffer.from(bytes.toString('utf8').replace(/\r\n|\r/g, '\n'), 'utf8') : bytes;
  return { path: relativePath, kind, sha256: createHash('sha256').update(content).digest('hex') };
}

const manifest = {
  schema: '0.2',
  payloadVersion: '0.2.0',
  textHashNormalization: 'utf8-lf',
  files: collect(payloadRoot).map(entryFor)
};
const output = `${JSON.stringify(manifest, null, 2)}\n`;

if (check) {
  if (!existsSync(manifestPath) || readFileSync(manifestPath, 'utf8').replace(/\r\n/g, '\n') !== output) {
    console.error('PAYLOAD_MANIFEST.json is missing or stale');
    process.exit(1);
  }
  console.log('PAYLOAD_MANIFEST.json is current');
  process.exit(0);
}

writeFileSync(manifestPath, output, 'utf8');
console.log('PAYLOAD_MANIFEST.json generated');
