#!/usr/bin/env node
import { readFileSync, existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { createFinding, hasErrors, writeFindings } from './lib/findings.mjs';
import { resolveRepositoryPath } from './lib/paths.mjs';
import { validateTextBytes } from './lib/text.mjs';

const args = process.argv.slice(2);
const json = args.includes('--json');
const paths = args.filter((arg) => arg !== '--json');
const repositoryRoot = process.cwd();
const findings = [];

function validateRepositoryRoot(root, targetFindings) {
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    targetFindings.push(createFinding('ERROR', 'TXT000', `Repository root does not exist: ${root}`));
    return false;
  }

  const gitResult = spawnSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
    timeout: 10_000
  });

  if (gitResult.status !== 0) {
    targetFindings.push(createFinding('ERROR', 'TXT000', `Repository root is not a Git worktree root: ${root}`));
    return false;
  }

  const gitRoot = path.resolve(gitResult.stdout.trim());
  if (gitRoot.toLowerCase() !== path.resolve(root).toLowerCase()) {
    targetFindings.push(createFinding('ERROR', 'TXT000', `Repository root is not the Git worktree root: ${root}`));
    return false;
  }

  return true;
}

if (validateRepositoryRoot(repositoryRoot, findings)) {
  if (paths.length === 0) {
    findings.push(createFinding('ERROR', 'TXT000', 'no input paths supplied'));
  }

  for (const inputPath of paths) {
    try {
      const fullPath = resolveRepositoryPath(repositoryRoot, inputPath);
      if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
        findings.push(createFinding('ERROR', 'TXT000', `input path is not a file: ${inputPath}`));
        continue;
      }

      const bytes = readFileSync(fullPath);
      validateTextBytes(inputPath, bytes, findings);
    } catch (error) {
      findings.push(createFinding('ERROR', 'TXT000', error.message));
    }
  }
}

if (!hasErrors(findings)) {
  findings.push(createFinding('PASS', 'TXT101', `${paths.length} text file(s) are valid UTF-8 without BOM`));
  findings.push(createFinding('PASS', 'TXT103', 'no mixed line endings detected in text files'));
  findings.push(createFinding('PASS', 'TXT201', 'no common mojibake markers detected'));
}

writeFindings(findings, { json });
process.exit(findings.some((finding) => finding.id === 'TXT000' && finding.severity === 'ERROR') ? 2 : hasErrors(findings) ? 1 : 0);
