---
schema: "0.2"
id: RUN-<run-slug>-1
type: execution_run
work_id: TASK-<task-slug>
plan_revision: 1
attempt: 1
execution_contract: controlled-task@1
# Native route: derive while Task is ready with tools/derive-governance-input-digest.mjs.
governance_input_digest: execution-governance-input@1:<sha256>
adapter_id: none
adapter_descriptor_revision: none
external_ref: none
status: open
terminal_outcome: none
started_at_utc: <RFC-3339 UTC>
completed_at_utc: none
terminal_evidence_refs: []
result_id: none
---

# Execution Run: RUN-<run-slug>-1

## Outcome

Durable governance summary for one controlled execution attempt. Runtime
events, checkpoints, monitoring and retry schedules remain outside Core.
The governance digest covers only the normalized work and Policy inputs
actually consumed at dispatch; local binding, health and unrelated Policy are
excluded.

To close this Run as a Result candidate, set `status: terminal`,
`terminal_outcome: result_candidate`, `completed_at_utc` to the completion time
in RFC 3339 UTC (not earlier than `started_at_utc`), and `result_id` to the
corresponding Task Result's ID. For a reviewable execution binding, follow
`templates/RESULT.md`: declare `acceptance_evidence`, `execution_run_id` and
`scope_paths` together, or omit all three. When any is declared, validation
requires `acceptance_evidence` and `scope_paths`; it also requires
`execution_run_id` if the Task declares `execution.contract`. A declared Run
ID must name this terminal Run reciprocally. For `failed`,
`cancelled`, or `abandoned`, follow that terminal outcome without inventing a
Result candidate. An `open` Run keeps its terminal fields at `none`.
