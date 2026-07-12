# CURRENT_CURSOR.md

## Setup

- readiness: `not_ready | baseline_ready | delivery_ready | invalidated`
- source: `.exorail/PROJECT_READINESS.md`

## Position

- delivery profile: `none | light | structured`
- planning revision observed: `0 | <positive integer>`
- planning source: `none | <canonical ROADMAP.md path | milestone README.md path>`
- milestone: `none | Mxx-name`
- delivery candidate: `none | DCxxx-name`
- candidate source: `none | <canonical ROADMAP.md path | milestone README.md path>`
- delivery unit: `none | DUxxx-name`
- owning module: `none | <module-id>`
- affected contexts: `none | <context-id>,...`
- blueprint increment: `none | <increment source or decision reference>`
- closure target: `none | delivery_unit | milestone | bounded_context | current_scope | project_vision`
- completion gap: `none | <ROADMAP completion-gap review reference or summary>`
- contract revision: `none | <number>`
- task candidate: `none | <candidate label from BACKLOG.md>`
- task: `none | Txxx-name`
- status: `setup_required | awaiting_delivery | awaiting_context_selection | awaiting_context_definition | shaping | ready | in_progress | verifying | blocked | completed`
- expected branch: `<branch>`

## Last stable result

- task: `none | Txxx-name`
- result: `none | .exorail/delivery-units/.../RESULT.md | .exorail/modules/.../delivery-units/.../RESULT.md`
- commit: `none | <sha>`

## Next step

- action:
- promotion action: `none | select_context | request_context_definition | process_blueprint_increment | promote_candidate_to_shaping | await_delivery_contract_approval | continue_delivery_unit | materialize_next_task`
- required knowledge: `none | <canonical paths needed for the next action>`
- next human decision: `none | choose next bounded context | provide context documentation | approve candidate promotion to shaping | approve Delivery Contract revision | approve milestone closure | approve current scope closure | approve project vision completion | acknowledge completion gap`
- contract file: `none | .exorail/delivery-units/.../CONTRACT.md | .exorail/modules/.../delivery-units/.../CONTRACT.md`
- task file: `none | <delivery-unit-path>/tasks/.../TASK.md`

## Required reads

- `.exorail/WORKFLOW_CONFIG.md`
- `.exorail/PROJECT_READINESS.md`
- `.exorail/CURRENT_CURSOR.md`
- `<planning source or candidate source when delivery candidate is not none>`
- `<delivery-unit-path>/tasks/.../TASK.md`

## Immediate constraints

- `none`

## Reconstruction rule

If this cursor conflicts with readiness, blueprint increment status, closure target, completion-gap review, planning source, candidate source, task, result or Git state, report the inconsistency and run `doctor`. Do not continue from the cursor alone. A cursor that names a Delivery candidate points to shaping preparation only; it is not a Delivery Unit and cannot authorize implementation.
