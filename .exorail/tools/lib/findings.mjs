export function createFinding(severity, id, message, details = {}) {
  return { severity, id, message, ...details };
}

export function hasErrors(findings) {
  return findings.some((finding) => finding.severity === 'ERROR');
}

export function writeFindings(findings, { json = false, stdout = process.stdout } = {}) {
  if (json) {
    stdout.write(`${JSON.stringify({ findings }, null, 2)}\n`);
    return;
  }

  for (const finding of findings) {
    stdout.write(`${finding.severity} ${finding.id} ${finding.message}\n`);
  }
}
