# PLAYBOOK.md

## Purpose

Define the canonical method for configuring and governing an agent-assisted software project without relying on the current conversation for state.

## Principles

1. Chat is not memory; the repository and its artifacts are memory.
2. Canonical documentation takes precedence over tasks, results, and conversations.
3. The agent does not invent missing information: it uses evidence, declares assumptions, and asks for confirmation.
4. Setup establishes a sufficient global project frame and preserves the known
   delivery direction, but materializes detailed Delivery Units and tasks only
   when their turn and evidence justify it.
5. Implementation starts only when the repository baseline and the active Delivery Unit are ready.
6. Initial context is minimal and targeted, but correctness takes precedence over token savings.
7. Every task is small, verifiable, resumable, and linked to canonical sources.
8. Semantic readiness and mechanical validation remain separate.
9. Every artifact must have a clear responsibility and update event.
10. If a workflow element does not reduce ambiguity, drift, or rework, remove it.
11. Compaction preserves an active task; a completed task should make a clean next session possible from repository state alone.
12. A supplied blueprint or chat document is intake evidence until its durable facts are approved and materialized into owning canonical sources.
13. Planning records preserve intended outcomes and ordering but never grant
    implementation authority; only an approved Delivery Contract revision does.

## Source hierarchy in the target project

1. `AGENTS.md`
2. workflow configuration and readiness
3. canonical project documentation
4. decisions and ADRs
5. current Delivery Unit contract, task, and acceptance
6. results and operational history
7. unmaterialized intake evidence and conversations

A lower source cannot implicitly change a decision defined by a higher source.

## Workflow model

### Configuration

Transforms a supplied or synthesized blueprint, documentation, user answers, and codebase evidence into:

- a sufficient global project frame
- navigable canonical sources
- explicit coverage from intake evidence to owning project documents
- explicit bounded-context coverage without requiring every context to be
  fully defined
- a proportionate plan for known milestones and delivery outcomes
- explicit decisions
- a project-proportionate profile
- verifiable readiness
- the next allowed action, and first executable work only when a delivery outcome is supplied

Configuration produces two coordinated baselines when evidence supports both:
the knowledge baseline owns navigable project truth and provenance, while the
delivery-planning baseline owns known outcome direction in canonical Roadmap
coverage. Missing planning detail remains an explicit gap; it is never inferred
from the existence of a knowledge source.

### Planning

Planning connects canonical project knowledge to future shaping without
prematurely creating executable artifacts. It may identify milestones, Delivery
candidates, and, inside an approved Structured Delivery Unit, task candidates.
Planning records describe intent, ordering, dependencies, ownership, and the
knowledge required for later shaping. They do not replace a Delivery Contract,
task contract, readiness gate, or human approval.

The known plan may cover the complete declared project vision or only the first
defined slice. New documentation may extend it later. Planning preserves
completed history, appends or reorders future work only through an explicit
revision, and leaves detailed implementation choices to just-in-time shaping.

The canonical Roadmap owns global planning authority and ordering. A dedicated
milestone plan owns local candidate detail only when that split improves
clarity. Module files may reference planning records for navigation but never
own candidate state. Delivery candidates use stable `DC` identifiers; `DU`
identifiers begin only when shaping materializes a Delivery Contract.

### Execution

Every deliverable change belongs to a Delivery Unit. Delivery Units use one of two profiles:

- `light`: one atomic outcome represented by `CONTRACT.md` and `RESULT.md`
- `structured`: one outcome decomposed into small tasks, with `CONTRACT.md`, `BACKLOG.md`, `ACCEPTANCE.md`, and task-level contracts and results

The workflow recommends the smallest sufficient profile and the user approves the Delivery Unit before implementation. A light unit must be promoted to structured when useful independent task decomposition emerges.

### State

Operational state must be:

- readable by people and agents
- reconstructable from artifacts
- aligned with Git and real work
- deliberately versioned or excluded according to project policy

### Control

- the readiness gate decides whether implementation is safe
- build and tests verify the software
- human or agent reviews evaluate quality and fitness
- the workflow validator detects mechanical drift

These controls complement rather than replace one another.

## Responsibility and authority

These are responsibilities and sequential reasoning phases, not agent personas, orchestration roles, or handoff requirements. The same LLM may perform shaping, execution, and review, but execution and review must remain distinct phases with separate recorded outputs. Human authority always belongs to the actual user.

