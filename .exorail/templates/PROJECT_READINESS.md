# PROJECT_READINESS.md

## Baseline
- readiness: `not_ready | ready | invalidated`
- product intent source: `none | <path>`
- system structure source: `none | <path>`
- context catalogue: `none | .exorail/planning/contexts/`
- engineering verification source: `none | <path>`
- invalidation Decision: `none | user:<decision-reference>`
- affected areas: `none | <comma-separated areas>`
- required recovery: `none | <concrete recovery>`
- resolution: `none | recovered | superseded`

## Rule

Readiness permits planning. Implementation additionally requires an active Task
with a current approved Story plan and satisfied execution-ready guards. A
sibling Task Contract is required only when that Task's resolver-derived
`contract_required` value is `required`.

When readiness is `invalidated`, new execution cannot start until the recorded
Decision supplies evidence, affected areas, required recovery and a resolution.
Unrelated active work is not cancelled automatically.

This file is operator-maintained. The validator owns the canonical records under
`.exorail/planning/` and does not read readiness, the cursor or the knowledge
index, so nothing detects a readiness state that its evidence does not support.
The rule above binds the operator.
