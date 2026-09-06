---
schema: "0.2"
id: TASK-<slug>:result
type: task_result
parent: TASK-<slug>
status: review_pending
based_on_plan_revision: 1
evidence: [<repository-relative evidence path or command result>]
# execution_run_id: RUN-<slug>-1
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
