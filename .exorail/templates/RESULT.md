---
schema: "0.2"
id: TASK-<slug>:result
type: task_result
parent: TASK-<slug>
status: review_pending
based_on_plan_revision: 1
evidence: [<repository-relative evidence path or command result>]
# Run binding — declare these three together, or none of them. They are
# optional, and they are what makes a Result observable: the Run, the
# acceptance evidence and the scope touched bind into one chain a reviewer can
# check. Record the Run and declare them whenever the execution should be tied
# to this Result. Omitting all three stays valid, and costs exactly that:
# nothing links this Result to an execution, the scope it touched is not
# stated, and `tools/derive-task-review-readiness.mjs` reports evidence_missing
# for it even after acceptance and integration.
# execution_run_id: RUN-<slug>-1
# acceptance_evidence: [US-<slug>-AC-1]
# scope_paths: [src/example.mjs]
# completed_by_member_id: <member-id>
# review_focus: [<review concern>]
# not_verified: [<explicitly unverified behavior>]
created_at_utc: <RFC-3339 UTC>
# Optional timing; resolved Policy may require it for selected work.
# timing:
#   started_at_utc: <RFC-3339 UTC>
#   completed_at_utc: <RFC-3339 UTC>
#   active_minutes: 0
#   blocked_minutes: 0
#   review_wait_minutes: 0
#   remediation_attempts: 0
---

# Task Result: <title>

## Outcome

<observable completed task outcome>

## Evidence

<commands, results, acceptance-criterion coverage, provenance and durable evidence>

## Timing

<actual duration, remediation attempts, and estimation notes>

## Timing intervals

| kind | started_at_utc | completed_at_utc |
| --- | --- | --- |

## Handoff

<internal-clean review state, integration state, and follow-up information>
