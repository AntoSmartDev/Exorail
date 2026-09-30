---
schema: "0.2"
id: TASK-<slug>
type: task
title: <specific executable outcome>
parent: US-<parent-slug>
status: planned
plan_revision: 1
# Declare a dependency only when this Task must build on another Task's
# accepted and integrated output: each id listed holds this Task out of ready
# until that Task has a task_acceptance and a task_integration receipt. A Task
# that only has to come after another needs no dependency; the order of a
# sequential Story already places it.
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
# Optional Task overrides. Omit both, or declare both: the validator reads them
# as one pair, so a Task that sets only one is refused with AG401 even when the
# value it sets matches its Story. Declared together, each must be at least as
# restrictive as its parent Story: execution_mode: sequential | parallel;
# verification_profile: minimal | standard | full.
# execution_mode: sequential
# verification_profile: standard
# Refining to ready: uncomment all of the following together. A light planned
# Task needs none of it. A ready or active Task needs every line, and the
# validator refuses one that is missing any. Each acceptance criterion names
# something a reviewer can inspect: an output, result, report, evidence,
# response, status, file, listing, diff or assertion.
# task_acceptance_criteria: ["node test/example.test.mjs prints 0 failed in its report"]
# acceptance_refs: [US-<slug>-AC-1]
# execution:
#   contract: controlled-task@1
# execution_isolation: sequential_only
# change_scope:
#   change_class: routine
#   risk: low
#   corroborated_paths: []
#   material_replan: false
# acceptance_refs names criteria from the parent Story's Acceptance criteria.
# execution_isolation is sequential_only, parallel_safe or
# parallel_hunk_disjoint; the last also needs logical_regions. A change_class
# other than routine, a high or critical risk, or material_replan: true makes
# the Task exceptional: contract_required becomes required, and a sibling
# Contract carrying user: approval must exist before the Task starts.
# Choose routine only when none of the exceptional meanings below applies:
# externally_consequential affects an outside party or system; destructive
# removes or irreversibly changes data/capability; security_sensitive affects a
# security boundary; data_sensitive handles protected data; migration changes a
# live representation; public_api changes a published consumer contract;
# architecture changes an accepted system boundary; parallel_integration joins
# independently produced work. If the class is uncertain, do not guess a more
# severe label: open a Decision request before refining this Task.
# corroborated_paths is an array the resolver checks for shape; [] is correct
# when no corroborating path exists.
# The validator also reads three sections of the body — Contract requirement,
# Acceptance and Quality gate — so write them for this Task.
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

Run the derived verification profile and compare the implementation with every
acceptance reference. Remediate only while the attempt remains safe and within
scope, for at most three cycles. A clean result is `review_pending`, not
accepted or integrated. Stop for a typed human Decision when a blocker,
material replan, unsafe scope, missing evidence or non-convergence occurs.

## Quality gate

<commands, checks, and evidence required>

## Handoff

<evidence, reviewer, review/integration route, and next workflow state>
