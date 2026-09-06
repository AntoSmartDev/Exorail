# Start a schema 0.2 project

Read `.exorail/AGENTS.md`, `.exorail/WORKFLOW_CONFIG.md`,
`.exorail/PROJECT_READINESS.md`, `.exorail/CURRENT_CURSOR.md`,
`.exorail/KNOWLEDGE_INDEX.md` and `.exorail/method/PROJECT_SETUP.md`. Establish only evidenced baseline
facts. Build the Context catalogue when domain boundaries are known.

For delivery planning, use `Epic → Feature → User Story → Task`. A Milestone
collects Stories; it is not a parent. Contexts tag work; they are not parents.
Do not create pre-0.2 hierarchy or candidate nodes.

Create a specific Story only after its outcome and acceptance criteria are
known. Populate its complete light Task backlog with acceptance references,
dependencies and intended scope. Create a detailed Task Contract only when the
resolver marks the Task `contract_required: required`; Result starts only when
the implementation is internally clean and is initially `review_pending`.

Before launch, show the proposed execution waves and ask whether to keep the
default `task` review boundary or explicitly select `story`. Record an explicit
Story-boundary choice against the current Story revision and resolved Policy;
final whole-Story review remains mandatory. A request that cannot yet be placed
stays outside the workflow until it is classified; do not materialize a record
for it.

Stop for human approval when a material Story replan, blocker, supersession,
policy exception or Contract Challenge requires a decision. Offer evidence,
impact, options and a recommendation; record protected authority only as
`user:<decision-reference>`.
