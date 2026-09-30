# Structure reference — schema 0.2

Schema 0.2 and release 0.2.0 are the canonical clean-break line. Schema 0.5
is historical public payload and schema 0.6 is retired internal design.
Neither is current, runtime-compatible or upgraded; legacy work is deliberately
reconstructed.

```text
.exorail/
  project/{PRODUCT,ENGINEERING,ARCHITECTURE}.md
  planning/
    contexts/CTX-<slug>.md
    milestones/MS-<slug>/MILESTONE.md
    epics/EP-<slug>/EPIC.md
      features/FEAT-<slug>/FEATURE.md
        stories/US-<slug>/STORY.md
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
use `EP-` plus four digits and a lowercase kebab slug. Only the canonical
record files named above are authoritative; `project/`, `TEAM.json` and
`projections/` appear in the block to show where they sit and are not
canonical records. Every projection is a generated read model. A
Contract is forbidden for a planned Task; it requires a `ready`, `active`, `blocked` or
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

Templates that declare `title:` in front matter repeat that value in their
heading: the heading placeholder is a back-reference to the field already
filled, never a second value to invent. Task Contracts, Task Results,
Execution Runs and External Actions declare no `title:` field, and adding one
is refused with AG206. Their headings are prose the validator never reads: a
Contract and a Result name the Task they belong to, a Run and an External
Action their own identifier.

## Front matter grammar

Canonical records open with `---`, a block of front matter, and a closing `---`.
`tools/lib/schema-0.2.mjs` owns what that block accepts, and accepts a deliberately
small subset of YAML. These are the forms it reads; anything else is `AG206`.

- One `key: value` per line. A key is lowercase, starts with a letter, and
  continues with letters, digits or `_`.
- Values are written inline. A list is JSON flow style on one line, for example
  `contexts: [CTX-billing, CTX-invoicing]`. **A block sequence, with `- item` on
  its own line, is not read.** Neither is a multi-line or folded scalar.
- Nesting is one level deep and exactly two spaces, opened by a key with an
  empty value:

```text
execution:
  contract: controlled-task@1
```

- A key may appear once per level. A repeated key is rejected rather than
  overwritten.
- Blank lines and lines starting with `#` are ignored, so a commented example in
  a template costs nothing.
- Quoted strings keep their content, `true` and `false` are booleans, a bare
  number is a number, and everything else stays a string.

The subset is not a reduced dialect of a larger one that arrives later: it is the
grammar these records have. Write for it directly rather than expecting a general
YAML parser to be behind it.

## Optional deployment capability boundary

This section describes an **installed adopter project**, not only the shipped
`.exorail/` tree. ExoRail is repository-native and offline. An adopter may use
deployment-owned filesystem permissions, Git hooks or agent-tool configuration
to protect files; ExoRail does not enforce those controls.

| Class | Paths and meaning |
| --- | --- |
| Payload and integrity | The installed root `AGENTS.md` bridge, the `.exorail/AGENTS.md` operating contract, installed workflow documents, `method/`, `tools/`, `templates/` and `PAYLOAD_MANIFEST.json`. A deployment may protect them from unreviewed payload edits. The manifest is normally checked, not regenerated, by an adopter. |
| File-level governance | `DECISIONS.md`, `WORKFLOW_CONFIG.md`, `PROJECT_READINESS.md`, `KNOWLEDGE_INDEX.md` and `TEAM.json`. Reserving these files changes normal work: durable Decisions are recorded in `DECISIONS.md`; capability activation is written to `WORKFLOW_CONFIG.md`; readiness, knowledge routing and team state may otherwise be updated during work. |
| Adapter profiles | `adapters/` matters to this boundary only when a capability activation in `WORKFLOW_CONFIG.md` names a profile. An inactive profile alone does not activate it. A native route remains complete without an adapter; an activated profile can affect capability resolution and the governance-input digest. |
| Project state | `planning/`, `runs/`, `external-actions/` and `episodes/` are shared project records. `project/` is setup evidence routed through `KNOWLEDGE_INDEX.md`, not a canonical record type. `CURRENT_CURSOR.md` is a historical setup note once planning contains work; generated projections supply navigation then. |
| Generated outputs | `projections/` contains generated read models and may be reserved for generator ownership. |
| Local exception | `local/` is ignored by Git, machine-local and neither authentication nor authority. It is not a governance file. |

ADRs have no ExoRail-prescribed path. An adopter that wants to protect them
chooses and configures its own location.

File-level protection cannot isolate `authority_ref` values inside otherwise
ordinary work records: `STORY.md`, `TASK.md` and `EXTERNAL_ACTION` contain such
fields. An Execution Run's `governance_input_digest` is an attestation, not an
authority act. These controls are optional deployment choices. They do not
authenticate a person, prove human origin, prevent direct edits by a fully
privileged writer, or control an already-running external Runtime; they neither
require a hardened deployment nor restrict the native path.

## Episodes and projections

An Episode is an optional reusable technical fact. Its `contexts` and
`provenance.source_result` must resolve to active canonical records; a
superseded Episode names an active successor. `EPISODE_INDEX.md` is generated
from canonical Episode records in deterministic order. Regenerate projections
after an Episode change; never edit the index by hand.

This topology governs ExoRail's own records. An adopter's source, tests,
documentation and build files are not part of it and are not legacy: they are
the project. Historical directories from an earlier ExoRail schema version may
remain outside this topology only as evidence;
they cannot be used as source authority for new work.
