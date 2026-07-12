# Templates

Templates materialized in the target project according to the selected profile.

## Fixed Core workflow state

These files have distinct control responsibilities and are materialized for every configured project:

- `WORKFLOW_CONFIG.md`: profile, paths, state policy, Git policy, and commands
- `PROJECT_READINESS.md`: repository-baseline and Delivery Unit readiness
- `KNOWLEDGE_INDEX.md`: routes required project knowledge to canonical sources
- `DECISIONS.md`: accepted, blocking, and deferred decision authority
- `CURRENT_CURSOR_TEMPLATE.md`: materialized as the single operational pointer

## Canonical project-source alternatives

The four project-source templates below are split-source alternatives, not four mandatory files. Follow the consolidation rule in `../method/PROJECT_SETUP.md` and materialize only the sources justified by the approved coverage map.

- `PRODUCT.md`: canonical product intent and boundaries, materialized under `.exorail/project/` when no equivalent exists
- `ARCHITECTURE.md`: canonical structure and ownership, materialized under `.exorail/project/` when no equivalent exists
- `ENGINEERING.md`: canonical quality and implementation contract, materialized under `.exorail/project/` when no equivalent exists
- `ROADMAP.md`: canonical project objective, completion criteria, planning authority, milestones, current delivery scope, and root Delivery candidates, materialized under `.exorail/project/` when no equivalent exists

## Optional knowledge-tree source templates

These files support a decomposed project wiki when `KNOWLEDGE_INDEX.md` routes
to several topical sources. They are optional project-source helpers, not
required workflow state.

- `knowledge-tree/KNOWLEDGE_SOURCE_TEMPLATE.md`: generic skeleton for a decomposed canonical knowledge source
- `knowledge-tree/BOUNDED_CONTEXT.md`: cohesive local knowledge for one defined or selected bounded context, conventionally materialized under `.exorail/project/knowledge/contexts/` when no equivalent source exists
- `knowledge-tree/OVERVIEW.md`: project overview, actor map, scope, and recommended read order
- `knowledge-tree/SOLUTION_STRUCTURE.md`: system shape, boundaries, ownership, and navigation
- `knowledge-tree/MODULE_BOUNDARIES.md`: bounded contexts, responsibilities, invariants, and exclusions
- `knowledge-tree/PERSISTENCE.md`: storage, transactional rules, schemas, and ownership
- `knowledge-tree/INTEGRATIONS.md`: external systems, contracts, messaging, and failure handling
- `knowledge-tree/SECURITY.md`: trust boundaries, auth and access rules, sensitive-data handling, and relevant compliance references
- `knowledge-tree/TESTING_STRATEGY.md`: verification layers, required checks, and representative examples
- `knowledge-tree/CODING_STANDARDS.md`: implementation conventions and review-sensitive rules
- `knowledge-tree/MIGRATION.md`: transition sequencing, coexistence rules, and cutover constraints

## Delivery artifacts created on demand

- `MODULE.md`: optional stable bounded-context or capability guide, materialized only when recurring ownership justifies it
- `CONTRACT.md`: materialize only after an actual Delivery Unit outcome exists
- `RESULT.md`: materialize with its owning Delivery Unit, not as setup state

## Structured and routing additions

- `BACKLOG.md`, `ACCEPTANCE.md`, and `TASK.md`: required only for a Structured Delivery Unit
- `CONTEXT_MAP.md`, `TASK_ROUTING.md`, and `RESULTS.md`: global indexes created only when recurring navigation or result volume justifies them
- `MILESTONE_README.md`: optional milestone plan with required knowledge, exit criteria, and Delivery candidates, conventionally materialized as `.exorail/project/milestones/<milestone-id>/README.md` when `ROADMAP.md` is not sufficient

## Conditional

- `TARGET_STRUCTURE.md`: concrete target filesystem, ownership, and current-to-target delta; materialize only when its knowledge-index row is required
- `PATTERN_MAP.md`: evidence-backed canonical and legacy implementation examples; materialize only when its knowledge-index row is required
- `PROJECT_BLUEPRINT.md`: optional intake form or immutable supplied snapshot
- `ACTIVE_CONSTRAINTS_TEMPLATE.md`
- `READY_CHECKLIST_TEMPLATE.md`
- `ADR-TEMPLATE.md`
- `SESSION-TEMPLATE.md`

## Rule

Product, Architecture, Engineering, and Roadmap require canonical coverage, but one cohesive source or equivalent existing sources may satisfy several areas. Do not copy templates by default. Each conditional artifact must be required by the profile or an explicit project need.

Prefer one `BOUNDED_CONTEXT.md`-shaped source for a local slice. Split it into
data, integration, security, or other topical sources only when independent
ownership, update events, or recurring read paths justify the extra surface.

Record approved project policy exceptions in `WORKFLOW_CONFIG.md` or durable decisions rather than overriding canonical method files.
