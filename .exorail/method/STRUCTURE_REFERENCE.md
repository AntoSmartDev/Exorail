# Structure reference — schema 0.2

Schema 0.2 and release 0.2.0 are the canonical clean-break line. Schema 0.5
is historical public payload and schema 0.6 is retired internal design.
Neither is current, runtime-compatible or upgraded; legacy work is deliberately
reconstructed.

```text
.exorail/
  planning/
    contexts/CTX-<slug>.md
    milestones/MS-<slug>/MILESTONE.md
    epics/EP-<slug>/EPIC.md
      features/FEAT-<slug>/FEATURE.md
        stories/US-<slug>/STORY.md
        stories/US-<slug>/BACKLOG.md
        stories/US-<slug>/tasks/TASK-<slug>/{TASK,CONTRACT,RESULT}.md
  episodes/EP-<four-digits>-<slug>/EPISODE.md
  runs/RUN-<slug>-<attempt>.md
  external-actions/ACT-<slug>.md
  projections/{WORK_INDEX,STORY_INDEX,MILESTONE_FORECAST,DEPENDENCY_GRAPH,TEAM_VIEW,EPISODE_INDEX,RESUMPTION}.md
  adapters/ADAPTER-<slug>.md
  TEAM.json
```

Baseline knowledge lives in `.exorail/project/`: `PRODUCT.md`,
`ENGINEERING.md`, `ARCHITECTURE.md` and the conditional artifacts they
reference. It is setup evidence routed by `KNOWLEDGE_INDEX.md`, not a canonical
record type, so no validator owns its shape.

IDs are immutable and use `EP-`, `FEAT-`, `US-`, `TASK-`, `MS-`, `CTX-`,
`ADAPTER-`, `RUN-`, or `ACT-` plus their defined lowercase slug form. Episodes
use `EP-` plus four digits and a lowercase kebab slug. Only the named files are
authoritative.
`BACKLOG.md` and every projection are generated read models. A Contract is
forbidden for a planned Task; it requires a `ready`, `active`, `blocked` or
`completed` Task. A Result is immutable completion evidence and stays
`review_pending`; receipt ordering governs review, integration, dependencies
and Story closure. A `completed` Task without a Result is invalid.

An Execution Run is a minimal durable summary of one controlled attempt, never
an event log. An External Action exists only for consequential or destructive
Integration Adapter mutations. `TEAM.json` supplies provider-neutral member
identity and lifecycle; role fields remain distinct from member attribution.
Adapter profiles are opaque portable descriptors. Entrypoints, provider
mappings, credentials, runtime bindings, checkpoints and event streams are not
canonical records.

## Episodes and projections

An Episode is an optional reusable technical fact. Its `contexts` and
`provenance.source_result` must resolve to active canonical records; a
superseded Episode names an active successor. `EPISODE_INDEX.md` is generated
from canonical Episode records in deterministic order. Regenerate projections
after an Episode change; never edit the index by hand.

This topology governs Exorail's own records. An adopter's source, tests,
documentation and build files are not part of it and are not legacy: they are
the project. Historical directories from an earlier Exorail schema version may
remain outside this topology only as evidence;
they cannot be used as source authority for new work.
