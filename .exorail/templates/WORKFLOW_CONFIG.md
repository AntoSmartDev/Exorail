# WORKFLOW_CONFIG.md

- schema: `0.2`
- workflow root: `.exorail/`
- epic root: `.exorail/planning/epics/`
- context root: `.exorail/planning/contexts/`
- milestone root: `.exorail/planning/milestones/`
- projection root: `.exorail/projections/`
- adapter root: `.exorail/adapters/`
- default execution mode: `sequential`
- default human review: `task`
- allowed review boundaries: `task,story`
- Story-boundary authority: `required`
- default verification profile: `standard`
- timing evidence: `optional`
- Task forecast: `optional`
- allowed execution isolation: `parallel_safe,parallel_hunk_disjoint,sequential_only`
- git mutation approval: `explicit action-specific`

## Capability activation

Presence does not activate an adapter. Add project-level rows only for
capabilities that may enter this workflow. Row order in `adapter_ids` is the
deterministic selection order. An absent row, or this empty table, means the
optional capability is disabled. Requirement is derived separately from the
consumer contract; it is not an activation mode.
The only activation modes are `disabled`, `manual`, and `on_demand`.

| capability | mode | adapter_ids |
| --- | --- | --- |
