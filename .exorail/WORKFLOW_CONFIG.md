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
  - `minimal`: the Task's own acceptance criteria are demonstrated.
  - `standard`: the above, plus evidence that behaviour the Task did not intend
    to change still holds. The adopter names those checks in `ENGINEERING.md`;
    a project with no verification layer records establishing one as work.
  - `full`: the above, plus evidence across the Story's affected paths rather
    than the Task's.
- timing evidence: `optional`
- Task forecast: `optional`
- allowed execution isolation: `parallel_safe,parallel_hunk_disjoint,sequential_only`
- episode: `enabled` # deliberate: selective reusable technical memory is available by default
- Task Contract requirement: `resolver-derived; exceptional only`
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
