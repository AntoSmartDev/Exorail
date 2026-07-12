# STRUCTURE_REFERENCE.md

## Available v0 structure

```text
<repo>/
  AGENTS.md                 # minimal discovery bridge
  CLAUDE.md                 # only when Claude Code is supported
  README.md
  src/
  tests/
  .exorail/
    AGENTS.md               # canonical shared agent contract
    WORKFLOW_CONFIG.md
    PROJECT_READINESS.md
    KNOWLEDGE_INDEX.md
    DECISIONS.md
    CURRENT_CURSOR.md
    ACTIVE_CONSTRAINTS.md     # conditional
    READY_CHECKLIST.md        # conditional
    CONTEXT_MAP.md            # conditional
    TASK_ROUTING.md           # conditional
    RESULTS.md                # conditional
    project/                  # only for canonical coverage not already owned elsewhere
      PRODUCT.md              # split-source alternatives, not a mandatory set
      ARCHITECTURE.md
      ENGINEERING.md
      ROADMAP.md
      knowledge/              # optional navigable project wiki for mixed or large documentation
        OVERVIEW.md
        SOLUTION_STRUCTURE.md
        MODULE_BOUNDARIES.md
        PERSISTENCE.md
        INTEGRATIONS.md
        SECURITY.md
        TESTING_STRATEGY.md
        CODING_STANDARDS.md
        MIGRATION.md
        contexts/             # optional cohesive local knowledge; no Module required
          catalog.md
      milestones/             # optional planning-only milestone records when ROADMAP alone is insufficient
        M01-name/
          README.md
    method/
    prompts/
    templates/
    tools/
    modules/                  # optional stable bounded contexts or capabilities
      bookings/
        MODULE.md
        delivery-units/
          DU003-.../
            CONTRACT.md
            RESULT.md
    delivery-units/           # units without one clear Module owner
      DU001-.../              # light Delivery Unit without one clear Module owner
        CONTRACT.md
        RESULT.md
      DU002-.../              # structured Delivery Unit
        CONTRACT.md
        BACKLOG.md
        ACCEPTANCE.md
        tasks/
          T001-.../
            TASK.md
            RESULT.md
    archive/                  # conditional
    notes/                    # conditional
```

`.exorail/` is the default workflow container. The effective path must be recorded in `WORKFLOW_CONFIG.md` and respected by entrypoints and validators.

## Entrypoints

### `AGENTS.md`

The root file is a minimal, fail-closed discovery bridge to `.exorail/AGENTS.md`. The canonical internal contract includes:

- canonical sources
- workflow location
- minimum read order
- non-negotiable gates and constraints
- relevant build and verification commands

### `CLAUDE.md`

A thin root bridge for Claude Code. It directly imports `.exorail/AGENTS.md` and contains only genuinely Claude-specific differences.

## Core artifacts

- canonical Product, Architecture, Engineering, and Roadmap coverage in one or more sources selected by `PROJECT_SETUP.md`, including explicitly mapped brownfield equivalents
- `WORKFLOW_CONFIG.md`: profile, target agents, state policy, Git policy, and paths
- `PROJECT_READINESS.md`: separate Project Frame Ready, Slice Ready,
  aggregate repository-baseline, and Delivery Unit readiness; own the
  bounded-context coverage assessment, current-scope readiness reference,
  planning revision reference, scoped setup invalidation record, and compact
  resolved history; Delivery Unit artifacts retain contract-specific
  invalidation
- `KNOWLEDGE_INDEX.md`: routing index for required project knowledge and canonical sources
- `DECISIONS.md`: accepted, blocking, and deferred decisions
- `CURRENT_CURSOR.md`: reconstructable operational position; when no Delivery
  Unit exists, it may point to the selected Delivery candidate, planning
  revision, planning source, candidate source, required knowledge, promotion
  action, and next human decision without owning candidate state
- `CONTRACT.md`: complete operational contract, materialized only for an actual Delivery Unit
- `TASK.md`: one small step inside a structured Delivery Unit
- `RESULT.md`: Delivery Unit or task outcome, verification, and impact assessment, materialized only with its owning unit or task

