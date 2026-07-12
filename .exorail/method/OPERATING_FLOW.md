# OPERATING_FLOW.md

## Purpose

Define the operational cycle and context discipline after workflow configuration.

The responsibility and authority model is canonical in `.exorail/method/PLAYBOOK.md`. Apply it as the sequence `shape -> human approval -> execute -> review -> human decision when required`; these are phases, not personas, agent assignments, or session-switching requirements.

## Gate Loading Index

This table routes material transitions to their existing procedure; it does not redefine the gate. Load the matching source before acting and stop at the stated boundary. Routine work does not load unrelated rows. When applicability is uncertain, inspect this table and then the smallest matching source rather than reading the complete method.

| Observable trigger | Load only | Stop before |
| --- | --- | --- |
| Initial, incremental, or recovery setup is requested, or project readiness is incomplete | [PROJECT_SETUP.md](PROJECT_SETUP.md) | delivery shaping or implementation beyond the readiness currently evidenced |
| New blueprint evidence, a new bounded context, or a correction to project knowledge is supplied | [Blueprint Increment procedure](PROJECT_SETUP.md#blueprint-increment-procedure) | changing roadmap, cursor, active contract, or queue order without impact analysis and required human approval |
| Baseline is ready and the cursor names a Delivery candidate, asks for context selection, or asks for context definition | [Supervised selection and candidate promotion](#supervised-selection-and-candidate-promotion) | materializing a Delivery Unit contract or task without the required human selection and shaping authority |
| A selected Delivery candidate needs a contract draft, or an approved Structured backlog needs its next current task | [Delivery Unit and task just-in-time materialization](#delivery-unit-and-task-just-in-time-materialization) | materializing downstream tasks or implementation before contract approval, decomposition review, transition, and task authority are current |
| A new outcome needs a Delivery Unit profile and contract | [Delivery Unit intake and shaping](#delivery-unit-intake-and-shaping) | marking the contract ready or starting implementation without explicit approval |
| A Light Delivery Unit is about to execute | [Light Delivery Unit](#light-delivery-unit) | editing before baseline, contract, scope, and verification gates are current |
| A Structured task is about to execute or a downstream task transition is evaluated | [Structured Delivery Unit](#structured-delivery-unit) | editing while decomposition, branch, dependency, revision, or transition evidence is stale |
| Repository evidence materially contradicts an approved contract | [Contract Challenge Rule](#contract-challenge-rule) | the affected unapproved change or continued protected execution |
| A material contract, scope, architecture, dependency, or policy change is required | [Work shaping](#work-shaping) | treating the proposal or prior approval as authority for the revised work |
| Canonical project context becomes insufficient or unreliable | [Setup invalidation procedure](PROJECT_SETUP.md#setup-invalidation-procedure) | affected delivery work not explicitly proven safe to continue |
| A Light Delivery Unit reaches review or closure | [Delivery Unit closure](#delivery-unit-closure) | acceptance, integration, or archival without the proportionate self-review |
| A Structured Delivery Unit reaches aggregate review or closure | [Delivery Unit closure](#delivery-unit-closure) | closure or integration without the separate aggregate review and required human decision |
| A milestone, bounded context, current delivery scope, or project vision appears complete, or the queue becomes empty | [Milestone, context, scope, and project closure](#milestone-context-scope-and-project-closure) | marking completion from an empty queue or single Delivery Unit without the required evidence review |
| Human validation, contract approval, challenge resolution, exception, material residual risk, or another protected human decision is required | [Human Decision Brief](#human-decision-brief) | recording approval, validation, exception, or closure authority by inference |
| A commit, branch change, integration, or other protected Git action is proposed | [Branches and commits](#branches-and-commits) | the mutation without explicit action-specific approval |
| A stable task or Delivery Unit result is ready to leave the current execution context | [Session transition](#session-transition) | opening new work before durable state and the next recommendation are coherent |

## Conceptual operations

### `status`

Reconstruct from configuration, readiness, cursor, and current artifacts:

- setup validity
- active milestone, Delivery Unit, and task when present
- last stable result
- expected and actual branch
- gaps or inconsistencies

`status` reads and reports. It does not modify state.

### `next`

Determine the next allowed action:

- configure the project
- resolve a blocking gap
- shape, approve, or complete a Delivery Unit
- create or complete a structured task
- verify work
- update artifacts
- close a Delivery Unit or milestone

`next` cannot skip the readiness gate or a required verification.

### `resume`

Apply `status` with minimum context, then read only sources referenced by the cursor, Delivery Unit contract, and current task when present.

If state is inconsistent, route to `doctor` instead of continuing by assumption.

### `doctor`

Diagnose without modifying:

- missing references
- inconsistent cursor
- task and result misalignment
- stale readiness
- wrong branch
- state-policy violations
- artifacts required by the profile but missing

Return evidence and a recommended corrective action.

## Canonical State Vocabulary

Canonical fields accept only the values below. Prose may use ordinary language, but an unsupported synonym in a machine-readable field is an error and is never normalized silently. The validator implements these values and mappings; it does not own alternative meanings.

| Validator family | Family and owner | Canonical values and meaning | Allowed / prohibited actions | Transition, authority, and related mapping |
| --- | --- | --- | --- | --- |
| `SetupType` | Setup type — `PROJECT_READINESS.md` `Setup state.type` | `initial_setup`, `incremental_setup`, `recovery_setup` | first baseline, targeted extension, or divergence repair; no product implementation | selected from evidence; recovery route must match active invalidation |
| `IntakeStrategy` | Intake strategy — `PROJECT_READINESS.md` `Setup state.intake strategy` | `provided_blueprint`, `guided_blueprint`, `brownfield_reconstruction` | collect and map evidence; never treat inference as approval | may change during setup; must retain an explicit intake source |
| `IntakeSource` | Intake source — `PROJECT_READINESS.md` `Setup state.intake source` | `chat_markdown`, `file`, `repository`, `interview`, `mixed` | record the actual origin of setup evidence | combined evidence uses mixed; source does not grant approval |
| `StatePolicy` | State policy — `WORKFLOW_CONFIG.md` `State policy.mode` | `tracked`, `local`, `hybrid` | apply the corresponding persistence rules; no implicit mode | changes require setup and Git-policy review |
| `ProjectReadiness` | Project readiness — `PROJECT_READINESS.md` `Setup state.status` | `not_ready`, `baseline_ready`, `delivery_ready`, `invalidated` | only delivery ready permits ordinary implementation; baseline ready permits shaping | ready states may become invalidated; recovery restores only an evidenced coherent state |
| `CursorStatus` | Cursor status — `CURRENT_CURSOR.md` `Position.status` | `setup_required`, `awaiting_delivery`, `awaiting_context_selection`, `awaiting_context_definition`, `shaping`, `ready`, `in_progress`, `verifying`, `blocked`, `completed` | perform only the named phase; blocked permits diagnosis or recovery, never protected implementation | normal flow follows setup, supervised selection, shaping, delivery, and completion; active phases may enter blocked |
| `DeliveryProfile` | Delivery profile — cursor `delivery profile` and contract `profile` | `none`, `light`, `structured` | none is cursor-only when no Delivery Unit exists; contracts use Light or Structured | profile changes that alter decomposition are material contract changes |
| `DeliveryUnitStatus` | Delivery Unit status — `CONTRACT.md` `Identity.status` | `candidate`, `shaping`, `ready`, `active`, `verifying`, `accepted`, `archived`, `blocked` | implementation only while active; verification while verifying | approval and profile gates precede ready; viable phases may enter blocked |
| `TaskCandidateStatus` | Task candidate status — `BACKLOG.md` `Task candidates.State` | `planned`, `ready_for_materialization`, `materialized`, `completed`, `blocked`, `deferred`, `cancelled` | records backlog intent only; no implementation until `TASK.md` exists and transition is valid | candidate may materialize one current task after previous-result review; executable state then belongs to `TASK.md` |
| `TaskStatus` | Task status — `TASK.md` `Identity.status` | `ready`, `in_progress`, `verifying`, `blocked`, `completed` | execute only while in progress; verify only while verifying | completed requires a result with status DONE and remains immutable |
| `ResultStatus` | Result status — `RESULT.md` `Status` | `PENDING`, `DONE`, `PARTIAL`, `BLOCKED` | record evidence and impact; only DONE satisfies completion | outcome of execution, not a cursor synonym |
| `DecompositionStatus` | Decomposition review — `BACKLOG.md` `Decomposition review.status` | `pending`, `approved`, `split_required`, `blocked` | only approved permits Structured readiness | split or blocked routes to decomposition or blocker resolution |
| `TransitionStatus` | Transition check — `TASK.md` `Transition check.status` | `valid`, `update_required`, `reshape_required`, `blocked` | only valid permits task implementation | other values route to update, reshaping, or blocker resolution |
| `ChallengeStatus` | Contract Challenge — contract or task `Contract challenge.status` | `not_required`, `open`, `resolved` | open pauses affected implementation | material resolutions may revise the contract, split work, or remain blocked |
| `ChallengeResolution` | Challenge resolution — challenge `resolution` | `none`, `contract_confirmed`, `clarification_recorded`, `contract_revision_required`, `task_split_required`, `blocked_or_deferred` | none applies before resolution; other values apply the named route | every resolution requires an explicit human source; revision and split invalidate affected assumptions |
| `InvalidationStatus` | Setup invalidation — `PROJECT_READINESS.md` `Setup invalidation.status` | `none`, `active`, `resolved` | active permits scoped setup or recovery and explicitly proven unaffected work only | active maps readiness to invalidated; resolved requires human source and revalidation |
| `ContractApproval` | Contract approval — `CONTRACT.md` `approval` | `pending`, `approved`, `declined` | implementation requires approved | approval is revision-bound; material revision resets it to pending |
| `BranchApproval` | Branch approval — `CONTRACT.md` `branch approval` | `pending`, `approved`, `declined`, `exception_approved`, `not_required` | only approved or exception approved permits a required branch action | decided protected actions require scope, rationale, updates, and human source |
| `LightReviewMode` | Light review mode — `RESULT.md` `review mode` | `light_self_review`, `not_applicable` | Light closure uses self-review; task results may mark it not applicable | mode never substitutes for human validation |
| `StructuredReviewMode` | Structured review mode — `ACCEPTANCE.md` `review mode` | `structured_aggregate` | Structured closure requires aggregate review | recorded after implementation as a distinct reasoning pass |
| `LightReviewStatus` | Light review status — `RESULT.md` `review status` | `pending`, `passed`, `changes_required`, `blocked`, `not_required` | Light closure requires passed; task-only results may use not required | changes or blocked route back to work |
| `StructuredReviewStatus` | Structured review status — `ACCEPTANCE.md` `review status` | `pending`, `passed`, `changes_required`, `blocked` | Structured closure requires passed | changes or blocked prohibit closure |
| `HumanValidationRequired` | Human validation requirement — result or acceptance `human validation required` | `yes`, `no` | yes activates the human validation gate; no requires a not-required status | the agent cannot set or satisfy required human authority by inference |
| `HumanValidationStatus` | Human validation status — result or acceptance `human validation status` | `not_required`, `pending`, `confirmed`, `rejected` | confirmed satisfies a required human gate; pending or rejected cannot close it | confirmed or rejected requires an explicit human source |
| `ClosureStatus` | Structured closure — `ACCEPTANCE.md` `final status` | `accepted`, `rejected`, `follow_up_required` | accepted permits an integration proposal; other values prohibit closure | accepted requires passed aggregate review and explicit human closure authority |
| `IntegrationDecision` | Integration decision — `ACCEPTANCE.md` `integration decision` | `merge`, `pull_request`, `defer` | proposes the named route but never authorizes a mutation | decision precedes action-specific approval |
| `IntegrationApproval` | Integration approval — `ACCEPTANCE.md` `integration approval` | `pending`, `approved`, `declined`, `not_required` | mutation requires approved when integration is requested | completed integration evidence requires matching human authority |
| `CommitProposal` | Commit proposal — `RESULT.md` `commit proposal` | `pending`, `approved`, `declined`, `not_applicable` | no commit while pending, declined, not applicable, or inferred | approved or declined records action scope and human source |
| `ProtectedActionDecision` | Other protected Git action — `RESULT.md` `other action decision` | `none`, `pending`, `approved`, `declined` | only approved permits the recorded action | action scope and human source are mandatory when decided |
| `SessionContext` | Session context — `RESULT.md` `context class` | `repository_sufficient`, `handoff_required`, `same_session_justified`, `awaiting_delivery` | describes what durable context can support next | repository or handoff contexts route to a new session; awaiting delivery stops |
| `SessionRecommendation` | Session recommendation — `RESULT.md` `recommendation` | `new_session`, `compact_then_continue`, `continue_current`, `stop` | follow only a recommendation compatible with the recorded context | same-session context permits continue or compact; awaiting delivery maps to stop |
| `ReasoningLevel` | Reasoning level — `CONTRACT.md` or `TASK.md` `Execution guidance.reasoning level` | `low_reasoning`, `medium_reasoning`, `deep_reasoning` | guides operator choice of model and session posture; it never grants authority or overrides required reads and gates | reasoning level is stable task or Delivery Unit guidance and combines with runtime context pressure and transition evidence |

Cursor selection states have narrow meanings:

- `awaiting_delivery`: the baseline is ready but no shapeable outcome or
  Delivery candidate has been selected
- `awaiting_context_selection`: the current scope or bounded context has
  completed or stalled, and the user must choose the next known context,
  milestone, or Delivery candidate before shaping continues
- `awaiting_context_definition`: the chosen context is outlined, deferred,
  unknown, or lacks sufficient knowledge, and the user must provide
  documentation or answer a guided interview before the workflow can create or
  update the planning record

These states pause before shaping. They never authorize a Delivery Unit,
contract approval, task materialization, implementation, or Git action.

`DeliveryUnitStatus=candidate` applies only after a `CONTRACT.md` has been
materialized for a proposed Delivery Unit. It is not the same concept as a
Delivery candidate, which is a non-executable planning record with no contract
or implementation authority. Likewise, a task candidate in `BACKLOG.md` is a
non-executable backlog record and cannot use `TaskStatus` until `TASK.md`
exists. Candidate promotion records are pointers and provenance; execution
authority remains with the materialized Delivery Contract after shaping.

Protected authority source fields accept only `none` or `user:<decision-reference>`. Agent, recommendation, discussion, silence, role, chat, or session labels never supply authority.

### Planning vocabulary

Planning records use stable identifiers and states but remain outside executable
Delivery Unit and task state:

- milestone identifiers use `Mxx-name`
- Delivery candidate identifiers use `DCxxx-name`; never assign a `DU` prefix
  before a Delivery Unit contract is materialized
- milestone plan states are `planned`, `active`, `blocked`, `deferred`,
  `completed`, `archived`, or `cancelled`
- Delivery candidate states are `planned`, `eligible`, `blocked`, `deferred`,
  `promoted`, `completed`, or `cancelled`

Candidate-state meaning:

- `planned`: outcome is known but dependencies, knowledge, selection, or
  ordering do not yet permit promotion
- `eligible`: dependencies and required knowledge are sufficient for supervised
  selection and shaping; no implementation authority exists
- `blocked`: a named gap prevents shaping even if ordering would otherwise
  allow it
- `deferred`: deliberately excluded from the current delivery horizon without
  being cancelled
- `promoted`: shaping materialized a Delivery Unit contract and the candidate
  records its `DU` reference; executable state is now owned by that contract
- `completed`: the linked Delivery Unit was accepted and the planning record was
  reconciled
- `cancelled`: an explicit planning decision removed the outcome before
  completion without rewriting its history

Dependencies may reference milestone or Delivery candidate identifiers and
must remain explicit, resolvable, and acyclic. Identifiers are unique within the
active planning baseline. An unmet dependency keeps a candidate `planned`; it is
not an independent blocker. `eligible` additionally requires sufficient
referenced knowledge and no named blocker. Planning revision approval authorizes the recorded
direction and ordering only. It never changes a candidate into an executable
unit and never satisfies Delivery Contract, task, Git, validation, or closure
authority. Mechanical validation of this vocabulary is introduced with the
planning validator phase; until then, method and template conformance remain
mandatory semantic review.

### Supervised selection and candidate promotion

Use this procedure whenever readiness is `baseline_ready`, the cursor has no
active Delivery Unit, and the next step may come from the approved planning
baseline rather than a user-supplied ad hoc outcome.

1. Read `PROJECT_READINESS.md`, `CURRENT_CURSOR.md`, the planning source named
   by readiness or cursor, and only the milestone plan or Module reference
   needed to locate the relevant candidate.
2. Verify that the cursor's `planning revision observed` matches the approved
   planning revision in the planning source. If it does not, report the
   mismatch, recommend a planning reassessment, and do not promote a candidate
   until the user approves the current revision or selects a new direction.
3. Identify candidates in the current delivery scope first, then the roadmap
   immediate priority, then active milestone plans. A candidate is selectable
   only when its state is `eligible`, its dependencies are recorded as
   satisfied or not applicable, its required knowledge is reachable, and no
   blocker or deferral reason applies.
4. If one candidate is clearly first, recommend it with the evidence: candidate
   id, milestone, owning Module or affected contexts, dependency status,
   required knowledge, and why alternatives are not first. If several are
   plausible, present the smallest decision set and ask the user to choose.
5. If no candidate is eligible but known contexts or candidates remain, set
   cursor status to `awaiting_context_selection` and ask which known context,
   milestone, or candidate should open next.
6. If the chosen context is `outlined`, `deferred`, or `unknown`, or if required
   knowledge is missing, set cursor status to `awaiting_context_definition`.
   Request the missing context documentation or run a guided interview scoped
   to the selected context. Route the answer through `incremental_setup` before
   updating roadmap, readiness, or candidates.
7. If the user approves promotion of an eligible candidate, record the cursor
   with status `shaping`, the candidate id, candidate source, planning source,
   observed planning revision, milestone, owning Module or affected contexts,
   required knowledge, and `promotion action:
   promote_candidate_to_shaping`. This authorizes shaping only.
8. During shaping, create or update the Delivery Unit contract under the normal
   Delivery Unit intake procedure. Only after a contract is materialized may the
   candidate planning record move to `promoted` and record `Materialized as:
   DUxxx-name`.

When the selected context is `deferred`, the user decision must explicitly
change its planning posture or supply new evidence that makes it selectable.
When documentation is missing, the next action is documentation intake or
guided questioning, not contract shaping. When no planned work is selectable
and no known future context remains, stop with a completion-gap note: the queue
is empty but project vision completion still requires the later completion
review.

The cursor is only a pointer. It may carry `delivery candidate`, `candidate
source`, `planning revision observed`, `promotion action`, `required
knowledge`, and `next human decision` so a clean session can resume selection
or shaping, but it must not duplicate outcome text, dependency tables,
candidate state, or milestone ordering from the planning owner.

### Delivery Unit and task just-in-time materialization

Use this procedure after supervised selection authorizes shaping or when an
approved Structured Delivery Unit needs its next task.

#### Delivery candidate to contract draft

1. Read the cursor, planning source, candidate source, readiness, and required
   knowledge named by the selected candidate.
2. Confirm the candidate is still selected for shaping, the observed planning
   revision matches the planning source, and no dependency or knowledge blocker
   emerged since selection.
3. Choose the smallest sufficient Delivery Unit profile. A candidate may become
   Light only when the outcome is atomic and does not benefit from independent
   task transitions; otherwise use Structured.
4. Materialize only the Delivery Unit contract draft:
   - assign the first real `DUxxx-name`
   - set contract `status: candidate` or `shaping`
   - record planning provenance: Delivery candidate, candidate source, planning
     revision, milestone, owning Module or affected contexts, and required
     knowledge
   - keep contract `approval: pending`
5. Mark the Delivery candidate `promoted` and record `Materialized as:
   DUxxx-name` only after the contract draft exists. This records where the
   draft is inspectable; it does not approve the contract or implementation.
6. Keep the cursor candidate-only while the draft is pending: retain the
   selected candidate, set Delivery Unit, contract file, and task file to
   `none`, set `promotion action: await_delivery_contract_approval`, and set
   `next human decision: approve Delivery Contract revision`. The cursor must
   not point to a pending contract or grant executable authority.
7. Only after the user approves the contract revision may the cursor move to
   the materialized Delivery Unit path, clear its candidate pointer, and route
   the approved work according to its profile.

Do not create `BACKLOG.md`, `ACCEPTANCE.md`, task folders, or `TASK.md` until
the Structured profile is selected and its contract/decomposition path
requires them. For a Light unit, the contract owns the executable plan after
approval.

#### Structured backlog and current task

For a Structured Delivery Unit, `BACKLOG.md` may list task candidates without
creating task folders. Each candidate records one intended outcome,
dependencies, required knowledge, based-on contract revision, state, previous
result reviewed, transition status, and materialized task path.

Task candidate states mean:

- `planned`: known future task candidate that must not be materialized yet
- `ready_for_materialization`: dependencies, previous-result review, contract
  revision, and required knowledge are sufficient to create the current
  `TASK.md`
- `materialized`: the candidate has exactly one `TASK.md`; executable state is
  now owned by that task
- `completed`: the materialized task has a `RESULT.md` with `DONE` and has been
  reconciled with the backlog
- `blocked`: a named blocker prevents materialization or execution
- `deferred`: deliberately postponed without being cancelled
- `cancelled`: removed before execution by an explicit decomposition or
  contract decision

Only one next task should normally be materialized ahead of execution. A
Structured unit may have an approved backlog and no task, or one current
materialized task. Do not materialize downstream tasks merely because their
candidate rows are known.

#### Task candidate to `TASK.md`

Before materializing the current task:

1. Read the Delivery Contract, `BACKLOG.md`, the latest dependency `RESULT.md`
   records, acceptance expectations, decisions, and required candidate
   knowledge.
2. Compare previous task results, changed assumptions, changed decisions,
   repository changes, contract revision, dependency state, and required
   knowledge.
3. Record the candidate's transition outcome in `BACKLOG.md`:
   - `valid`: candidate can become the current `TASK.md`
   - `update_required`: update the candidate or backlog before materialization
   - `reshape_required`: revise decomposition or the Delivery Contract before
     materialization
   - `blocked`: stop and record the blocker
4. Materialize `TASK.md` only when the candidate is
   `ready_for_materialization` and transition is `valid`.
5. Copy only the task-local executable contract into `TASK.md`: outcome, scope,
   dependencies, required reads, preconditions, acceptance, verification,
   assumptions, and reasoning level. Do not copy the whole backlog or canonical
   project context.
6. Update the cursor with the task id, task file, candidate id, and
   `promotion action: materialize_next_task`.

After the task result is stable, update the result impact assessment and then
reconcile only future task candidates. If the result changes assumptions,
decisions, contract scope, dependencies, or verification needs, update,
reshape, block, or defer affected candidates before any downstream task is
materialized. Never rewrite a completed task to match later knowledge.

Human selection of a candidate authorizes shaping. Contract approval authorizes
the Delivery Unit revision. A valid task transition authorizes task
materialization. None of these gates authorizes Git mutation or later
downstream tasks.

### Cross-artifact mapping

| Project readiness | Cursor | Current Delivery Unit / task | Required coherence |
| --- | --- | --- | --- |
| `not_ready` | `setup_required` | none, candidate/shaping, or blocked | next action routes to setup; no implementation |
| `baseline_ready` | `awaiting_delivery`, `awaiting_context_selection`, `awaiting_context_definition`, or `shaping` | none, candidate, shaping, or blocked | Project Frame Ready and Slice Ready both pass; baseline supports supervised selection or shaping but no executable task |
| `delivery_ready` | `ready`, `in_progress`, `verifying`, or `completed` | DU `ready`, `active`, `verifying`, or `accepted`; task phase matches cursor | current contract approval, decomposition, transition, and acceptance gates are current |
| `invalidated` | `setup_required` or affected `blocked`; an explicitly assessed unaffected phase may remain | affected DU/task blocked with stale approval cleared | recovery scope, cursor action, contract impact, and downstream revalidation agree |

Cursor `shaping` maps to a named Delivery candidate before a contract exists or
to DU `candidate` or `shaping` after a contract exists. With a Structured task,
cursor `ready` maps to task `ready` while the Delivery Unit may already be
`active`; `in_progress` maps to DU `active` and task `in_progress`; `verifying`
maps to task `verifying` and DU `active` or `verifying`; `completed` maps to
task `completed` with result `DONE` while the Delivery Unit may continue. A
task-local challenge may map cursor and task to `blocked` while the Delivery
Unit retains its viable phase; baseline invalidation affecting the whole unit
blocks the Delivery Unit too. Without a task, cursor phases map directly to the
Delivery Unit and `completed` requires its closure. `awaiting_delivery`,
`awaiting_context_selection`, and `awaiting_context_definition` have no active
Delivery Unit or task.

### State creation and transition recording

Add a state only when it changes an allowed action, authority, required input, expected output, gate, stop behavior, or recovery route. Otherwise use an existing state or a descriptive non-state field. When one transition affects several artifacts, update their owning fields together, preserve authority and evidence, clear stale approvals or assumptions, and keep completed results immutable. Validate current coherence and explicitly recorded transition evidence; do not infer an unrecorded historical transition. Any inconsistency routes to `doctor` or setup recovery rather than implementation.

## Session start

The canonical minimal read order is owned by
[Start of session](../AGENTS.md#start-of-session). This operational method
adds gate-specific procedures after that entrypoint; it does not maintain a
second session-start checklist.

## Context routing

When enabled, use `CONTEXT_MAP.md` to locate sources by area and `TASK_ROUTING.md` to associate work types with sources. Otherwise use search, task references, and targeted reads before opening aggregate documents. In brownfield work, sample representative files before expanding analysis.

Before a non-routine context expansion, identify the concrete uncertainty, the smallest next source likely to resolve it, and the decision or check that depends on that read. Expand directly when safety or correctness already makes the required source obvious.

`ACTIVE_CONSTRAINTS.md` enters the initial context only when adopted by the project.

Expand context when:

- readiness or cursor are inconsistent
- information required for a decision is missing
- the task crosses several boundaries
- a regression or unexpected behavior appears
- a decision changes structure or ownership
- a Delivery Unit, milestone, or architectural transition is being closed

Keep canonical documents short and stable, tasks focused on delta and outcome, and results concise with details in the specific task. Use indexes without duplicating content, and keep history and archives outside initial context.

The context budget limits preventive reading, not reasoning, review, or verification depth. When context sufficiency is genuinely uncertain, quality takes precedence.

Curated canonical knowledge is not self-refreshing. Treat stale topical sources
as an advisory reliability risk: when repository changes suggest that one area
has moved while its mapped canonical source has not been reviewed, revisit the
source or explicitly accept that it remains sufficient.

## Blueprint Increment during active work

When new documentation or user-supplied project detail arrives during active
work, classify it before changing the cursor, roadmap, contract, or task:

- if it is unrelated or future-only, route it through Blueprint Increment and
  append future candidates without interrupting active work
- if it affects future task candidates but not the current task, update or
  revalidate the backlog before the next task materializes
- if it materially contradicts the approved Delivery Contract or current task,
  pause the affected work and apply the Contract Challenge Rule
- if it makes canonical project context insufficient or unreliable for active
  or next work, apply setup invalidation and targeted recovery
- if it only clarifies canonical knowledge without changing active or planned
  work, update the owning source and record no cursor change

The default queue action is append. Insert new work before existing future
candidates only when it is a dependency, blocks safe shaping, or changes an
assumption required by dependent work. Never rewrite completed results or
closed Delivery Units to make an increment appear native to the original plan.

## Reasoning-level guidance

Record one stable `reasoning level` in the Delivery Unit contract and in each
Structured `TASK.md`:

- `low_reasoning`: local execution with low ambiguity and one straightforward path
- `medium_reasoning`: bounded analysis, non-trivial verification, or multi-file work where trade-offs still stay contained
- `deep_reasoning`: architectural shaping, contradiction handling, migrations, boundary decisions, security-sensitive design, or other work where the reasoning path itself is material

This field guides the operator; it does not prescribe a specific model, vendor,
or session surface. Use it to estimate how much reasoning quality the next step
needs before execution starts.

Keep the assignment proportional:

- Light Delivery Units default to `low_reasoning` unless shaping or verification is materially non-trivial
- Structured Delivery Units often justify `medium_reasoning` at contract level because decomposition, shared acceptance, or recovery value already exists
- a Structured task may be lower or higher than its parent Delivery Unit depending on the actual local step

Reasoning level is durable guidance. Do not store transient context-window
pressure in repository state.

## Context pressure and compaction

Use percentage thresholds only when the active client exposes reliable context-usage telemetry. When it does not, describe pressure as an estimate and never present a fabricated percentage.

During an active task:

- below 50 percent: continue without a context prompt
- at or above 50 percent: offer compaction once and state whether preserving the current chat context is still preferable
- at or above 70 percent: recommend compaction and prepare a checkpoint before further broad context expansion
- at or above 85 percent: avoid optional context expansion and strongly recommend compaction or a controlled session handoff

If the user declines, do not repeat the same prompt on every turn. Offer again only after entering a higher threshold band, before a context-intensive phase, or when loss risk materially changes. Reset the offered bands when the task changes or compaction completes.

Before compaction:

1. synchronize durable decisions, state changes, and evidence into their owning artifacts
2. preserve the current objective, completed work, pending checks, changed files, blockers, and exact next step
3. use a session handoff only when task, result, and cursor cannot carry the required working state
4. after compaction, reconstruct status and continue the same task rather than silently opening new work

Context pressure and offered bands are session-local. Do not store percentages in shared repository artifacts.

When deciding whether to continue in the current session, compact, or open a
new one, combine runtime context pressure with the recorded `reasoning level`
rather than treating either signal in isolation:

- `low_reasoning` work may stay in the current session longer when the context is still healthy and the next read surface is small
- `medium_reasoning` work should prefer compaction or a fresh session once context pressure becomes elevated or the next step depends on several sources
- `deep_reasoning` work should bias toward a fresh session after durable synchronization whenever context pressure is elevated or high

If continuity in the same chat still has material value, justify that decision
through the existing session-transition record instead of inventing a parallel
handoff rule.

Practical derived guidance:

| Runtime context pressure | Low reasoning | Medium reasoning | Deep reasoning |
| --- | --- | --- | --- |
| `low` | usually continue when the next read surface stays small | continue only when the next step remains focused and current artifacts are already synchronized | prefer a clean reasoning surface unless immediate continuity is clearly valuable |
| `elevated` | compact if broader reads are about to start; otherwise continuing may remain acceptable | prefer `compact_then_continue` or a fresh session | prefer a fresh session after durable synchronization |
| `high` | avoid optional context expansion; compact or switch before broadening scope | prefer compaction or a fresh session before further analysis | strongly prefer a fresh session; avoid continuing on diluted context |

This table is operator guidance, not a mechanical gate. The repository remains
the durable memory surface; the final transition is still recorded through the
existing session-transition section in `RESULT.md`.

## Summary strategy

Use summaries only when they reduce context dilution or improve resumability.
Do not summarize by default when the next step is already well supported by the
current repository state and current chat context.

Two summary forms are allowed:

- `chat summary`: a short runtime checkpoint used before compaction when the same chat is expected to continue
- `handoff summary`: a slightly more structured checkpoint used before changing chat or LLM when one small temporary bridge still adds value after durable synchronization

A chat summary is for continuity inside the same session. Keep it short and
focused on:

- the current objective
- what was completed
- what remains next
- active blockers or limits
- exact files or results that must stay in attention after compaction

A handoff summary is for a new session or different LLM. Use it only when the
contract, cursor, results, and required reads are almost sufficient but one
concise working bridge still materially improves recovery. Keep it operational
rather than narrative. At minimum record:

- the exact next task or Delivery Unit focus
- active contract revision and decision state
- completed dependencies that matter now
- the minimum required reads
- current blockers, limits, or unresolved risks
- what must not be reopened without new evidence

Do not turn either summary into a second canonical source. Canonical
decisions, contract state, acceptance state, and durable evidence still belong
in their owning repository artifacts first.

## Work shaping

Before implementation, confirm:

- intent and outcome
- scope and non-scope
- material assumptions and uncertainty
- materially different interpretations and their consequences
- the simplest supported approach that satisfies the outcome
- candidate files or areas
- canonical sources to read
- consolidated decisions
- acceptance
- planned verification
- potential readiness impact

For bluefield work, also confirm:

- whether the Delivery Unit changes current state, target state, or only the
  bridge between them
- whether coexistence rules already cover the intended move
- whether `TARGET_STRUCTURE.md`, `PATTERN_MAP.md`, or `MIGRATION.md` must be
  updated before the change can stay unambiguous

When the outcome touches a meaningful security surface, shape it explicitly
instead of treating security as background intuition. Ask only what the current
task needs to know:

- does the work cross a trust boundary or open a new attack surface?
- does it handle untrusted input, credentials, personal data, or other
  sensitive data?
- does it add or alter authentication, authorization, tenancy, or policy
  checks?
- does it depend on third-party systems, callbacks, uploads, webhooks, or
  other externally influenced flows?
- does it require audit, traceability, or security-relevant logging?
- is there a concrete project or regulatory expectation that materially affects
  the implementation?

If the answer is yes and the canonical sources are insufficient, suspend
shaping long enough to make the rule or risk durable. Do not let the agent
silently invent data-handling rules, access-control semantics, or compliance
claims.

If any missing item forces an implicit structural choice, suspend the task and reopen setup.

Ask the user only when ambiguity is blocking. Otherwise record the working assumption and proceed within the approved scope.

Shaping ends with a proposal. Do not mark a contract approved until the actual user explicitly approves that revision and the decision source is recorded.

## Human Decision Brief

Use a Human Decision Brief in chat only when an explicit human-authority gate is material: initial Delivery Contract approval, a material contract revision, Contract Challenge resolution, a policy or process exception, Structured Delivery Unit closure, a protected Git action that requires approval, or explicit acceptance of material residual risk. Do not add one to routine transitions, informational or read-only work, automated verification, non-material documentation, progress reporting, or a decision already covered by valid recorded authority.

Lead with a recommendation and separate repository evidence from inference. Three brief levels are allowed:

- `Light`: recommendation, essential evidence, residual risk, one direct decision question, and exact concise replies
- `Standard`: recommendation, concise rationale, relevant evidence with uncertainty identified, what can be approved as-is, what should realistically be considered changing now, residual risk, planned durable file updates after the decision, and one direct final question with exact concise replies
- `Full`: the complete high-risk form described below

Choose the smallest brief that still matches the decision weight. Use this minimum routing:

| Gate | Minimum brief |
| --- | --- |
| simple initial contract approval with one atomic outcome | `Light` |
| straightforward protected Git action with low decision complexity | `Light` |
| ordinary material contract revision without process exception, unresolved challenge, or significant residual risk | `Standard` |
| moderate integration decision with bounded impact and explicit rollback path | `Standard` |
| Structured closure | `Full` |
| Contract Challenge resolution | `Full` |
| policy or process exception | `Full` |
| explicit acceptance of material residual risk | `Full` |
| significant integration decision with broad impact or difficult reversal | `Full` |

Do not use `Light` or `Standard` to compress a decision that changes process rules, resolves a material challenge, accepts material residual risk, or closes a Structured Delivery Unit. When in doubt between `Standard` and `Full`, prefer `Full`.

A `Full` brief is required for the high-risk gates listed above. It contains:

- decision requested
- recommendation and concise rationale
- relevant evidence, with uncertainty identified
- what can be approved as-is
- what should realistically be considered changing now
- what can safely be deferred
- residual risks
- one question worth asking, or `none`
- planned durable file updates after the decision
- one direct final question and exact concise replies
- an invitation to ask questions or debate before deciding

Do not invent criticism, alternatives, risks, or questions to fill the format. `consider changing now`, `defer`, and `question worth asking` may be `none`. Discussion, a recommendation, and silence are not approval. Only the user's final explicit decision satisfies the gate, recorded as `user:<decision-reference>` and bound to the applicable contract revision or action scope.

Persist only the explicit decision, concise rationale, affected revision or scope, planned or actual updates, and authority reference in the existing owning artifact. Do not copy the complete chat brief into repository files or create a brief, gate, role, handoff, or global-state artifact.

### Batched human decision review

When several pending human decisions can be reviewed together without hiding
risk, the agent may present them as one batched review instead of interrupting
execution with several fragmented prompts.

Use a batched review only when all of the following are true:

- each decision is already shaped enough to present clearly
- grouping them improves coordination more than it increases cognitive load
- no individual decision requires an immediate stop before any other safe
  preparatory work can continue
- the combined set still remains understandable as a small explicit queue, not
  an omnibus status dump

Do not use batching to blur responsibility, compress a high-risk decision into
surrounding low-risk ones, or continue past a gate that must be approved now.
If one decision materially changes the course of the rest, stop and resolve it
first instead of batching downstream consequences behind it.

Prefer a single decision brief when there is only one material gate, when the
next action depends entirely on one answer, or when bundling would make replies
ambiguous. Prefer a batched review when several approvals or confirmations are
independent enough that the user can evaluate them in one pass.

The minimum batched form is:

- a numbered list of decisions requested
- the minimum context and recommendation for each item
- the residual risk for each item
- one explicit reply format for each item, or one explicit combined reply when
  the allowed answers are unambiguous
- the planned durable updates for accepted or declined outcomes

Each accepted or declined item is still persisted separately in its owning
artifact with its own scope, rationale, updates, and `user:<decision-reference>`
source. The batch is a chat presentation convenience, not a new state object.

If no further safe work exists before the human reply, stop with the batched
review pending. If safe preparatory or read-only work remains, the agent may
complete that work first, then present the batched review before the blocked
transition.

### Compact Light example

> Recommendation: approve contract revision 1 as written. Evidence: the outcome is atomic, its boundary exists, and the named checks cover acceptance. Residual risk: the CLI error wording may need a later non-material adjustment. Approve revision 1? Reply exactly `Approve contract revision 1` or `Decline contract revision 1`. You may ask questions or debate the recommendation before deciding.

### Compact Standard example

> Recommendation: approve contract revision 2 as written. Rationale: the dependency change is material because it affects execution scope, but it does not alter process rules or introduce unresolved architectural risk. Evidence: the repository already uses the same library in the affected boundary, tests remain local, and the revision updates the acceptance checks. Consider changing now: defer the optional convenience wrapper and keep only the dependency needed for the current outcome. Residual risk: one extra dependency adds future maintenance surface, but rollback is straightforward. Planned durable updates: record contract revision 2, the approval rationale, and `user:<decision-reference>` in `CONTRACT.md`, then revalidate downstream tasks against revision 2. Approve contract revision 2? Reply exactly `Approve contract revision 2` or `Decline contract revision 2`. You may ask questions or debate the recommendation before deciding.

### Compact Full example

> Decision requested: close Structured Delivery Unit DU004 at contract revision 3 and defer integration. Recommendation: accept closure; the aggregate review and regression suite pass. Evidence: all backlog tasks are complete, acceptance is satisfied, and the worktree classification is recorded. Inference: the remaining migration risk is low because compatibility coverage passed. Approve as-is: closure at revision 3. Consider changing now: none. Defer: branch integration until release sequencing is decided. Residual risk: production telemetry is unavailable before release. Question worth asking: none. Planned durable updates: record the closure decision, rationale, revision, deferred integration, and `user:<decision-reference>` in `ACCEPTANCE.md`. Accept closure and defer integration? Reply exactly `Accept DU004 closure at revision 3 and defer integration` or `Reject DU004 closure at revision 3`. You may ask questions or debate the recommendation before deciding.

## Execution discipline

Before editing:

1. confirm that the contract approval source is human and applies to the current revision
2. translate the outcome into observable success criteria
3. for multi-step work, state a short plan that pairs each meaningful step with a check
4. consider whether a simpler supported solution achieves the same acceptance

During implementation:

- write the minimum code and documentation required by the outcome
- avoid speculative features, abstractions, configurability, and failure handling
- touch only files and lines required by the task or its necessary consequences
- preserve adjacent code, comments, formatting, and pre-existing debt
- match established local style unless canonical guidance or safety requires otherwise
- remove only artifacts made obsolete by the current change

If the solution becomes materially larger or more complex than the outcome suggests, pause and simplify or re-shape the task before continuing.

Stop before making a material contract, scope, architecture, dependency, or policy change. Revise the proposal, invalidate stale approval, and request an explicit user decision instead of extending execution authority by inference.

When several human-authority gates become pending during one bounded line of
work, accumulate only the decisions that can genuinely be reviewed together.
Do not cross a blocked gate merely because a later batched review is planned.

After editing, run the planned checks and iterate until acceptance passes, an evidenced blocker remains, or repeated-failure recovery applies.

### Verification planning

Verification must be shaped before implementation, not improvised at the end.
Choose the smallest mix of checks that can credibly prove the outcome without
hiding risk.

Use this decision rule:

- `UnitTests`: required when behavior can be proven in isolation and logic or
  branching is part of the change; usually not enough by themselves for wiring,
  configuration, persistence, or cross-boundary behavior
- `IntegrationTests`: required when confidence depends on collaboration between
  components, infrastructure, persistence, HTTP, messaging, filesystem, or
  runtime configuration; not required for a purely local change with no
  meaningful integration surface
- `ArchitectureTests`: required when the change relies on dependency direction,
  module boundaries, naming, layering, or other structural rules that can drift
  silently; not required when no structural rule is part of the outcome or
  regression risk
- manual checks: required when the observable proof surface is UI, operations,
  diagnostics, third-party behavior, or another area not credibly covered by
  available automation

Not every Delivery Unit needs all layers. What matters is that the contract or
task makes the intended proof surface explicit and the result records what was
actually exercised.

When an expected layer is intentionally omitted, record the reason succinctly:
for example no isolated logic, no integration surface, no structural rule at
risk, or no reliable automation harness yet.

### Verification evidence discipline

Record verification in proportion to the work, but do not collapse everything
into one vague "verified" claim.

Distinguish three things:

- executed checks: what was actually run or inspected
- evidence references: where a later reader can inspect the proof surface
- limitations: what was not verified, what remains manual, or what confidence
  boundary still exists

For a Light Delivery Unit, `RESULT.md` is the primary verification record. For a
Structured Delivery Unit, each task `RESULT.md` records task-local verification
and `ACCEPTANCE.md` records the aggregate execution, evidence references, and
remaining limits for closure.

An evidence reference may be a command and outcome, a named test suite, a
specific file and assertion surface, a task result, or a CI or report reference
when available. Do not create mandatory log archives or attach bulky output by
default. Prefer concise, inspectable references that a later reviewer can
follow.

When verification is intentionally partial, say so explicitly. A concise
limitation is better than overstating confidence.

### Security review discipline

Do not force a formal threat model for every Delivery Unit. Apply proportionate
security review when the work changes a trust boundary, sensitive-data path,
authorization rule, untrusted-input surface, or infrastructure exposure.

At minimum, the review should make explicit:

- what security-relevant surface changed
- what check or evidence was used to gain confidence
- what residual risk or unverified assumption remains
- whether the risk is local to the task, should be recorded in a durable
  decision, or requires broader canonical guidance

Use external references such as OWASP, NIS2, GDPR, NIST, or internal security
policy only when they are actually relevant to the project or requested by the
user. Reference them as constraints or evidence sources, never as implied proof
of compliance.

### Code documentation discipline

Keep explanatory burden in the cheapest durable place.

Use code comments for:

- public APIs whose contract is not obvious from the signature
- domain rules or invariants that are easy to break and costly to rediscover
- orchestration or integration seams where the reason for sequencing matters
- non-obvious constraints, workarounds, or failure-avoidance behavior tied to
  the code being changed

Do not add comments that merely restate names, mirror trivial control flow, or
copy what already lives more clearly in canonical workflow sources.

Use canonical project sources for broader policies, cross-cutting rules,
architectural rationale, testing expectations, and decisions that apply beyond
one file or method. Use task and result artifacts for change-local execution
intent, verification evidence, and impact. When in doubt, keep long-lived local
truth near the code and cross-cutting truth in canonical sources.

## Contract Challenge Rule

Execution may challenge an approved Delivery Contract only when material repository evidence shows that the approved work is infeasible, unsafe, internally inconsistent, no longer atomic, unverifiable, or materially inferior to a simpler or safer supported solution. A challenge extends the existing stop, revision, decomposition, impact, transition, and human-authority rules; it does not create a role, artifact, handoff, or global workflow state.

### Valid triggers

- repository behavior contradicts a contract assumption
- repository evidence previously treated as reliable is discovered to be stale,
  misleading, generated without trustworthy ownership, or otherwise unsafe to
  promote without clarification
- an acceptance criterion is impossible or cannot be verified
- a required dependency or boundary does not exist
- implementation requires unavoidable scope expansion
- implementation introduces a concrete security, data-integrity, compatibility, or operational risk
- a task is no longer sufficiently atomic
- a materially simpler or safer supported solution changes the approved approach

Personal preference, stylistic disagreement, speculative optimization, or an alternative without material safety, simplicity, feasibility, or verification benefit does not justify a challenge.

When the trigger is an unsafe brownfield source rather than direct code
behavior, first classify the source and identify the trustworthy anchor that
contradicts it. Do not continue by averaging several competing sources or by
rewriting the suspect source into canonical wording before the contradiction is
resolved.

### Required response

Pause before the unapproved change. Lead with the observed mismatch and minimum recommendation, then ask one direct question. Record:

- what the contract expects
- observed repository evidence, including relevant files, commands, or behavior
- the mismatch and its impact on scope, acceptance, architecture, dependencies, risk, or downstream tasks
- the minimum correction and only materially distinct alternatives
- whether unaffected work can safely continue
- affected tasks and downstream revalidation need
- the user authority or decision required

Do not continue protected work while the challenge is unresolved. Unaffected work may continue only when the recorded evidence shows it is independent and the cursor identifies an allowed action.

### Resolution values

- `contract_confirmed`: the current approved revision remains valid and execution may resume
- `clarification_recorded`: ambiguity is resolved without a material revision
- `contract_revision_required`: revise the contract, increment its revision, invalidate stale approval, and request explicit user approval
- `task_split_required`: reshape the task or Structured Delivery Unit and return to decomposition before execution
- `blocked_or_deferred`: implementation cannot continue safely

Every resolution requires an explicit user decision source. `contract_revision_required`, `task_split_required`, and `blocked_or_deferred` remain paused until their existing revision, decomposition, readiness, and cursor gates are satisfied.

### Persistence

- Structured units record the challenge in the active `TASK.md`
- Light units record it in the active `CONTRACT.md`
- material unresolved decisions remain in `CONTRACT.md`
- the cursor records the blocker and next allowed action without adding a new global state
- `DECISIONS.md` is used only when the resulting decision has broader or durable scope
- material changes increment the contract revision and invalidate stale approval
- invalidated downstream assumptions require revalidation before affected tasks resume

The recorded challenge is operational evidence, not proof that the engineering objection is correct. Human authority resolves protected choices.

## Delivery Unit intake and shaping

During shaping, assign Module ownership only when one configured Module clearly owns the outcome. Record `owning module: none` for root Delivery Units and list existing affected Modules when the work crosses boundaries. Module placement organizes context; it does not change Delivery Unit profile, approval, execution, review, or closure rules.

Before implementation, distinguish among:

- a ready Delivery Unit
- a proposed outcome or Delivery candidate that still requires shaping
- no Delivery Unit

When no ready Delivery Unit, materialized proposed contract, or planned
Delivery candidate exists, set the cursor to `awaiting_delivery` and ask the
user to describe the outcome, problem, or change. Analyze repository evidence
and recommend `light` or `structured`; do not invent work.

When a planned Delivery candidate exists, run supervised selection first. A
selected candidate can move the cursor to `shaping`, but it remains
non-executable until this procedure materializes a Delivery Contract and the
user approves the resulting revision. Do not create `BACKLOG.md`,
`ACCEPTANCE.md`, task folders, or task files merely because a candidate was
selected.

Recommend `structured` when any of these apply:

- multiple independently verifiable results or sequential tasks
- multiple boundaries, components, or verification modes
- migration or structural change
- medium or high risk
- work likely to span sessions
- meaningful downstream invalidation risk

Recommend `light` only for one atomic outcome with one coherent verification boundary and no useful decomposition. The user approves the contract and profile before implementation.

In bluefield work, classify the Delivery Unit during shaping as one of:

- `legacy_stabilization`
- `target_introduction`
- `bridge_or_coexistence`
- `convergence_step`

This classification is only for shaping clarity. It does not create a new state
or artifact. Persist the useful part in the contract outcome, scope,
constraints, and canonical sources.

## Light Delivery Unit

A light unit contains `CONTRACT.md` and `RESULT.md`. The contract owns the complete operational task, acceptance, and verification.

Flow:

1. confirm baseline readiness and contract approval
2. read the contract and canonical sources
3. update the cursor
4. implement within scope
5. verify and record the result, including impact assessment
6. reassess readiness and the delivery queue
7. run the validator when installed

Do not create a milestone, backlog, acceptance file, or task folder only to satisfy hierarchy.

## Structured Delivery Unit

Before approval, run the decomposition review in `BACKLOG.md`. Each task must have one observable outcome, independent verification, limited coherent responsibility, and no hidden architectural decision. Mark `split_required` when a task contains independent outcomes, crosses unrelated boundaries with different checks, or cannot be confidently reviewed and resumed. Do not split when doing so creates unverifiable intermediate states or artificial setup repetition.

For each task:

1. confirm baseline readiness, contract status, dependencies, and the approved delivery branch or exception
2. compare the contract revision, dependency results, repository state, changed decisions, and task assumptions
3. record transition status as `valid`, `update_required`, `reshape_required`, or `blocked`; proceed only when `valid`
4. read `CONTRACT.md`, `BACKLOG.md`, `ACCEPTANCE.md`, the task, and referenced sources
5. implement and verify
6. update the task `RESULT.md`, including deviations and downstream impact
7. update result indexes when adopted
8. revalidate subsequent tasks and update backlog, acceptance, contract, decisions, or readiness when needed
9. increment the contract revision for substantive outcome, scope, constraint, decision, or dependency changes
10. run the validator when installed

In bluefield work, update migration-oriented artifacts whenever a task
materially changes coexistence rules, supported target patterns,
current-to-target structure, or migration sequencing assumptions.

Never rewrite a completed task to conceal later change. Preserve its result, add a corrective task, revise the contract, and revalidate downstream work.

## Operational prompt

A prompt derived from the task may improve execution focus when starting in a new session or when a tool requires a focused prompt. Do not restate a task that is already the active context. It remains optional for a light Delivery Unit.

It is not a permanent artifact and cannot introduce decisions absent from the canonical task.

The minimum useful prompt anchors the execution to the owning task or Delivery
Unit artifact first, then adds only the context that reduces ambiguity for the
next step.

Always include:

- the exact task or Delivery Unit artifact to execute
- the instruction to reconstruct state from canonical workflow artifacts rather than prior chat

Include when relevant:

- the smallest read framing for required reads or canonical sources
- the execution focus for the next step
- active constraints, assumptions, or trade-offs that are easy to miss
- the expected verification or evidence target
- a chat summary or handoff summary only when the session-transition guidance says one still adds value

Avoid:

- repeating the full task text when the artifact already owns it
- copying long canonical context instead of referencing the owning source
- adding model-specific recommendations
- turning the prompt into a second contract or summary artifact

Preferred progression:

1. task anchor only, when the repository state and required reads are already enough
2. task anchor plus concise read framing, when the next step needs a sharper reconstruction path
3. task anchor plus carryover summary, only when compaction or session switch would otherwise lose a small but material working thread

## Task closure

A task can close when:

- outcome or blocker is explicit
- acceptance has been evaluated
- verification and evidence are recorded
- affected documentation and decisions are updated
- the cursor reflects real state
- the impact assessment records deviations, changed assumptions or decisions, contract impact, downstream impact, and whether revalidation is required
- subsequent work has been reviewed
- the validator reports no errors when installed

Before commit or handoff, classify all worktree changes and do not absorb unrelated changes.

After closure, propose one atomic commit for the verified task. Record `pending`, `approved`, `declined`, or `not_applicable` in the result. Do not stage or commit until the user explicitly approves the specific action and scope.

### Session transition

Record one transition class in the result:

- `repository_sufficient`: durable context is complete; recommend `new_session`
- `handoff_required`: existing artifacts cannot carry essential working context; create a focused handoff, then recommend `new_session`
- `same_session_justified`: immediate continuity has a material benefit; recommend `compact_then_continue` or `continue_current` and record why
- `awaiting_delivery`: no Delivery Unit is ready or being shaped; recommend `stop` after asking the user for the next outcome

A completed task defaults to `repository_sufficient`. If the next task appears to require the old chat, first move durable information into its owning artifacts. Use `handoff_required` only when a concise temporary handoff remains necessary after that synchronization.

Choose the transition class from durable repository state first, then refine
the recommendation using runtime context pressure and the recorded reasoning
level:

- prefer `repository_sufficient` when the next step can be reconstructed from the contract, current cursor, results, and required reads
- use `same_session_justified` only when immediate continuity has a material benefit that is still stronger than the current context-pressure cost
- prefer `compact_then_continue` over `continue_current` when the same chat still has value but the active context is already elevated
- when `deep_reasoning` meets elevated or high context pressure, bias toward `new_session` once durable synchronization is complete
- reserve `handoff_required` for the residual cases where even synchronized repository state still cannot carry one essential temporary working thread
- use a short `chat summary` before `compact_then_continue`; use a `handoff summary` only for `handoff_required` or for the rare `new_session` case where one concise temporary bridge still improves recovery

Use the complete session-transition record whenever the next step depends on a clean-session prompt, a compact-and-continue decision, or a real handoff. The complete form records:

- `context class`
- `recommendation`
- `reason`
- `handoff`
- `opening prompt`

Allow a compact form only when all of the following are true:

- `context class` is `awaiting_delivery`
- `recommendation` is `stop`
- no handoff is needed
- no opening prompt is needed because no next executable work exists yet

In that compact stop form, `reason`, `handoff`, and `opening prompt` may be omitted. Their meaning is implicit: no handoff, no opening prompt, and stop because no Delivery Unit is ready or shaped.

When recommending a new session, provide a ready-to-use opening prompt derived from `SWITCH_LLM_PROMPT.md` and the current cursor. Closure housekeeping such as an approved commit may remain in the current session, but implementation of the next task follows the recorded transition.

### Shared-cursor handoff discipline

The workflow supports several operators only through sequential handoff on one
shared cursor. It does not support concurrent mutation of the same active
workflow state.

Before one operator stops and another continues on the same branch or workflow
root:

- finish the current durable update cycle first: synchronize the owning contract, current task, result, cursor, and any required decision or readiness updates
- classify the worktree before handoff; do not leave unrelated changes ambiguous
- record the session-transition guidance that matches the real recovery need
- use a handoff summary only when the synchronized repository still cannot carry one essential temporary thread

When taking over:

- start from `status` or `resume`, not from chat memory alone
- re-read readiness, cursor, the active contract or task, and the latest owning result before acting
- cross-check Git state, current revision references, and transition validity before implementation resumes
- treat any chat summary or handoff summary as a temporary bridge that cannot override repository truth

If two operators truly need parallel work, do not share one mutable cursor
across both streams. Split by independent branch, workflow root, or Delivery
Unit scope first, then merge through normal review and integration.

## Delivery Unit closure

Run review as a distinct reasoning pass after implementation. A Structured Delivery Unit records an aggregate review in `ACCEPTANCE.md`; a Light Delivery Unit records a proportionate self-review in `RESULT.md`. The same LLM may perform both execution and review, but the review output must be separate from the execution outcome.

Review covers:

- coherence between tasks and acceptance
- regressions and inconsistencies
- quality, simplicity, and operating cost
- debt or follow-up work
- impact on documentation and readiness
- security-sensitive changes and residual risks when relevant
- integration decision: merge, pull request, or defer

When closure or validation requires human judgment, keep it pending until the actual user decides and record the decision source. Review completion alone cannot satisfy human validation.

After acceptance, propose the recorded integration decision. Do not merge, create a pull request, or perform another integration mutation until the user explicitly approves that action.

Archive the Delivery Unit when it no longer belongs in active context while preserving references and final results.

## Milestone, context, scope, and project closure

Closure above one Delivery Unit is a distinct review. It never follows
automatically from an empty queue, a completed task, or one accepted Delivery
Unit.

Run the smallest applicable review:

- **Delivery Unit review**: owned by `RESULT.md` for Light units or
  `ACCEPTANCE.md` for Structured units; proves only that the unit outcome was
  accepted
- **milestone review**: evaluates the milestone exit criteria, accepted
  Delivery Unit references, remaining candidate states, dependency outcomes,
  and closure decision source
- **bounded-context review**: evaluates whether the selected context's local
  outcomes, invariants, required knowledge, verification expectations, and
  known follow-ups are satisfied
- **current delivery scope review**: evaluates whether the approved current
  scope in the Roadmap is complete or needs another context, candidate, or
  Blueprint Increment
- **project vision review**: evaluates the recorded project completion criteria
  in Product/Roadmap sources; it is the only review that can claim the declared
  project vision is complete

Completion-gap review is required when there are no eligible candidates or no
materialized next tasks but project completion criteria are not proven. The
review must record:

- which queue or candidate set is empty
- which project, scope, milestone, or context completion criteria remain
  unproven
- whether the next step is context selection, context definition, Blueprint
  Increment, candidate shaping, corrective work, or a deliberate stop
- what documentation or human decision is required

After a bounded context closes, present the next-step options before changing
the cursor:

- `defined` contexts with eligible candidates
- `outlined` contexts that need local documentation or interview
- `deferred` contexts and the decision needed to open them
- blocked or unknown contexts and their missing evidence
- candidate recommendation with rationale, or stop rationale when no work is
  currently plannable

Set the cursor according to the selected next step:

- `awaiting_context_selection` when the user must choose among known contexts,
  milestones, or candidates
- `awaiting_context_definition` when the selected context needs documentation
  or guided interview before planning
- `shaping` when an eligible candidate is selected for shaping only
- `awaiting_delivery` when the baseline is ready but no planned work exists and
  the user must describe the next outcome
- `completed` only for the closed Delivery Unit/task level represented by the
  current cursor, not for the project vision unless the project review passes

Human closure decisions are required for milestone closure, current-scope
closure, project-vision completion, and any closure with material residual
risk. The decision source must be the actual user. Agent review, empty queue,
or lack of visible work cannot supply closure authority.

Perform a lightweight retrospective only after the appropriate closure review:

- outcomes achieved
- decisions stabilized
- recurring problems
- missing or unnecessary artifacts
- workflow improvements justified by evidence

## Recovery after repeated failure

When the same blocking condition recurs after an evidence-based attempt:

1. stop changes based on the same hypothesis
2. preserve work and evidence
3. summarize symptom, attempt, and new evidence
4. expand context to required sources
5. produce a materially different plan
6. choose between a new approach, task split, setup invalidation, or user input

Do not apply this protocol to intentionally failing tests, normal red-green cycles, or independent failures.

## Branches and commits

- before starting a structured Delivery Unit, propose a dedicated branch and request approval to create or switch to it
- a structured Delivery Unit may use the current branch only through an explicitly approved exception recorded in its contract
- light Delivery Units use the current branch unless isolation is justified; creating or switching branches still requires approval
- prefer atomic commits aligned with actual outcomes
- propose a commit after every verified task and record the decision in `RESULT.md`
- propose merge, pull request, or deferral after every accepted Delivery Unit and record approval and outcome in `ACCEPTANCE.md` or the light-unit `RESULT.md`
- request explicit, action-specific consent immediately before every Git mutation, including branch changes, staging and commit, amend, merge, rebase, cherry-pick, reset, tag, push, and pull-request creation
- treat an explicit user instruction for the same action and scope as approval; request approval again if the action or scope materially changes
- never execute a mutation while approval is pending, declined, absent, or inferred
- respect tracked, local, or hybrid workflow policy

Several Git approvals may be requested in one batched human review only when
each action remains individually scoped and no earlier pending approval is a
prerequisite for understanding the later one. Never treat batch presentation as
approval to execute all listed mutations automatically.
