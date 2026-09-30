# Operating flow — schema 0.2

Schema 0.2 and release 0.2.0 are the canonical clean-break line. Schema 0.5
is historical public payload and schema 0.6 is retired internal design.
Neither is current, runtime-compatible or upgraded; legacy work is deliberately
reconstructed.

## Navigation

For an empty planning workspace, read `CURRENT_CURSOR.md`. When planning
contains work, regenerate projections and read `RESUMPTION.md`. Git and CI
facts are normalized Runtime observations rather than projection inputs unless
that projection explicitly declares them. Then read the
active artifact and the smallest set of knowledge sources selected by
`KNOWLEDGE_INDEX.md`. Generated views under
`.exorail/projections/` provide past/present/future navigation and are never
manual authority.

## Derived tool reference

After following the applicable lifecycle guidance below, read
`.exorail/tools/README.md` for the shipped read-only command reference. In
particular, `derive:team-view` presents declared member attribution,
`derive:review-readiness` observes Git-backed review preparation, and
`derive:review-brief` produces a non-canonical reviewer orientation artifact.
They are optional derived surfaces: none grants authority, creates a provider
side effect, or is required to execute the ordinary no-adapter path.

## Work intake

1. Place an isolated request in an existing Story only when its acceptance
   criteria match.
2. Otherwise create a specific Story under a compatible Feature; a one-Task
   Story is valid. Do not create a permanent generic catch-all Story.
3. Give the Story an outcome, acceptance criteria, risks, contexts, policy,
   dependencies, and a sufficient non-generic executable Task frontier.
4. A request that cannot yet be classified is not yet workflow state. Hold it
   outside the workflow and classify it before execution; there is no canonical
   record for unclassified intake.

An idea, blueprint, existing repository, partial documentation, migration goal
or focused interview is enough to begin Understand/Define. Establish the
smallest reliable project frame and one sufficiently defined delivery slice;
perfect up-front specification is not required. Record an unknown as a visible
gap, risk, decision or blocker and state the next question or evidence needed.
An unresolved gap never becomes implementation authority.

## Task lifecycle

`planned → ready → active → completed` is the Task lifecycle. A completed Task
has immutable Result evidence; Result `review_pending`, human acceptance and
Story integration are evidence and receipt states, not additional Task states.
Story completion is a separate whole-Story outcome. Exceptional Task states
are `blocked`, `replan-needed`, and `superseded`; their guards are defined by
the schema.

- A planned Task has a light Task definition only.
- To become ready it needs accepted dependencies, a policy-compatible
  verification plan, a non-placeholder `task_acceptance_criteria` condition,
  `acceptance_refs` mapped to the parent Story criteria, an `## Acceptance`
  explanation and a `## Quality gate` that names pass/fail evidence; it needs
  a current Contract only when `contract_required` is `required`.
- A `task_acceptance_criteria` condition is observable when it names an
  inspectable `output`, `result`, `report`, `evidence`, `receipt`, `response`,
  `status`, `artifact`, `record`, `file`, `listing`, `diff`, or `assertion`.
  It is not satisfied by the generic values `done`, `works`, `improved`,
  `tests pass`, `tbd`, `todo`, or `none`. The `## Quality gate` also names an
  evidence action: `run`, `verify`, `inspect`, `assert`, `check`, `compare`,
  `review`, or `execute`.
- A light future Task may remain `planned` without that detail. It is valid
  backlog but is not offered by the executable frontier until refined.
- Active work follows the approved scope. Perform proportionate verification
  and at most attempts `1` through `3` under one Task plan revision. Attempts
  are contiguous and terminal before another starts. A terminal
  `result_candidate` closes that slice; after three non-candidate attempts,
  record a Decision, replan or split rather than creating attempt `4`.