`KNOWLEDGE_INDEX.md` is the entrypoint for selective reading. It may route to
one cohesive project source or to a split knowledge tree when ownership, update
events, or recurring read patterns justify separate files.

Its core routing rows remain explicit in every project. Knowledge-area states
describe active or next read requirements and do not replace the
bounded-context maturity assessment in `PROJECT_READINESS.md`. Optional topical rows
may be omitted only when they are currently not applicable; once they become
relevant enough to be `deferred` or `required`, they must be materialized.

When a knowledge tree exists, `KNOWLEDGE_INDEX.md` remains the single routing
entrypoint. The tree is project knowledge, not workflow state: use it to reduce
future read scope, not to mirror every directory or invent a second planning
system.

For one defined or selected bounded context, prefer one cohesive source shaped
from `templates/knowledge-tree/BOUNDED_CONTEXT.md` and conventionally place it
under `project/knowledge/contexts/` when the repository has no stronger existing
owner. A context source is canonical project knowledge, not workflow state and
not a `MODULE.md`. Split it further only under the same ownership and
proportionality rules used by the rest of the knowledge tree.

## Optional Modules

A bounded context is part of canonical project knowledge: it describes a stable
domain or responsibility boundary whether or not the workflow creates a local
artifact for it. A Module is the optional workflow navigation and ownership
boundary used when one recognized bounded context or durable capability has
recurring local context and delivery work. The two concepts are related but not
interchangeable. A known bounded context does not require a Module, and a
durable technical capability may justify a Module without becoming a domain
bounded context.

A Module records responsibility, exclusions, canonical sources, allowed
dependencies, and local invariants. It is not an execution, approval, review,
or closure unit and never replaces a Delivery Unit.

Create `.exorail/modules/<module-id>/MODULE.md` only when the boundary is recognizable, has rules or ownership of its own, is expected to receive multiple Delivery Units over time, and makes recurring context easier to find. Do not create a Module for a one-off change, a single small feature, a temporary workstream, or merely to classify every Delivery Unit.

Place a Delivery Unit under `.exorail/modules/<module-id>/delivery-units/` when that Module is its clear owner. Otherwise place it under `.exorail/delivery-units/`. A cross-module unit stays in the root Delivery Unit directory and lists the involved Modules in its contract. The physical location and contract ownership must agree.

Projects that do not benefit from Modules use only `.exorail/delivery-units/`; the `modules/` directory need not exist.

## Conditional artifacts

- `PROJECT_BLUEPRINT.md`: optional intake form or immutable supplied snapshot; never a competing canonical source after materialization
- `CONTEXT_MAP.md` and `TASK_ROUTING.md`: projects with multiple areas or documents
- `RESULTS.md`: index when results become numerous
- milestones: optional planning-only grouping for related Delivery Units, kept in roadmap coverage rather than the execution tree unless a dedicated planning artifact is justified
- modules: optional stable ownership boundaries for recurring capability work
- `BACKLOG.md` and `ACCEPTANCE.md`: structured Delivery Units only
- `ACTIVE_CONSTRAINTS.md`: active constraints that are easy to forget
- `READY_CHECKLIST.md`: repeatedly useful mechanical checks
- `archive/`: completed work that should leave active context
- local templates: only when the target project uses them directly

Canonical `ROADMAP.md` coverage owns the project objective, project completion
criteria, planning authority and revision, milestone ordering, current delivery
scope, and root Delivery candidates. A dedicated milestone `README.md` owns one
milestone's outcome, required knowledge, dependencies, exit criteria, Delivery
candidates, promotion rule, and closure evidence. Create that directory only
when the Roadmap alone is no longer a proportionate owner.

Delivery candidate identifiers use `DCxxx-name` and remain planning records.
Do not reserve a `DU` identifier, create an empty Delivery Unit directory, or
materialize `CONTRACT.md` before shaping. Promotion records the eventual
Delivery Unit reference without transferring planning ownership into
`MODULE.md` or the cursor. The cursor can name the candidate and source to make
the next session reconstructable, but the roadmap or milestone plan remains the
only owner of candidate outcome, dependencies, state, and ordering.

