#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { TextDecoder } from 'node:util';
import { createFinding, hasErrors, writeFindings } from './lib/findings.mjs';
import { resolveRepositoryPath } from './lib/paths.mjs';
import { getField, getSection, escapeRegExp } from './lib/markdown.mjs';
import { getGitRoot, runGit } from './lib/git.mjs';

const args = process.argv.slice(2);
const json = args.includes('--json');
const repositoryRootArg = getArgValue(args, '--repository-root') ?? process.cwd();
const workflowRoot = getArgValue(args, '--workflow-root') ?? '.exorail';
const root = path.resolve(repositoryRootArg);
const findings = [];
let fatal = false;

function add(severity, id, message) {
  findings.push(createFinding(severity, id, message));
  if (severity === 'ERROR' && (id === 'WF000' || /^WF00[1-8]$/.test(id))) {
    fatal = true;
  }
}

if (!existsSync(root)) {
  add('ERROR', 'WF000', `repository root does not exist: ${repositoryRootArg}`);
  finish(2);
}

let workflowPath;
try {
  workflowPath = resolveRepositoryPath(root, workflowRoot);
} catch {
  add('ERROR', 'WF000', `workflow root escapes the repository: ${workflowRoot}`);
  finish(2);
}

const requiredFiles = {
  WF001: path.join(root, 'AGENTS.md'),
  WF008: path.join(workflowPath, 'AGENTS.md'),
  WF002: path.join(workflowPath, 'WORKFLOW_CONFIG.md'),
  WF003: path.join(workflowPath, 'PROJECT_READINESS.md'),
  WF004: path.join(workflowPath, 'CURRENT_CURSOR.md'),
  WF006: path.join(workflowPath, 'KNOWLEDGE_INDEX.md'),
  WF007: path.join(workflowPath, 'DECISIONS.md')
};

for (const [id, filePath] of Object.entries(requiredFiles)) {
  const relative = toSlash(path.relative(root, filePath));
  if (existsSync(filePath)) {
    add('PASS', id, `required file exists: ${relative}`);
  } else {
    add('ERROR', id, `required file is missing: ${relative}`);
  }
}

const gitRoot = getGitRoot(root);
if (!gitRoot.ok) {
  add('ERROR', 'WF005', 'repository root is not a readable Git worktree');
} else if (samePath(gitRoot.root, root)) {
  add('PASS', 'WF005', 'repository root matches the Git worktree root');
} else {
  add('ERROR', 'WF005', `repository root differs from Git root: ${gitRoot.root}`);
}

if (fatal) finish(2);

const config = readFileSync(requiredFiles.WF002, 'utf8');
const readiness = readFileSync(requiredFiles.WF003, 'utf8');
const cursor = readFileSync(requiredFiles.WF004, 'utf8');
const decisions = readFileSync(requiredFiles.WF007, 'utf8');

const decisionErrors = [];
for (const line of decisions.split(/\r\n|\n|\r/)) {
  if (!/^\|\s*[A-Za-z]+\d+\s*\|/.test(line)) continue;
  const cells = splitTableRow(line).map((cell) => normalizeInline(cell));
  if (cells.length < 8 || cells[2] !== 'accepted') continue;
  if (!cells[4]) decisionErrors.push(`${cells[0]} scope`);
  if (!cells[5]) decisionErrors.push(`${cells[0]} rationale`);
  if (!isHumanDecisionSource(cells[6])) decisionErrors.push(`${cells[0]} human source`);
}
if (decisionErrors.length === 0) {
  add('PASS', 'WF126', 'accepted durable decisions have scope, rationale, and explicit human authority');
} else {
  add('ERROR', 'WF126', `accepted durable decisions are incomplete: ${decisionErrors.join(', ')}`);
}

const configuredRoot = getField(config, 'workflow root');
if (!configuredRoot) {
  add('ERROR', 'WF101', 'WORKFLOW_CONFIG does not declare workflow root');
} else if (trimRoot(configuredRoot) === trimRoot(workflowRoot)) {
  add('PASS', 'WF101', `configured workflow root matches '${workflowRoot}'`);
} else {
  add('ERROR', 'WF101', `configured workflow root '${configuredRoot}' differs from '${workflowRoot}'`);
}

const schema = getSection(config, 'Schema');
const projectConfig = getSection(config, 'Project');
const statePolicy = getSection(config, 'State policy');
const stateMode = getField(statePolicy, 'mode');
const schemaVersion = getField(schema, 'version');
const projectMode = getField(projectConfig, 'mode');
const setupProfile = getField(projectConfig, 'setup profile');
const deliveryProfiles = getField(projectConfig, 'delivery profiles');
const profileValues = deliveryProfiles.split(',').map((value) => value.trim()).filter(Boolean);
const projectConfigErrors = [];
if (schemaVersion !== '0.5') projectConfigErrors.push(`schema='${schemaVersion}'`);
if (!['unconfigured', 'greenfield', 'brownfield'].includes(projectMode)) projectConfigErrors.push(`project mode='${projectMode}'`);
if (!['core', 'structured'].includes(setupProfile)) projectConfigErrors.push(`setup profile='${setupProfile}' (supported: core, structured; advanced is reserved)`);
if (profileValues.length === 0 || profileValues.some((value) => !['light', 'structured'].includes(value))) {
  projectConfigErrors.push(`delivery profiles='${deliveryProfiles}'`);
}
if (projectConfigErrors.length === 0) {
  add('PASS', 'WF123', 'schema, project mode, setup profile, and Delivery Unit profiles are supported');
} else {
  add('ERROR', 'WF123', `project configuration is missing or unsupported: ${projectConfigErrors.join(', ')}`);
}

const canonicalAgentReference = `${trimRoot(workflowRoot)}/AGENTS.md`.replaceAll('\\', '/');
const rootAgent = readFileSync(requiredFiles.WF001, 'utf8');
const rootAgentNormalized = rootAgent.replaceAll('\\', '/');
if (!rootAgentNormalized.includes(canonicalAgentReference)) {
  add('ERROR', 'WF120', `root AGENTS.md does not reference '${canonicalAgentReference}'`);
} else if (!/missing or unreadable/i.test(rootAgent) || !/do not implement/i.test(rootAgent)) {
  add('ERROR', 'WF120', 'root AGENTS.md is not a fail-closed discovery bridge');
} else {
  add('PASS', 'WF120', 'root AGENTS.md is a fail-closed bridge to the canonical contract');
}

const optionalArtifacts = getSection(config, 'Optional artifacts');
const optionalMap = {
  'context map': 'CONTEXT_MAP.md',
  'task routing': 'TASK_ROUTING.md',
  'results index': 'RESULTS.md',
  'active constraints': 'ACTIVE_CONSTRAINTS.md',
  'ready checklist': 'READY_CHECKLIST.md'
};
for (const [settingName, artifactName] of Object.entries(optionalMap)) {
  const setting = getField(optionalArtifacts, settingName);
  if (setting === 'enabled') {
    if (existsSync(path.join(workflowPath, artifactName))) {
      add('PASS', 'WF112', `enabled artifact exists: ${artifactName}`);
    } else {
      add('ERROR', 'WF112', `enabled artifact is missing: ${artifactName}`);
    }
  } else if (setting === 'disabled') {
    add('PASS', 'WF112', `optional artifact is disabled: ${artifactName}`);
  } else {
    add('ERROR', 'WF112', `optional artifact setting is missing or unsupported: ${settingName}`);
  }
}

const gitPolicy = getSection(config, 'Git policy');
const expectedGitPolicy = {
  'approval mode': 'explicit',
  'approval scope': 'action_specific',
  'structured delivery branch': 'required',
  'light delivery branch': 'optional',
  'task commit': 'propose_after_verification',
  'delivery integration': 'propose_after_acceptance'
};
const gitPolicyErrors = [];
for (const [field, expected] of Object.entries(expectedGitPolicy)) {
  const actual = getField(gitPolicy, field);
  if (actual !== expected) gitPolicyErrors.push(`${field}='${actual}'`);
}
if (gitPolicyErrors.length === 0) {
  add('PASS', 'WF113', 'Git mutation approval policy is explicit and complete');
} else {
  add('ERROR', 'WF113', `Git policy is missing or unsupported: ${gitPolicyErrors.join(', ')}`);
}

const supportedAgents = getField(config, 'supported');
if (/(^|,)\s*claude\s*(,|$)/.test(supportedAgents)) {
  const claudePath = path.join(root, 'CLAUDE.md');
  if (!existsSync(claudePath)) {
    if (projectMode === 'unconfigured') {
      add('WARN', 'WF102', 'Claude is declared by the unconfigured template but CLAUDE.md is absent; add the optional bridge before configuring Claude support');
    } else {
      add('ERROR', 'WF102', 'Claude is supported but CLAUDE.md is missing');
    }
  } else {
    const claude = readFileSync(claudePath, 'utf8').replaceAll('\\', '/');
    const importPattern = new RegExp(`^@${escapeRegExp(canonicalAgentReference)}\\s*$`, 'm');
    if (importPattern.test(claude)) {
      add('PASS', 'WF102', 'CLAUDE.md imports the canonical workflow contract');
    } else {
      add('ERROR', 'WF102', `CLAUDE.md does not directly import '${canonicalAgentReference}'`);
    }
  }
} else {
  add('PASS', 'WF102', 'Claude bridge is not required by configuration');
}

const pathsSection = getSection(config, 'Paths');
for (const field of ['delivery unit root', 'module root']) {
  const configuredPath = getField(pathsSection, field);
  try {
    resolveRepositoryPath(root, configuredPath || '__missing__');
  } catch {
    add('ERROR', 'WF124', `configured ${field} is missing or unsafe`);
  }
}
if (!findings.some((finding) => finding.id === 'WF124' && finding.severity === 'ERROR')) {
  add('PASS', 'WF124', 'configured Delivery Unit and optional Module roots are safe');
}

const setupState = getSection(readiness, 'Setup state');
const setupInvalidation = getSection(readiness, 'Setup invalidation');
const baselineGate = getSection(readiness, 'Baseline gate');
const deliveryGate = getSection(readiness, 'Delivery gate');
const decision = getSection(readiness, 'Decision');
const readinessStatus = getField(setupState, 'status');
const intakeStrategy = getField(setupState, 'intake strategy');
const intakeSource = getField(setupState, 'intake source');
const setupType = getField(setupState, 'type');
const invalidationStatus = getField(setupInvalidation, 'status');
const invalidationDetectedFrom = getField(setupInvalidation, 'detected from');
const invalidationEvidence = getField(setupInvalidation, 'evidence');
const invalidationAreas = getField(setupInvalidation, 'affected areas');
const invalidationSources = getField(setupInvalidation, 'affected canonical sources');
const invalidationDeliveries = getField(setupInvalidation, 'affected delivery units');
const invalidationReason = getField(setupInvalidation, 'reason');
const invalidationRecovery = getField(setupInvalidation, 'required recovery');
const unaffectedWorkAssessment = getField(setupInvalidation, 'unaffected work assessment');
const invalidationResolvedBy = getField(setupInvalidation, 'resolved by');
const affectedInvalidationDeliveries = invalidationDeliveries && invalidationDeliveries !== 'none'
  ? invalidationDeliveries.split(/\s*,\s*/).filter(Boolean)
  : [];
const allRequired = getField(readiness, 'all required entries sufficient');
const readyToImplement = getField(decision, 'ready to implement');
const baselineReady = getField(decision, 'baseline ready');
const baselineGateProjectFrameReady = getField(baselineGate, 'project frame ready');
const baselineGateSliceReady = getField(baselineGate, 'slice ready');
const baselineGateReady = getField(baselineGate, 'baseline ready');
const baselineGateBlockingDecisions = getField(baselineGate, 'blocking setup decisions are resolved');
const baselineGateCleanSessionShaping = getField(baselineGate, 'delivery shaping can proceed without reconstructing the repository');
const baselineGateValues = [
  baselineGateProjectFrameReady,
  baselineGateSliceReady,
  baselineGateReady,
  baselineGateBlockingDecisions,
  baselineGateCleanSessionShaping
];

if (!isProjectReadiness(readinessStatus) ||
  !isYesNo(baselineReady) ||
  !isYesNo(readyToImplement) ||
  baselineGateValues.some((value) => !isYesNo(value))) {
  add('ERROR', 'WF103', 'PROJECT_READINESS does not expose supported Baseline gate and Decision values');
  fatal = true;
} else {
  const deliveryNoCount = countDeliveryNo(deliveryGate);
  const baselineGateExpected = baselineGateProjectFrameReady === 'yes' &&
    baselineGateSliceReady === 'yes' &&
    baselineGateBlockingDecisions === 'yes' &&
    baselineGateCleanSessionShaping === 'yes'
    ? 'yes'
    : 'no';
  const baselineGateFormulaValid = baselineGateReady === baselineGateExpected;
  const baselineDecisionAgrees = baselineReady === baselineGateReady;
  const coherentDeliveryReady = readinessStatus === 'delivery_ready' &&
    baselineReady === 'yes' &&
    readyToImplement === 'yes' &&
    allRequired === 'yes' &&
    baselineGateReady === 'yes' &&
    deliveryNoCount === 0 &&
    baselineGateFormulaValid &&
    baselineDecisionAgrees;
  const coherentBaselineReady = readinessStatus === 'baseline_ready' &&
    baselineReady === 'yes' &&
    readyToImplement === 'no' &&
    allRequired === 'yes' &&
    baselineGateReady === 'yes' &&
    baselineGateFormulaValid &&
    baselineDecisionAgrees;
  const coherentNotReady = ['not_ready', 'invalidated'].includes(readinessStatus) &&
    baselineReady === 'no' &&
    readyToImplement === 'no' &&
    baselineDecisionAgrees &&
    baselineGateFormulaValid;

  if (coherentDeliveryReady || coherentBaselineReady || coherentNotReady) {
    add('PASS', 'WF103', 'readiness status, gate and decision are mechanically coherent');
  } else {
    add('ERROR', 'WF103', 'readiness status, gate and decision conflict');
  }
}

const invalidationErrors = [];
if (invalidationStatus === 'none') {
  for (const fieldValue of [invalidationDetectedFrom, invalidationEvidence, invalidationAreas, invalidationSources, invalidationDeliveries, invalidationReason, invalidationRecovery, unaffectedWorkAssessment, invalidationResolvedBy]) {
    if (fieldValue !== 'none') {
      invalidationErrors.push('inactive invalidation fields');
      break;
    }
  }
  if (readinessStatus === 'invalidated') invalidationErrors.push('missing active invalidation');
} else if (['active', 'resolved'].includes(invalidationStatus)) {
  for (const [field, value] of Object.entries({
    'detected from': invalidationDetectedFrom,
    evidence: invalidationEvidence,
    'affected areas': invalidationAreas,
    reason: invalidationReason,
    'required recovery': invalidationRecovery
  })) {
    if (isPlaceholder(value)) invalidationErrors.push(field);
  }
  if (invalidationSources !== 'none' && isPlaceholder(invalidationSources)) invalidationErrors.push('affected canonical sources');
  if (invalidationDeliveries !== 'none' && isPlaceholder(invalidationDeliveries)) invalidationErrors.push('affected delivery units');
  const recoveryMatch = invalidationRecovery.match(/^(incremental_setup|recovery_setup):\s*\S/);
  if (!recoveryMatch) {
    invalidationErrors.push('recovery route');
  } else if (setupType && setupType !== recoveryMatch[1]) {
    invalidationErrors.push('setup type and recovery route');
  }

  if (invalidationStatus === 'active') {
    if (readinessStatus !== 'invalidated' || baselineReady !== 'no' || readyToImplement !== 'no' || allRequired !== 'no') {
      invalidationErrors.push('active invalidation readiness');
    }
    if (invalidationResolvedBy !== 'none') invalidationErrors.push('active invalidation resolution');
  } else {
    if (readinessStatus === 'invalidated') invalidationErrors.push('resolved invalidation readiness');
    if (!isHumanDecisionSource(invalidationResolvedBy)) invalidationErrors.push('human invalidation resolution source');
  }
} else {
  invalidationErrors.push('invalidation status');
}

if (invalidationErrors.length === 0) {
  add('PASS', 'WF127', 'setup invalidation record and recovery routing are coherent');
} else {
  add('ERROR', 'WF127', `setup invalidation is incomplete or inconsistent: ${invalidationErrors.join(', ')}`);
}

