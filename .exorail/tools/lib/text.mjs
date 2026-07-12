import { TextDecoder } from 'node:util';
import { createFinding } from './findings.mjs';

export function validateTextBytes(displayPath, bytes, findings) {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    findings.push(createFinding('ERROR', 'TXT101', `UTF-8 BOM detected: ${displayPath}`));
    return;
  }

  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    findings.push(createFinding('ERROR', 'TXT102', `file is not valid UTF-8: ${displayPath}`));
    return;
  }

  const hasCrLf = /\r\n/.test(text);
  const withoutCrLf = text.replace(/\r\n/g, '');
  const hasBareLf = /(?<!\r)\n/.test(text);
  const hasBareCr = /\r/.test(withoutCrLf);
  const endingTypes = [hasCrLf, hasBareLf, hasBareCr].filter(Boolean).length;
  if (endingTypes > 1) {
    findings.push(createFinding('ERROR', 'TXT103', `mixed line endings detected: ${displayPath}`));
  }

  if (/\uFFFD|\u00EF\u00BB\u00BF|\u00C3[\u0080-\u00BF]|\u00C2[\u0080-\u00BF]|\u00E2\u20AC|\u00F0\u0178/u.test(text)) {
    findings.push(createFinding('WARN', 'TXT201', `common mojibake marker detected: ${displayPath}`));
  }
}
