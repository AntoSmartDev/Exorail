import { existsSync } from 'node:fs';
import path from 'node:path';
export function createFinding(severity, id, message, details = {}) {
  return { severity, id, message, ...details };
}

export function hasErrors(findings) {
  return findings.some((finding) => finding.severity === 'ERROR');
}

// Findings whose subject is a generated artifact rather than canonical state.
// A projection is a pure function of the canonical records: an output, not an
// input. It is worth reporting when it is behind, and it is not a reason to
// refuse work, because refusing would invert `canonical state > derived
// projection` and because the repair -- regenerating it -- does not itself
// need the frontier.
const GENERATED_ARTIFACT_FINDINGS = new Set(['AG501']);

// Whether a finding may stop project advancement.
//
// This predicate is the single owner of that boundary. Keeping it here rather
// than at each call site is what makes the boundary survive a growing finding
// vocabulary: without one owner, adding a finding to the validator silently
// changes what blocks work, because nothing ever stated which findings are
// allowed to. With it, a new finding forces a deliberate answer about its
// subject instead of inheriting a default.
//
// Operational derivations -- those that authorize or recommend the next
// execution -- consume this. Diagnostic derivations do not, because some of
// them exist precisely to explain why a project is not operational, and gating
// those makes Exorail hardest to inspect exactly when it is broken.
export function isAdmissionBlocking(finding) {
  return finding.severity === 'ERROR' && !GENERATED_ARTIFACT_FINDINGS.has(finding.id);
}

// Human-readable output confirms a clean run and routes a failing one to the
// correction reference, which otherwise has to be found by reading the source.
// `--json` output stays a bare findings envelope for callers that parse it.
export function writeFindings(findings, { json = false, stdout = process.stdout, root = null } = {}) {
  if (json) {
    stdout.write(`${JSON.stringify({ findings }, null, 2)}\n`);
    return;
  }

  for (const finding of findings) {
    stdout.write(`${finding.severity} ${finding.id} ${finding.message}\n`);
  }

  // Three states, not two. A non-PASS finding routes to the correction
  // reference. PASS findings are their own report and need no summary line:
  // an earlier fix printed one anyway, so a text-encoding validator ended up
  // asserting that canonical records and policy inheritance were current --
  // subjects it never examined -- immediately after listing three findings
  // and calling them none. Only a run with no findings at all gets the OK
  // line, and only its caller knows which root it examined.
  if (findings.some((finding) => finding.severity !== 'PASS')) {
    stdout.write('See .exorail/method/FINDINGS.md for the canonical correction of each finding.\n');
    return;
  }
  if (findings.length) return;

  // A fourth state, and the one that mattered most. On a workspace with no
  // planning records at all this said canonical records were "current", which
  // is not a weaker claim than the truth but a different one: there is nothing
  // to be current. A returning or arriving agent that trusts exit codes read
  // that as "proceed" and walked into a project with no baseline.
  //
  // Saying nothing was found is honest. Saying what was found to be current,
  // when nothing exists, is not.
  const planning = root && existsSync(path.join(root, '.exorail', 'planning'));
  if (!planning) {
    stdout.write('OK no findings; no canonical planning records exist yet, so nothing was validated. Start at .exorail/method/PROJECT_SETUP.md.\n');
    return;
  }

  const projections = root && existsSync(path.join(root, '.exorail', 'projections'));
  stdout.write(projections
    ? 'OK no findings; canonical records, policy inheritance and generated projections are current.\n'
    : 'OK no findings; canonical records and policy inheritance are current. No generated projections are present: run .exorail/tools/generate-projections.mjs.\n');
}