const knowledgeIndex = readFileSync(requiredFiles.WF006, 'utf8');
const coverageErrors = [];
const coverageGroups = {
  Product: false,
  Architecture: false,
  Engineering: false,
  Roadmap: false
};
if (!getStateVocabulary().IntakeStrategy.includes(intakeStrategy)) {
  coverageErrors.push('missing or unsupported intake strategy');
}
if (!getStateVocabulary().IntakeSource.includes(intakeSource)) {
  coverageErrors.push('missing or unsupported intake source');
}
const knowledgeTable = parseMarkdownTable(knowledgeIndex);
if (!knowledgeTable) {
  coverageErrors.push('coverage table');
} else {
  const requiredColumns = ['Area or document', 'State', 'Minimum readiness', 'Input evidence', 'Canonical source', 'Blocking gap'];
  for (const column of requiredColumns) {
    if (!knowledgeTable.headers.includes(column)) coverageErrors.push('required coverage columns');
  }

  if (coverageErrors.length === 0) {
    for (const row of knowledgeTable.rows) {
      const area = row['Area or document'];
      const state = normalizeInline(row.State);
      const evidence = row['Input evidence'];
      const source = row['Canonical source'];
      const gap = normalizeInline(row['Blocking gap']);
      const rowErrors = [];
      if (!String(evidence ?? '').trim()) rowErrors.push('input evidence');
      if (!String(source ?? '').trim()) rowErrors.push('canonical source');
      if (!String(gap ?? '').trim()) rowErrors.push('blocking gap');
      if (state !== 'required') continue;

      if (['baseline_ready', 'delivery_ready'].includes(readinessStatus)) {
        if (evidence === 'none') rowErrors.push('ready evidence');
        if (source === 'none') rowErrors.push('ready canonical source');
        if (gap !== 'none') rowErrors.push('unresolved ready gap');
      } else if ((evidence === 'none' || source === 'none') && gap === 'none') {
        rowErrors.push('missing explicit gap');
      }

      if (source !== 'none') {
        const sourcePaths = extractCellPaths(source);
        if (sourcePaths.length === 0) {
          rowErrors.push('reachable canonical source');
        } else {
          for (const relativePath of sourcePaths) {
            let fullPath;
            try {
              fullPath = resolveRepositoryPath(root, relativePath);
            } catch {
              rowErrors.push(`missing canonical source '${relativePath}'`);
              continue;
            }
            if (!existsSync(fullPath)) {
              rowErrors.push(`missing canonical source '${relativePath}'`);
            } else if (!hasSubstantiveLine(readFileSync(fullPath, 'utf8'))) {
              rowErrors.push(`empty canonical source '${relativePath}'`);
            }
          }
        }
      }

      if (rowErrors.length > 0) {
        coverageErrors.push(`${area} (${rowErrors.join(', ')})`);
        continue;
      }
      if (/product/i.test(area)) coverageGroups.Product = true;
      if (/architecture|system structure|ownership/i.test(area)) coverageGroups.Architecture = true;
      if (/engineering|testing|coding standards/i.test(area)) coverageGroups.Engineering = true;
      if (/roadmap|delivery plan/i.test(area)) coverageGroups.Roadmap = true;
    }

    for (const [group, covered] of Object.entries(coverageGroups)) {
      if (!covered) coverageErrors.push(`missing ${group} coverage`);
    }
  }
}
if (coverageErrors.length === 0) {
  add('PASS', 'WF119', 'required blueprint coverage has evidence, reachable canonical sources, and no unresolved ready gaps');
} else {
  add('ERROR', 'WF119', `blueprint coverage is incomplete: ${coverageErrors.join('; ')}`);
}

const freshnessWarnings = [];
const changedRepositoryPaths = getChangedRepositoryPaths(root);
if (changedRepositoryPaths.length > 0 && knowledgeTable) {
  const normalizedChanged = changedRepositoryPaths.map((item) => item.replaceAll('\\', '/').toLowerCase());
  const changedWorkflowOnly = normalizedChanged.filter((item) => !/^(?:\.exorail\/|agents\.md$|claude\.md$)/.test(item));
  const freshnessPatterns = {
    'Data and persistence': /(^|\/)(data|db|database|persistence|persist|migration|migrations|schema|sql|entity|entities|repository|repositories)(?:\/|\.|$)|\.(sql)$/i,
    'Integrations and messaging': /(^|\/)(integration|integrations|messaging|message|messages|queue|queues|event|events|webhook|webhooks|api|apis|client|clients|contracts?)(?:\/|\.|$)/i,
    'Security and access control': /(^|\/)(security|auth|authentication|authorization|identity|identities|permission|permissions|role|roles|secret|secrets|token|tokens|credential|credentials)(?:\/|\.|$)/i,
    'Observability and operations': /(^|\/)(observability|telemetry|metric|metrics|trace|traces|logging|logs|audit|auditing|diagnostic|diagnostics)(?:\/|\.|$)/i,
    'Engineering and verification': /(^|\/)(test|tests|spec|specs|fixture|fixtures|harness|harnesses)(?:\/|\.|$)/i
  };
  for (const [area, pattern] of Object.entries(freshnessPatterns)) {
    const row = knowledgeTable.rows.find((candidate) =>
      normalizeInline(candidate['Area or document']) === area &&
      ['required', 'deferred'].includes(normalizeInline(candidate.State)) &&
      candidate['Canonical source'] &&
      normalizeInline(candidate['Canonical source']) !== 'none'
    );
    if (!row) continue;
    const topicalChanges = changedWorkflowOnly.filter((item) => pattern.test(item));
    if (topicalChanges.length === 0) continue;
    const sourcePaths = extractCellPaths(row['Canonical source']).map((item) => item.replaceAll('\\', '/').toLowerCase());
    if (sourcePaths.length === 0) continue;
    if (sourcePaths.some((sourcePath) => normalizedChanged.includes(sourcePath))) continue;
    freshnessWarnings.push(`${area} changed in worktree but canonical source was not updated: source ${sourcePaths.join(', ')}; changed paths ${topicalChanges.slice(0, 3).join(', ')}`);
  }
}
if (freshnessWarnings.length === 0) {
  add('PASS', 'WF135', 'knowledge freshness advisory found no topical drift in the current worktree');
} else {
  add('WARN', 'WF135', `knowledge freshness advisory: ${freshnessWarnings.join('; ')}`);
}

const conditionalArtifactErrors = [];
const conditionalDefinitions = {
  'Target filesystem structure': 'TARGET_STRUCTURE.md',
  'Implementation pattern map': 'PATTERN_MAP.md'
};
if (!knowledgeTable) {
  conditionalArtifactErrors.push('coverage table');
} else {
  for (const [areaName, fileName] of Object.entries(conditionalDefinitions)) {
    const row = knowledgeTable.rows.find((candidate) => normalizeInline(candidate['Area or document']) === areaName);
    if (!row) {
      conditionalArtifactErrors.push(`missing classification for ${areaName}`);
      continue;
    }
    const state = normalizeInline(row.State);
    const minimum = row['Minimum readiness'];
    const evidence = row['Input evidence'];
    const source = row['Canonical source'];
    const gap = normalizeInline(row['Blocking gap']);
    if (!['required', 'deferred', 'not_applicable'].includes(state)) conditionalArtifactErrors.push(`${areaName} classification`);
    if (isPlaceholder(minimum) || normalizeInline(minimum) === 'none') conditionalArtifactErrors.push(`${areaName} activation criterion`);
    if (isPlaceholder(evidence) || normalizeInline(evidence) === 'none') conditionalArtifactErrors.push(`${areaName} classification evidence`);
    if (['deferred', 'not_applicable'].includes(state)) {
      if (gap !== 'none') conditionalArtifactErrors.push(`${areaName} non-required blocking gap`);
      continue;
    }

    const artifactPaths = extractCellPaths(source);
    if (artifactPaths.length !== 1 || path.basename(artifactPaths[0]) !== fileName) {
      conditionalArtifactErrors.push(`${areaName} canonical path`);
      continue;
    }
    let artifactPath = '';
    try {
      artifactPath = resolveRepositoryPath(root, artifactPaths[0]);
    } catch {
      conditionalArtifactErrors.push(`missing required ${fileName}`);
      continue;
    }
    if (!existsSync(artifactPath)) {
      conditionalArtifactErrors.push(`missing required ${fileName}`);
      continue;
    }
    const artifactContent = readFileSync(artifactPath, 'utf8');
    if (!hasSubstantiveLine(artifactContent)) conditionalArtifactErrors.push(`${fileName}: content`);
    if (fileName === 'TARGET_STRUCTURE.md' && !/\|\s*Path\s*\|/i.test(artifactContent)) {
      conditionalArtifactErrors.push(`${fileName}: target structure columns`);
    }
    if (fileName === 'PATTERN_MAP.md' && !/\|\s*Pattern\s*\|/i.test(artifactContent)) {
      conditionalArtifactErrors.push(`${fileName}: pattern map columns`);
    }
  }
}
if (conditionalArtifactErrors.length === 0) {
  add('PASS', 'WF130', 'conditional project artifact classification and content are coherent');
} else if (invalidationStatus === 'active' && !isPlaceholder(unaffectedWorkAssessment) && unaffectedWorkAssessment !== 'none') {
  add('WARN', 'WF130', `conditional project artifact is stale within a scoped invalidation; explicitly assessed unaffected work may continue: ${conditionalArtifactErrors.join('; ')}`);
} else {
  add('ERROR', 'WF130', `conditional project artifacts are incomplete or inconsistent: ${conditionalArtifactErrors.join('; ')}`);
}

const cursorSetup = getSection(cursor, 'Setup');
const position = getSection(cursor, 'Position');
const lastStable = getSection(cursor, 'Last stable result');
const requiredReads = getSection(cursor, 'Required reads');
const nextStep = getSection(cursor, 'Next step');
const lastStableTask = getField(lastStable, 'task');
const lastResultPathValue = getField(lastStable, 'result');
const currentTask = getField(position, 'task');
const currentStatus = getField(position, 'status');
const currentDelivery = getField(position, 'delivery unit');
const currentModule = getField(position, 'owning module');
const deliveryProfile = getField(position, 'delivery profile');
const expectedBranch = getField(position, 'expected branch');
const cursorContractRevision = getField(position, 'contract revision');
const nextAction = getField(nextStep, 'action');
const contractFile = getField(nextStep, 'contract file');
const taskFile = getField(nextStep, 'task file');
const cursorReadiness = getField(cursorSetup, 'readiness');

if (!position ||
  !requiredReads ||
  !currentTask ||
  !currentDelivery ||
  !currentModule ||
  !isDeliveryProfile(deliveryProfile) ||
  !isCursorStatus(currentStatus)) {
  add('ERROR', 'WF104', isCursorStatus(currentStatus)
    ? 'CURRENT_CURSOR does not expose the required v0 sections and fields'
    : `unsupported CURRENT_CURSOR Position.status '${currentStatus}'`);
  fatal = true;
} else {
  add('PASS', 'WF104', 'CURRENT_CURSOR exposes required v0 structure');
}

const invalidationCursorErrors = [];
if (cursorReadiness !== readinessStatus) invalidationCursorErrors.push('cursor readiness');
if (invalidationStatus === 'active') {
  if (currentDelivery === 'none') {
    if (currentStatus !== 'setup_required') invalidationCursorErrors.push('setup-required routing');
  } else if (affectedInvalidationDeliveries.includes(currentDelivery)) {
    if (currentStatus !== 'blocked') invalidationCursorErrors.push('affected work pause');
  } else if (isPlaceholder(unaffectedWorkAssessment)) {
    invalidationCursorErrors.push('explicit unaffected-work assessment');
  }
}
if (invalidationCursorErrors.length === 0) {
  add('PASS', 'WF128', 'cursor routing agrees with setup invalidation scope');
} else {
  add('ERROR', 'WF128', `cursor routing conflicts with setup invalidation: ${invalidationCursorErrors.join(', ')}`);
}

const brownfieldErrors = [];
const brownfieldAssessment = getSection(readiness, 'Brownfield evidence assessment');
if (intakeStrategy === 'brownfield_reconstruction') {
  const assessmentTable = parseMarkdownTable(brownfieldAssessment);
  if (!assessmentTable) {
    brownfieldErrors.push('missing evidence assessment table');
  } else {
    const requiredColumns = ['Evidence statement', 'Classification', 'Source', 'Inference confidence', 'Destination', 'Blocking'];
    const legacyColumns = ['Statement or area', 'Classification', 'Evidence', 'Confidence', 'Canonical destination', 'Blocking'];
    const hasCurrentColumns = requiredColumns.every((column) => assessmentTable.headers.includes(column));
    const hasLegacyColumns = legacyColumns.every((column) => assessmentTable.headers.includes(column));
    for (const column of requiredColumns) {
      if (!hasCurrentColumns && !hasLegacyColumns && !assessmentTable.headers.includes(column)) brownfieldErrors.push('missing evidence assessment columns');
    }
    const rows = assessmentTable.rows;
    if (['baseline_ready', 'delivery_ready'].includes(readinessStatus) && rows.length === 0) {
      brownfieldErrors.push('ready brownfield baseline has no classified evidence');
    }
    for (const row of rows) {
      const statement = normalizeInline(row['Evidence statement'] ?? row['Statement or area']);
      const classification = normalizeInline(row.Classification);
      const sourceValue = normalizeInline(row.Source ?? row.Evidence);
      const confidence = normalizeInline(row['Inference confidence'] ?? row.Confidence);
      const destination = normalizeInline(row.Destination ?? row['Canonical destination']);
      const blocking = normalizeInline(row.Blocking);
      if (isPlaceholder(statement) || !['observed_fact', 'supported_inference', 'user_confirmed_decision', 'documented_decision', 'legacy_evidence', 'contradiction', 'unresolved_gap', 'not_needed_for_baseline_readiness'].includes(classification) || isPlaceholder(sourceValue) || !['yes', 'no'].includes(blocking)) {
        brownfieldErrors.push(`invalid evidence assessment row '${statement}'`);
      }
      if (classification === 'supported_inference' && !['low', 'medium', 'high'].includes(confidence)) {
        brownfieldErrors.push(`supported inference '${statement}' lacks confidence`);
      }
      if (classification !== 'supported_inference' && confidence !== 'not_applicable') {
        brownfieldErrors.push(`non-inference '${statement}' has inference confidence`);
      }
      if (classification === 'user_confirmed_decision' && !isHumanDecisionSource(sourceValue)) {
        brownfieldErrors.push(`user-confirmed decision '${statement}' lacks actual user source`);
      }
      if (classification === 'unresolved_gap' && blocking !== 'yes') {
        brownfieldErrors.push(`unresolved evidence '${statement}' is not blocking`);
      }
      if (classification === 'not_needed_for_baseline_readiness' && blocking !== 'no') {
        brownfieldErrors.push(`non-baseline evidence '${statement}' is unexpectedly blocking`);
      }
      if (['baseline_ready', 'delivery_ready'].includes(readinessStatus) && blocking === 'yes') {
        brownfieldErrors.push(`ready baseline retains blocking evidence '${statement}'`);
      }
      if (destination !== 'not_applicable' && destination !== 'none') {
        try {
          const destinationPath = resolveRepositoryPath(root, destination);
          if (!existsSync(destinationPath)) brownfieldErrors.push(`evidence '${statement}' lacks an existing canonical destination`);
        } catch {
          brownfieldErrors.push(`evidence '${statement}' lacks an existing canonical destination`);
        }
      }
    }
  }
}
if (readinessStatus === 'baseline_ready' && currentStatus === 'awaiting_delivery') {
  if (currentDelivery !== 'none' || currentTask !== 'none') {
    brownfieldErrors.push('awaiting-delivery baseline retains proposed executable work');
  }
  if (intakeStrategy === 'brownfield_reconstruction') {
    for (const field of ['intent and boundaries are sufficient', 'contract is approved', 'work requires no implicit structural decision', 'acceptance and verification are concrete']) {
      if (getField(deliveryGate, field) !== 'no') brownfieldErrors.push(`awaiting-delivery gate '${field}' must be no`);
    }
    if (getField(deliveryGate, 'decomposition review is approved') !== 'not_applicable') {
      brownfieldErrors.push('awaiting-delivery decomposition review must be not_applicable');
    }
  }
  if (!/outcome|delivery|bounded context|next/i.test(nextAction)) {
    brownfieldErrors.push('awaiting-delivery next action must request the desired outcome');
  }
}
if (brownfieldErrors.length === 0) {
  add('PASS', 'WF133', 'brownfield evidence authority and baseline-only delivery routing are coherent');
} else {
  add('ERROR', 'WF133', `brownfield onboarding is incomplete or unsafe: ${brownfieldErrors.join('; ')}`);
}

