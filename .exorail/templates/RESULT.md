# RESULT.md - TXXX - <Title>

## Status

`PENDING | DONE | PARTIAL | BLOCKED`

## Outcome

- ...

## Acceptance evaluation

- accepted items:
- unmet items:

## Verification evidence

- executed checks:
- evidence references:
- summary:
- limitations: `none`

## Changes

- files:
- canonical documentation:
- decisions:

## Risks and follow-ups

- ...

## Workflow resync

- readiness changed: `yes | no`
- cursor updated: `yes | no`
- subsequent work reviewed: `yes | no | not_applicable`
- backlog or acceptance changes:
- closure propagation: `none | milestone_review_required | context_review_required | scope_review_required | completion_gap | project_review_required`
- next selection required: `yes | no`

## Impact assessment

- deviations from task or contract: `none`
- assumptions changed: `none`
- decisions changed: `none`
- canonical sources updated: `none`
- contract impact: `none | revision_required | blocked`
- downstream task impact: `none | update_required | reshape_required | blocked`
- downstream revalidation required: `yes | no`

## Review

Omit this section from Structured task results; aggregate review belongs to `ACCEPTANCE.md`.

- review mode: `light_self_review | not_applicable`
- review status: `pending | passed | changes_required | blocked | not_required`
- contract revision reviewed: `none | <number>`
- acceptance and non-regressions: `passed | failed | not_applicable`
- verification evidence: `sufficient | insufficient | not_applicable`
- repository state: `consistent | inconsistent | not_applicable`
- downstream assumptions: `valid | update_required | reshape_required | blocked | not_applicable`
- human validation required: `yes | no`
- human validation status: `not_required | pending | confirmed | rejected`

Human validation, commit approval, and other protected-action fields are local specializations of the canonical authority decision record defined in `STRUCTURE_REFERENCE.md`.

Add human decision source, scope, rationale, and updates only when human validation is required.

## Git handoff

- commit proposal: `pending | approved | declined | not_applicable`
- commit scope: `<outcome and files> | none`
- commit: `none | this_commit | <sha>`
- other protected action: `none | stage | amend | rebase | cherry_pick | reset | tag | push | <action>`

When commit proposal is `approved` or `declined`, add commit approval source, decision rationale, and decision updates. When another protected action is not `none`, add:

- other action decision: `none | pending | approved | declined`
- other action approval source: `none | user:<decision-reference>`
- other action scope: `none | <action and target scope>`
- other action rationale: `none | <concise rationale>`
- other action updates: `none | <planned or actual durable updates or result>`

## Session transition

- context class: `repository_sufficient | handoff_required | same_session_justified | awaiting_delivery`
- recommendation: `new_session | compact_then_continue | continue_current | stop`

Derive this recommendation from the durable repository state first, then refine
it using runtime context pressure and the recorded reasoning level from the
owning `CONTRACT.md` or `TASK.md`. Do not persist context-window percentages in
the repository.

Use a short chat summary only for `compact_then_continue`. Use a handoff
summary only when a new session still benefits from one concise temporary
bridge after durable synchronization.

Use the complete form below whenever a clean-session prompt, same-session continuation, or real handoff is needed:

- reason:
- handoff: `none | .exorail/.../SESSION.md`
- opening prompt: `SWITCH_LLM_PROMPT.md | provided_in_chat | not_applicable`

Compact stop form:

- when `context class` is `awaiting_delivery` and `recommendation` is `stop`, `reason`, `handoff`, and `opening prompt` may be omitted
- in that compact form, `handoff` is implicitly `none` and `opening prompt` is implicitly `not_applicable`
