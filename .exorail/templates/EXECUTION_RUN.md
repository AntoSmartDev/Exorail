---
schema: "0.2"
id: RUN-<run-slug>-1
type: execution_run
work_id: TASK-<task-slug>
plan_revision: 1
attempt: 1
execution_contract: controlled-task@1
governance_input_digest: execution-governance-input@1:<sha256> # native: derive while Task is ready with tools/derive-governance-input-digest.mjs
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
