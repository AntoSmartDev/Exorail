# ACCEPTANCE.md - DUXXX - <Title>

## Verifiable outcome

- ...

## Acceptance

- [ ] ...

## Non-regression

- [ ] ...

## Verification plan

- planned layers:
- automated:
- manual:
- omitted layers and rationale: `none`

## Security review

- applicable: `yes | no`
- changed surface:
- checks or evidence:
- residual risk:
- durable follow-up or decision source: `none | <source>`

## Closure review

- review mode: `structured_aggregate`
- review status: `pending | passed | changes_required | blocked`
- contract revision reviewed: `<number>`
- task coherence:
- acceptance result:
- regressions or inconsistencies:
- executed checks:
- summary:
- evidence references:
- limitations:
- repository state:
- downstream assumptions:
- quality and simplicity:
- operational cost:
- contract impact:
- downstream revalidation result:
- follow-ups:
- human validation required: `yes | no`
- human validation status: `not_required | pending | confirmed | rejected`
- integration decision: `merge | pull_request | defer`
- integration approval: `pending | approved | declined | not_required`
- integration result: `pending | deferred | <reference>`
- final status: `accepted | rejected | follow_up_required`
- closure decision source: `none | user:<decision-reference>`
- closure decision scope: `none | contract revision <number>`
- closure decision rationale: `none | <concise rationale>`
- closure decision updates: `none | <planned or actual durable updates>`

## Post-closure routing

- milestone impact: `none | candidate_completed | milestone_review_required | milestone_closed | gap`
- bounded-context impact: `none | context_review_required | context_closed | next_context_selection_required | gap`
- current-scope impact: `none | scope_review_required | scope_completed | completion_gap`
- project-vision impact: `not_assessed | review_required | completed | gap`
- next cursor recommendation: `awaiting_context_selection | awaiting_context_definition | shaping | awaiting_delivery | completed | none`

Human validation, integration, and closure fields are local specializations of the canonical authority decision record defined in `STRUCTURE_REFERENCE.md`.

Add human decision source, scope, rationale, and updates only when human validation is required. Add integration approval source, scope, rationale, and updates only when integration is approved or declined.