- ExoRail supports two dispatch paths. In the native path, derive the
  `governance_input_digest` while the Task is `ready`, then move it to `active`;
  the terminal Run is recorded when the work completes. Use the read-only
  `tools/derive-governance-input-digest.mjs` command for that native digest;
  it is not a Run identity, does not prove dispatch, and cannot repair an
  already-active native Task. The validator checks only the digest shape, so
  never invent a value. In the Runtime dispatch path, initial admission requires a `ready` Task
  with no current-revision Run; derive its envelope, create its `open` Run, then
  complete the same logical transition to `active` before validating the
  complete working tree. A retry is admitted after either path when the Task is
  `active`, its latest current-revision Run is terminal `failed`, no Run is
  open, fewer than three attempts exist, and the same current Decision,
  revision, dependency and readiness guards hold. Its digest is derived through
  retry admission while the Task is `active`. Only the Runtime path repairs an
  interrupted `open`-Run transition. A `blocked` Task with no Run returns to
  `ready`; one blocked after a failed Run returns to `active`. A blocked Task
  with an open Run receives no new admission; the Runtime must suspend that
  existing Run, which ExoRail does not itself enforce.
- If a Run is `open` after an interrupted dispatch transition, complete the
  Task transition to `active`; do not infer whether invocation began from the
  canonical records. A later attempt after `cancelled` or `abandoned` is not
  resumable on the same Task: supersede it and create a successor Task.
- A completed Task writes immutable Result evidence in `review_pending`.
  It becomes accepted only through the required human route. Human review is
  Task-level by default; a Story review boundary requires explicit current
  Story confirmation and still ends with mandatory whole-Story review.

## Canonical record status vocabularies

Record types do not share one lifecycle. Epic status is `planned`, `active`,
`completed`, `blocked`, or `superseded`. Feature status is `planned`, `active`,
`completed`, `blocked`, or `superseded`. Story status is `planned`, `ready`,
`active`, `completed`, `blocked`, `replan-needed`, or `superseded`.

Task Contract status is `ready`, `active`, or `blocked`. Context status is
`active` or `retired`. Episode status is `active`, `superseded`, or `retired`.
Milestone status is `planned`, `active`, `completed`, `blocked`, or
`superseded`. Adapter Profile status is `active` or `retired`. Execution Run
status is `open` or `terminal`. External Action status is `proposed`,
`authorized`, `applied`, `failed`, or `cancelled`. A Team member is `active`
or `inactive`. An assignee must be active while its Task is `ready` or
`active`; a member may become inactive after completed work so historical
attribution remains valid. Owner, assignee, reviewer and approval-owner fields
are routing/attribution concepts only and never supply protected `user:`
authority.

## Resuming

Each projection records the digest of its own canonical inputs, so two
projections carrying different digests is expected and is not staleness. Use
`generate-projections.mjs --check`, which is non-mutating, rather than
regenerating to find out.

Read `.exorail/projections/RESUMPTION.md` for position, then check whether the
records it describes are committed. Canonical records are durable on disk before
they are durable in history, and a projection cannot tell the difference. An
uncommitted frame is normal mid-session and is a handover risk between sessions:
report it rather than assuming either state.

## Execution receipt kinds

The Story execution receipts ledger owns receipt kinds. Record
`task_acceptance` after the required human accepts a completed Task Result;
it records Task-level acceptance. Record `task_integration` after that Task's
accepted work is integrated into its Story; dependent Tasks unlock only after
this receipt. Record `result_adoption` only when a human adopts completed Task
evidence from an earlier plan revision into the current Story plan. Record
`story_acceptance` last, after the human reviews the aggregate commit whose
ancestry contains every Task integration for the accepted boundary.

`task_integration` and `result_adoption` name an `integration_commit`.

Every kind records something that happened. A refusal is not one of them: it is
recorded as a Decision, carrying its own `user:` authority and plan revision,
and the correction that follows is new work at a new revision. The ledger says
that work was not accepted by the absence of an acceptance receipt. At the
Task boundary that absence also holds a dependant blocked; at the Story
boundary a dependant unlocks on integration alone, so it is Story completion,
not dependant unlock, that a refusal reliably prevents.

