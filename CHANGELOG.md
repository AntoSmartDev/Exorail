# Changelog

## v0.2.0 — Unreleased

A clean break. Nothing from an earlier version is converted and no upgrade path
is provided, whatever release or schema number you are coming from: install 0.2
as a fresh `.exorail/` container and keep what you had as your own evidence.
Workflow schema moves from `0.5` to `0.2`; product version and schema version
are separate concerns and the schema number is deliberately not the product
number.

### Added

- Canonical work model `Epic → Feature → User Story → Task`, with Milestones
  collecting Stories and Contexts tagging work. Neither is a hierarchy parent.
- Immutable Task Results in `review_pending`, carrying non-empty criterion
  evidence and an optional timing ledger.
- An execution-receipt ledger on the Story binding `task_acceptance`,
  `task_integration`, `result_adoption` and `story_acceptance` to exact
  reviewed commits and normalized patch identities, with ordering, attempt and
  revision binding enforced.
- Review boundaries: `task` by default, or `story` when resolved Policy permits
  it and current human authority is recorded. Neither removes the mandatory
  whole-Story review.
- Material replan as an explicit procedure: increment the Story plan revision,
  preserve completed Tasks, Results and receipts, and mark affected future work
  `replan-needed` or `superseded`.
- Hierarchy-aware entry and re-entry routes: Epic and Feature guidance names the
  concrete Story and executable Task below it; terminal work either names the
  determined Feature for a subsequent Story or asks the human question that
  selects one.
- Executable Task admission that requires observable Task acceptance, references
  mapped to the parent Story criteria, and a Quality gate naming evidence.
- Bounded controlled execution loops: a Task has at most three contiguous
  attempts per plan revision, a terminal result candidate closes its slice, and
  an attempted Task affected by a material replan is superseded in favour of a
  current-revision successor Task beginning at attempt `1`.
- Typed Decision requests and Contract Challenges with a frozen trigger and
  resolution vocabulary, recording evidence, impact, options, recommendation and
  the requested human decision.
- Parallel Tasks with derived execution isolation, separate workspaces,
  dependency gates, and a graph-derived non-parallel closeout.
- Read-only derived commands: executable frontier, review readiness, Review
  Brief and team view. None grants authority or contacts a provider.
- `derive-governance-input-digest.mjs` derives the native Task digest after
  admission checks for an initial attempt or retry. It neither dispatches work
  nor creates an Execution Run.
- The no-adapter native path derives that digest while a Task is `ready`, moves
  the Task to `active`, and records its terminal Run at completion. The Runtime
  dispatch path still records an `open` Run before execution; retry admission
  remains guarded by the current Task, Run, dependency and revision state.
- `derive-task-review-readiness.mjs` observes one Task's checked Git range and
  linked integration receipt, Run and Result. It reports technical readiness,
  not human acceptance, and changes no canonical record.
- Generated projections, including a resumption view, regenerated from
  canonical records and rejected when stale or hand-edited.
- `TEAM.json`, a provider-neutral member registry. Attribution is routing, not
  authentication, and never grants protected authority.
- Optional Episodes for reusable technical facts, tied to Result provenance.
- Optional adapter profiles with fail-closed capability activation, minimal
  execution-run summaries, and external-action records for consequential or
  destructive provider mutations.
- A documented finding reference giving the canonical correction for every
  stable validator finding.

### Changed

- Protected authority is only `user:<decision-reference>`. A role, an agent
  name, a chat label or a self-reported receipt never supplies it.
- Execution success is explicitly not accepted completion. Agent verification,
  human Task acceptance, Story-base integration and whole-Story outcome are
  four distinct recorded events.
- Readiness permits planning; implementation additionally requires an active
  Task with a current approved Story plan and satisfied guards.
- A Task Contract is required only when the resolver marks it `required`,
  instead of being a universal artifact.
- Progressive definition replaces up-front decomposition: a Story carries its
  complete Task backlog as light records, and detail arrives when a Task is due.

### Fixed

- Brownfield setup now explains why a baseline Task must be refined before
  later dependent work; project setup also makes clear that planning precedes
  readiness and that readiness gates implementation, not planning.
- Task and Result templates now expose the fields needed for a ready Task and
  the optional three-field Result-to-Run binding. The unbound Result remains
  valid but cannot supply execution-linked review evidence.
- Resumption guidance prioritizes outstanding review and acceptance before
  planning the next Task, without adding a canonical lifecycle state.
- Validator findings for malformed front matter, record paths, timestamps and
  Result execution evidence now identify the offending field and expected
  form; timing and projection findings also locate the failed check. The Task
  Quality gate rejects unchanged placeholder prose.
- Git-backed review readiness separates the selected Task's own canonical
  governance records from out-of-scope changes without hiding those records
  from the observed-path report. Unrelated governance or implementation paths
  remain scope escapes.
- The non-canonical Story `BACKLOG.md` template and references were removed;
  light future Tasks remain in the Story's canonical Task backlog.
- Human-gate guidance explicitly tells agents to stop for an owner decision
  instead of adding or simulating a `user:` reference or receipt. The
  repository-local reference format does not authenticate human origin.
- The derived executable frontier no longer reports eligible work from
  canonical state the validator rejects. Operational derivations refuse state
  that fails admission validation, so the supported path cannot advance on
  records that do not hold together.
- Blocked work is reported with its reason instead of being omitted from the
  launch surface. A Task held by its own status, an open Decision request, a
  stale revision or an unmet dependency now appears with those reasons rather
  than disappearing.
- A stale generated projection is reported as needing a refresh and no longer
  reads as an invalid workflow. Admission validation covers canonical state;
  a derived view is an output of that state, not an input to it.
- Bootstrap instructions name their files at the paths those files occupy.
  `AGENTS.md` and the new-project prompt previously named three payload files
  without their `.exorail/` prefix, which halted a compliant agent at the first
  read.
- Root `AGENTS.md` is a thin bridge holding no rule of its own. Rules that were
  reachable only from it, and therefore invisible to an agent entering through
  `CLAUDE.md`, now live in the shared contract both entrypoints read.

### Compatibility

- 0.2 is a clean break; there is no in-place upgrade from any earlier release
  or schema.
- Optional adapters extend the baseline of repository, ExoRail and one capable
  coding agent. They are not required, and their absence affects only the
  delegation route.
- Semantic preflight, change impact and convergence remain post-0.2 work and are
  not claimed by this release.

## v0.1.1 - 2026-07-15

### Changed

- Agents must turn every human gate into a direct, actionable question rather
  than ending on a state-only report. This covers setup gaps, context
  selection, delivery selection, approval, blockers, and protected actions.
- New-project and resumed-session prompts now require that conversational
  handoff; distributable regression checks enforce it.

## v0.1.0 - 2026-07-12

- Initial clean public baseline for ExoRail.
