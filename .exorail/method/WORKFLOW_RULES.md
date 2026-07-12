# WORKFLOW_RULES.md

## Purpose

Collect method invariants. Procedures belong in `.exorail/method/PROJECT_SETUP.md` and `.exorail/method/OPERATING_FLOW.md`.

## Memory and sources

- chat is not memory
- the repository and configured artifacts are memory
- canonical documentation is authoritative
- tasks and results reference canonical context without duplicating it
- assumptions and decisions must remain distinguishable
- supplied blueprints, attachments, and pasted Markdown are intake evidence until approved content is materialized into owning canonical sources
- inventory material intake evidence before materialization and persist approved
  provenance through knowledge routing, readiness evidence, and decisions
- use one cohesive bounded-context source by default; split local knowledge only
  for independent ownership, update cycles, or recurring read needs
- never leave a required project fact or accepted decision available only in chat
- reuse equivalent brownfield sources and prevent aggregate intake documents from competing with split canonical documents
- do not promote stale, generated, copied, contradictory, or clearly low-integrity brownfield material to canonical truth without corroboration or explicit authority

## Readiness

- require a sufficient global project frame and at least one selected `defined`
  slice before declaring the repository baseline ready for shaping
- keep bounded-context maturity separate from `KNOWLEDGE_INDEX.md` area states
- allow outlined, deferred, or unknown contexts to remain incomplete only when
  they do not force active or next work to invent a global or local decision
- treat current delivery scope as a shaping target, never as Delivery Contract
  approval or proof of project vision completion
- do not implement when a task requires implicit structural decisions
- consolidate only items required for next work
- record blocking gaps and non-blocking unknowns
- reassess setup after structural changes or when opening new areas
- do not repeat setup while the current gate remains sufficient

## Context

- start from entrypoints, cursor, the current Delivery Unit contract, and current task when present
- use routing and explicit references before reading large documents
- expand context for conflicts, regressions, cross-boundary decisions, and closure reviews
- never reduce reasoning or verification depth merely to save tokens
- use an exact context percentage only when the active client exposes reliable telemetry; label any fallback assessment as an estimate
- compaction during an active task preserves that task and requires a checkpoint when repository artifacts do not capture the current working state
- do not persist session-specific token percentages in shared workflow state
- use a short chat summary for compaction and a handoff summary only for a genuine session or LLM transition that still needs one concise temporary bridge after repository synchronization
- a next-task prompt must anchor execution to the owning task or Delivery Unit artifact and add only the minimum framing that improves reconstruction or verification

## Engineering behavior

- state material assumptions before implementation
- surface uncertainty, materially different interpretations, and relevant trade-offs instead of choosing silently
- ask only when ambiguity blocks a safe decision; otherwise declare the working assumption
- identify a simpler supported approach when one exists and push back on unnecessary complexity
- implement the minimum solution that satisfies the approved outcome
- do not add speculative features, abstractions, configurability, or failure handling without evidence or a requirement
- keep changes surgical: do not refactor, reformat, or clean adjacent code outside the active scope
- follow existing local style unless it conflicts with canonical sources, security, or an approved decision
- remove imports, variables, functions, and files made obsolete by the current change; preserve pre-existing unrelated debt
- every changed line must support the requested outcome or a necessary consequence such as tests, documentation, or induced cleanup

## Work structure

- every deliverable change belongs to a user-approved Delivery Unit
- planning direction, milestone selection, Delivery candidates, and task
  candidates never grant implementation authority
- keep Delivery candidates in their owning roadmap or milestone plan until
  shaping materializes a Delivery Unit; keep task candidates in the Structured
  backlog until their executable task is materialized
- use stable `DC` identifiers for Delivery candidates and reserve `DU`
  identifiers and directories for materialized Delivery Unit contracts
- keep candidate dependencies explicit; unmet dependencies mean `planned`,
  while `blocked` requires a distinct named gap
- require explicit planning revision authority before materially changing
  objective, current scope, milestone ordering, dependencies, or candidate set
