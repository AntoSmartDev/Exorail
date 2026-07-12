# PROJECT_READINESS.md

## Setup state

- type: `initial_setup | incremental_setup | recovery_setup`
- intake strategy: `provided_blueprint | guided_blueprint | brownfield_reconstruction`
- intake source: `chat_markdown | file | repository | interview | mixed`
- status: `not_ready | baseline_ready | delivery_ready | invalidated`
- version: `0`
- planning revision: `0 | <positive revision after planning is materialized>`
- assessed at: `YYYY-MM-DD`

## Setup invalidation

- status: `none | active | resolved`
- detected from: `none | <repository evidence or decision reference>`
- evidence: `none | <files, commands, or observed behavior>`
- affected areas: `none | <project areas>`
- affected canonical sources: `none | <paths>`
- affected delivery units: `none | DUxxx-name, ...`
- reason: `none | <why the baseline is insufficient or unreliable>`
- required recovery: `none | incremental_setup: <targeted scope> | recovery_setup: <systemic scope>`
- unaffected work assessment: `none | <work and evidence proving independence>`
- resolved by: `none | user:<decision-reference>`

## Setup invalidation history

| Detected from | Affected scope | Reason | Recovery | Resolved by |
| --- | --- | --- | --- | --- |

## Required blueprint

- source: `KNOWLEDGE_INDEX.md`
- all required entries sufficient: `yes | no`

## Project frame coverage

- global purpose and outcomes: `insufficient | sufficient`
- system shape and major boundaries: `insufficient | sufficient`
- technology, platform, data, and integration direction: `insufficient | sufficient`
- applicable cross-cutting constraints: `insufficient | sufficient`
- delivery direction and known deferrals: `insufficient | sufficient`
- evidence and canonical sources: `none | <paths and decision references>`
- blocking global gaps: `none | <gaps>`

## Bounded-context coverage

Coverage values describe context maturity and are independent from
`KNOWLEDGE_INDEX.md` area states.

| Context or responsibility area | Coverage | Responsibility and boundaries source | Dependencies | Local outcome source | Blocking gap |
| --- | --- | --- | --- | --- | --- |
| `<context-id>` | `defined | outlined | deferred | unknown | not_applicable` | `<canonical source or none>` | `none | <contexts or global decisions>` | `<canonical source or none>` | `none | <gap>` |

## Active delivery scope

- planning source: `none | <canonical ROADMAP.md path>`
- bounded context or responsibility area: `none | <context-id>`
- selected outcome: `none | <outcome>`
- selection source: `none | user:<decision-reference>`
- scope sufficient for shaping: `yes | no`
- closure assessment: `not_assessed | open | completed | gap`
- next selection required: `yes | no`
- note: selecting scope does not approve a Delivery Unit or implementation

## Post-context options

Use after a bounded context or current scope closes, or when a completion-gap
review finds no immediately executable work.

| Context or candidate | Readiness | Required action | Evidence source | Recommendation |
| --- | --- | --- | --- | --- |
| `none | <context-id or DCxxx-name>` | `defined | outlined | deferred | unknown | eligible | blocked` | `select_context | define_context | shape_candidate | blueprint_increment | stop` | `<source>` | `<why this is or is not next>` |

## Blocking gaps

- `none`

## Non-blocking unknowns

- `none`

## Blueprint increment

Use this section only for the latest incremental intake that affects current or
future project knowledge. Completed details remain in the owning knowledge,
roadmap, decision, and result artifacts; do not create a duplicate chronology.

- status: `none | proposed | approved | applied | blocked`
- source: `none | <file, chat_markdown, repository, interview, mixed>`
- classification: `none | new | extension | correction | replacement | integration`
- affected contexts: `none | <context-id>,...`
- affected canonical sources: `none | <paths>`
- planning revision impact: `none | revision_required | no_change`
- active work impact: `none | unaffected | revalidate | challenge | setup_invalidation`
- queue insertion: `none | append | before_dependents | replace_future | hold`
- decision source: `none | user:<decision-reference>`

## Brownfield evidence assessment

Use this table for `brownfield_reconstruction`. Remove the example row when recording evidence.

| Statement or area | Classification | Evidence | Confidence | Canonical destination | Blocking |
| --- | --- | --- | --- | --- | --- |
| `<material repository claim>` | `<allowed evidence classification>` | `<path, command, or user:decision-reference>` | `not_applicable`, `low`, `medium`, or `high` | `<existing or workflow-owned canonical path>` | `yes` or `no` |

## Next executable work

- delivery profile: `none | light | structured`
- milestone: `none | Mxx-name`
- delivery unit: `none | DUxxx-name`
- contract file: `none | .exorail/delivery-units/.../CONTRACT.md | .exorail/modules/.../delivery-units/.../CONTRACT.md`
- task: `none | Txxx-name`
- task file: `none | <delivery-unit-path>/tasks/.../TASK.md`
- acceptance summary:
- verification summary:

## Baseline gate

- project frame ready: `yes | no`
- slice ready: `yes | no`
- baseline ready: `yes | no`
- blocking setup decisions are resolved: `yes | no`
- delivery shaping can proceed without reconstructing the repository: `yes | no`

## Project Frame Ready gate

- global direction is sufficient for the selected slice: `yes | no`
- known global gaps are explicit and non-blocking: `yes | no`

## Slice Ready gate

- selected slice exists: `yes | no`
- selected slice coverage is `defined`: `yes | no`
- outcome, boundaries, and dependencies are sufficient: `yes | no`
- required knowledge rows are sufficient: `yes | no`

## Delivery gate

- intent and boundaries are sufficient: `yes | no`
- required decisions are resolved: `yes | no`
- required structure and ownership are clear: `yes | no`
- required blueprint entries are sufficient: `yes | no`
- contract is approved: `yes | no`
- work requires no implicit structural decision: `yes | no`
- decomposition review is approved: `yes | no | not_applicable`
- acceptance and verification are concrete: `yes | no`

## Decision

- baseline ready: `yes | no`
- ready to implement: `yes | no`
- reason:
- next setup action:

## Rule

Project Frame Ready and Slice Ready are diagnostic sub-gates owned by the
Baseline gate. Their detailed sections record the input checks; the Baseline
gate owns the final boolean values. They are not alternative readiness states.
`baseline ready: yes` requires `project frame ready: yes`, `slice ready: yes`,
resolved blocking setup decisions, and clean-session shaping reconstruction.
`baseline_ready` means shaping may proceed but implementation may not. A
sufficient project frame without one defined slice remains `not_ready` and
routes to slice definition. Bounded-context coverage values never replace the
`KNOWLEDGE_INDEX.md` states used to route active or next knowledge.

`delivery_ready`, the baseline and Delivery gates, and `ready to implement:
yes` must agree before implementation. Completing the active scope or one
bounded context does not prove project vision completion. An active setup
invalidation requires `invalidated`, readiness decisions `no`, and cursor
routing that pauses affected work.

`closure assessment` and `Post-context options` summarize the current recovery
or next-selection posture. Roadmap and milestone sources own completion
criteria, candidate state, and closure evidence.

`planning revision` mirrors the approved revision in the canonical Roadmap; it
does not own planning authority. `planning source` identifies that owner.