## Planning records and executable artifacts

Planning records preserve delivery intent before executable artifacts are
justified. Their concepts and authority are canonical in `PLAYBOOK.md`:

- a milestone plan may live in canonical roadmap coverage or in one dedicated
  milestone record when the roadmap alone is insufficient
- a Delivery candidate lives only in its owning planning record until shaping
  materializes an actual Delivery Unit contract
- a task candidate lives only in the owning Structured `BACKLOG.md` until its
  executable `TASK.md` is materialized

A planned identifier or folder reference does not prove that the corresponding
Delivery Unit or task exists. Conversely, once `CONTRACT.md` or `TASK.md` is
materialized, its local state and authority belong to that executable artifact,
not to the earlier candidate record. Candidate promotion must preserve the
planning provenance without copying the planning record into a second source of
truth.

Planning approval selects direction and ordering only. It cannot satisfy
Delivery Contract approval, task transition, human validation, or protected Git
authority.

Just-in-time materialization preserves this ownership boundary: candidate
records keep intent and ordering, the materialized contract owns Delivery Unit
authority, and the materialized `TASK.md` owns only the current executable task.
Future task candidates remain in `BACKLOG.md` until their transition is valid.

## State policy

- `tracked`: the workflow container and its workflow-owned root bridges are versioned
- `local`: the workflow container and its workflow-owned root bridges are excluded from Git and require explicit backup
- `hybrid`: shareable sources and required bridges are listed explicitly while local or sensitive state is excluded

Policy must be declared. The validator must not infer privacy from the directory name. Never ignore, replace, or relocate pre-existing project instructions until their ownership and destination have been reviewed with the user.

## Structure rule

Every file must have one responsibility and a clear update event. If two files explain or record the same fact, remove one or turn it into a simple index.

`CONTRACT.md` owns outcome, behavior, scope, constraints, boundaries, decisions, assumptions, dependencies, stop conditions, contract revision, and revision-bound human approval source. `BACKLOG.md` owns only task decomposition, ordering, dependency state, and decomposition review. `ACCEPTANCE.md` owns aggregate acceptance, non-regression, final verification, distinct Structured review output, human validation state when required, and integration decision. A Light unit records its proportionate review in `RESULT.md`.

`CONTRACT.md` and Structured `TASK.md` also own one stable `Execution guidance.reasoning level` field. It helps the operator judge the amount of reasoning quality the work requires, but it does not prescribe a specific model and does not replace session-transition evidence.

### Planning ownership and update events

