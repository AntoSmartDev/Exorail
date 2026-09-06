# Finding reference — schema 0.2

This is the authoritative operator reference for stable validator findings.
Read the named record path first, correct the canonical artifact or generated
projection, then rerun the validator. Do not suppress a finding by editing a
projection or by weakening a predicate.

| ID | Meaning | Field or relation checked | Canonical correction |
| --- | --- | --- | --- |
| AG201 | Invalid canonical identity or parent type | `id`, record type, parent type | Use the record's canonical ID and parent. |
| AG202 | Artifact path is not canonical | Authoritative file location | Move the record to its canonical topology path. |
| AG203 | Reference is not a unique active canonical record | Context, source Result, Story or dependency reference | Point to one active canonical record. |
| AG204 | Unregistered authoritative artifact | File under an authority root | Remove it or use a registered canonical path. |
| AG205 | Duplicate canonical authority | Duplicate record ID | Keep one authoritative record. |
| AG206 | Unsupported field or YAML grammar | Front matter keys and grammar | Use the supported schema fields and YAML subset. |
| AG207 | UTF-8 BOM is prohibited | File encoding | Save UTF-8 without BOM. |
| AG208 | Timestamp must be RFC 3339 UTC | Canonical timestamp | Use a valid `YYYY-MM-DDTHH:MM:SSZ` value. |
| AG209 | Link must resolve inside `.exorail` | Markdown link target | Use a resolving internal link. |
| AG210 | Required title or body section is missing | Required front matter or heading | Restore the required value or section. |
| AG211 | Role identifier is invalid | Owner, reviewer or handoff role | Use the canonical role-id format. |
| AG212 | Risk must be low, medium, high, or critical | `risk` vocabulary | Choose one allowed risk value. |
| AG214 | Generic catch-all Story is forbidden | Story purpose and acceptance criteria | Create a specific Story with acceptance criteria. |
| AG301 | State transition is invalid | Lifecycle state and required state evidence | Use a representable lifecycle state and required record. |
| AG302 | Required Task prerequisite is missing | Contract or readiness prerequisite | Add the required current prerequisite. |
| AG303 | Completion evidence is missing or invalid | Result evidence and completion relation | Restore valid completion evidence. |
| AG304 | Future Task requires replanning | Unfinished Task revision | Replan or supersede the future Task. |
| AG305 | Timing actual is missing | Result timing actual | Record the actual timing value. |
| AG306 | Timing evidence is incoherent | Result timing order and evidence | Correct the incoherent timing data. |
| AG307 | Forecast value is invalid | Task forecast vocabulary | Use an allowed effort band and confidence. |
| AG401 | Child policy is more permissive | Inherited execution/review/verification policy | Keep the child at least as restrictive as its parent. |
| AG402 | Story review boundary is not eligible | Resolved review Policy and current authority | Select an allowed boundary and record current required authority. |
| AG403 | Parallel execution is not eligible | Parallel Task and Story eligibility | Use sequential work or make the Story eligible. |
| AG404 | Parallel dependency is unresolved | Ready/active dependency completion and integration | Wait until the upstream Task is integrated. |
| AG405 | Parallel work conflicts or lacks integration | Wave overlap and graph closeout | Separate ownership and add a graph-derived closeout. |
| AG501 | Projection is not generator-owned and current | Generated projection bytes | Regenerate projections; do not edit them. |
| AG502 | Adapter descriptor or capability activation contract is invalid | Descriptor family/capability or activation Policy | Correct the portable descriptor or fail-closed activation table. |
| AG601 | Invalid canonical authority or review confirmation | Authority reference or review confirmation | Record a valid `user:` authority at the current revision. |
| AG603 | Acceptance references or Result criterion evidence are invalid | Controlled-execution acceptance evidence | Supply valid acceptance references/evidence. |
| AG604 | Story intake, derived readiness or dependency availability is invalid | Story lifecycle and executable frontier | Complete the current plan and resolve the reported readiness guard. |
| AG605 | Resolver corroboration or exceptional Contract boundary is invalid | Change scope and Contract authority | Add corroboration and the required approved Contract. |
| AG606 | Work receipt, integration or Story outcome lifecycle is invalid | Generalized receipt ledger and aggregate review | Correct ordering, revision/attempt binding, adoption or Story acceptance. |
| AG607 | Run, external-action, Result relation or evidence lifecycle is invalid | Durable execution/action summaries | Correct the minimal lifecycle record and its Result/evidence relation. |
| AG608 | Typed Decision or Contract Challenge is invalid | Decision request or Challenge record | Use the typed record and resolve it with authority. |
| AG609 | Execution isolation or dependency unlock is invalid | Resolved isolation Policy and dependency gate | Correct isolation Policy or wait for required integration. |
| AG610 | Episode capability is disabled for a live Episode | Episode capability and live Episode relation | Enable Episode capability or remove the Episode. |
| AG620 | Task cannot enter executable work: add at least one observable acceptance criterion | `task_acceptance_criteria` on a `ready` or `active` Task | Add a concrete, observable condition of satisfaction before claiming executable work. |
| AG621 | Task cannot enter executable work: map each acceptance reference to a criterion in its parent Story | `acceptance_refs` and the parent Story's acceptance criteria | Map every Task reference to a named parent-Story criterion. |
| AG622 | Task cannot enter executable work: add a Quality gate that names verification evidence | Task `## Acceptance` and `## Quality gate` sections | State the Task-specific condition and the verification evidence that distinguishes pass from fail. |
| AG623 | Task cannot create attempt 4: record a replan, split, or human decision after attempt 3 | `execution_run` attempt count for one Task and plan revision | Stop the slice and use a Decision, replan or successor Task; do not add a fourth attempt. |
| AG624 | Task attempt sequence is not resumable | Attempt numbering and predecessor terminal state | Restore a contiguous `1..n` sequence with each prior attempt terminal. |
| AG625 | Task cannot start another attempt after a terminal result candidate | A later `execution_run` after `result_candidate` | Use the existing review/acceptance route or a Decision/replan successor Task. |
| TXT000 | Text validation could not run | Repository root, Git worktree root, or supplied input paths | Run the command from the Git worktree root and pass existing file paths. |
| TXT101 | UTF-8 BOM is present | File encoding | Save the file as UTF-8 without a byte order mark. |
| TXT102 | File is not valid UTF-8 | File encoding | Re-encode the file as UTF-8. |
| TXT103 | Line endings are mixed within a file | Line ending consistency | Normalize the file to one line ending, and record the choice in `.gitattributes`. |
| TXT201 | Mojibake marker is present | Text content after a lossy re-encoding | Restore the text from its original encoding rather than editing the damaged characters. |
