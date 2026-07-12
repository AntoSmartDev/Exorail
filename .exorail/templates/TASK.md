# TASK.md - TXXX - <Title>

## Identity

- delivery unit: `DUxxx-name`
- milestone: `none | Mxx-name`
- task candidate: `none | TCxxx-name`
- status: `ready | in_progress | verifying | blocked | completed`

## Contract basis

- contract: `<delivery-unit-path>/CONTRACT.md`
- based on contract revision: `1`
- depends on: `none | Txxx-name, ...`

## Transition check

- status: `valid | update_required | reshape_required | blocked`
- checked at: `YYYY-MM-DD`
- source task candidate: `none | TCxxx-name`
- previous result reviewed: `yes | no | not_applicable`
- contract revision current: `yes | no`
- dependency results reviewed: `yes | no | not_applicable`
- repository changes reviewed: `yes | no`
- decisions and canonical sources reviewed: `yes | no`
- assumptions still valid: `yes | no`
- outcome:

## Outcome

Describe one observable result.

## Scope

### In scope

- ...

### Out of scope

- ...

## Required reads

- `.exorail/PROJECT_READINESS.md`
- `<delivery-unit-path>/CONTRACT.md`
- ...

## Preconditions

- blocking decisions: `none`
- required blueprint entries:
- expected branch:
- security prerequisites: `none | <required rule, approval, secret handling, auth expectation>`

## Execution guidance

- reasoning level: `low_reasoning | medium_reasoning | deep_reasoning`

## Assumptions and trade-offs

- confirmed assumptions:
- material uncertainty: `none`
- alternative interpretations: `none`
- simpler approach considered:
- security-sensitive assumptions: `none`

## Acceptance

- [ ] ...

## Verification

- planned layers: `unit | integration | architecture | manual`
- command or manual check:
- expected evidence:
- evidence reference target:
- omitted layers and rationale: `none`

## Plan and checks

1. step:
   - verify:
2. step:
   - verify:

## Candidate changes

- ...

## Contract challenge (conditional)

Omit this section when no material challenge occurred. When a challenge opens or is resolved, materialize the complete record defined by the Contract Challenge Rule in `.exorail/method/OPERATING_FLOW.md`.

Resolution fields inside the challenge record are local specializations of the canonical authority decision record defined in `STRUCTURE_REFERENCE.md`.

## Notes

This task is the executable materialization of the named task candidate. Do not
duplicate canonical project context or future backlog items. Reference their
owning sources.