- integrate new blueprint or context documentation through Blueprint Increment:
  classify it, analyze conflicts, update owning knowledge, assess active-work
  impact, revise planning, insert into queue, and request human approval before
  changing protected planning or delivery state
- append future work by default; insert before existing future candidates only
  when dependency or safety evidence requires it
- do not interrupt active work for new documentation unless the increment has
  evidenced material impact on the active contract, task, architecture,
  assumptions, dependency, safety posture, or verification
- use the cursor to point to the selected Delivery candidate, planning source,
  observed planning revision, required knowledge, and next human decision; do
  not copy candidate outcome, dependency tables, ordering, or state into it
- a selected Delivery candidate authorizes shaping preparation only; it is not
  a Delivery Unit until `CONTRACT.md` is materialized, and it is not executable
  until the resulting contract revision is approved
- materialize a Delivery Unit contract from a selected Delivery candidate
  just-in-time; record planning provenance but keep contract approval pending
- for Structured Delivery Units, keep future work as task candidates in
  `BACKLOG.md` and materialize only the current `TASK.md` after previous
  results, contract revision, dependency state, and transition evidence are
  valid
- after a bounded context or current scope closes, present eligible candidates,
  outlined contexts, deferred contexts, missing documentation, and the
  recommended next choice before changing the cursor
- do not close a milestone, bounded context, current delivery scope, or project
  vision from an empty queue alone; run the corresponding closure or
  completion-gap review and record required human authority where applicable
- a bounded context belongs to canonical project knowledge; create a workflow
  Module only when recurring ownership and navigation justify it
- current delivery scope selects what the workflow should shape and deliver but
  does not pre-approve any contained Delivery Unit
- Modules are optional stable ownership boundaries; they never replace Delivery Units or add an execution gate
- place a Delivery Unit inside a Module only when that Module is its clear owner; keep unowned and cross-module units in the configured root Delivery Unit directory
- physical placement, owning Module, and affected-Module references must agree
- use the smallest Human Decision Brief level allowed by `OPERATING_FLOW.md` only at material human-authority gates; discussion, recommendation, and silence never satisfy approval
- batched human review is a presentation optimization only; each decision still requires explicit human authority in its own scope
- use a light Delivery Unit for one atomic outcome and one coherent verification boundary
- use a structured Delivery Unit for multiple dependent steps, boundaries, verification modes, sessions, or medium/high risk
- promote light to structured when useful decomposition emerges
- require a decomposition review before approving structured work; `split_required` blocks implementation
- keep tasks small enough to reason about, verify independently, review confidently, and resume safely
- avoid both monolithic tasks and artificial splits that create unverifiable intermediate states
- review downstream work after every stable result
- use completed task results to update, reshape, block, defer, or cancel future
  task candidates before materializing the next task
- responsibility and authority follow the canonical matrix in `.exorail/method/PLAYBOOK.md`; they are phases, not personas
- do not absorb unrelated refactoring into active scope

## State

- `CURRENT_CURSOR.md` is an operational pointer, not a second roadmap
- the cursor must be reconstructable from tasks, results, and configuration
- when the cursor points to planning work, it must be reconstructable from the
  planning source and candidate source, not from chat memory
- `awaiting_context_selection` and `awaiting_context_definition` are pauses
  before shaping; they cannot retain an active Delivery Unit or task
- one operator owns active cursor mutation at a time; handoff is sequential, not concurrent
- every real state change updates the relevant artifacts
- omit documented conditional detail when its controlling state is inactive; never use omission to hide an open, blocked, approved, declined, or resolved decision
- state names and cross-artifact mappings follow the Canonical State Vocabulary in `OPERATING_FLOW.md`; unsupported aliases are errors
- tracked, local, or hybrid policy must be explicit
- do not treat the directory name as a privacy policy
- after task closure, record impact on the contract and downstream tasks, then record whether the next step should use a clean session, a handoff, the current session, or no session
- before a downstream task starts, compare the current contract revision, dependency results, repository changes, decisions, and task assumptions
- before a task candidate becomes `TASK.md`, compare the previous result,
  changed assumptions, changed decisions, repository state, contract revision,
  and required knowledge; only `valid` transition permits materialization
