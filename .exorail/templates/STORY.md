---
schema: "0.2"
id: US-<slug>
type: user_story
title: <specific user outcome>
parent: FEAT-<parent-slug>
status: planned
plan_revision: 1
risk: medium
contexts: []
# Optional ownership. Uncomment to populate TEAM_VIEW, which lists only records
# naming a role. Role IDs use [a-z][a-z0-9_-]*, for example delivery_owner.
# owner_role: <owner-role-id>
# reviewer_role: <reviewer-role-id>
# owner_member_id: <member-id>
# assignee_member_id: <member-id>
# reviewer_member_id: <member-id>
execution_mode: sequential
review_boundary: task
parallel_eligible: false
execution_policy:
  verification_profile: standard
review_mode_confirmation: none
# Copy and uncomment only when launching: review_mode_confirmation:
#   boundary: story
#   plan_revision: 1
#   confirmed_at_utc: <RFC-3339 UTC>
#   authority_ref: user:<decision-reference>
# Story-boundary review also requires approval_owner_role and must be permitted
# by resolved Policy. Member attribution never grants authority.
# Role IDs use [a-z][a-z0-9_-]*, for example delivery_owner.
# approval_owner_role: <approval-role-id>
created_at_utc: <RFC-3339 UTC>
updated_at_utc: <RFC-3339 UTC>
---

# User Story: <title>

## Description

<user and business context>

## Outcome

<observable user outcome>

## Acceptance criteria

<testable conditions of satisfaction>

## Risks

<delivery, product, or dependency risks>

## Task backlog

<ordered light Tasks, acceptance references, dependencies and intended scope>

<!-- Blocked Decision-record example: copy and uncomment only when this Story is blocked.
  A non-empty record states the concrete blocker, the next human or dependency
  action, and the condition that permits resumption. It records context only;
  it does not replace or duplicate a Task-hosted typed Challenge.

  ## Decision record

  - blocker: <concrete blocker>
  - next action: <human decision or dependency action>
  - resume when: <observable resumption condition>
-->

<!-- Decision-request example: copy and uncomment only for a Story-level Decision.
  A Story hosts ordinary `decision` rows only; a typed `challenge` belongs in
  its affected TASK.md. Keep `resolution` and `authority_ref` empty while the
  Decision is open; after human resolution both are required. `DECISIONS.md`
  is the durable project-decision register, never a runtime request host.

  ## Decision requests

  | request_id | kind | trigger | evidence | impact | options | recommendation | requested_decision | resolution | authority_ref | plan_revision | recorded_at_utc |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | DR-0001 | decision |  | Evidence observed. | Planning impact. | Confirm or replan. | Confirm the plan. | Confirm current plan. |  |  | 1 | <RFC-3339 UTC> |
-->

## Execution preflight

Before launch, show the operator the derived execution waves, dependencies,
Task isolation, review choice and next available action. `review_boundary` is
`task` by default. `story` needs current explicit human authority for this
`plan_revision` and permission from resolved Policy; it never removes the
mandatory final whole-Story review.

<!-- Execution-receipts example: copy and uncomment only after an acceptance or integration event.
  Task-boundary acceptance uses `integration_commit: none` before integration.
  At the Story boundary, a later Task acceptance repeats the exact integration
  commit it accepts. `story_acceptance` always uses `none`, and
  `story_acceptance.reviewed_sha` names the reviewed aggregate whose ancestry
  contains every Task integration. A `result_adoption` names the commit of the
  adopted work. An agent must not add, copy or simulate a `user:` reference or
  receipt: stop and wait for the owner to issue the reference before recording
  the event.

  ## Execution receipts

  | receipt_id | kind | work_id | attempt | reviewed_sha | patch_id | plan_revision | authority_ref | recorded_at_utc | integration_commit |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | ER-0001 | task_acceptance | TASK-<slug> | 1 | <sha> | <sha> | 1 | user:<decision-reference> | <RFC-3339 UTC> | none |
  | ER-0002 | task_integration | TASK-<slug> | 1 | <sha> | <sha> | 1 | user:<decision-reference> | <RFC-3339 UTC> | <sha> |
  | ER-0003 | story_acceptance | US-<slug> | 1 | <aggregate-sha> | <sha> | 1 | user:<decision-reference> | <RFC-3339 UTC> | none |
-->

## Review and delivery

Every Task is internally verified against its acceptance references before it
is reported clean. At the `task` boundary, a human accepts and integrates each
Task. At the `story` boundary, internally clean Tasks may be integrated
only under the approved policy and the human validates the complete Story.
After all Tasks are integrated, perform whole-Story review; one optional Story
PR may then be proposed, with its target named when the offer is accepted. Do
not create Task PRs.