const frameAndSliceErrors = [];
const projectFrameCoverage = getSection(readiness, 'Project frame coverage');
const boundedContextCoverage = getSection(readiness, 'Bounded-context coverage');
const activeDeliveryScope = getSection(readiness, 'Active delivery scope');
const projectFrameGate = getSection(readiness, 'Project Frame Ready gate');
const sliceReadyGate = getSection(readiness, 'Slice Ready gate');
const activeScopeContext = getField(activeDeliveryScope, 'bounded context or responsibility area');
const activeScopePlanningSource = getField(activeDeliveryScope, 'planning source');
const activeScopeSufficient = getField(activeDeliveryScope, 'scope sufficient for shaping');
const activeScopeClosure = getField(activeDeliveryScope, 'closure assessment');
const activeScopeNextSelection = getField(activeDeliveryScope, 'next selection required');
if (['baseline_ready', 'delivery_ready'].includes(readinessStatus)) {
  for (const field of [
    'global purpose and outcomes',
    'system shape and major boundaries',
    'technology, platform, data, and integration direction',
    'applicable cross-cutting constraints',
    'delivery direction and known deferrals'
  ]) {
    if (getField(projectFrameCoverage, field) !== 'sufficient') frameAndSliceErrors.push(`project frame coverage ${field}`);
  }
  if (getField(projectFrameCoverage, 'blocking global gaps') !== 'none') frameAndSliceErrors.push('project frame retains blocking global gaps');
  for (const field of ['global direction is sufficient for the selected slice', 'known global gaps are explicit and non-blocking']) {
    if (getField(projectFrameGate, field) !== 'yes') frameAndSliceErrors.push(`Project Frame Ready gate ${field}`);
  }
  for (const field of ['selected slice exists', 'selected slice coverage is `defined`', 'outcome, boundaries, and dependencies are sufficient', 'required knowledge rows are sufficient']) {
    if (getField(sliceReadyGate, field) !== 'yes') frameAndSliceErrors.push(`Slice Ready gate ${field}`);
  }
  if (activeScopeContext === 'none' || activeScopeSufficient !== 'yes') frameAndSliceErrors.push('active delivery scope is not shapeable');
  const contextTable = parseMarkdownTable(boundedContextCoverage);
  if (!contextTable) {
    frameAndSliceErrors.push('bounded-context coverage table');
  } else {
    const activeRow = contextTable.rows.find((row) => normalizeInline(row['Context or responsibility area']) === activeScopeContext);
    if (!activeRow) {
      frameAndSliceErrors.push(`active bounded context '${activeScopeContext}' coverage row`);
    } else {
      if (normalizeInline(activeRow.Coverage) !== 'defined') frameAndSliceErrors.push(`active bounded context '${activeScopeContext}' is not defined`);
      if (normalizeInline(activeRow['Blocking gap']) !== 'none') frameAndSliceErrors.push(`active bounded context '${activeScopeContext}' retains blocking gap`);
      for (const sourceField of ['Responsibility and boundaries source', 'Local outcome source']) {
        for (const sourcePath of extractCellPaths(activeRow[sourceField])) {
          try {
            if (!existsSync(resolveRepositoryPath(root, sourcePath))) frameAndSliceErrors.push(`bounded context '${activeScopeContext}' ${sourceField}`);
          } catch {
            frameAndSliceErrors.push(`bounded context '${activeScopeContext}' ${sourceField}`);
          }
        }
      }
    }
  }
}
if (frameAndSliceErrors.length === 0) {
  add('PASS', 'WF136', 'project frame and selected slice gates have deterministic supporting evidence');
} else {
  add('ERROR', 'WF136', `project frame or selected slice gate evidence is incomplete: ${frameAndSliceErrors.join('; ')}`);
}

const planningErrors = [];
const candidateRecords = new Map();
const milestoneRecords = new Map();
const planningGraph = new Map();
const planningSources = new Set();
for (const value of [activeScopePlanningSource, getField(position, 'planning source'), getField(position, 'candidate source')]) {
  const normalized = normalizeInline(value);
  if (normalized && !['none', 'this file'].includes(normalized)) planningSources.add(normalized);
}
for (const planningSource of planningSources) {
  let planningPath = '';
  try {
    planningPath = resolveRepositoryPath(root, planningSource);
  } catch {
    planningErrors.push(`planning source missing '${planningSource}'`);
    continue;
  }
  if (!existsSync(planningPath)) {
    planningErrors.push(`planning source missing '${planningSource}'`);
    continue;
  }
  const planningContent = readFileSync(planningPath, 'utf8');
  const planningAuthority = getSection(planningContent, 'Planning authority');
  const sourceRevision = getField(planningAuthority, 'planning revision');
  if (planningAuthority) {
    if (!/^\d+$/.test(sourceRevision)) planningErrors.push(`${planningSource} planning revision`);
    if (sourceRevision !== '0' && (getField(planningAuthority, 'decision') !== 'approved' || !isHumanDecisionSource(getField(planningAuthority, 'decision source')))) {
      planningErrors.push(`${planningSource} planning authority`);
    }
  }

  const milestoneTable = parseMarkdownTable(getSection(planningContent, 'Milestones or increments'));
  if (milestoneTable) {
    for (const row of milestoneTable.rows) {
      const milestoneId = normalizeInline(row.Milestone);
      if (!milestoneId || milestoneId.includes('|')) continue;
      if (!/^M\d{2}-[A-Za-z0-9-]+$/.test(milestoneId)) planningErrors.push(`invalid milestone id '${milestoneId}'`);
      if (milestoneRecords.has(milestoneId)) planningErrors.push(`duplicate milestone id '${milestoneId}'`);
      const dependencies = splitCommaValues(row.Dependencies);
      milestoneRecords.set(milestoneId, { id: milestoneId, state: normalizeInline(row.State), source: planningSource, dependencies });
      planningGraph.set(milestoneId, dependencies);
      const planSource = normalizeInline(row['Plan source']);
      if (!['this file', 'none'].includes(planSource)) {
        try {
          if (!existsSync(resolveRepositoryPath(root, planSource))) planningErrors.push(`milestone '${milestoneId}' plan source missing '${planSource}'`);
        } catch {
          planningErrors.push(`milestone '${milestoneId}' plan source missing '${planSource}'`);
        }
      }
    }
  }

  for (const sectionName of ['Root Delivery candidates (optional)', 'Delivery candidates']) {
    const candidateTable = parseMarkdownTable(getSection(planningContent, sectionName));
    if (!candidateTable) continue;
    for (const row of candidateTable.rows) {
      const candidateId = normalizeInline(row.Candidate);
      if (!candidateId || candidateId.includes('|')) continue;
      if (!/^DC\d{3}-[A-Za-z0-9-]+$/.test(candidateId)) planningErrors.push(`invalid Delivery candidate id '${candidateId}'`);
      if (candidateRecords.has(candidateId)) planningErrors.push(`duplicate Delivery candidate id '${candidateId}'`);
      const dependencies = splitCommaValues(row.Dependencies);
      const materializedAs = normalizeInline(row['Materialized as']);
      const state = normalizeInline(row.State);
      candidateRecords.set(candidateId, { id: candidateId, state, source: planningSource, dependencies, materializedAs });
      planningGraph.set(candidateId, dependencies);
      for (const sourcePath of extractCellPaths(row['Required knowledge'])) {
        try {
          if (!existsSync(resolveRepositoryPath(root, sourcePath))) planningErrors.push(`candidate '${candidateId}' required knowledge`);
        } catch {
          planningErrors.push(`candidate '${candidateId}' required knowledge`);
        }
      }
    }
  }
}
for (const candidate of candidateRecords.values()) {
  for (const dependency of candidate.dependencies) {
    if (!candidateRecords.has(dependency) && !milestoneRecords.has(dependency)) planningErrors.push(`candidate '${candidate.id}' references missing dependency '${dependency}'`);
  }
  if (['promoted', 'completed'].includes(candidate.state) && candidate.materializedAs !== 'none' && !findDirectoryByName(workflowPath, candidate.materializedAs)) {
    planningErrors.push(`candidate '${candidate.id}' materialized Delivery Unit is missing '${candidate.materializedAs}'`);
  }
}
for (const milestone of milestoneRecords.values()) {
  for (const dependency of milestone.dependencies) {
    if (!milestoneRecords.has(dependency)) planningErrors.push(`milestone '${milestone.id}' references missing dependency '${dependency}'`);
  }
}
if (hasGraphCycle(planningGraph)) planningErrors.push('planning dependency graph contains a cycle');
if (planningErrors.length === 0) {
  add('PASS', 'WF137', 'roadmap, milestone, Delivery candidate ids, references, and dependencies are mechanically coherent');
} else {
  add('ERROR', 'WF137', `planning graph is incomplete or inconsistent: ${planningErrors.join('; ')}`);
}

const cursorPlanningErrors = [];
const cursorPlanningRevision = getField(position, 'planning revision observed');
const cursorPlanningSource = normalizeInline(getField(position, 'planning source'));
const cursorCandidate = normalizeInline(getField(position, 'delivery candidate'));
const cursorCandidateSource = normalizeInline(getField(position, 'candidate source'));
const cursorPromotionAction = normalizeInline(getField(nextStep, 'promotion action'));
const cursorNextHumanDecision = normalizeInline(getField(nextStep, 'next human decision'));
if (!/^\d+$/.test(cursorPlanningRevision)) cursorPlanningErrors.push('cursor planning revision observed');
if (cursorCandidate !== 'none') {
  if (!candidateRecords.has(cursorCandidate)) {
    cursorPlanningErrors.push(`cursor references missing Delivery candidate '${cursorCandidate}'`);
  } else {
    const candidate = candidateRecords.get(cursorCandidate);
    if (cursorCandidateSource !== candidate.source) cursorPlanningErrors.push('cursor candidate source');
    try {
      const sourcePath = resolveRepositoryPath(root, cursorPlanningSource);
      if (!existsSync(sourcePath)) cursorPlanningErrors.push('cursor planning source');
      const sourceRevision = getField(getSection(readFileSync(sourcePath, 'utf8'), 'Planning authority'), 'planning revision');
      if (/^\d+$/.test(sourceRevision) && cursorPlanningRevision !== sourceRevision) cursorPlanningErrors.push('cursor planning revision mismatch');
    } catch {
      cursorPlanningErrors.push('cursor planning source');
    }
    if (currentDelivery !== 'none' || currentTask !== 'none' || contractFile !== 'none' || taskFile !== 'none') {
      cursorPlanningErrors.push('candidate-only cursor carries executable authority');
    }
    if (candidate.state === 'eligible') {
      if (cursorPromotionAction !== 'promote_candidate_to_shaping' || cursorNextHumanDecision !== 'approve candidate promotion to shaping') {
        cursorPlanningErrors.push('eligible candidate cursor lacks promotion authority request');
      }
    } else if (candidate.state === 'promoted') {
      const draftDirectory = candidate.materializedAs === 'none' ? null : findDirectoryByName(workflowPath, candidate.materializedAs);
      const draftContractPath = draftDirectory ? path.join(draftDirectory, 'CONTRACT.md') : null;
      const draftContract = draftContractPath && existsSync(draftContractPath) ? readFileSync(draftContractPath, 'utf8') : '';
      const draftIdentity = draftContract ? getSection(draftContract, 'Identity') : '';
      const pendingDraftIsCoherent = draftIdentity &&
        ['candidate', 'shaping'].includes(getField(draftIdentity, 'status')) &&
        getField(draftIdentity, 'approval') === 'pending' &&
        getField(draftIdentity, 'approval source') === 'none' &&
        getField(draftIdentity, 'approved contract revision') === 'none' &&
        getField(draftIdentity, 'approval scope') === 'none' &&
        getField(draftIdentity, 'approval rationale') === 'none' &&
        getField(draftIdentity, 'approval updates') === 'none';
      if (!pendingDraftIsCoherent) {
        cursorPlanningErrors.push(`promoted candidate '${cursorCandidate}' lacks a coherent pending Delivery Contract draft`);
      }
      if (currentStatus !== 'shaping' || cursorPromotionAction !== 'await_delivery_contract_approval' || cursorNextHumanDecision !== 'approve Delivery Contract revision') {
        cursorPlanningErrors.push('pending Delivery Contract draft cursor lacks approval routing');
      }
    } else {
      cursorPlanningErrors.push(`cursor candidate '${cursorCandidate}' is not eligible or promoted`);
    }
  }
} else if (cursorCandidateSource !== 'none') {
  cursorPlanningErrors.push('cursor candidate source without candidate');
}
if (cursorPlanningErrors.length === 0) {
  add('PASS', 'WF138', 'cursor planning source, revision, candidate pointer, and promotion authority are coherent');
} else {
  add('ERROR', 'WF138', `cursor planning pointer is incomplete or unsafe: ${cursorPlanningErrors.join('; ')}`);
}

const jitErrors = [];
for (const backlogFile of findFiles(workflowPath, 'BACKLOG.md')) {
  const backlogContent = readFileSync(backlogFile, 'utf8');
  const taskCandidateTable = parseMarkdownTable(getSection(backlogContent, 'Task candidates'));
  if (!taskCandidateTable) continue;
  for (const requiredColumn of ['Candidate', 'Depends on', 'Based on contract revision', 'State', 'Previous result reviewed', 'Transition', 'Materialized task']) {
    if (!taskCandidateTable.headers.includes(requiredColumn)) jitErrors.push(`${path.basename(path.dirname(backlogFile))} task candidate columns`);
  }
  if (jitErrors.some((item) => item.includes(`${path.basename(path.dirname(backlogFile))} task candidate columns`))) continue;
  for (const row of taskCandidateTable.rows) {
    const taskCandidateId = normalizeInline(row.Candidate);
    if (!taskCandidateId || taskCandidateId.includes('|')) continue;
    const state = normalizeInline(row.State);
    const materializedTask = normalizeInline(row['Materialized task']);
    const transition = normalizeInline(row.Transition);
    const previousReviewed = normalizeInline(row['Previous result reviewed']);
    if (!getStateVocabulary().TaskCandidateStatus.includes(state)) jitErrors.push(`${taskCandidateId} task candidate state`);
    if (['planned', 'blocked', 'deferred', 'cancelled'].includes(state) && materializedTask !== 'none') jitErrors.push(`${taskCandidateId} is prematurely materialized`);
    if (state === 'ready_for_materialization') {
      if (transition !== 'valid') jitErrors.push(`${taskCandidateId} transition is not valid`);
      if (!['yes', 'not_applicable'].includes(previousReviewed)) jitErrors.push(`${taskCandidateId} previous result review`);
      if (materializedTask !== 'none') jitErrors.push(`${taskCandidateId} ready candidate already has TASK.md`);
    }
    if (['materialized', 'completed'].includes(state)) {
      if (materializedTask === 'none') {
        jitErrors.push(`${taskCandidateId} lacks materialized task`);
      } else {
        const materializedPath = path.join(path.dirname(backlogFile), ...materializedTask.split('/'));
        if (!existsSync(materializedPath)) {
          jitErrors.push(`${taskCandidateId} materialized task path`);
        } else {
          const taskContent = readFileSync(materializedPath, 'utf8');
          if (getField(getSection(taskContent, 'Identity'), 'task candidate') !== taskCandidateId ||
            getField(getSection(taskContent, 'Transition check'), 'source task candidate') !== taskCandidateId) {
            jitErrors.push(`${taskCandidateId} TASK.md candidate provenance`);
          }
        }
      }
    }
  }
}
const cursorTaskCandidate = normalizeInline(getField(position, 'task candidate'));
if (cursorTaskCandidate !== 'none' && currentTask !== 'none' && taskFile && taskFile !== 'none') {
  try {
    const cursorTaskPath = resolveRepositoryPath(root, taskFile);
    if (existsSync(cursorTaskPath) && getField(getSection(readFileSync(cursorTaskPath, 'utf8'), 'Identity'), 'task candidate') !== cursorTaskCandidate) {
      jitErrors.push('cursor task candidate differs from TASK.md');
    }
  } catch {
    // WF107 owns unsafe cursor task paths.
  }
}
if (jitErrors.length === 0) {
  add('PASS', 'WF139', 'JIT task candidate materialization is mechanically coherent');
} else {
  add('ERROR', 'WF139', `JIT task materialization is inconsistent: ${jitErrors.join('; ')}`);
}

const incrementErrors = [];
const blueprintIncrement = getSection(readiness, 'Blueprint increment');
const incrementStatus = normalizeInline(getField(blueprintIncrement, 'status'));
const incrementSource = normalizeInline(getField(blueprintIncrement, 'source'));
const incrementClassification = normalizeInline(getField(blueprintIncrement, 'classification'));
const incrementRevisionImpact = normalizeInline(getField(blueprintIncrement, 'planning revision impact'));
const incrementActiveImpact = normalizeInline(getField(blueprintIncrement, 'active work impact'));
const incrementQueueInsertion = normalizeInline(getField(blueprintIncrement, 'queue insertion'));
const incrementDecisionSource = normalizeInline(getField(blueprintIncrement, 'decision source'));
if (incrementStatus === 'none') {
  for (const inactiveValue of [incrementSource, incrementClassification, incrementRevisionImpact, incrementActiveImpact, incrementQueueInsertion, incrementDecisionSource]) {
    if (inactiveValue !== 'none') {
      incrementErrors.push('inactive Blueprint increment fields');
      break;
    }
  }
} else if (['proposed', 'approved', 'applied', 'blocked'].includes(incrementStatus)) {
  if (incrementSource === 'none' || incrementClassification === 'none') incrementErrors.push('increment source or classification');
  if (!['revision_required', 'no_change'].includes(incrementRevisionImpact)) incrementErrors.push('increment planning revision impact');
  if (!['unaffected', 'revalidate', 'challenge', 'setup_invalidation'].includes(incrementActiveImpact)) incrementErrors.push('increment active work impact');
  if (!['append', 'before_dependents', 'replace_future', 'hold'].includes(incrementQueueInsertion)) incrementErrors.push('increment queue insertion');
  if (['approved', 'applied'].includes(incrementStatus) && !isHumanDecisionSource(incrementDecisionSource)) incrementErrors.push('increment decision source');
  if (incrementStatus === 'proposed' && incrementDecisionSource !== 'none') incrementErrors.push('proposed increment decision source');
  if (incrementActiveImpact === 'setup_invalidation' && invalidationStatus !== 'active') incrementErrors.push('increment setup invalidation impact without active invalidation');
  if (incrementRevisionImpact === 'revision_required') {
    let revisionTargetFound = false;
    for (const planningSource of planningSources) {
      try {
        const sourcePath = resolveRepositoryPath(root, planningSource);
        if (!existsSync(sourcePath)) continue;
        const target = normalizeInline(getField(getSection(readFileSync(sourcePath, 'utf8'), 'Blueprint increment queue impact'), 'planning revision target'));
        if (/^\d+$/.test(target)) revisionTargetFound = true;
      } catch {
        // WF137 owns planning source reachability.
      }
    }
    if (!revisionTargetFound) incrementErrors.push('increment revision target');
  }
} else {
  incrementErrors.push('Blueprint increment status');
}
if (incrementErrors.length === 0) {
  add('PASS', 'WF140', 'Blueprint Increment status, revision impact, queue insertion, and active-work impact are coherent');
} else {
  add('ERROR', 'WF140', `Blueprint Increment record is incomplete or inconsistent: ${incrementErrors.join('; ')}`);
}