- transition status must be `valid`, `update_required`, `reshape_required`, or `blocked`; only `valid` permits implementation
- preserve completed task history; use a corrective task and a new contract revision rather than rewriting completed work
- preserve completed planning and delivery history when a Blueprint Increment
  arrives; update future records or add corrective work rather than rewriting
  completed outcomes
- distinguish Delivery Unit acceptance, milestone closure, bounded-context
  closure, current-scope closure, and project-vision completion; each proves a
  different level of outcome
- default to a clean session when repository artifacts are sufficient; unresolved dependence on chat indicates incomplete handoff state
- before another operator continues, synchronize the owning contract, task, result, cursor, and worktree classification; the receiving operator reconstructs from those artifacts before acting
- true concurrent multi-operator editing of one shared cursor is unsupported; if work must proceed in parallel, partition it into independent branches, workflow roots, or separately scoped Delivery Units first

## Decisions and documentation

- use a lightweight register for operational and technical decisions
- a proposal or agent recommendation is not approval
- record the actual user source for every protected human decision
- bind Delivery Contract approval to one revision; material contract changes invalidate prior approval
- bind approved planning direction to its own scope and revision without
  treating that decision as Delivery Contract approval
- keep execution and review as distinct recorded phases; review cannot stand in for human validation
- challenge an approved contract only for material evidence under `.exorail/method/OPERATING_FLOW.md`; preference and style are not challenge triggers
- use ADRs only for significant architectural decisions
- update canonical sources when the real model changes
- treat stale curated knowledge as an advisory risk even when it is not yet a blocking inconsistency
- distinguish canonical, derived, and temporary documents
- promote a note only when it becomes a stable source

## Verification

- define acceptance and verification before execution
- convert work into verifiable goals rather than vague implementation intentions
- for multi-step work, map each meaningful step to an explicit check
- record checks that were actually run
- continue until acceptance is verified, a blocker is evidenced, or repeated-failure recovery applies
- do not use the validator as a substitute for tests, review, or readiness
- deterministic errors block closure
- warnings require explicit evaluation
- an empty queue triggers completion-gap review unless project completion
  criteria are already explicitly satisfied

## Git

- classify the worktree before commit, merge, or branch change
- preserve unrelated changes
- align commits with real scope
- read-only Git inspection does not require approval
- every Git mutation requires explicit, action-specific user approval before execution
- approval for one action does not authorize a later action or materially changed scope
- every structured Delivery Unit uses a dedicated branch unless the user explicitly approves an exception
- after every verified task, propose an atomic commit and record the user's decision
- after every accepted Delivery Unit, propose merge, pull request, or deferral and record the user's decision
- never infer approval from workflow state, prior approvals, or silence

## Recovery

- after the same blocker recurs, do not repeat the same hypothesis
- preserve evidence and expand context
- materially change approach or replan
- keep local Delivery Contract invalidation separate from baseline setup invalidation
- invalidate setup only when structural evidence makes the baseline insufficient for active or next work; use the scoped recovery procedure in `PROJECT_SETUP.md`

## Tooling

- validators must be read-only
- mechanical checks must be implemented in code
- tooling must respect `WORKFLOW_CONFIG.md`
- the v0 runtime and portability contract is owned by `.exorail/tools/README.md`; keep one validator implementation
- changed text files must follow declared encoding and line-ending policy
- standard Markdown is canonical; specialized viewers remain optional

## Anti-drift gate

Before adding an artifact or rule, ask:

1. Does it reduce ambiguity, drift, or rework?
2. Does it own a responsibility not already covered?
3. Does it have a real read and update event?
4. Does the benefit justify maintenance cost?
5. Does it remain understandable without proprietary tooling?

If the answer is negative, do not introduce it.

Promote a workflow rule or validator check only from recurring observed friction, a demonstrated failure mode, or an explicit external requirement. Mechanical checks require a regression that proves the failure and the supported behavior. Do not generalize a project-specific preference into the protocol.
