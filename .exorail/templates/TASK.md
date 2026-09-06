---
schema: "0.2"
id: TASK-<slug>
type: task
title: <specific executable outcome>
parent: US-<parent-slug>
status: planned
plan_revision: 1
depends_on: []
affected_paths: []
contract_required: not_required
# Optional ownership. Uncomment to populate TEAM_VIEW, which lists only records
# naming a role. Role IDs use [a-z][a-z0-9_-]*, for example delivery_owner.
# owner_role: <owner-role-id>
# reviewer_role: <reviewer-role-id>
# owner_member_id: <member-id>
# assignee_member_id: <member-id>
# reviewer_member_id: <member-id>
# Optional Task overrides — omit all three unless this Task must be at least as
# restrictive as its parent Story: execution_mode: sequential | parallel;
# verification_profile: minimal | standard | full.
# execution_mode: sequential
# verification_profile: standard
# Controlled-execution fields — copy only when a Task enters controlled work:
# execution:
#   contract: controlled-task@1
# acceptance_refs: [US-<slug>-AC-1]
# execution_isolation: parallel_safe | parallel_hunk_disjoint | sequential_only
# change_scope:
#   change_class: routine
#   risk: low
#   corroborated_paths: []
#   material_replan: false
# Optional forecast; resolved Policy may require it for selected work.
# forecast:
#   effort_band: M
#   confidence: medium
#   assumptions: []
created_at_utc: <RFC-3339 UTC>
updated_at_utc: <RFC-3339 UTC>
---

# Task: <title>

## Intent

<why this executable task is needed>

## Expected outcome

<observable implementation outcome>

## Open questions

<open decisions or write none>

<!-- Blocked Decision-record example: copy and uncomment only when this Task is blocked.
  A non-empty record states the concrete blocker, the next human or dependency
  action, and the condition that permits resumption. It records context only;
  an open typed Challenge remains in `## Decision requests` and is not repeated
  here.

  ## Decision record

  - blocker: <concrete blocker>
  - next action: <human decision or dependency action>
  - resume when: <observable resumption condition>
-->

<!-- Decision-request example: copy and uncomment only when a runtime request is needed.
  A Challenge is hosted only by its affected Task. Keep `resolution` and
  `authority_ref` empty while it is open; after human resolution both are
  required. `DECISIONS.md` is the durable project-decision register, never a
  runtime request host.

  ## Decision requests

  | request_id | kind | trigger | evidence | impact | options | recommendation | requested_decision | resolution | authority_ref | plan_revision | recorded_at_utc |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | DR-0001 | challenge | concrete_risk | Evidence observed. | Delivery impact. | Confirm or replan. | Confirm the plan. | Confirm current plan. |  |  | 1 | <RFC-3339 UTC> |
-->

## Contract requirement

`contract_required` is `not_required` for normal work. Set it to `required`
only when the approved resolver identifies an exceptional boundary; only that
case needs a sibling Task Contract before execution.

## Acceptance

<task-specific acceptance conditions>

## Execution and review

<acceptance_refs, derived execution isolation, dependencies, verification profile,
and whether human acceptance is required before Story-base integration>

## Quality gate

Run the derived verification profile and compare the implementation with every
acceptance reference. Remediate only while the attempt remains safe and within
scope, for at most three cycles. A clean result is `review_pending`, not
accepted or integrated. Stop for a typed human Decision when a blocker,
material replan, unsafe scope, missing evidence or non-convergence occurs.

## Handoff

<evidence, reviewer, review/integration route, and next workflow state>
