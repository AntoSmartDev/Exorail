# CURRENT_CURSOR.md

## Setup

- readiness: `not_ready`
- source: `.exorail/PROJECT_READINESS.md`

## Position

- delivery profile: `none`
- planning revision observed: `0`
- planning source: `none`
- milestone: `none`
- delivery candidate: `none`
- candidate source: `none`
- delivery unit: `none`
- owning module: `none`
- affected contexts: `none`
- blueprint increment: `none`
- closure target: `none`
- completion gap: `none`
- contract revision: `none`
- task candidate: `none`
- task: `none`
- status: `setup_required`
- expected branch: `none`

## Last stable result

- task: `none`
- result: `none`
- commit: `none`

## Next step

- action: run initial setup before shaping a Delivery Unit
- promotion action: `none`
- required knowledge: `.exorail/PROJECT_READINESS.md`, `.exorail/KNOWLEDGE_INDEX.md`, `.exorail/method/PROJECT_SETUP.md`
- next human decision: `none`
- contract file: `none`
- task file: `none`

## Required reads

- `.exorail/WORKFLOW_CONFIG.md`
- `.exorail/PROJECT_READINESS.md`
- `.exorail/KNOWLEDGE_INDEX.md`
- `.exorail/DECISIONS.md`
- `.exorail/method/PROJECT_SETUP.md`

## Immediate constraints

- do not implement before baseline and delivery readiness pass
- do not infer approval for Git mutations

## Reconstruction rule

If setup artifacts conflict with repository evidence, report the inconsistency and remain in setup.
