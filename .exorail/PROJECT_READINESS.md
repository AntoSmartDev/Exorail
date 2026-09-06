# PROJECT_READINESS.md

First-install state. Replace each source with the path that carries it, then
set `readiness` to `ready` once every required row of `KNOWLEDGE_INDEX.md`
resolves. Keep a missing source explicit rather than inventing one.

## Baseline
- readiness: `not_ready`
- product intent source: `none`
- system structure source: `none`
- context catalogue: `none | .exorail/planning/contexts/`
- engineering verification source: `none`
- invalidation Decision: `none | user:<decision-reference>`
- affected areas: `none`
- required recovery: `none`
- resolution: `none`

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
The rule above binds the operator. An agent may set `readiness` to `ready`
when every required row of `KNOWLEDGE_INDEX.md` resolves, because that condition
is mechanical and checkable; it must record which rows it checked. Readiness is
a derived state, not a protected act: it permits planning and authorizes
nothing. Acceptance, approval and Decision resolution remain protected and
require `user:<decision-reference>`.
