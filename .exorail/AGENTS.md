# AGENTS.md — Canonical 0.2 workflow

This is the shared operational contract. The canonical hierarchy is:

`Epic → Feature → User Story → Task`.

A Milestone is a collection of User Stories, never a hierarchy parent. A
bounded Context is a transversal tag from `.exorail/planning/contexts/`, never
a hierarchy node. Adapter profiles declare portable contracts and capabilities;
local bindings and provider mappings remain outside Core. Presence is not
activation and activation is not invocation: absent capability Policy is
fail-closed, while the ordinary no-adapter workflow remains complete.
Without a capability activation and local binding, adapter-specific instructions
do not apply; use the native repository route instead.

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
- Record accepted durable decisions in `DECISIONS.md` or an ADR. A protected
  route requires the declared `user:<decision-reference>` authority-reference
  form; roles, agents and chat labels are descriptive only. The baseline checks
  that form, not human origin or identity, and a fully privileged repository
  writer can create it. An agent must not add, copy or simulate a `user:`
  reference or receipt: stop, present the decision, and wait for the owner to
  issue the reference before recording it. Do not create pre-0.2 hierarchy or
  candidate nodes.
- Preserve historical records as history. They are not runtime authority.
- A runtime executes; ExoRail computes the frontier, supplies scope, validates
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
- After successful native integration or delivery, move the active execution
  context to the returned `active_workspace` before the next operation: Task to
  Story, Story to its declared target, Feature to its project target. Verify
  `active_branch` there; keep the finished child's worktree intact.
- All ExoRail-owned files are English. User-facing messages use the interaction
  locale, and project deliverables follow their configured output locale.

## Canonical method

- setup: `.exorail/method/PROJECT_SETUP.md`
- operation: `.exorail/method/OPERATING_FLOW.md`
- native Git lifecycle: `.exorail/method/GIT_RUNTIME.md`
- daily use: `.exorail/method/PLAYBOOK.md`
- invariants: `.exorail/method/WORKFLOW_RULES.md`
- structure: `.exorail/method/STRUCTURE_REFERENCE.md`
- commands: `.exorail/tools/README.md`
- correcting a finding: `.exorail/method/FINDINGS.md`

## Manual intent shortcuts

A user may write `Exorail: <intent>` to ask the agent to follow an existing
route. These are natural-language requests, not shell commands, slash commands,
an installed Skill, or a new source of workflow authority. Use the installed
sources below; the normal workflow remains available without these shortcuts.
For an unknown intent, show the available names and ask what the user needs;
do not invent or execute a similarly named command.

| Manual intent | Existing route |
| --- | --- |
| `Exorail: help` | Show this list and point to `.exorail/tools/README.md` for actual tool commands. |
| `Exorail: start` | Follow `.exorail/method/PROJECT_SETUP.md` and `.exorail/prompts/START_NEW_PROJECT_PROMPT.md`; inspect `.exorail/KNOWLEDGE_INDEX.md` and `.exorail/PROJECT_READINESS.md` before suggesting work. A validator pass on an empty project does not mean ready to execute. |
| `Exorail: status` | Read current canonical records and `.exorail/PROJECT_READINESS.md`; use `.exorail/projections/RESUMPTION.md` only when fresh, or `.exorail/CURRENT_CURSOR.md` only for empty planning. Distinguish declared facts, verified findings and inference; do not promise a project-wide Attention view. |
| `Exorail: resume` | Follow `.exorail/prompts/SWITCH_LLM_PROMPT.md` and fresh `.exorail/projections/RESUMPTION.md` when available; inspect the relevant records. No prior `pause` is required, and an open human request does not block unrelated eligible work by itself. |
| `Exorail: validate` | Run `node ./.exorail/tools/validate-workflow.mjs` as documented in `.exorail/tools/README.md`; report its actual exit code and findings. A clean structural check does not certify project completeness. |
| `Exorail: review` | Use `.exorail/tools/README.md` to select the existing Task/Story review-readiness and Review Brief tools; require the applicable subject and real Git base/head identities. Preparation is not independent review, acceptance or integration. |
| `Exorail: explain` | For a finding, read `.exorail/method/FINDINGS.md` and the cited record or tool output; distinguish a documented correction from an unverified causal explanation. |
| `Exorail: team` | Use the documented read-only `derive-team-view.mjs` route in `.exorail/tools/README.md`; local identity, TEAM membership and presentation never grant authority. |
| `Exorail: projections check` | Run `node ./.exorail/tools/generate-projections.mjs --check`; report stale or invalid inputs. Do not refresh or rewrite projections under this intent. |
| `Exorail: switch` | Follow `.exorail/prompts/SWITCH_LLM_PROMPT.md` for a handoff; do not claim to transfer a provider session or uncommitted work automatically. |

For `resume` and `switch` with non-empty planning, use
`node ./.exorail/tools/generate-projections.mjs --check` before reading
`.exorail/projections/RESUMPTION.md`. The linked prompt's regeneration step is not part of these
shortcuts: if the projection is absent or stale, stop, name it, and offer the
documented regeneration command as a separate user-requested action. Empty
planning uses `.exorail/CURRENT_CURSOR.md` instead.

If an input needed for a route is missing or stale, name it and stop that route
rather than manufacturing a successful status, review or next action. None of
these shortcuts resolves a Decision, accepts a Result, integrates work, refreshes
projections or publishes a release.

## Optional deployment boundary

An adopter may configure deployment-owned file protection, but ExoRail does not
enforce it. See `method/STRUCTURE_REFERENCE.md#optional-deployment-capability-boundary`
for the one canonical installed-project classification and its operational
costs. File-level protection cannot isolate `authority_ref` values inside
otherwise ordinary work records, and it does not establish human origin or
identity.
