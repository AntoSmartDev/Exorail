# AGENTS.md — Canonical 0.2 workflow

This is the shared operational contract. The canonical hierarchy is:

`Epic → Feature → User Story → Task`.

A Milestone is a collection of User Stories, never a hierarchy parent. A
bounded Context is a transversal tag from `.exorail/planning/contexts/`, never
a hierarchy node. Adapter profiles declare portable contracts and capabilities;
local bindings and provider mappings remain outside Core. Presence is not
activation and activation is not invocation: absent capability Policy is
fail-closed, while the ordinary no-adapter workflow remains complete.

## Start of session

1. Read `.exorail/WORKFLOW_CONFIG.md` and `.exorail/PROJECT_READINESS.md`.
   For an empty planning workspace, read `.exorail/CURRENT_CURSOR.md`. Once
   planning holds work that file is a historical setup note whose `readiness`
   and `status` are no longer maintained and will contradict
   `.exorail/PROJECT_READINESS.md`; regenerate projections and read
   `.exorail/projections/RESUMPTION.md` instead.
   If a required file is missing or unreadable, stop and report that the
   workflow is unavailable. Do not implement before loading the canonical
   inputs.
   For the optional personal view, `.exorail/local/identity.json` names one
   `member_id` from `TEAM.json`. It is local, ignored by Git, and neither
   authentication nor authority; its absence never invalidates the repository.
2. Read the active Epic, Feature, Story, Task, and Result named by the cursor,
   plus only the knowledge-index sources needed by that work. Read a Contract
   only when the Task declares `contract_required: required`.
3. Use generated projections for navigation; do not manually edit them.
4. When no active work exists, select or create a specific Story under a
   compatible Feature. Classify a request before executing it; there is no
   holding area for unclassified work.

## Execution rules

- Do not implement while readiness is `not_ready` or `invalidated`.
- A Story contains outcome, acceptance, risk, policy, and the complete Task
  backlog. Create future Tasks early as light Task records.
- A planned Task becomes `ready` only with completed dependencies, its derived
  verification guards, and a current sibling `CONTRACT.md` only when required.
  It becomes `active` only after its policy guards pass. Internal verification
  produces immutable `review_pending` Result evidence; human acceptance and
  Story-base integration are separate events.
- A material Story change increments `plan_revision` and marks affected future
  Tasks `replan-needed` or `superseded`; never silently rewrite them.
- Story launch presents the derived executable frontier and asks whether to keep
  the `task` review boundary or explicitly select `story`. Task-boundary review
  is default; Story-boundary review needs current human authority permitted by
  resolved Policy and never skips mandatory
  whole-Story review.
- Parallel Tasks require derived isolation and separate runtime workspaces,
  and a verified Story-base integration before each dependent starts. They may
  share a file only for approved logically disjoint regions without semantic or
  generated-artifact ownership overlap.
- A Task gets at most three safe remediation cycles. A blocker, non-convergence,
  unsafe scope, material replan or approved-plan contradiction creates a typed
  Decision or Contract Challenge instead of invented continuation.
- Record accepted durable decisions in `DECISIONS.md` or an ADR. Protected
  authority is only `user:<decision-reference>`; roles, agents and chat labels
  are descriptive only. Do not create pre-0.2 hierarchy or candidate nodes.
- Preserve historical records as history. They are not runtime authority.
- A runtime executes; Exorail computes the frontier, supplies scope, validates
  normalized outcomes, records Result/evidence/authority, and authorizes
  progression. Runtime checkpoints, events and bindings are never canonical.
- Adapter family and capability names grant no dispatch. Resolve activation,
  ordered eligibility, binding, live conformance and health before invocation.
  A lower layer may make a capability unavailable but cannot expand Policy.
- Keep agent review, human Task acceptance, integration and Story outcome
  distinct. At each completion, name the affected Task and its next action,
  offer `Approve Task` or `Synchronize integration`, and expose `Show details`.
  After all Tasks integrate, run whole-Story review and offer one optional
  Story PR. Do not create Task PRs or infer approval.
- Preserve unrelated worktree changes and obtain explicit approval for Git
  mutations.
- All Exorail-owned files are English. User-facing messages use the interaction
  locale, and project deliverables follow their configured output locale.

## Canonical method

- setup: `.exorail/method/PROJECT_SETUP.md`
- operation: `.exorail/method/OPERATING_FLOW.md`
- daily use: `.exorail/method/PLAYBOOK.md`
- invariants: `.exorail/method/WORKFLOW_RULES.md`
- structure: `.exorail/method/STRUCTURE_REFERENCE.md`
- commands: `.exorail/tools/README.md`
- correcting a finding: `.exorail/method/FINDINGS.md`