`completed` on a Task is an execution fact and is never withdrawn: the work was
done. Acceptance is a separate human fact. Refusing acceptance does not
un-complete the work, and a completed Task is never reopened in the supported
lifecycle route. The validator checks the current snapshot's lifecycle and
revision constraints. It does not by itself prove historical non-rewrite or
integrity of prior Git history.
Task-boundary acceptance uses `none` before integration. At the Story boundary,
a later `task_acceptance` repeats the exact integration commit it accepts.
`story_acceptance` always uses `none`; its aggregate belongs in `reviewed_sha`.

## Task Contract requirement

`contract_required` is `required` when the Task needs a current Task Contract for
its exceptional boundary; otherwise it is `not_required`. A required Contract
must be current before the Task becomes `ready`, `active`, or `blocked`.

## Where an open question blocks

A Challenge is hosted by its affected Task and holds that Task `blocked`, which
is reachable only from `ready` or `active`. A `planned` Task therefore cannot
host one, and a question raised while planning has no Task-level home: record it
as a `decision` on the Story, where it blocks every Task under that Story until
it is resolved.

This is deliberate and it is coarse. A question that concerns one Task stops the
others too. Where that cost is real, the answer is not to hide the question but
to split the Story so the blocked work and the independent work sit apart.

## Lifecycle transitions

A container's status follows its children rather than leading them. A Story,
Feature or Epic is `active` only while it has a child in `ready`, `active` or
`blocked`; with none it is `planned`, and `AG301` reports the mismatch. When a
Story becomes `replan-needed` its Feature and Epic return to `planned` until a
current-revision child is ready again.

A Task moves `planned` → `ready` → `active` → `completed`, and to `blocked` from
`ready` or `active`. It becomes `ready` only when its dependencies carry the
receipts named below, no Decision request affecting it is open, and its Story is
`ready` or `active`. A completed Task is never reopened: superseding work is a
new Task at a new revision.

## Change and parallel work

A change is material when it contradicts something already delivered, changes
an acceptance criterion, changes what a completed Task produced, or changes the
Task set or their dependencies. A change that only adds detail a Task was always
going to settle is not material, and is recorded in that Task.

The test is not size. If honouring the change would require editing a completed
Task, its Result or a receipt, the change is material by definition, because
those are immutable: what cannot be edited must be superseded instead.

A material replan is seven ordered actions:

1. Record the material change and its Challenge or Decision where required.
2. Increment the Story `plan_revision`.
3. Preserve completed Task, Result and receipt history at its original revision.
4. Mark each affected unfinished Task `replan-needed` or `superseded`. Use
   `superseded` when the Task's outcome no longer belongs in the plan, and
   `replan-needed` when its outcome still belongs but its inputs, dependencies
   or acceptance moved **and it has no recorded controlled attempt**. Carry
   that unattempted `replan-needed` Task to the current revision. A Task with
   one or more recorded execution attempts stays at its original revision:
   preserve that attempt history, mark the Task `superseded`, and create a
   successor Task at the current revision beginning at attempt `1`. This keeps
   the old attempt slice interpretable instead of changing its revision under
   immutable run records. A refused Task is already `completed` and this step
   still reaches it: mark it `superseded` too, because a completed Task with
   no acceptance receipt can never satisfy Story completion and would otherwise
   block it forever. Its `## Decision record` states the successor, revision,
   resolved Decision and protected authority, so the fact of delivery or the
   exhausted attempt slice survives in the record even though the status no
   longer reads `completed`.
5. Create replacement future Tasks at the current revision and update the
   backlog/dependencies.
6. Mark any knowledge source the replan invalidates as superseded in place,
   naming the revision that invalidated it, and leave replacing its content to
   the Task that now owns it. A routed source that silently contradicts the
   current plan is worse than a missing one.
7. Keep the Story `replan-needed` until a current-revision Task is ready,
   blocked or active; only then resume the Story lifecycle.

Do not rewrite historical receipts or completed Task revisions. Recompute the
executable frontier after a replan; no cached or adapter-produced frontier can
authorize work at the new revision.

