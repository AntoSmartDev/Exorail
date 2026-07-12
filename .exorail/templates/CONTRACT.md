# CONTRACT.md - DUXXX - <Title>

## Identity

- profile: `light | structured`
- status: `candidate | shaping | ready | active | verifying | accepted | archived | blocked`
- risk: `low | medium | high`
- milestone: `none | Mxx-name`
- owning module: `none | <module-id>`
- affected modules: `none | <comma-separated module ids>`
- branch: `<branch>`
- branch approval: `pending | approved | declined | exception_approved | not_required`
- contract revision: `1`
- approval: `pending | approved | declined`
- approval source: `none | user:<decision-reference>`
- approved contract revision: `none | 1`
- approval scope: `none | contract revision 1`
- approval rationale: `none | <concise rationale>`
- approval updates: `none | <planned or actual durable updates>`

These approval and branch-decision fields are local specializations of the canonical authority decision record defined in `STRUCTURE_REFERENCE.md`.

Add branch approval source, rationale, and updates only for `approved`, `declined`, or `exception_approved` branch decisions.

## Planning provenance

Omit only when the Delivery Unit was supplied directly by the user and did not
come from a Delivery candidate.

- delivery candidate: `none | DCxxx-name`
- candidate source: `none | <ROADMAP.md or milestone README.md path>`
- planning revision: `none | <integer>`
- selected by: `none | user:<decision-reference>`
- required knowledge used for shaping: `none | <canonical paths>`

Planning provenance explains where the outcome came from. It does not approve
this contract or implementation.

## Outcome

Describe one independently closable delivery result.

## Context and motivation

- ...

## Behavior and specifications

- ...

## Scope

### In scope

- ...

### Out of scope

- ...

## Constraints

- technical:
- non-functional:
- security-sensitive considerations: `none | <relevant constraints, trust boundary, sensitive data, auth, compliance note>`

## Execution guidance

- reasoning level: `low_reasoning | medium_reasoning | deep_reasoning`

## Affected boundaries

- ...

## Decisions

- ...

## Assumptions

- ...

## Dependencies

- `none`

## Open decisions

- `none`

## Security notes

- active security concern: `no | yes`
- trust boundary or sensitive surface: `none | <surface>`
- durable security source: `none | <canonical source or decision>`
- residual security risk to review: `none | <concise note>`

## Canonical sources

- `.exorail/PROJECT_READINESS.md`
- ...

## Stop conditions

- a blocking decision or unsupported structural assumption emerges
- scope, risk, or useful decomposition no longer matches the approved profile

## Deviation rules

- increment `contract revision` for substantive changes to outcome, scope, constraints, decisions, or dependencies
- a material revision immediately invalidates `approval`; reset approval fields until the actual user approves the new revision
- revalidate every unstarted downstream task based on an older revision
- preserve completed task history and add corrective work instead of rewriting it
- a proposal, recommendation, or agent review never supplies a `user:` decision source
- for Structured units, materialize task files just-in-time from `BACKLOG.md`;
  do not create downstream `TASK.md` files before their transition is valid

## Light execution

Complete this section only for profile `light`.

### Acceptance

- [ ] ...

### Non-regression

- [ ] ...

### Verification

- planned layers: `unit | integration | architecture | manual`
- command or manual check:
- expected evidence:
- omitted layers and rationale: `none`

### Plan and checks

1. step:
   - verify:

## Contract challenge (conditional)

For a Light Delivery Unit, omit this section when no material challenge occurred. When a challenge opens or is resolved, materialize the complete record defined by the Contract Challenge Rule. Structured units record challenges in the active `TASK.md`.
