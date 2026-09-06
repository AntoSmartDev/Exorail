#!/usr/bin/env node
import path from 'node:path';
import { hasErrors, writeFindings } from './lib/findings.mjs';
import { validate } from './lib/schema-0.2.mjs';

const args = process.argv.slice(2);
const rootIndex = args.indexOf('--repository-root');
const root = path.resolve(rootIndex < 0 ? process.cwd() : args[rootIndex + 1]);
const result = validate(root);
writeFindings(result.findings, { json: args.includes('--json'), root });
process.exitCode = hasErrors(result.findings) ? 1 : 0;