| Responsibility | Owns | Limits and required stops |
| --- | --- | --- |
| Planning | derive the known delivery direction from canonical project knowledge; identify milestone outcomes, Delivery candidates, dependencies, ordering, required knowledge, and the current delivery scope; revise future work when new evidence or documentation arrives | a planning record is not a Delivery Unit and does not authorize implementation; planning must not invent undefined bounded-context behavior, silently reorder approved scope, or interrupt active work without evidenced impact and the required human decision |
| Shaping | analyze repository evidence and user intent; recommend a Light or Structured Delivery Unit; prepare or revise `CONTRACT.md`; define outcome, scope, boundaries, constraints, dependencies, assumptions, risks, acceptance needs, and decomposition; surface unresolved decisions | a proposal or recommendation is never approval; shaping must leave protected decisions pending until the user explicitly decides |
| Execution | implement one task at a time from the approved Delivery Contract revision; stay within approved scope and decisions; verify changes; record deviations and downstream impact | stop before an unapproved contract, scope, architecture, dependency, or policy change; challenge material repository contradictions through the rule owned by `OPERATING_FLOW.md`; never fabricate approval or silently rewrite the contract |
| Review | run a distinct post-implementation reasoning pass against the contract, acceptance, non-regressions, verification evidence, repository state, and downstream assumptions; use aggregate review for Structured units and proportionate self-review for Light units | review records findings but cannot fabricate human validation, approve protected decisions, or conceal execution deviations |
| Human authority | approve the Delivery Contract; decide unresolved product or architecture questions, material scope changes, policy exceptions, protected Git actions, and closure or integration decisions that require human judgment | authority belongs only to the actual user, never an LLM persona; the agent may recommend but must wait for explicit input and record its actual source before marking a protected decision approved; material gates use the smallest Human Decision Brief level allowed by `OPERATING_FLOW.md` |

An approval applies only to the recorded contract revision and approved scope. A material change to outcome, scope, constraints, architecture, dependencies, or protected policy invalidates that approval until the user explicitly approves the new revision. Missing human authority blocks the transition; it is never inferred from workflow state, prior approval, agent recommendation, or silence.

## Work levels

- project frame: the minimum global product and engineering model needed to
  understand the declared project vision, system shape, major components or
  bounded contexts, technology and platform direction, data and integration
  posture, cross-cutting constraints, and roadmap without fully designing every
  future slice
- bounded context: a domain or responsibility boundary recognized by canonical
  project knowledge; its coverage may be sufficient for delivery or explicitly
  remain partial or deferred
- project: the canonical product and engineering context that owns the project
  frame and bounded-context knowledge
- Module: an optional workflow navigation and ownership boundary for one stable
  bounded context or durable capability; it is not the bounded context itself
  and need not exist merely because a bounded context is known
- milestone: an optional planning-only grouping for related delivery outcomes
  that contribute to one broader result
- milestone plan: the roadmap-owned or dedicated planning record that preserves
  a milestone's outcome, dependencies, required knowledge, exit expectations,
  and known Delivery candidates
- Delivery candidate: a non-executable planning record for a possible future
  delivery outcome; it has no Delivery Contract, readiness, approval, or
  implementation authority until shaping materializes it as a Delivery Unit
- Delivery Unit: the smallest user-approved, independently closable delivery outcome
- task candidate: a non-executable decomposition record inside a Structured
  Delivery Unit backlog; it becomes an executable task only after its `TASK.md`
  is materialized and its transition and authority requirements pass
- task: a small, independently verifiable step inside a structured Delivery Unit
- current delivery scope: the explicitly selected set of planned outcomes that
  the workflow is presently expected to shape and deliver; selecting it does
  not approve its future Delivery Units
- project vision completion: the evidence-based conclusion that the declared
  global project outcomes, not merely the current Delivery Unit, milestone, or
  bounded context, satisfy their recorded completion criteria

Modules organize recurring context but do not approve, execute, review, or
close work. A bounded context may be documented without a workflow Module, and
a durable technical capability may justify a Module without being a domain
bounded context. Milestones and their plans organize delivery direction but do
not replace Delivery Units, tasks, reviews, or approval gates. Delivery and task
candidates preserve future intent but remain non-executable. Product,
Architecture, Roadmap, decisions, and setup are context or control, not
Delivery Units. Every code, documentation, infrastructure, migration,
refactoring, security, or operational change that is intended for delivery
belongs to one approved Delivery Unit.

## Quality criterion

The workflow is effective when:

- a new agent reads the minimum sufficient context
- state is reconstructable without previous chat history
- task boundaries can start from a clean session without losing durable context
- missing decisions emerge before code is written
- produced artifacts are proportionate to complexity
- Product, Architecture, Engineering, and Roadmap have sufficient canonical coverage without duplicating equivalent brownfield sources
- the project frame is globally coherent while incomplete future bounded
  contexts remain explicit rather than invented
- known delivery direction survives as planning records without forcing
  premature contracts or tasks
- acceptance and verification are defined before execution
- completed work updates sources and state without duplication
- the method remains understandable without plugins or orchestrators