const closureErrors = [];
const cursorClosureTarget = normalizeInline(getField(position, 'closure target'));
const cursorCompletionGap = normalizeInline(getField(position, 'completion gap'));
if (!['not_assessed', 'open', 'completed', 'gap'].includes(activeScopeClosure)) closureErrors.push('active scope closure assessment');
if (!['yes', 'no'].includes(activeScopeNextSelection)) closureErrors.push('active scope next selection required');
if (activeScopeClosure === 'completed' && normalizeInline(getField(activeDeliveryScope, 'closure evidence')) === 'none') closureErrors.push('completed active scope lacks closure evidence');
if (!['none', 'delivery_unit', 'milestone', 'bounded_context', 'current_scope', 'project_vision'].includes(cursorClosureTarget)) closureErrors.push('cursor closure target');
for (const planningSource of planningSources) {
  try {
    const sourcePath = resolveRepositoryPath(root, planningSource);
    if (!existsSync(sourcePath)) continue;
    const planningContent = readFileSync(sourcePath, 'utf8');
    const completionGap = getSection(planningContent, 'Completion-gap review');
    if (!completionGap) continue;
    const gapStatus = normalizeInline(getField(completionGap, 'status'));
    const gapNextAction = normalizeInline(getField(completionGap, 'next required action'));
    const gapDecisionSource = normalizeInline(getField(completionGap, 'decision source'));
    if (!['not_assessed', 'not_required', 'gap_found', 'resolved'].includes(gapStatus)) closureErrors.push(`${planningSource} completion-gap status`);
    if (gapStatus === 'gap_found') {
      if (gapNextAction === 'none') closureErrors.push(`${planningSource} completion-gap next action`);
      if (cursorCompletionGap === 'none' && cursorNextHumanDecision !== 'acknowledge completion gap') closureErrors.push('completion gap is not surfaced in cursor');
    }
    if (gapStatus === 'resolved' && !isHumanDecisionSource(gapDecisionSource)) closureErrors.push(`${planningSource} completion-gap resolution authority`);
    const completionCriteria = getSection(planningContent, 'Project completion criteria');
    if (cursorClosureTarget === 'project_vision' && normalizeInline(getField(completionCriteria, 'status')) !== 'satisfied') {
      closureErrors.push('project vision closure without satisfied completion criteria');
    }
  } catch {
    // WF137 owns planning source reachability.
  }
}
if (closureErrors.length === 0) {
  add('PASS', 'WF141', 'closure target, completion-gap review, and scope completion evidence are coherent');
} else {
  add('ERROR', 'WF141', `closure or completion-gap routing is incomplete: ${closureErrors.join('; ')}`);
}

if (isPlaceholder(nextAction)) {
  add('ERROR', 'WF114', 'CURRENT_CURSOR does not expose a substantive next action');
} else {
  add('PASS', 'WF114', 'CURRENT_CURSOR exposes a substantive next action');
}

if (fatal) finish(2);

let activeContractContent = '';
let activeContractApproval = '';
let activeApprovedContractRevision = '';
let activeBacklogContent = '';

if (currentDelivery === 'none' && contractFile === 'none') {
  if (currentModule !== 'none') {
    add('ERROR', 'WF121', 'cursor without a Delivery Unit retains an owning Module');
  } else if (currentStatus === 'setup_required' && ['not_ready', 'invalidated'].includes(readinessStatus)) {
    add('PASS', 'WF121', 'cursor is waiting for initial or recovery setup');
  } else if (['awaiting_delivery', 'awaiting_context_selection', 'awaiting_context_definition'].includes(currentStatus) && readinessStatus === 'baseline_ready') {
    add('PASS', 'WF121', 'cursor is waiting for supervised delivery selection or definition');
  } else if (currentStatus === 'shaping' && readinessStatus === 'baseline_ready' && !['', 'none'].includes(getField(position, 'delivery candidate'))) {
    add('PASS', 'WF121', 'cursor is shaping a selected Delivery candidate before contract materialization');
  } else {
    add('ERROR', 'WF121', 'cursor without a Delivery Unit is inconsistent with readiness');
  }
} else if (contractFile && contractFile !== 'none') {
  let contractPath;
  try {
    contractPath = resolveRepositoryPath(root, contractFile);
  } catch {
    contractPath = null;
  }

  if (!contractPath || !existsSync(contractPath)) {
    add('ERROR', 'WF121', `Delivery Unit contract is missing or unsafe: ${contractFile}`);
  } else if (path.basename(path.dirname(contractPath)) !== currentDelivery) {
    add('ERROR', 'WF121', 'cursor Delivery Unit differs from contract path');
  } else {
    const activeContract = readFileSync(contractPath, 'utf8');
    activeContractContent = activeContract;
    const contractIdentity = getSection(activeContract, 'Identity');
    const contractProfile = getField(contractIdentity, 'profile');
    const contractRevision = getField(contractIdentity, 'contract revision');
    const contractStatus = getField(contractIdentity, 'status');
    const contractModule = getField(contractIdentity, 'owning module');
    const contractApproval = getField(contractIdentity, 'approval');
    const contractApprovalSource = getField(contractIdentity, 'approval source');
    const approvedContractRevision = getField(contractIdentity, 'approved contract revision');
    activeContractApproval = contractApproval;
    activeApprovedContractRevision = approvedContractRevision;
    const activeBacklogPath = path.join(path.dirname(contractPath), 'BACKLOG.md');
    activeBacklogContent = existsSync(activeBacklogPath) ? readFileSync(activeBacklogPath, 'utf8') : '';
    const contractApprovalScope = getField(contractIdentity, 'approval scope');
    const contractApprovalRationale = getField(contractIdentity, 'approval rationale');
    const contractApprovalUpdates = getField(contractIdentity, 'approval updates');
    const approvedContractIsCoherent = contractApproval === 'approved' &&
      isHumanDecisionSource(contractApprovalSource) &&
      approvedContractRevision === contractRevision &&
      contractApprovalScope === `contract revision ${contractRevision}` &&
      isDecisionDetail(contractApprovalRationale) &&
      isDecisionDetail(contractApprovalUpdates, { allowNone: true });
    const blockedRevisionIsCoherent = currentStatus === 'blocked' &&
      contractStatus === 'blocked' &&
      readinessStatus !== 'delivery_ready' &&
      readyToImplement === 'no' &&
      contractApproval === 'pending' &&
      contractApprovalSource === 'none' &&
      approvedContractRevision === 'none' &&
      contractApprovalScope === 'none' &&
      contractApprovalRationale === 'none' &&
      contractApprovalUpdates === 'none';

    if (contractProfile !== deliveryProfile ||
      contractRevision !== cursorContractRevision ||
      contractModule !== currentModule ||
      (!approvedContractIsCoherent && !blockedRevisionIsCoherent)) {
      add('ERROR', 'WF121', 'cursor and Delivery Unit contract authority are inconsistent');
    } else {
      add('PASS', 'WF121', 'cursor and Delivery Unit contract authority are coherent');
    }
  }
} else {
  add('ERROR', 'WF121', 'active Delivery Unit does not identify its contract');
}

if (expectedBranch && !expectedBranch.startsWith('<') && expectedBranch !== 'none') {
  const branchResult = runGit(['branch', '--show-current'], { cwd: root });
  const actualBranch = String(branchResult.stdout ?? '').trim();
  if (branchResult.status === 0 && actualBranch === expectedBranch) {
    add('PASS', 'WF105', `current branch matches '${expectedBranch}'`);
  } else {
    add('ERROR', 'WF105', `expected branch '${expectedBranch}', actual '${actualBranch}'`);
  }
} else {
  add('PASS', 'WF105', 'cursor does not require a concrete branch');
}

const requiredPaths = Array.from(requiredReads.matchAll(/^\s*-\s+`([^`]+)`\s*$/gm)).map((match) => match[1]);
if (requiredPaths.length === 0) {
  add('ERROR', 'WF106', 'Required reads contains no supported path entries');
} else {
  for (const relativePath of requiredPaths) {
    let fullPath;
    try {
      fullPath = resolveRepositoryPath(root, relativePath);
    } catch {
      add('ERROR', 'WF106', `required read escapes repository: ${relativePath}`);
      continue;
    }

    if (existsSync(fullPath)) {
      add('PASS', 'WF106', `required read exists: ${relativePath}`);
    } else {
      add('ERROR', 'WF106', `required read is missing: ${relativePath}`);
    }
  }
}

let activeTaskPath = null;
let activeTask = null;
if (currentTask === 'none' && (taskFile === 'none' || !taskFile)) {
  add('PASS', 'WF107', 'cursor is idle and does not require a task file');
} else if (taskFile) {
  let taskPath;
  try {
    taskPath = resolveRepositoryPath(root, taskFile);
  } catch {
    taskPath = null;
  }

  if (!taskPath || !existsSync(taskPath)) {
    add('ERROR', 'WF107', `current task file is missing or unsafe: ${taskFile}`);
  } else if (/^T\d{3}-/.test(currentTask) && path.basename(path.dirname(taskPath)) !== currentTask) {
    add('ERROR', 'WF107', `cursor task '${currentTask}' differs from task file '${taskFile}'`);
  } else {
    activeTaskPath = taskPath;
    activeTask = readFileSync(taskPath, 'utf8');
    add('PASS', 'WF107', 'cursor task and task file are consistent');
  }
} else {
  add('ERROR', 'WF107', 'active cursor does not identify a task file');
}

if (!activeTaskPath) {
  if (currentTask === 'none') {
    add('PASS', 'WF115', 'no active task contract requires validation');
  }
} else {
  const taskErrors = [];
  const taskIdentity = getSection(activeTask, 'Identity');
  const taskOutcome = getSection(activeTask, 'Outcome');
  const taskScope = getSection(activeTask, 'Scope');
  const taskReads = getSection(activeTask, 'Required reads');
  const taskPreconditions = getSection(activeTask, 'Preconditions');
  const taskAcceptance = getSection(activeTask, 'Acceptance');
  const taskVerification = getSection(activeTask, 'Verification');
  const contractBasis = getSection(activeTask, 'Contract basis');
  const transitionCheck = getSection(activeTask, 'Transition check');
  const taskChallenge = getSection(activeTask, 'Contract challenge');
  const taskChallengeStatus = getField(taskChallenge, 'status');
  const taskChallengeResolution = getField(taskChallenge, 'resolution');

  if (!hasSubstantiveLine(taskOutcome)) taskErrors.push('outcome');
  if (Array.from(String(taskScope ?? '').matchAll(/^\s*-\s+(?!\.\.\.|<)(\S.+)$/gm)).length < 2) taskErrors.push('scope');
  if (Array.from(String(taskAcceptance ?? '').matchAll(/^\s*-\s+\[[ xX]\]\s+(?!\.\.\.|<)(\S.+)$/gm)).length === 0) taskErrors.push('acceptance');

  const verificationCommand = getField(taskVerification, 'command or manual check') || getField(taskVerification, 'command');
  const expectedEvidence = getField(taskVerification, 'expected evidence');
  if (isPlaceholder(verificationCommand) || isPlaceholder(expectedEvidence)) taskErrors.push('verification');

  const taskStatus = getField(taskIdentity, 'status');
  const taskExpectedBranch = getField(taskPreconditions, 'expected branch');
  const taskDelivery = getField(taskIdentity, 'delivery unit');
  const basedOnRevision = getField(contractBasis, 'based on contract revision');
  const transitionStatus = getField(transitionCheck, 'status');
  const blockedChallengeTransition = taskStatus === 'blocked' &&
    ['open', 'resolved'].includes(taskChallengeStatus) &&
    (taskChallengeStatus === 'open' || ['contract_revision_required', 'task_split_required', 'blocked_or_deferred'].includes(taskChallengeResolution));

  if (taskStatus !== currentStatus) taskErrors.push('status differs from cursor');
  if (isPlaceholder(taskExpectedBranch) || taskExpectedBranch !== expectedBranch) taskErrors.push('expected branch differs from cursor');
  if (taskDelivery !== currentDelivery) taskErrors.push('Delivery Unit differs from cursor');
  if (basedOnRevision !== cursorContractRevision && taskChallengeResolution !== 'contract_revision_required') taskErrors.push('stale contract revision');
  if (transitionStatus !== 'valid' && !blockedChallengeTransition) {
    taskErrors.push('transition check');
  }
  if (!blockedChallengeTransition) {
    for (const field of ['contract revision current', 'repository changes reviewed', 'decisions and canonical sources reviewed', 'assumptions still valid']) {
      if (getField(transitionCheck, field) !== 'yes') taskErrors.push(`transition ${field}`);
    }
    if (!['yes', 'not_applicable'].includes(getField(transitionCheck, 'dependency results reviewed'))) {
      taskErrors.push('transition dependency results');
    }
  }

  const taskReadPaths = Array.from(String(taskReads ?? '').matchAll(/^\s*-\s+`([^`]+)`\s*$/gm)).map((match) => match[1]);
  if (taskReadPaths.length === 0) {
    taskErrors.push('required reads');
  } else {
    for (const relativePath of taskReadPaths) {
      let fullPath;
      try {
        fullPath = resolveRepositoryPath(root, relativePath);
      } catch {
        taskErrors.push(`required read escapes repository: ${relativePath}`);
        continue;
      }
      if (!existsSync(fullPath)) taskErrors.push(`missing required read: ${relativePath}`);
    }
  }

  if (taskErrors.length === 0) {
    add('PASS', 'WF115', 'active task contract is coherent');
  } else {
    add('ERROR', 'WF115', `active task contract is incomplete or inconsistent: ${taskErrors.join(', ')}`);
  }

  const challengeErrors = activeContractContent
    ? getContractChallengeErrors(activeTask, {
      workStatus: taskStatus,
      isCurrent: true,
      cursorStatus: currentStatus,
      readinessStatus,
      readyToImplement,
      profile: deliveryProfile,
      contractApproval: activeContractApproval,
      approvedContractRevision: activeApprovedContractRevision,
      backlogContent: activeBacklogContent
    })
    : ['active contract'];
  if (challengeErrors.length === 0) {
    add('PASS', 'WF125', 'active task Contract Challenge state is coherent');
  } else {
    add('ERROR', 'WF125', `active task Contract Challenge state is incomplete or inconsistent: ${challengeErrors.join(', ')}`);
  }
}