A light `planned` Task carries none of the controlled execution fields.
Refining it to `ready` is what closes its contract: a `ready` or `active` Task
carries `task_acceptance_criteria` and `acceptance_refs`, and either of those
makes `execution.contract`, `change_scope` and `execution_isolation` required
too, with optional `logical_regions`. `templates/TASK.md` shows the block whole.
The supported `execution.contract` is `controlled-task@1`.
Runtime binding, workspace, branch, checkpoint and event data remain local.
`change_scope.change_class` is one of `routine`,
`externally_consequential`, `destructive`, `security_sensitive`,
`data_sensitive`, `migration`, `public_api`, `architecture`, or
`parallel_integration`; its risk is `low`, `medium`, `high`, or `critical`.
`routine` applies only when no exceptional meaning applies. An
`externally_consequential` change affects an outside party or system;
`destructive` removes or irreversibly changes data or capability;
`security_sensitive` affects a security boundary; `data_sensitive` handles
protected data; `migration` changes a live representation; `public_api`
changes a published consumer contract; `architecture` changes an accepted
system boundary; and `parallel_integration` joins independently produced work.
When the class is uncertain, open a Decision request before refining the Task;
do not select a different exceptional class merely because it is stricter.
`corroborated_paths` is required as an array for resolver consistency; an empty
list is correct when no corroborating path exists.
`execution_isolation` is `parallel_safe`, `parallel_hunk_disjoint`, or
`sequential_only`. Exceptional scope requires the current approved Task
Contract.

Parallel execution is allowed only when derived isolation and dependencies
permit it. Use a separate runtime workspace per parallel Task.
Shared files require approved logically disjoint hunks and never shared
semantic ownership. A parallel wave has at least two members and a non-parallel
graph-derived closeout: its `depends_on` lists every member of the wave. The
closeout is exempt from the wave's own closeout requirement. Add a new parallel
member and its closeout dependency in the same change. Dependencies gate only
downstream Tasks, not unrelated waves.

## Controlled-execution selection

`execution_mode` is `sequential` when Tasks must proceed in order, or
`parallel` only when the Story's derived isolation and dependencies permit a
wave. A sequential Story exposes one eligible independent Task at a time; a
parallel Story may expose only its currently eligible wave. Neither mode
changes Result review, protected acceptance, Story integration, or the
repository-native route. A sequential Story permits only sequential Task
execution-mode overrides.

`review_boundary` is `task` for the default human review of each completed
Task, or `story` only when resolved Policy permits it and
`review_mode_confirmation` carries the current declared `user:`
authority-reference form for the selected Story revision. The selected boundary
is durable lifecycle state; defaults are Policy and Task records do not
duplicate it.

`verification_profile` is `minimal`, `standard`, or `full`. A Task may keep or
strengthen its Story's verification profile, but it may not weaken it:
`minimal` < `standard` < `full`.

## Task forecast

`forecast` is optional unless resolved Policy requires it. When present, its
`effort_band` is `XS`, `S`, `M`, `L`, or `XL`, and `confidence` is `low`,
`medium`, or `high`. The two axes are independent and always validated.

## Human gates

Pause at approval, acceptance, blocker, supersession, material replan and
Contract Challenge decisions. State the evidence, impact, options,
recommendation, requested decision, consequence and next permitted action.
Protected routes require the declared `user:<decision-reference>`
authority-reference form; agent review, roles and chat labels never substitute
for the required human decision. The baseline checks that form in the current
snapshot and does not attest human origin or authenticate identity. An agent
must not add, copy or simulate a `user:` reference or receipt. Stop at the
gate, present the requested decision, and wait for the owner to issue the
reference before recording it.

## Decision request kinds

Decision request kind is `decision` for an ordinary human choice and
`challenge` for a typed Contract Challenge. Both kinds record evidence, impact,
options, recommendation and requested decision; only a Challenge uses its
frozen trigger vocabulary.

## Decision request triggers and resolutions

A `trigger` belongs only to a `challenge`, never to a `decision`. A Challenge
is hosted only by its affected `Task`, uses exactly one of
`repository_mismatch`, `unverifiable_acceptance`,
`missing_dependency_or_boundary`, `unavoidable_scope_expansion`,
`concrete_risk`, `task_not_atomic`, or
`materially_simpler_or_safer_solution`, and keeps that Task `blocked` while
the request is open. A Story with an open Decision request is not `ready`.
An open Task Challenge cannot coexist with that Task's Result or with a
`task_acceptance`, `task_integration`, or `result_adoption` receipt for it.

