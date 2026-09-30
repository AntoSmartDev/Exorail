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
- readiness evidence: `<required row> → <canonical source checked>`

## Rule

Readiness permits planning. Implementation additionally requires an active Task
with a current approved Story plan and satisfied execution-ready guards. A
sibling Task Contract is required only when that Task's resolver-derived
`contract_required` value is `required`.

Plan before you set this file to `ready`. The `Roadmap` row of
`KNOWLEDGE_INDEX.md` resolves to the Epic/Feature/Story tree and its
projections, which do not exist in a new project: building that tree is
planning, and planning is what `not_ready` still allows. What `not_ready`
stops is implementation. The order is therefore: establish the baseline
documents, plan the first Story and its Tasks, then set `readiness` to `ready`
once every required row resolves, and only then implement.

When readiness is `invalidated`, new execution cannot start until the recorded
Decision supplies evidence, affected areas, required recovery and a resolution.
Unrelated active work is not cancelled automatically.

This file is operator-maintained. The validator owns the canonical records under
`.exorail/planning/` and does not read readiness, the cursor or the knowledge
index, so nothing detects a readiness state that its evidence does not support.
The rule above binds the operator. An agent may set `readiness` to `ready`
when every required row of `KNOWLEDGE_INDEX.md` resolves, because that condition
is mechanical and checkable; record each checked row and source in `readiness
evidence` above. Readiness is a derived state, not a protected act: it permits planning and authorizes
nothing. Acceptance, approval and Decision resolution remain protected and
require `user:<decision-reference>`.