if (lastStableTask === 'none' && lastResultPathValue === 'none') {
  add('PASS', 'WF116', 'no last stable result requires validation');
} else {
  const resultErrors = [];
  const transitionErrors = [];
  let lastResultPath = null;
  try {
    lastResultPath = resolveRepositoryPath(root, lastResultPathValue);
  } catch {
    resultErrors.push('result file');
    transitionErrors.push('result file');
  }

  if (!lastResultPath || !existsSync(lastResultPath)) {
    if (!resultErrors.includes('result file')) resultErrors.push('result file');
    if (!transitionErrors.includes('result file')) transitionErrors.push('result file');
  } else {
    const lastResult = readFileSync(lastResultPath, 'utf8');
    const resultStatus = getSection(lastResult, 'Status');
    const acceptanceEvaluation = getSection(lastResult, 'Acceptance evaluation');
    const verificationEvidence = getSection(lastResult, 'Verification evidence');
    const workflowResync = getSection(lastResult, 'Workflow resync');
    const impactAssessment = getSection(lastResult, 'Impact assessment');
    const gitHandoff = getSection(lastResult, 'Git handoff');
    const sessionTransition = getSection(lastResult, 'Session transition');

    if (!/^\s*`DONE`\s*$/m.test(String(resultStatus ?? ''))) resultErrors.push('DONE status');
    if (!hasSubstantiveLine(acceptanceEvaluation)) resultErrors.push('acceptance evaluation');
    if (!hasSubstantiveLine(verificationEvidence)) resultErrors.push('verification evidence');
    for (const field of ['executed checks', 'evidence references', 'summary', 'limitations']) {
      if (isPlaceholder(getField(verificationEvidence, field))) resultErrors.push(`verification evidence ${field}`);
    }
    if (getField(workflowResync, 'cursor updated') !== 'yes') resultErrors.push('cursor resync');
    for (const field of ['deviations from task or contract', 'assumptions changed', 'decisions changed', 'canonical sources updated', 'contract impact', 'downstream task impact', 'downstream revalidation required']) {
      if (isMissingOrTemplatePlaceholder(getField(impactAssessment, field))) resultErrors.push(`impact ${field}`);
    }
    if (!['none', 'revision_required', 'blocked'].includes(getField(impactAssessment, 'contract impact'))) resultErrors.push('contract impact value');
    if (!['none', 'update_required', 'reshape_required', 'blocked'].includes(getField(impactAssessment, 'downstream task impact'))) resultErrors.push('downstream impact value');
    if (!['yes', 'no'].includes(getField(impactAssessment, 'downstream revalidation required'))) resultErrors.push('downstream revalidation value');

    const commitProposal = getField(gitHandoff, 'commit proposal');
    const commitApprovalSource = getField(gitHandoff, 'commit approval source');
    const commitScope = getField(gitHandoff, 'commit scope');
    const commitRationale = getField(gitHandoff, 'commit decision rationale');
    const commitUpdates = getField(gitHandoff, 'commit decision updates');
    const commitReference = getField(gitHandoff, 'commit');
    if (!['pending', 'approved', 'declined', 'not_applicable'].includes(commitProposal)) {
      resultErrors.push('commit proposal');
    } else if (['approved', 'declined'].includes(commitProposal)) {
      if (!isHumanDecisionSource(commitApprovalSource)) resultErrors.push('human commit approval source');
      if (isPlaceholder(commitRationale)) resultErrors.push('commit decision rationale');
      if (!isDecisionDetail(commitUpdates, { allowNone: true })) resultErrors.push('commit decision updates');
    } else if (hasInactiveDecisionDetails(commitApprovalSource, commitRationale, commitUpdates)) {
      resultErrors.push('inactive commit decision fields');
    }
    if (commitReference && commitReference !== 'none' && commitProposal !== 'approved') resultErrors.push('recorded commit lacks approval');
    if (commitProposal !== 'not_applicable' && isPlaceholder(commitScope)) {
      resultErrors.push('commit scope');
    } else if (commitProposal === 'not_applicable' && commitScope && commitScope !== 'none') {
      resultErrors.push('not-applicable commit scope');
    }

    const otherAction = getField(gitHandoff, 'other protected action');
    const otherActionDecision = getField(gitHandoff, 'other action decision');
    const otherActionSource = getField(gitHandoff, 'other action approval source');
    const otherActionScope = getField(gitHandoff, 'other action scope');
    const otherActionRationale = getField(gitHandoff, 'other action rationale');
    const otherActionUpdates = getField(gitHandoff, 'other action updates');
    if (otherAction === 'none') {
      if (hasInactiveDecisionDetails(otherActionDecision, otherActionSource, otherActionScope, otherActionRationale, otherActionUpdates)) {
        resultErrors.push('inactive protected action fields');
      }
    } else if (isPlaceholder(otherAction) || !['pending', 'approved', 'declined'].includes(otherActionDecision)) {
      resultErrors.push('other protected action');
    } else if (['approved', 'declined'].includes(otherActionDecision)) {
      if (!isHumanDecisionSource(otherActionSource) ||
        !isDecisionDetail(otherActionScope) ||
        !isDecisionDetail(otherActionRationale) ||
        !isDecisionDetail(otherActionUpdates, { allowNone: true })) {
        resultErrors.push('protected action decision record');
      }
    } else if (!isDecisionDetail(otherActionScope) || otherActionSource !== 'none' || otherActionRationale !== 'none' || otherActionUpdates !== 'none') {
      resultErrors.push('pending protected action authority');
    }

    if (path.basename(path.dirname(lastResultPath)) !== lastStableTask) resultErrors.push('task and result path');

    const contextClass = getField(sessionTransition, 'context class');
    const recommendation = getField(sessionTransition, 'recommendation');
    const transitionReason = getField(sessionTransition, 'reason');
    const handoff = getField(sessionTransition, 'handoff');
    const openingPrompt = getField(sessionTransition, 'opening prompt');
    const compactStopForm = contextClass === 'awaiting_delivery' &&
      recommendation === 'stop' &&
      !transitionReason &&
      !handoff &&
      !openingPrompt;
    if (!compactStopForm && isPlaceholder(transitionReason)) transitionErrors.push('reason');
    if (!compactStopForm && !['SWITCH_LLM_PROMPT.md', 'provided_in_chat', 'not_applicable'].includes(openingPrompt)) {
      transitionErrors.push('opening prompt');
    }

    if (contextClass === 'repository_sufficient') {
      if (recommendation !== 'new_session') transitionErrors.push('repository-sufficient recommendation');
      if (handoff !== 'none') transitionErrors.push('unnecessary handoff');
      if (openingPrompt === 'not_applicable') transitionErrors.push('new-session opening prompt');
    } else if (contextClass === 'handoff_required') {
      if (recommendation !== 'new_session') transitionErrors.push('handoff recommendation');
      if (!handoff || handoff === 'none') {
        transitionErrors.push('handoff path');
      } else {
        try {
          const handoffPath = resolveRepositoryPath(root, handoff);
          if (!existsSync(handoffPath)) transitionErrors.push('missing handoff');
        } catch {
          transitionErrors.push('missing handoff');
        }
      }
      if (openingPrompt === 'not_applicable') transitionErrors.push('handoff opening prompt');
    } else if (contextClass === 'same_session_justified') {
      if (!['compact_then_continue', 'continue_current'].includes(recommendation)) transitionErrors.push('same-session recommendation');
    } else if (contextClass === 'awaiting_delivery') {
      if (recommendation !== 'stop') transitionErrors.push('stop recommendation');
      if (!compactStopForm) {
        if (handoff !== 'none') transitionErrors.push('stop handoff');
        if (openingPrompt !== 'not_applicable') transitionErrors.push('stop opening prompt');
      }
    } else {
      transitionErrors.push('context class');
    }
  }

  if (resultErrors.length === 0) {
    add('PASS', 'WF116', 'last stable result has acceptance, evidence, resync, and Git handoff');
  } else {
    add('ERROR', 'WF116', `last stable result is incomplete: ${resultErrors.join(', ')}`);
  }

  if (transitionErrors.length === 0) {
    add('PASS', 'WF118', 'last stable result has a coherent session transition');
  } else {
    add('ERROR', 'WF118', `session transition is incomplete or inconsistent: ${transitionErrors.join(', ')}`);
  }
}