| Concept or fact | Canonical owner | Update event |
| --- | --- | --- |
| Project frame | canonical Product, Architecture, Engineering, and Roadmap sources routed by `KNOWLEDGE_INDEX.md` | initial setup, approved global decision, or new evidence that changes project purpose, system shape, technology, platform, data, integration, or cross-cutting direction |
| Bounded-context knowledge | the mapped canonical project source, or `MODULE.md` only when that Module genuinely owns the durable local context | initial or incremental setup, approved context definition, boundary change, or evidence that invalidates the current description |
| Bounded-context coverage assessment | `PROJECT_READINESS.md` | setup assessment, Blueprint Increment, context opening or completion, or scoped setup recovery |
| Milestone outcome and ordering | canonical `ROADMAP.md` coverage | planning approval, dependency change, scope revision, or milestone closure |
| Milestone plan detail | the dedicated milestone record when one is justified; otherwise the roadmap owner | candidate addition or promotion, dependency or exit-expectation change, or milestone review |
| Delivery candidate | its owning milestone plan or roadmap planning record | planning revision, dependency result, promotion to Delivery Unit shaping, deferral, or removal before execution |
| Candidate cursor pointer | `CURRENT_CURSOR.md` | supervised selection, context-definition pause, candidate promotion to shaping, or replacement by a materialized Delivery Unit |
| Delivery Unit state and authority | the materialized `CONTRACT.md`, with aggregate closure in `ACCEPTANCE.md` for Structured units or `RESULT.md` for Light units | shaping, contract revision or approval, execution transition, verification, review, acceptance, or archive |
| Task candidate | the owning Structured `BACKLOG.md` | decomposition review, dependency result, transition assessment, materialization, reshape, or removal before execution |
| Task state and outcome | the materialized `TASK.md` and its `RESULT.md` | task materialization, transition, execution, verification, challenge, or closure |
| Current delivery scope | canonical roadmap coverage; `PROJECT_READINESS.md` assesses whether it is shapeable or executable | explicit scope selection, approved planning revision, scope completion, or impact from new evidence |
| Blueprint Increment status and impact | `PROJECT_READINESS.md` for the latest active increment; owning knowledge, roadmap, decision, contract, backlog, task, or result artifacts for durable facts and effects | new documentation, context definition, correction, replacement source, integration evidence, or scoped setup recovery |
| Queue insertion and planning revision | `ROADMAP.md` or the owning milestone plan | approved Blueprint Increment, dependency change, candidate addition, deferral, replacement of future work, or human planning decision |
| Milestone closure decision | dedicated milestone plan when present; otherwise canonical Roadmap coverage | exit-criteria review, accepted Delivery Unit reconciliation, remaining-candidate review, and required human closure decision |
| Bounded-context closure assessment | `PROJECT_READINESS.md` summarizes current posture; mapped bounded-context source and Roadmap own durable criteria and evidence | context outcome review, candidate exhaustion, required follow-up, or next-context selection |
| Completion-gap review | canonical Roadmap coverage; `CURRENT_CURSOR.md` may point to the active gap | empty queue, no eligible candidate, blocked scope, or project criteria not yet proven |
| Project vision completion criteria | canonical Product and Roadmap coverage | initial definition or explicit approved change to the declared project outcome |
| Project vision completion decision | canonical Roadmap/Product completion review | evidence-based global completion review and any required human decision; never inferred from an empty queue |

Indexes and cursors reference these owners; they do not restate or acquire
their authority. Later phases may extend templates to materialize these records,
but must preserve this ownership model.

### Canonical authority decision record

When a protected decision is persisted in repository state, its canonical record shape is:

- source: the explicit human authority reference, always `user:<decision-reference>`
- scope: the exact revision, action scope, or affected surface authorized by the decision
- rationale: the concise reason that justifies the decision
- updates: the planned or actual durable repository updates caused by the decision

The owning artifact may prefix the fields for local clarity, but it must not silently redefine the shape. Common specializations include:

- contract approval: `approval source`, `approval scope`, `approval rationale`, `approval updates`
- branch decision: `branch approval source`, branch scope via `branch`, `branch decision rationale`, `branch decision updates`
- challenge resolution: `resolution source`, resolution scope via the active task or Delivery Unit, `resolution rationale`, `resolution updates`
- human validation: `human decision source`, `human decision scope`, `human decision rationale`, `human decision updates`
- integration decision: `integration approval source`, `integration scope`, `integration rationale`, `integration updates`
- Structured closure: `closure decision source`, `closure decision scope`, `closure decision rationale`, `closure decision updates`
- protected Git action: `commit approval source` or `other action approval source`, paired with the matching local scope, rationale, and updates fields

If a protected decision is inactive or not required, the owning template may allow these fields to stay omitted or `none`, but when the decision is active the complete authority record is required.

A Light unit persists a Contract Challenge in `CONTRACT.md`; a Structured unit persists it in the affected `TASK.md`. Omit the section when no challenge occurred. The procedure and complete record shape remain owned by `OPERATING_FLOW.md`, and no dedicated challenge artifact is created.

Human Decision Briefs remain chat-only. Existing contract, acceptance, result, decision, cursor, and Git handoff fields persist only the resulting decision record; no gate or brief artifact is added.

Conditional inactive detail may be omitted only where the owning template says so. Missing challenge sections mean no challenge occurred; missing Git or human-decision detail is allowed only while the corresponding action is `none` or `not_applicable`. Open, blocked, approved, declined, or resolved states always require their complete authority and evidence record.

`RESULT.md` always records a session transition, but the owner may allow a compact stop form when no next Delivery Unit is ready and no handoff or opening prompt is needed.
