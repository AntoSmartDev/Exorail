# Resume a schema 0.2 workflow

Read `.exorail/AGENTS.md`, `.exorail/WORKFLOW_CONFIG.md`,
`.exorail/PROJECT_READINESS.md`, `.exorail/DECISIONS.md` and
`.exorail/KNOWLEDGE_INDEX.md`. For an empty planning workspace read
`.exorail/CURRENT_CURSOR.md`; otherwise regenerate projections and read
`.exorail/projections/RESUMPTION.md`. Then read the active Epic, Feature, Story, Task, Contract,
or Result named by the cursor. Use generated projections for orientation.

For a Task, verify parent Story `plan_revision`, dependencies, execution policy,
derived isolation, review choice, required Contract and sources before acting.
A planned Task is not executable. An internally clean Result is immutable
`review_pending` evidence, not human acceptance or integration. Do not infer
human approval; protected routes require the declared
`user:<decision-reference>` authority-reference form. The form does not by
itself attest human origin.

Resume the Story status in plain language: name active Tasks, completed Tasks
ready for review, blocked dependencies and the next recommended action. Mention
`Show details` for the full schedule and evidence. Preserve separate Task
worktrees and branches, and reconcile any manual integration before starting a
dependent Task.

If the cursor has no active Task, classify the outcome under a compatible Story
or create a specific new Story under a Feature. Do not recreate legacy hierarchy
objects. Preserve legacy records only as historical evidence.