for (const backlogFile of findFiles(workflowPath, 'BACKLOG.md')) {
  const backlog = readFileSync(backlogFile, 'utf8');
  const contractPath = path.join(path.dirname(backlogFile), 'CONTRACT.md');
  const acceptancePath = path.join(path.dirname(backlogFile), 'ACCEPTANCE.md');
  const deliveryErrors = [];
  const contract = existsSync(contractPath) ? readFileSync(contractPath, 'utf8') : '';
  const contractIdentity = getSection(contract, 'Identity');
  const deliveryStatus = getField(contractIdentity, 'status');
  const deliveryProfileValue = getField(contractIdentity, 'profile');
  const deliveryBranch = getField(contractIdentity, 'branch');
  const branchApproval = getField(contractIdentity, 'branch approval');
  const branchApprovalSource = getField(contractIdentity, 'branch approval source');
  const branchDecisionRationale = getField(contractIdentity, 'branch decision rationale');
  const branchDecisionUpdates = getField(contractIdentity, 'branch decision updates');
  const contractRevisionValue = getField(contractIdentity, 'contract revision');
  const contractApproval = getField(contractIdentity, 'approval');
  const contractApprovalSource = getField(contractIdentity, 'approval source');
  const approvedContractRevision = getField(contractIdentity, 'approved contract revision');
  const contractApprovalScope = getField(contractIdentity, 'approval scope');
  const contractApprovalRationale = getField(contractIdentity, 'approval rationale');
  const contractApprovalUpdates = getField(contractIdentity, 'approval updates');
  if (!existsSync(contractPath)) deliveryErrors.push('contract file');
  if (deliveryProfileValue !== 'structured') deliveryErrors.push('structured profile');
  if (!/^\d+$/.test(contractRevisionValue)) deliveryErrors.push('contract revision');
  if (contractApproval === 'approved') {
    if (!isHumanDecisionSource(contractApprovalSource)) deliveryErrors.push('human contract approval source');
    if (contractApprovalScope !== `contract revision ${contractRevisionValue}`) deliveryErrors.push('contract approval scope');
    if (!isDecisionDetail(contractApprovalRationale)) deliveryErrors.push('contract approval rationale');
    if (!isDecisionDetail(contractApprovalUpdates, { allowNone: true })) deliveryErrors.push('contract approval updates');
    if (approvedContractRevision !== contractRevisionValue) deliveryErrors.push('approved contract revision');
  } else if (contractApproval === 'pending') {
    if ([contractApprovalSource, approvedContractRevision, contractApprovalScope, contractApprovalRationale, contractApprovalUpdates].some((value) => value && value !== 'none')) {
      deliveryErrors.push('pending contract approval fields');
    }
  } else if (contractApproval === 'declined') {
    if (!isHumanDecisionSource(contractApprovalSource) ||
      approvedContractRevision !== 'none' ||
      contractApprovalScope !== `contract revision ${contractRevisionValue}` ||
      !isDecisionDetail(contractApprovalRationale) ||
      !isDecisionDetail(contractApprovalUpdates, { allowNone: true })) {
      deliveryErrors.push('declined contract approval fields');
    }
  } else {
    deliveryErrors.push('contract approval');
  }

  if (['approved', 'exception_approved', 'declined'].includes(branchApproval)) {
    if (isPlaceholder(deliveryBranch) ||
      !isHumanDecisionSource(branchApprovalSource) ||
      !isDecisionDetail(branchDecisionRationale) ||
      !isDecisionDetail(branchDecisionUpdates, { allowNone: true })) {
      if (!isHumanDecisionSource(branchApprovalSource)) deliveryErrors.push('human branch approval source');
      if (isPlaceholder(deliveryBranch)) deliveryErrors.push('branch decision scope');
      if (!isDecisionDetail(branchDecisionRationale)) deliveryErrors.push('branch decision rationale');
      if (!isDecisionDetail(branchDecisionUpdates, { allowNone: true })) deliveryErrors.push('branch decision updates');
    }
  } else if (['pending', 'not_required'].includes(branchApproval)) {
    if (hasInactiveDecisionDetails(branchApprovalSource, branchDecisionRationale, branchDecisionUpdates)) deliveryErrors.push('inactive branch decision fields');
  } else {
    deliveryErrors.push('branch approval');
  }

  if (['ready', 'active', 'verifying', 'accepted', 'archived'].includes(deliveryStatus)) {
    if (contractApproval !== 'approved') deliveryErrors.push('contract approval');
    if (isPlaceholder(deliveryBranch)) deliveryErrors.push('branch');
    if (!['approved', 'exception_approved'].includes(branchApproval)) deliveryErrors.push('branch approval');
  }

  const decomposition = getSection(backlog, 'Decomposition review');
  const decompositionStatus = getField(decomposition, 'status');
  const requiresApprovedDecomposition = ['ready', 'active', 'verifying', 'accepted', 'archived'].includes(deliveryStatus);
  if (requiresApprovedDecomposition && decompositionStatus !== 'approved') {
    deliveryErrors.push('decomposition review');
  } else if (!requiresApprovedDecomposition && !['pending', 'approved', 'split_required', 'blocked'].includes(decompositionStatus)) {
    deliveryErrors.push('decomposition review');
  }
  if (decompositionStatus === 'approved') {
    for (const field of ['single outcome per task', 'independently verifiable', 'boundaries and checks are coherent']) {
      if (getField(decomposition, field) !== 'yes') deliveryErrors.push(`decomposition ${field}`);
    }
    if (getField(decomposition, 'hidden decisions') !== 'none') deliveryErrors.push('decomposition hidden decisions');
    if (getField(decomposition, 'split or merge required') !== 'none') deliveryErrors.push('decomposition split or merge');
    if (isPlaceholder(getField(decomposition, 'rationale'))) deliveryErrors.push('decomposition rationale');
  }

  const taskMatches = Array.from(backlog.matchAll(/^\s*-\s+\[([ xX])\]\s+`(T\d{3}-[A-Za-z0-9-]+)`\s+-\s+depends on:\s+`[^`]+`\s+-\s+based on contract revision:\s+`(\d+)`\s*$/gm));

  for (const taskMatch of taskMatches) {
    const isChecked = /[xX]/.test(taskMatch[1]);
    const taskName = taskMatch[2];
    const taskRevision = taskMatch[3];
    const resultPath = path.join(path.dirname(backlogFile), 'tasks', taskName, 'RESULT.md');
    let isDone = false;
    if (existsSync(resultPath)) {
      const result = readFileSync(resultPath, 'utf8');
      isDone = /^## Status\s*[\r\n]+\s*`DONE`\s*(?=^## |\s*$)/ms.test(result);
    }

    if (isChecked === isDone) {
      add('PASS', 'WF108', `backlog and result agree: ${taskName}`);
    } else {
      add('ERROR', 'WF108', `backlog and result disagree: ${taskName}`);
    }

    if (!isDone && contractRevisionValue && taskRevision !== contractRevisionValue) {
      add('ERROR', 'WF108', `backlog task revision is stale: ${taskName}`);
      deliveryErrors.push(`stale downstream task ${taskName}`);
    }
  }

  if (['accepted', 'archived'].includes(deliveryStatus)) {
    if (taskMatches.length === 0 || taskMatches.some((match) => !/[xX]/.test(match[1]))) {
      deliveryErrors.push('completed tasks');
    }

    if (!existsSync(acceptancePath)) {
      deliveryErrors.push('acceptance file');
    } else {
      const deliveryAcceptance = readFileSync(acceptancePath, 'utf8');
      if (!hasSubstantiveLine(getSection(deliveryAcceptance, 'Acceptance'))) deliveryErrors.push('acceptance contract');
      if (!hasSubstantiveLine(getSection(deliveryAcceptance, 'Non-regression'))) deliveryErrors.push('non-regression contract');
      const closure = getSection(deliveryAcceptance, 'Closure review');
      for (const field of ['task coherence', 'acceptance result', 'regressions or inconsistencies', 'executed checks', 'summary', 'evidence references', 'limitations', 'repository state', 'downstream assumptions', 'quality and simplicity', 'operational cost', 'contract impact', 'downstream revalidation result', 'follow-ups']) {
        if (isMissingOrTemplatePlaceholder(getField(closure, field))) deliveryErrors.push(field);
      }
      if (getField(closure, 'review mode') !== 'structured_aggregate') deliveryErrors.push('structured review mode');
      if (getField(closure, 'review status') !== 'passed') deliveryErrors.push('structured review status');
      if (getField(closure, 'contract revision reviewed') !== contractRevisionValue) deliveryErrors.push('reviewed contract revision');

      const humanValidationRequired = getField(closure, 'human validation required');
      const humanValidationStatus = getField(closure, 'human validation status');
      const humanDecisionSource = getField(closure, 'human decision source');
      const humanDecisionScope = getField(closure, 'human decision scope');
      const humanDecisionRationale = getField(closure, 'human decision rationale');
      const humanDecisionUpdates = getField(closure, 'human decision updates');
      if (humanValidationRequired === 'yes') {
        if (humanValidationStatus !== 'confirmed' ||
          !isHumanDecisionSource(humanDecisionSource) ||
          !isDecisionDetail(humanDecisionScope) ||
          !isDecisionDetail(humanDecisionRationale) ||
          !isDecisionDetail(humanDecisionUpdates, { allowNone: true })) {
          deliveryErrors.push('human validation');
        }
      } else if (humanValidationRequired === 'no') {
        if ((humanValidationStatus && humanValidationStatus !== 'not_required') ||
          hasInactiveDecisionDetails(humanDecisionSource, humanDecisionScope, humanDecisionRationale, humanDecisionUpdates)) {
          deliveryErrors.push('human validation fields');
        }
      } else {
        deliveryErrors.push('human validation required');
      }

      const integrationDecision = getField(closure, 'integration decision');
      const integrationApproval = getField(closure, 'integration approval');
      const integrationApprovalSource = getField(closure, 'integration approval source');
      const integrationScope = getField(closure, 'integration scope');
      const integrationRationale = getField(closure, 'integration rationale');
      const integrationUpdates = getField(closure, 'integration updates');
      const integrationResult = getField(closure, 'integration result');
      const finalStatus = getField(closure, 'final status');
      const closureDecisionSource = getField(closure, 'closure decision source');
      const closureDecisionScope = getField(closure, 'closure decision scope');
      const closureDecisionRationale = getField(closure, 'closure decision rationale');
      const closureDecisionUpdates = getField(closure, 'closure decision updates');
      if (!['merge', 'pull_request', 'defer'].includes(integrationDecision)) deliveryErrors.push('integration decision');
      if (!['pending', 'approved', 'declined', 'not_required'].includes(integrationApproval)) {
        deliveryErrors.push('integration approval');
      } else if (['approved', 'declined'].includes(integrationApproval)) {
        if (!isHumanDecisionSource(integrationApprovalSource) ||
          !isDecisionDetail(integrationScope) ||
          !isDecisionDetail(integrationRationale) ||
          !isDecisionDetail(integrationUpdates, { allowNone: true })) {
          deliveryErrors.push('integration decision record');
        }
      } else if (hasInactiveDecisionDetails(integrationApprovalSource, integrationScope, integrationRationale, integrationUpdates)) {
        deliveryErrors.push('inactive integration decision fields');
      }
      if (isPlaceholder(integrationResult)) deliveryErrors.push('integration result');
      else if (!['pending', 'deferred'].includes(integrationResult) && integrationApproval !== 'approved') deliveryErrors.push('recorded integration lacks approval');
      if (finalStatus !== 'accepted') deliveryErrors.push('final status');
      if (!isHumanDecisionSource(closureDecisionSource) ||
        closureDecisionScope !== `contract revision ${contractRevisionValue}` ||
        !isDecisionDetail(closureDecisionRationale) ||
        !isDecisionDetail(closureDecisionUpdates, { allowNone: true })) {
        deliveryErrors.push('human Structured closure decision');
      }
    }
  }

  if (deliveryErrors.length === 0) {
    add('PASS', 'WF117', `structured Delivery Unit is coherent: ${path.basename(path.dirname(backlogFile))}`);
  } else {
    add('ERROR', 'WF117', `structured Delivery Unit is incomplete for ${path.basename(path.dirname(backlogFile))}: ${deliveryErrors.join(', ')}`);
  }
}

for (const contractItem of findFiles(workflowPath, 'CONTRACT.md')) {
  const deliveryDirectory = path.dirname(contractItem);
  if (existsSync(path.join(deliveryDirectory, 'BACKLOG.md'))) continue;

  const lightContract = readFileSync(contractItem, 'utf8');
  const identity = getSection(lightContract, 'Identity');
  const lightErrors = [];
  const lightProfile = getField(identity, 'profile');
  const lightStatus = getField(identity, 'status');
  const lightBranch = getField(identity, 'branch');
  const lightContractRevision = getField(identity, 'contract revision');
  const lightApproval = getField(identity, 'approval');
  const lightApprovalSource = getField(identity, 'approval source');
  const lightApprovedRevision = getField(identity, 'approved contract revision');
  const lightApprovalScope = getField(identity, 'approval scope');
  const lightApprovalRationale = getField(identity, 'approval rationale');
  const lightApprovalUpdates = getField(identity, 'approval updates');
  const lightBranchApproval = getField(identity, 'branch approval');
  const lightBranchApprovalSource = getField(identity, 'branch approval source');
  const lightBranchRationale = getField(identity, 'branch decision rationale');
  const lightBranchUpdates = getField(identity, 'branch decision updates');

  if (lightProfile !== 'light') lightErrors.push('light profile');
  if (!/^\d+$/.test(lightContractRevision)) lightErrors.push('contract revision');

  if (lightApproval === 'approved') {
    if (!isAuthorityDecisionRecord(lightApprovalSource, lightApprovalScope, lightApprovalRationale, lightApprovalUpdates, {
      expectedScope: `contract revision ${lightContractRevision}`,
      allowUpdatesNone: true
    })) {
      if (!isHumanDecisionSource(lightApprovalSource)) lightErrors.push('human contract approval source');
      if (lightApprovalScope !== `contract revision ${lightContractRevision}`) lightErrors.push('contract approval scope');
      if (!isDecisionDetail(lightApprovalRationale)) lightErrors.push('contract approval rationale');
      if (!isDecisionDetail(lightApprovalUpdates, { allowNone: true })) lightErrors.push('contract approval updates');
    }
    if (lightApprovedRevision !== lightContractRevision) lightErrors.push('approved contract revision');
  } else if (lightApproval === 'pending') {
    if ([lightApprovalSource, lightApprovedRevision, lightApprovalScope, lightApprovalRationale, lightApprovalUpdates].some((value) => value && value !== 'none')) {
      lightErrors.push('pending contract approval fields');
    }
  } else if (lightApproval === 'declined') {
    if (!isHumanDecisionSource(lightApprovalSource) ||
      lightApprovedRevision !== 'none' ||
      lightApprovalScope !== `contract revision ${lightContractRevision}` ||
      !isDecisionDetail(lightApprovalRationale) ||
      !isDecisionDetail(lightApprovalUpdates, { allowNone: true })) {
      lightErrors.push('declined contract approval fields');
    }
  } else {
    lightErrors.push('contract approval');
  }

  if (['approved', 'exception_approved', 'declined'].includes(lightBranchApproval)) {
    if (isPlaceholder(lightBranch) ||
      !isAuthorityDecisionRecord(lightBranchApprovalSource, lightBranch, lightBranchRationale, lightBranchUpdates, { allowUpdatesNone: true })) {
      if (!isHumanDecisionSource(lightBranchApprovalSource)) lightErrors.push('human branch approval source');
      if (isPlaceholder(lightBranch)) lightErrors.push('branch decision scope');
      if (!isDecisionDetail(lightBranchRationale)) lightErrors.push('branch decision rationale');
      if (!isDecisionDetail(lightBranchUpdates, { allowNone: true })) lightErrors.push('branch decision updates');
    }
  } else if (['pending', 'not_required'].includes(lightBranchApproval)) {
    if (hasInactiveDecisionDetails(lightBranchApprovalSource, lightBranchRationale, lightBranchUpdates)) lightErrors.push('inactive branch decision fields');
  } else {
    lightErrors.push('branch approval');
  }

  if (['ready', 'active', 'verifying', 'accepted', 'archived'].includes(lightStatus) && lightApproval !== 'approved') {
    lightErrors.push('contract approval');
  }

  const lightExecution = getSection(lightContract, 'Light execution');
  if (!hasChecklistLine(lightExecution)) lightErrors.push('acceptance');
  const lightNonRegression = /^### Non-regression\s*[\r\n]+(?<body>.*?)(?=^### |\s*$)/ms.exec(lightExecution);
  if (!lightNonRegression || !hasChecklistLine(lightNonRegression.groups.body)) lightErrors.push('non-regression');
  if (isPlaceholder(getField(lightExecution, 'expected evidence'))) lightErrors.push('verification');

  if (['accepted', 'archived'].includes(lightStatus)) {
    const lightResultPath = path.join(deliveryDirectory, 'RESULT.md');
    if (!existsSync(lightResultPath)) {
      lightErrors.push('result file');
    } else {
      const lightResult = readFileSync(lightResultPath, 'utf8');
      if (getResultStatus(lightResult) !== 'DONE') lightErrors.push('DONE result');
      const lightImpact = getSection(lightResult, 'Impact assessment');
      if (!['yes', 'no'].includes(getField(lightImpact, 'downstream revalidation required'))) lightErrors.push('impact assessment');
      const lightReview = getSection(lightResult, 'Review');
      if (getField(lightReview, 'review mode') !== 'light_self_review') lightErrors.push('light review mode');
      if (getField(lightReview, 'review status') !== 'passed') lightErrors.push('light review status');
      if (getField(lightReview, 'contract revision reviewed') !== lightContractRevision) lightErrors.push('reviewed contract revision');
      for (const field of ['acceptance and non-regressions', 'verification evidence', 'repository state', 'downstream assumptions']) {
        if (isPlaceholder(getField(lightReview, field))) lightErrors.push(`review ${field}`);
      }
      const lightHumanRequired = getField(lightReview, 'human validation required');
      const lightHumanStatus = getField(lightReview, 'human validation status');
      const lightHumanSource = getField(lightReview, 'human decision source');
      const lightHumanScope = getField(lightReview, 'human decision scope');
      const lightHumanRationale = getField(lightReview, 'human decision rationale');
      const lightHumanUpdates = getField(lightReview, 'human decision updates');
      if (lightHumanRequired === 'yes') {
        if (lightHumanStatus !== 'confirmed' ||
          !isAuthorityDecisionRecord(lightHumanSource, lightHumanScope, lightHumanRationale, lightHumanUpdates, { allowUpdatesNone: true })) {
          lightErrors.push('human validation');
        }
      } else if (lightHumanRequired === 'no') {
        if ((lightHumanStatus && lightHumanStatus !== 'not_required') ||
          hasInactiveDecisionDetails(lightHumanSource, lightHumanScope, lightHumanRationale, lightHumanUpdates)) {
          lightErrors.push('human validation fields');
        }
      } else {
        lightErrors.push('human validation required');
      }
    }
  }

  if (lightErrors.length === 0) {
    add('PASS', 'WF122', `light Delivery Unit is coherent: ${path.basename(deliveryDirectory)}`);
  } else {
    add('ERROR', 'WF122', `light Delivery Unit is incomplete for ${path.basename(deliveryDirectory)}: ${lightErrors.join(', ')}`);
  }
}

const stateVocabularyErrors = [];
recordState(stateVocabularyErrors, 'SetupType', 'PROJECT_READINESS Setup state.type', setupType);
recordState(stateVocabularyErrors, 'IntakeStrategy', 'PROJECT_READINESS intake strategy', intakeStrategy);
recordState(stateVocabularyErrors, 'IntakeSource', 'PROJECT_READINESS intake source', intakeSource);
recordState(stateVocabularyErrors, 'ProjectReadiness', 'PROJECT_READINESS status', readinessStatus);
recordState(stateVocabularyErrors, 'InvalidationStatus', 'PROJECT_READINESS invalidation status', invalidationStatus);
recordState(stateVocabularyErrors, 'StatePolicy', 'WORKFLOW_CONFIG state policy', stateMode);
recordState(stateVocabularyErrors, 'CursorStatus', 'CURRENT_CURSOR status', currentStatus);
recordState(stateVocabularyErrors, 'DeliveryProfile', 'CURRENT_CURSOR delivery profile', deliveryProfile);

for (const contractItem of findFiles(workflowPath, 'CONTRACT.md')) {
  const contractContent = readFileSync(contractItem, 'utf8');
  const identity = getSection(contractContent, 'Identity');
  const executionGuidance = getSection(contractContent, 'Execution guidance');
  const relativeContract = toSlash(path.relative(root, contractItem));
  recordState(stateVocabularyErrors, 'DeliveryProfile', `${relativeContract} profile`, getField(identity, 'profile'));
  recordState(stateVocabularyErrors, 'DeliveryUnitStatus', `${relativeContract} status`, getField(identity, 'status'));
  recordState(stateVocabularyErrors, 'ContractApproval', `${relativeContract} approval`, getField(identity, 'approval'));
  recordState(stateVocabularyErrors, 'BranchApproval', `${relativeContract} branch approval`, getField(identity, 'branch approval'));
  const reasoningLevel = getField(executionGuidance, 'reasoning level');
  if (reasoningLevel) recordState(stateVocabularyErrors, 'ReasoningLevel', `${relativeContract} reasoning level`, reasoningLevel);
  const challenge = getSection(contractContent, 'Contract challenge');
  if (challenge) {
    recordState(stateVocabularyErrors, 'ChallengeStatus', `${relativeContract} challenge status`, getField(challenge, 'status'));
    recordState(stateVocabularyErrors, 'ChallengeResolution', `${relativeContract} challenge resolution`, getField(challenge, 'resolution'));
  }
  for (const sourceField of ['approval source', 'branch approval source']) {
    const sourceValue = getField(identity, sourceField);
    if (sourceField === 'branch approval source' &&
      !sourceValue &&
      ['pending', 'not_required'].includes(getField(identity, 'branch approval'))) {
      continue;
    }
    if (sourceValue && sourceValue !== 'none' && !isHumanDecisionSource(sourceValue)) {
      stateVocabularyErrors.push(`${relativeContract} ${sourceField} '${sourceValue}' is unsupported; allowed: none or user:<decision-reference>`);
    }
  }
}

for (const backlogFile of findFiles(workflowPath, 'BACKLOG.md')) {
  const decomposition = getSection(readFileSync(backlogFile, 'utf8'), 'Decomposition review');
  recordState(stateVocabularyErrors, 'DecompositionStatus', `${toSlash(path.relative(root, backlogFile))} decomposition status`, getField(decomposition, 'status'));
}

for (const taskItem of findFiles(workflowPath, 'TASK.md')) {
  const taskContent = readFileSync(taskItem, 'utf8');
  const taskIdentity = getSection(taskContent, 'Identity');
  if (!taskIdentity) continue;
  const relativeTask = toSlash(path.relative(root, taskItem));
  const recordedTaskStatus = getField(taskIdentity, 'status');
  recordState(stateVocabularyErrors, 'TaskStatus', `${relativeTask} status`, recordedTaskStatus);
  const taskTransition = getSection(taskContent, 'Transition check');
  const recordedTransitionStatus = getField(taskTransition, 'status');
  recordState(stateVocabularyErrors, 'TransitionStatus', `${relativeTask} transition status`, recordedTransitionStatus);
  const taskChallengeSection = getSection(taskContent, 'Contract challenge');
  if (taskChallengeSection) {
    recordState(stateVocabularyErrors, 'ChallengeStatus', `${relativeTask} challenge status`, getField(taskChallengeSection, 'status'));
    recordState(stateVocabularyErrors, 'ChallengeResolution', `${relativeTask} challenge resolution`, getField(taskChallengeSection, 'resolution'));
  }
  const siblingResultPath = path.join(path.dirname(taskItem), 'RESULT.md');
  if (recordedTaskStatus === 'completed') {
    if (!existsSync(siblingResultPath) || getResultStatus(readFileSync(siblingResultPath, 'utf8')) !== 'DONE') {
      stateVocabularyErrors.push(`${relativeTask} completed requires a sibling result with status DONE`);
    }
  }
  if (recordedTaskStatus === 'blocked') {
    const transitionOutcome = getField(taskTransition, 'outcome');
    if (recordedTransitionStatus === 'valid' || isPlaceholder(transitionOutcome)) {
      stateVocabularyErrors.push(`${relativeTask} blocked requires a non-valid transition and substantive blocker outcome`);
    }
  }
}

for (const resultItem of findFiles(workflowPath, 'RESULT.md')) {
  const resultContent = readFileSync(resultItem, 'utf8');
  const relativeResult = toSlash(path.relative(root, resultItem));
  recordState(stateVocabularyErrors, 'ResultStatus', `${relativeResult} status`, getResultStatus(resultContent));
  const review = getSection(resultContent, 'Review');
  if (review) {
    recordState(stateVocabularyErrors, 'LightReviewMode', `${relativeResult} review mode`, getField(review, 'review mode'));
    recordState(stateVocabularyErrors, 'LightReviewStatus', `${relativeResult} review status`, getField(review, 'review status'));
    recordState(stateVocabularyErrors, 'HumanValidationRequired', `${relativeResult} human validation required`, getField(review, 'human validation required'));
    recordState(stateVocabularyErrors, 'HumanValidationStatus', `${relativeResult} human validation status`, getField(review, 'human validation status'));
  }
  const git = getSection(resultContent, 'Git handoff');
  if (git) {
    recordState(stateVocabularyErrors, 'CommitProposal', `${relativeResult} commit proposal`, getField(git, 'commit proposal'));
    if (getField(git, 'other protected action') !== 'none') {
      recordState(stateVocabularyErrors, 'ProtectedActionDecision', `${relativeResult} other action decision`, getField(git, 'other action decision'));
    }
  }
  const session = getSection(resultContent, 'Session transition');
  if (session) {
    recordState(stateVocabularyErrors, 'SessionContext', `${relativeResult} session context`, getField(session, 'context class'));
    recordState(stateVocabularyErrors, 'SessionRecommendation', `${relativeResult} session recommendation`, getField(session, 'recommendation'));
  }
}

for (const acceptanceItem of findFiles(workflowPath, 'ACCEPTANCE.md')) {
  const closure = getSection(readFileSync(acceptanceItem, 'utf8'), 'Closure review');
  const relativeAcceptance = toSlash(path.relative(root, acceptanceItem));
  recordState(stateVocabularyErrors, 'StructuredReviewMode', `${relativeAcceptance} review mode`, getField(closure, 'review mode'));
  recordState(stateVocabularyErrors, 'StructuredReviewStatus', `${relativeAcceptance} review status`, getField(closure, 'review status'));
  recordState(stateVocabularyErrors, 'HumanValidationRequired', `${relativeAcceptance} human validation required`, getField(closure, 'human validation required'));
  recordState(stateVocabularyErrors, 'HumanValidationStatus', `${relativeAcceptance} human validation status`, getField(closure, 'human validation status'));
  recordState(stateVocabularyErrors, 'IntegrationDecision', `${relativeAcceptance} integration decision`, getField(closure, 'integration decision'));
  recordState(stateVocabularyErrors, 'IntegrationApproval', `${relativeAcceptance} integration approval`, getField(closure, 'integration approval'));
  recordState(stateVocabularyErrors, 'ClosureStatus', `${relativeAcceptance} final status`, getField(closure, 'final status'));
}

if (stateVocabularyErrors.length === 0) {
  add('PASS', 'WF131', 'canonical state values are valid in their owning artifact contexts');
} else {
  add('ERROR', 'WF131', `canonical state vocabulary violations: ${stateVocabularyErrors.join('; ')}`);
}

const stateMappingErrors = [];
const allowedCursorByReadiness = {
  not_ready: ['setup_required', 'blocked'],
  invalidated: ['setup_required', 'blocked'],
  baseline_ready: ['awaiting_delivery', 'awaiting_context_selection', 'awaiting_context_definition', 'shaping', 'blocked'],
  delivery_ready: ['ready', 'in_progress', 'verifying', 'blocked', 'completed']
};
if (allowedCursorByReadiness[readinessStatus] && !allowedCursorByReadiness[readinessStatus].includes(currentStatus)) {
  stateMappingErrors.push(`readiness '${readinessStatus}' conflicts with cursor '${currentStatus}'`);
}
if (['awaiting_delivery', 'awaiting_context_selection', 'awaiting_context_definition'].includes(currentStatus) &&
  (currentDelivery !== 'none' || currentTask !== 'none')) {
  stateMappingErrors.push('awaiting-delivery cursor retains active work');
}

let mappingContractStatus = '';
if (contractFile && contractFile !== 'none') {
  try {
    const mappedContractPath = resolveRepositoryPath(root, contractFile);
    if (existsSync(mappedContractPath)) {
      mappingContractStatus = getField(getSection(readFileSync(mappedContractPath, 'utf8'), 'Identity'), 'status');
    }
  } catch {
    // WF121 owns unsafe contract paths.
  }
}
let mappingTaskStatus = '';
if (taskFile && taskFile !== 'none') {
  try {
    const mappedTaskPath = resolveRepositoryPath(root, taskFile);
    if (existsSync(mappedTaskPath)) {
      mappingTaskStatus = getField(getSection(readFileSync(mappedTaskPath, 'utf8'), 'Identity'), 'status');
    }
  } catch {
    // WF107 owns unsafe task paths.
  }
}
if (mappingTaskStatus) {
  const taskCursorMappings = {
    ready: { task: ['ready'], delivery: ['ready', 'active'] },
    in_progress: { task: ['in_progress'], delivery: ['active'] },
    verifying: { task: ['verifying'], delivery: ['verifying', 'active'] },
    blocked: { task: ['blocked'], delivery: ['blocked', 'active'] },
    completed: { task: ['completed'], delivery: ['accepted', 'archived', 'active', 'verifying'] }
  };
  const mapping = taskCursorMappings[currentStatus];
  if (mapping && (!mapping.task.includes(mappingTaskStatus) || !mapping.delivery.includes(mappingContractStatus))) {
    stateMappingErrors.push(`cursor '${currentStatus}' conflicts with Delivery Unit '${mappingContractStatus}' and task '${mappingTaskStatus}'`);
  }
} else if (mappingContractStatus) {
  const deliveryCursorMappings = {
    shaping: ['candidate', 'shaping'],
    ready: ['ready'],
    in_progress: ['active'],
    verifying: ['verifying'],
    blocked: ['blocked'],
    completed: ['accepted', 'archived']
  };
  if (deliveryCursorMappings[currentStatus] && !deliveryCursorMappings[currentStatus].includes(mappingContractStatus)) {
    stateMappingErrors.push(`cursor '${currentStatus}' conflicts with Delivery Unit '${mappingContractStatus}'`);
  }
}

if (contractFile && contractFile !== 'none') {
  try {
    const mappedContractPath = resolveRepositoryPath(root, contractFile);
    const mappingBacklogPath = path.join(path.dirname(mappedContractPath), 'BACKLOG.md');
    if (existsSync(mappingBacklogPath)) {
      const mappingDecomposition = getField(getSection(readFileSync(mappingBacklogPath, 'utf8'), 'Decomposition review'), 'status');
      if (mappingDecomposition === 'split_required' && (readinessStatus === 'delivery_ready' || ['ready', 'in_progress', 'verifying'].includes(currentStatus))) {
        stateMappingErrors.push('split_required decomposition cannot coexist with Delivery Unit readiness or implementation');
      }
    }
  } catch {
    // WF121 owns unsafe contract paths.
  }
}

if (stateMappingErrors.length === 0) {
  add('PASS', 'WF132', 'readiness, cursor, Delivery Unit, task, blocker, and decomposition mappings are coherent');
} else {
  add('ERROR', 'WF132', `cross-artifact state mapping violations: ${stateMappingErrors.join('; ')}; route to doctor or recovery before implementation`);
}

const affectedDeliveryErrors = [];
const moduleErrors = [];
const configuredModuleRoot = getField(pathsSection, 'module root');
let moduleRootPath = '';
try {
  moduleRootPath = configuredModuleRoot ? resolveRepositoryPath(root, configuredModuleRoot) : '';
} catch {
  moduleRootPath = '';
}
const moduleIds = new Set();
if (moduleRootPath && existsSync(moduleRootPath)) {
  for (const entry of readdirSync(moduleRootPath, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const moduleId = entry.name;
    moduleIds.add(moduleId);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(moduleId)) moduleErrors.push(`invalid Module id ${moduleId}`);
    const moduleFile = path.join(moduleRootPath, moduleId, 'MODULE.md');
    if (!existsSync(moduleFile)) {
      moduleErrors.push(`missing MODULE.md for ${moduleId}`);
      continue;
    }
    const moduleContent = readFileSync(moduleFile, 'utf8');
    const moduleIdentity = getSection(moduleContent, 'Identity');
    if (getField(moduleIdentity, 'module') !== moduleId) moduleErrors.push(`identity mismatch for ${moduleId}`);
    if (!['active', 'deprecated'].includes(getField(moduleIdentity, 'status'))) moduleErrors.push(`unsupported status for ${moduleId}`);
    for (const heading of ['Responsibility', 'Boundaries', 'Canonical sources', 'Dependencies', 'Invariants and checks']) {
      const section = getSection(moduleContent, heading);
      if (!hasSubstantiveLine(section)) moduleErrors.push(`${moduleId} lacks substantive ${heading}`);
    }
  }
}
const contractFiles = findFiles(workflowPath, 'CONTRACT.md');
const deliveryIds = contractFiles.map((item) => path.basename(path.dirname(item)));
for (const deliveryId of deliveryIds.filter((item, index, items) => items.indexOf(item) !== index)) {
  moduleErrors.push(`duplicate Delivery Unit id ${deliveryId}`);
}
for (const contractItem of contractFiles) {
  const contractContent = readFileSync(contractItem, 'utf8');
  const contractIdentity = getSection(contractContent, 'Identity');
  const owningModule = getField(contractIdentity, 'owning module');
  const affectedModulesValue = getField(contractIdentity, 'affected modules');
  const relativeContractPath = toSlash(path.relative(root, contractItem));
  const normalizedModuleRoot = trimRoot(configuredModuleRoot || '').replaceAll('\\', '/');
  const moduleLocationMatch = normalizedModuleRoot
    ? new RegExp(`^${escapeRegExp(normalizedModuleRoot)}/(?<module>[^/]+)/delivery-units/`).exec(relativeContractPath)
    : null;
  if (moduleLocationMatch?.groups?.module) {
    const locationModule = moduleLocationMatch.groups.module;
    if (owningModule !== locationModule) moduleErrors.push(`${path.basename(path.dirname(contractItem))} owner '${owningModule}' differs from location '${locationModule}'`);
  } else if (owningModule !== 'none') {
    moduleErrors.push(`root Delivery Unit ${path.basename(path.dirname(contractItem))} must use owning module none`);
  }
  if (owningModule !== 'none' && !moduleIds.has(owningModule)) {
    moduleErrors.push(`${path.basename(path.dirname(contractItem))} references missing owning Module ${owningModule}`);
  }
  if (!affectedModulesValue) {
    moduleErrors.push(`${path.basename(path.dirname(contractItem))} lacks affected modules`);
  } else if (affectedModulesValue !== 'none') {
    for (const affectedModule of affectedModulesValue.split(',').map((item) => item.trim()).filter(Boolean)) {
      if (!moduleIds.has(affectedModule)) moduleErrors.push(`${path.basename(path.dirname(contractItem))} references missing affected Module ${affectedModule}`);
    }
  }
}
if (moduleErrors.length === 0) {
  add('PASS', 'WF134', 'optional Modules and Delivery Unit ownership are coherent');
} else {
  add('ERROR', 'WF134', `Module organization is inconsistent: ${moduleErrors.join(', ')}`);
}

if (['active', 'resolved'].includes(invalidationStatus) && affectedInvalidationDeliveries.length > 0) {
  for (const affectedDelivery of affectedInvalidationDeliveries) {
    const deliveryDirectory = findDirectoryByName(workflowPath, affectedDelivery);
    if (!deliveryDirectory) {
      affectedDeliveryErrors.push(`missing affected Delivery Unit ${affectedDelivery}`);
      continue;
    }
    const affectedContractPath = path.join(deliveryDirectory, 'CONTRACT.md');
    if (!existsSync(affectedContractPath)) {
      affectedDeliveryErrors.push(`missing affected contract ${affectedDelivery}`);
      continue;
    }
    const affectedIdentity = getSection(readFileSync(affectedContractPath, 'utf8'), 'Identity');
    const affectedRevision = getField(affectedIdentity, 'contract revision');
    const affectedApproval = getField(affectedIdentity, 'approval');
    const affectedApprovalSource = getField(affectedIdentity, 'approval source');
    const affectedApprovedRevision = getField(affectedIdentity, 'approved contract revision');
    const affectedApprovalScope = getField(affectedIdentity, 'approval scope');
    const affectedApprovalRationale = getField(affectedIdentity, 'approval rationale');
    const affectedApprovalUpdates = getField(affectedIdentity, 'approval updates');
    if (invalidationStatus === 'active') {
      if (getField(affectedIdentity, 'status') !== 'blocked' ||
        affectedApproval !== 'pending' ||
        affectedApprovalSource !== 'none' ||
        affectedApprovedRevision !== 'none' ||
        affectedApprovalScope !== 'none' ||
        affectedApprovalRationale !== 'none' ||
        affectedApprovalUpdates !== 'none') {
        affectedDeliveryErrors.push(`stale affected contract authority ${affectedDelivery}`);
      }
    } else if (affectedApproval === 'approved') {
      if (!isAuthorityDecisionRecord(affectedApprovalSource, affectedApprovalScope, affectedApprovalRationale, affectedApprovalUpdates, {
        expectedScope: `contract revision ${affectedRevision}`,
        allowUpdatesNone: true
      }) || affectedApprovedRevision !== affectedRevision) {
        affectedDeliveryErrors.push(`recovered contract authority ${affectedDelivery}`);
      }
    } else if (affectedApproval === 'pending') {
      if (affectedApprovalSource !== 'none' ||
        affectedApprovedRevision !== 'none' ||
        affectedApprovalScope !== 'none' ||
        affectedApprovalRationale !== 'none' ||
        affectedApprovalUpdates !== 'none') {
        affectedDeliveryErrors.push(`pending recovered contract authority ${affectedDelivery}`);
      }
    } else {
      affectedDeliveryErrors.push(`recovered contract approval state ${affectedDelivery}`);
    }

    for (const affectedTaskPath of findFiles(deliveryDirectory, 'TASK.md')) {
      const affectedTask = readFileSync(affectedTaskPath, 'utf8');
      const affectedTaskStatus = getField(getSection(affectedTask, 'Identity'), 'status');
      const affectedResultPath = path.join(path.dirname(affectedTaskPath), 'RESULT.md');
      const affectedTaskIsDone = affectedTaskStatus === 'completed' ||
        (existsSync(affectedResultPath) && getResultStatus(readFileSync(affectedResultPath, 'utf8')) === 'DONE');
      if (affectedTaskIsDone) continue;
      const affectedTransition = getField(getSection(affectedTask, 'Transition check'), 'status');
      const affectedTaskRevision = getField(getSection(affectedTask, 'Contract basis'), 'based on contract revision');
      if (invalidationStatus === 'active' && !['update_required', 'reshape_required', 'blocked'].includes(affectedTransition)) {
        affectedDeliveryErrors.push(`downstream task lacks revalidation ${path.basename(path.dirname(affectedTaskPath))}`);
      } else if (invalidationStatus === 'resolved' && (affectedTransition !== 'valid' || affectedTaskRevision !== affectedRevision)) {
        affectedDeliveryErrors.push(`downstream task remains stale ${path.basename(path.dirname(affectedTaskPath))}`);
      }
    }
  }
}
if (affectedDeliveryErrors.length === 0) {
  add('PASS', 'WF129', 'affected Delivery Contract authority and downstream revalidation are coherent');
} else {
  add('ERROR', 'WF129', `setup invalidation left affected work executable: ${affectedDeliveryErrors.join(', ')}`);
}

if (!getStateVocabulary().StatePolicy.includes(stateMode)) {
  add('ERROR', 'WF109', 'unsupported or missing state policy mode');
} else if (stateMode === 'local') {
  const statePaths = [workflowRoot, 'AGENTS.md'];
  if (existsSync(path.join(root, 'CLAUDE.md'))) statePaths.push('CLAUDE.md');
  const tracked = runGit(['ls-files', '--', ...statePaths], { cwd: root });
  const staged = runGit(['diff', '--cached', '--name-only', '--', ...statePaths], { cwd: root });
  if (splitGitLines(tracked.stdout).length === 0 && splitGitLines(staged.stdout).length === 0) {
    add('PASS', 'WF109', 'local workflow state and discovery bridges are not tracked or staged');
  } else {
    add('ERROR', 'WF109', 'local workflow state or a discovery bridge contains tracked or staged files');
  }
} else if (stateMode === 'hybrid') {
  const trackedPaths = getField(statePolicy, 'tracked paths');
  const ignoredPaths = getField(statePolicy, 'ignored paths');
  if (!trackedPaths || !ignoredPaths) {
    add('WARN', 'WF109', 'hybrid state policy should declare tracked and ignored paths');
  } else {
    add('PASS', 'WF109', 'hybrid state policy declares tracked and ignored paths');
  }
} else {
  add('PASS', 'WF109', 'tracked workflow state permits versioned workflow files');
}

const workflowTextResults = inspectWorkflowTextFiles(root, workflowPath);
for (const issue of workflowTextResults.encodingIssues) {
  add('ERROR', 'WF110', issue);
}
if (workflowTextResults.encodingIssues.length === 0) {
  add('PASS', 'WF110', 'workflow text files are valid UTF-8 without BOM');
}
if (workflowTextResults.mojibakeCount === 0) {
  add('PASS', 'WF201', 'workflow text files contain no common mojibake markers');
} else {
  add('WARN', 'WF201', `possible mojibake detected in ${workflowTextResults.mojibakeCount} workflow file(s)`);
}

const changedTextResults = inspectChangedTextFiles(root);
if (!changedTextResults.ok) {
  add('ERROR', 'WF111', changedTextResults.message);
} else if (changedTextResults.errorCount === 0) {
  add('PASS', 'WF111', `changed-text validation passed: SUMMARY PASS=${changedTextResults.passCount} WARN=${changedTextResults.warnCount} ERROR=0`);
} else {
  add('ERROR', 'WF111', `changed-text validation failed: SUMMARY PASS=${changedTextResults.passCount} WARN=${changedTextResults.warnCount} ERROR=${changedTextResults.errorCount}`);
}
if (changedTextResults.warnMojibake) {
  add('WARN', 'WF202', 'changed-text validation detected possible mojibake');
}

finish();

function finish(exitCode = hasErrors(findings) ? 1 : 0) {
  writeFindings(findings, { json });
  if (!json && exitCode === 0) {
    process.stdout.write(`SUMMARY NODE_WORKFLOW=${findings.length} ERROR=0\n`);
  }
  process.exit(exitCode);
}

function getArgValue(values, name) {
  const index = values.indexOf(name);
  return index >= 0 ? values[index + 1] : null;
}

function trimRoot(value) {
  return String(value ?? '').replace(/[\\/]+$/, '');
}

function samePath(left, right) {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase();
}

function toSlash(value) {
  return value.split(path.sep).join('/');
}

function isYesNo(value) {
  return value === 'yes' || value === 'no';
}

function isProjectReadiness(value) {
  return ['not_ready', 'baseline_ready', 'delivery_ready', 'invalidated'].includes(value);
}

function isDeliveryProfile(value) {
  return ['none', 'light', 'structured'].includes(value);
}

function isCursorStatus(value) {
  return [
    'setup_required',
    'awaiting_delivery',
    'awaiting_context_selection',
    'awaiting_context_definition',
    'shaping',
    'ready',
    'in_progress',
    'verifying',
    'blocked',
    'completed'
  ].includes(value);
}

function getStateVocabulary() {
  return {
  SetupType: ['initial_setup', 'incremental_setup', 'recovery_setup'],
  IntakeStrategy: ['provided_blueprint', 'guided_blueprint', 'brownfield_reconstruction'],
  IntakeSource: ['chat_markdown', 'file', 'repository', 'interview', 'mixed'],
  ProjectReadiness: ['not_ready', 'baseline_ready', 'delivery_ready', 'invalidated'],
  CursorStatus: ['setup_required', 'awaiting_delivery', 'awaiting_context_selection', 'awaiting_context_definition', 'shaping', 'ready', 'in_progress', 'verifying', 'blocked', 'completed'],
  DeliveryProfile: ['none', 'light', 'structured'],
  DeliveryUnitStatus: ['candidate', 'shaping', 'ready', 'active', 'verifying', 'accepted', 'archived', 'blocked'],
  TaskCandidateStatus: ['planned', 'ready_for_materialization', 'materialized', 'completed', 'blocked', 'deferred', 'cancelled'],
  TaskStatus: ['ready', 'in_progress', 'verifying', 'blocked', 'completed'],
  ResultStatus: ['PENDING', 'DONE', 'PARTIAL', 'BLOCKED'],
  DecompositionStatus: ['pending', 'approved', 'split_required', 'blocked'],
  TransitionStatus: ['valid', 'update_required', 'reshape_required', 'blocked'],
  InvalidationStatus: ['none', 'active', 'resolved'],
  ChallengeStatus: ['not_required', 'open', 'resolved'],
  ChallengeResolution: ['none', 'contract_confirmed', 'clarification_recorded', 'contract_revision_required', 'task_split_required', 'blocked_or_deferred'],
  ContractApproval: ['pending', 'approved', 'declined'],
  BranchApproval: ['pending', 'approved', 'declined', 'exception_approved', 'not_required'],
  ReasoningLevel: ['low_reasoning', 'medium_reasoning', 'deep_reasoning'],
  LightReviewMode: ['light_self_review', 'not_applicable'],
  LightReviewStatus: ['pending', 'passed', 'changes_required', 'blocked', 'not_required'],
  StructuredReviewMode: ['structured_aggregate'],
  StructuredReviewStatus: ['pending', 'passed', 'changes_required', 'blocked'],
  HumanValidationRequired: ['yes', 'no'],
  HumanValidationStatus: ['not_required', 'pending', 'confirmed', 'rejected'],
  CommitProposal: ['pending', 'approved', 'declined', 'not_applicable'],
  ProtectedActionDecision: ['none', 'pending', 'approved', 'declined'],
  SessionContext: ['repository_sufficient', 'handoff_required', 'same_session_justified', 'awaiting_delivery'],
  SessionRecommendation: ['new_session', 'compact_then_continue', 'continue_current', 'stop'],
  IntegrationDecision: ['merge', 'pull_request', 'defer'],
  IntegrationApproval: ['pending', 'approved', 'declined', 'not_required'],
  ClosureStatus: ['accepted', 'rejected', 'follow_up_required'],
  StatePolicy: ['tracked', 'local', 'hybrid']
  };
}

function recordState(errors, family, field, value) {
  const normalized = normalizeInline(value);
  const allowed = getStateVocabulary()[family];
  if (!allowed) {
    errors.push(`${field} uses unknown state family '${family}'`);
    return;
  }
  if (!allowed.includes(normalized)) {
    errors.push(`${field} '${normalized || '<missing>'}' is unsupported; allowed: ${allowed.join(', ')}`);
  }
}

function getResultStatus(content) {
  return normalizeInline(getSection(content, 'Status').split(/\r\n|\n|\r/).find((line) => line.trim()) ?? '');
}

function countDeliveryNo(section) {
  if (!section) return 0;
  return Array.from(section.matchAll(/^- .+:\s*`?no`?\s*$/gim)).length;
}

function isPlaceholder(value) {
  if (!value) return true;
  const normalized = String(value).trim();
  return normalized === 'none' ||
    normalized === 'tbd' ||
    normalized.includes('<') ||
    normalized.includes('>');
}

function isMissingOrTemplatePlaceholder(value) {
  if (!value) return true;
  const normalized = String(value).trim();
  return normalized === 'tbd' ||
    normalized.includes('<') ||
    normalized.includes('>');
}

function isHumanDecisionSource(value) {
  if (!value) return false;
  const normalized = String(value).trim();
  return /^user:/i.test(normalized);
}

function isDecisionDetail(value, { allowNone = false } = {}) {
  if (allowNone && value === 'none') return true;
  return !isPlaceholder(value);
}

function isAuthorityDecisionRecord(source, scope, rationale, updates, { expectedScope = '', allowScopeNone = false, allowUpdatesNone = false } = {}) {
  if (!isHumanDecisionSource(source)) return false;
  if (expectedScope && scope !== expectedScope) return false;
  if (!expectedScope && allowScopeNone) {
    if (scope && scope !== 'none' && !isDecisionDetail(scope)) return false;
  } else if (!expectedScope && !isDecisionDetail(scope)) return false;
  if (!isDecisionDetail(rationale)) return false;
  if (!isDecisionDetail(updates, { allowNone: allowUpdatesNone })) return false;
  return true;
}

function getContractChallengeErrors(content, {
  workStatus,
  isCurrent,
  cursorStatus,
  readinessStatus,
  readyToImplement,
  profile,
  contractApproval,
  approvedContractRevision,
  backlogContent
}) {
  const errors = [];
  const challenge = getSection(content, 'Contract challenge');
  if (!challenge) {
    if (workStatus === 'blocked') errors.push('blocked work requires challenge or baseline invalidation evidence');
    return errors;
  }

  const status = getField(challenge, 'status');
  const trigger = getField(challenge, 'trigger');
  const resolution = getField(challenge, 'resolution');
  const resolutionSource = getField(challenge, 'resolution source');
  const resolutionRationale = getField(challenge, 'resolution rationale');
  const resolutionUpdates = getField(challenge, 'resolution updates');
  const authorityRequired = getField(challenge, 'authority required');
  const downstreamRevalidation = getField(challenge, 'downstream revalidation required');
  const allowedTriggers = [
    'repository_mismatch',
    'unverifiable_acceptance',
    'missing_dependency_or_boundary',
    'unavoidable_scope_expansion',
    'concrete_risk',
    'task_not_atomic',
    'materially_simpler_or_safer_solution'
  ];
  const allowedResolutions = getStateVocabulary().ChallengeResolution.filter((value) => value !== 'none');

  if (status === 'not_required') {
    if (trigger !== 'none' || resolution !== 'none' || resolutionSource !== 'none' ||
      authorityRequired !== 'none' || downstreamRevalidation !== 'no' ||
      resolutionRationale !== 'none' || resolutionUpdates !== 'none') {
      errors.push('inactive challenge fields');
    }
    return errors;
  }

  if (!['open', 'resolved'].includes(status)) {
    errors.push('challenge status');
    return errors;
  }
  if (!allowedTriggers.includes(trigger)) errors.push('challenge trigger');

  for (const field of ['expected by contract', 'observed repository evidence', 'mismatch', 'impact', 'recommended minimum correction', 'affected tasks']) {
    const value = getField(challenge, field);
    if (isPlaceholder(value) || value === 'none') errors.push(`challenge ${field}`);
  }
  if (!['yes', 'no'].includes(getField(challenge, 'unaffected work may continue'))) errors.push('unaffected work decision');
  if (!['yes', 'no'].includes(downstreamRevalidation)) errors.push('challenge downstream revalidation');
  if (!isHumanDecisionSource(authorityRequired)) errors.push('challenge authority required');

  const requiresPause = status === 'open' || ['contract_revision_required', 'task_split_required', 'blocked_or_deferred'].includes(resolution);
  if (isCurrent && requiresPause &&
    (workStatus !== 'blocked' || cursorStatus !== 'blocked' || readinessStatus === 'delivery_ready' || readyToImplement !== 'no')) {
    errors.push('challenge pause state');
  }

  if (status === 'open') {
    if (resolution !== 'none' || resolutionSource !== 'none' || resolutionRationale !== 'none' || resolutionUpdates !== 'none') {
      errors.push('open challenge resolution');
    }
    return errors;
  }

  if (!allowedResolutions.includes(resolution)) errors.push('challenge resolution');
  if (!isAuthorityDecisionRecord(resolutionSource, 'none', resolutionRationale, resolutionUpdates, { allowScopeNone: true, allowUpdatesNone: true })) {
    if (!isHumanDecisionSource(resolutionSource)) errors.push('human challenge resolution source');
    if (!isDecisionDetail(resolutionRationale)) errors.push('challenge resolution rationale');
    if (!isDecisionDetail(resolutionUpdates, { allowNone: true })) errors.push('challenge resolution updates');
  }
  if (['contract_revision_required', 'task_split_required'].includes(resolution) && downstreamRevalidation !== 'yes') {
    errors.push('required downstream revalidation');
  }
  if (resolution === 'contract_revision_required' && (contractApproval === 'approved' || approvedContractRevision !== 'none')) {
    errors.push('stale contract approval after challenge');
  }
  if (resolution === 'task_split_required') {
    if (profile !== 'structured') {
      errors.push('light task split requires profile promotion');
    } else {
      const decomposition = getSection(backlogContent, 'Decomposition review');
      if (getField(decomposition, 'status') !== 'split_required') errors.push('decomposition split routing');
    }
  }

  return errors;
}

function hasSubstantiveLine(section) {
  return String(section ?? '')
    .split(/\r\n|\n|\r/)
    .some((line) => {
      const normalized = line.trim();
      return normalized && !normalized.startsWith('#') && !isPlaceholder(normalized);
    });
}

function hasChecklistLine(section) {
  return /^-\s+\[[ xX]\]\s+(?!\.\.\.|<)\S.+$/m.test(String(section ?? ''));
}

function hasInactiveDecisionDetails(...values) {
  return values.some((value) => value && value !== 'none');
}

function findFiles(directory, fileName) {
  const found = [];
  if (!existsSync(directory)) return found;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (isStaticWorkflowDirectory(directory, entry.name)) continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...findFiles(entryPath, fileName));
    } else if (entry.isFile() && entry.name === fileName) {
      found.push(entryPath);
    }
  }
  return found;
}

function findAllFiles(directory) {
  const found = [];
  if (!existsSync(directory)) return found;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...findAllFiles(entryPath));
    } else if (entry.isFile()) {
      found.push(entryPath);
    }
  }
  return found;
}

function findDirectoryByName(directory, directoryName) {
  if (!existsSync(directory)) return '';
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (isStaticWorkflowDirectory(directory, entry.name)) continue;
    const entryPath = path.join(directory, entry.name);
    if (!entry.isDirectory()) continue;
    if (entry.name === directoryName) return entryPath;
    const nested = findDirectoryByName(entryPath, directoryName);
    if (nested) return nested;
  }
  return '';
}

function splitGitLines(output) {
  return String(output ?? '')
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitCommaValues(value) {
  const normalized = normalizeInline(value);
  if (!normalized || normalized === 'none') return [];
  return normalized.split(',').map((item) => normalizeInline(item)).filter(Boolean);
}

function hasGraphCycle(graph) {
  const visiting = new Set();
  const visited = new Set();
  function visit(node) {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const dependency of graph.get(node) ?? []) {
      if (graph.has(dependency) && visit(dependency)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  }
  for (const node of graph.keys()) {
    if (visit(node)) return true;
  }
  return false;
}

function getChangedRepositoryPaths(repositoryRoot) {
  const changed = new Set();
  for (const args of [
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '--'],
    ['diff', '--name-only', '--diff-filter=ACMR', '--'],
    ['ls-files', '--others', '--exclude-standard', '--']
  ]) {
    const result = runGit(args, { cwd: repositoryRoot });
    if (result.status !== 0) continue;
    for (const item of splitGitLines(result.stdout)) changed.add(item);
  }
  return Array.from(changed);
}

function inspectWorkflowTextFiles(repositoryRoot, workflowDirectory) {
  const textExtensions = new Set(['.md', '.js', '.mjs', '.json', '.yml', '.yaml', '.toml']);
  const encodingIssues = [];
  let mojibakeCount = 0;
  for (const filePath of findAllFiles(workflowDirectory)) {
    if (!textExtensions.has(path.extname(filePath).toLowerCase())) continue;
    const relative = toSlash(path.relative(repositoryRoot, filePath));
    const inspection = inspectTextBytes(relative, readFileSync(filePath));
    if (inspection.encodingError) encodingIssues.push(inspection.encodingError);
    if (inspection.hasMojibake) mojibakeCount += 1;
  }
  return { encodingIssues, mojibakeCount };
}

function inspectChangedTextFiles(repositoryRoot) {
  const changed = new Set();
  for (const args of [
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '--'],
    ['diff', '--name-only', '--diff-filter=ACMR', '--'],
    ['ls-files', '--others', '--exclude-standard', '--']
  ]) {
    const result = runGit(args, { cwd: repositoryRoot });
    if (result.status !== 0) {
      return { ok: false, message: `changed-text validation failed: git ${args.join(' ')}` };
    }
    for (const filePath of splitGitLines(result.stdout)) changed.add(filePath);
  }

  let checkedCount = 0;
  let errorCount = 0;
  let warnCount = 0;
  let lineEndingErrors = 0;
  let warnMojibake = false;
  for (const relativePath of changed) {
    const fullPath = path.join(repositoryRoot, ...relativePath.split('/'));
    if (!existsSync(fullPath) || !statSync(fullPath).isFile()) continue;
    if (!isKnownTextPath(fullPath)) continue;
    checkedCount += 1;
    const inspection = inspectTextBytes(relativePath, readFileSync(fullPath), { checkLineEndings: true });
    if (inspection.encodingError) errorCount += 1;
    if (inspection.mixedLineEndings) {
      errorCount += 1;
      lineEndingErrors += 1;
    }
    if (inspection.hasMojibake) {
      warnCount += 1;
      warnMojibake = true;
    }
  }
  const passCount = (errorCount === 0 ? 1 : 0) + (lineEndingErrors === 0 ? 1 : 0) + (warnCount === 0 ? 1 : 0);
  return { ok: true, checkedCount, passCount, warnCount, errorCount, warnMojibake };
}

function isKnownTextPath(filePath) {
  const textExtensions = new Set([
    '.bat', '.cmd', '.cs', '.cshtml', '.csproj', '.css', '.csv', '.env',
    '.html', '.http', '.ini', '.js', '.json', '.jsx', '.md', '.props', '.ps1',
    '.psd1', '.psm1', '.razor', '.resx', '.scss', '.sh', '.sln', '.slnx',
    '.sql', '.targets', '.toml', '.ts', '.tsx', '.tsv', '.txt', '.xml',
    '.yaml', '.yml'
  ]);
  const knownTextNames = new Set([
    '.editorconfig', '.gitattributes', '.gitignore', 'Directory.Build.props',
    'Directory.Build.targets', 'Directory.Packages.props', 'Dockerfile',
    'global.json', 'NuGet.config'
  ]);
  return textExtensions.has(path.extname(filePath).toLowerCase()) || knownTextNames.has(path.basename(filePath));
}

function inspectTextBytes(displayPath, bytes, { checkLineEndings = false } = {}) {
  const hasBom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  let text = '';
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return { encodingError: `invalid UTF-8: ${displayPath}`, mixedLineEndings: false, hasMojibake: false };
  }
  const encodingError = hasBom ? `UTF-8 BOM detected: ${displayPath}` : '';
  const hasCrLf = /\r\n/.test(text);
  const withoutCrLf = text.replace(/\r\n/g, '');
  const mixedLineEndings = checkLineEndings && hasCrLf && /(?<!\r)\n/.test(text);
  const hasMojibake = /\uFFFD|\u00EF\u00BB\u00BF|\u00C3[\u0080-\u00BF]|\u00C2[\u0080-\u00BF]|\u00E2\u20AC|\u00F0\u0178/u.test(text);
  return { encodingError, mixedLineEndings, hasMojibake };
}

function parseMarkdownTable(markdown) {
  const lines = String(markdown ?? '').split(/\r\n|\n|\r/).filter((line) => /^\s*\|/.test(line));
  if (lines.length < 2) return null;
  const headers = splitTableRow(lines[0]);
  const rows = [];
  for (const line of lines.slice(2)) {
    const cells = splitTableRow(line);
    if (cells.length < headers.length) continue;
    const row = {};
    for (let index = 0; index < headers.length; index += 1) {
      row[headers[index]] = cells[index];
    }
    rows.push(row);
  }
  return { headers, rows };
}

function isStaticWorkflowDirectory(parentDirectory, name) {
  if (name === '.git' || name === 'node_modules') return true;
  return samePath(parentDirectory, workflowPath) && ['method', 'prompts', 'templates', 'tools'].includes(name);
}

function splitTableRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function normalizeInline(value) {
  return String(value ?? '').trim().replace(/^`|`$/g, '').trim();
}

function extractCellPaths(value) {
  const text = String(value ?? '').trim();
  const backtickPaths = Array.from(text.matchAll(/`([^`]+)`/g)).map((match) => match[1]);
  if (backtickPaths.length > 0) return backtickPaths;
  return text
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && part !== 'none' && !/\s/.test(part));
}