Resolve the request with exactly one `resolution` and its human
`authority_ref`: `plan_confirmed`, `clarification_recorded`,
`plan_revision_required`, `task_split_required`, or `blocked_or_deferred`.
`plan_confirmed`: the plan stands as written. `clarification_recorded`: the
human supplied missing content and the plan stands. `plan_revision_required`:
the answer makes the change material, so the replan above applies.
`task_split_required`: the answer separates work the current Task cannot carry
together. `blocked_or_deferred`: no answer is available now, and the affected
work waits with a named owner.

While it is open, keep both `resolution` and `authority_ref` empty; supplying
only one does not resolve it. The recorded resolution tells the adopter how
the blocked work may resume without inventing a value.

## Story execution and integration

At launch, derive `executable-frontier@1` from the current canonical records
and resolved Policy with `tools/derive-executable-frontier.mjs`. For
Story-boundary review, also verify its explicit
current authority. Then show the operator the Task names, execution waves, active
work, blocked dependencies, review choice and a `Show details` route. As each
Task completes, identify it by title and ID, say whether it is ready for
review, and offer `Approve Task` or `Synchronize integration` for a completed
manual Git merge. A dependent Task starts only after its prerequisite is
completed and its integration receipt is recorded on the prerequisite's own
Task revision.

When all Tasks are integrated, run autonomous whole-Story validation. Ask the
human to validate the Story outcome; if clean and approved, offer one optional
Story PR, naming its target when the offer is accepted; no target is configured
in advance, because a Git mutation is approved per action. A usual target
recorded in the engineering source is a suggestion to repeat back, never a
value to apply. Task PRs do not exist. A rejected external
review does not reopen completed work and does not silently revoke a recorded
approval: it is a Decision, and the correction is new work at a new plan
revision.

## Execution summaries and Result timing

The Runtime dispatch path creates one `execution_run` in `open` before
dispatch and terminalizes it exactly once as `result_candidate`, `failed`,
`cancelled`, or `abandoned`. The native path records that terminal Run at
completion. Retries create a new Runtime attempt. Progress events, checkpoints,
heartbeats, prompts, workers and retry schedules remain runtime-owned. A
controlled Result links its terminal Run; a failed or cancelled Run needs no
Result. Bind the Run to `governance_input_digest`, derived only from the
governed work envelope, consumed Policy keys, consumed capability activation
and selected descriptor identity/revision. A Policy change never silently
reinterprets the attempt.

When present, the Result `## Timing intervals` ledger uses interval kind `active`, `blocked`,
or `review_wait`. Each interval has ordered UTC start and completion times;
the interval sums reconcile to the Result's active, blocked and review-wait
minute totals.

## Adapter and external-action boundary

An Adapter Profile declares only family, contract version, descriptor revision
and namespaced capabilities. Entrypoints, provider mappings, credentials and
live bindings remain adapter-owned. Presence does not activate it. Resolve the
project capability row, ordered adapter IDs, active descriptor, binding, live
capability, conformance and health before invocation. Missing activation is
disabled; missing binding blocks only that dispatch and leaves the repository
valid. State which optional delegation is unavailable, then use the documented
native repository route when it covers the work; never invent a binding or
treat its absence as permission for a provider side effect. Only a `consequential` or `destructive`
external mutation creates `external_action`; reads and routine
non-consequential writes do not create canonical integration activity.

The standard Adapter Profile `family` values are `integration`, `execution`,
and `projection`. A standard capability is valid only for its matching family:
`integration.observe_facts@1 → integration`,
`integration.consequential_side_effect@1 → integration`,
`integration.retrieve_context@1 → integration`,
`execution.durable@1 → execution`, `execution.observe@1 → execution`,
`execution.pause_resume@1 → execution`, `execution.cancel@1 → execution`, and
`projection.render@1 → projection`.
