# SWITCH_LLM_PROMPT.md

Use this prompt in a clean session or after compaction. The repository artifacts, not the previous chat, remain authoritative.

```text
Resume the repository workflow without relying on previous chat history.

Read root AGENTS.md, follow it to the canonical workflow contract, then locate WORKFLOW_CONFIG.md.
Read PROJECT_READINESS.md and CURRENT_CURSOR.md from the configured workflow root.
If the cursor names a Delivery candidate and no Delivery Unit, read the planning source and candidate source named by the cursor before shaping.
Read the current task and only the sources explicitly required by the cursor, candidate, Delivery Unit, or task.

Execution rule:
- anchor execution to the active task or Delivery Unit artifact
- if the cursor points to a Delivery candidate, anchor the session to supervised selection or shaping only; do not treat the candidate as a Delivery Unit
- keep the next step focused on that artifact and its required reads
- do not reconstruct missing state from prior chat if the repository does not already carry it

Report:
- readiness state
- active Delivery Unit profile
- planning revision observed and planning source, when present
- milestone, Delivery candidate, candidate source, and Delivery Unit, when present
- promotion action and next human decision, when present
- current task and status
- last stable result
- expected and actual branch
- immediate constraints
- next allowed action
- recorded session-transition recommendation

Cross-check the cursor against readiness, task, result and Git state.
If they conflict, run a read-only doctor analysis and report the inconsistency before proposing work.
If readiness is not_ready or invalidated, route to setup instead of implementation.
If readiness is baseline_ready and the cursor is awaiting_context_selection, present the known eligible candidates and context options with a recommendation, then ask for the next human choice.
If readiness is baseline_ready and the cursor is awaiting_context_definition, ask for the missing documentation or run the smallest guided interview for the chosen context.
If the planning revision observed by the cursor differs from the planning source, stop before shaping and request planning reassessment.
If the cursor names a task candidate and no task file, read the Delivery Contract, BACKLOG.md, dependency results, ACCEPTANCE.md when present, and required knowledge; materialize only the current TASK.md when the transition is valid.
If the session starts from new project documentation or a new bounded context, route to Blueprint Increment: classify the input, analyze conflicts, update owning sources, assess active-work impact, revise planning only with human approval, and append future work by default.
If the cursor names a closure target or completion gap, read PROJECT_READINESS.md, ROADMAP.md, relevant milestone plan or bounded-context source, and the latest accepted Delivery Unit evidence. Do not infer completion from an empty queue; run the relevant closure or completion-gap review and present next context/candidate options.
Expand context when the minimum set is insufficient for a supported decision.
Before editing, confirm that the recorded transition and repository state are sufficient without reconstructing the previous conversation.

If the session-transition record or the handoff guidance includes a concise carryover summary, use it only as a temporary bridge.
Do not let that summary override the contract, cursor, results, or canonical sources.
```
