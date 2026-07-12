# TASK_ROUTING.md - <ProjectName>

## Purpose

Define the minimum canonical reads for recurring task types.

## Routes

| Task type | Required sources | Conditional sources |
| --- | --- | --- |
| Delivery Unit shaping | candidate outcome and repository baseline | affected area docs and decisions |
| Structured task | Delivery Unit contract, backlog, acceptance, and current task | affected area docs and decisions |
| Refactoring | affected area docs and tests | ADR and dependent areas |
| Architecture | decisions and architecture sources | product, data, security and integration docs |
| Bug fix | failing evidence and affected area docs | historical result only when relevant |
| Review | acceptance, results and changed files | broader architecture for cross-boundary impact |

## Rule

Keep the table short. A task may expand its reads when evidence shows that the minimum route is insufficient.
