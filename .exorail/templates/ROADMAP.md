# ROADMAP.md

## Project objective

- declared outcome:
- scope boundary:
- source:

## Project completion criteria

- criterion:
- evidence expected:
- status: `not_assessed | pending | satisfied | gap`

An empty queue or one completed bounded context does not satisfy these criteria
by itself.

## Planning authority

- planning revision: `0 | <positive integer>`
- decision: `pending | approved | declined`
- decision source: `none | user:<decision-reference>`
- decision scope: `none | <objective, milestones, ordering, candidates, and current scope covered>`
- decision rationale: `none | <concise rationale>`
- decision updates: `none | <durable files or records changed by this decision>`

Planning revision `0` means no materialized plan has been approved. Planning
approval authorizes direction and ordering only; it never approves a Delivery
Unit, task, implementation, validation, or Git action.

## Milestones or increments

| Milestone | Outcome | Dependencies | State | Plan source |
| --- | --- | --- | --- | --- |
| `M01-...` | | `none` | `planned | active | blocked | deferred | completed | archived | cancelled` | `this file | .exorail/project/milestones/.../README.md` |

Use dedicated milestone plans only when this table cannot clearly own required
knowledge, candidate dependencies, exit criteria, or closure evidence.

## Current delivery scope

- bounded context or responsibility area: `none | <context-id>`
- milestone or increment: `none | Mxx-name`
- selected outcome: `none | <outcome>`
- selection source: `none | user:<decision-reference>`
- rationale:
- closure status: `not_assessed | open | completed | gap`
- closure evidence: `none | <accepted DUs, milestone reviews, context review, or gaps>`

Selection identifies the planning horizon. It does not approve a Delivery Unit.

## Immediate priority

- milestone or root candidate: `none | Mxx-name | DCxxx-name`
- outcome:
- rationale:
- required knowledge:

## Root Delivery candidates (optional)

Use this table for module-owned, unowned, or cross-cutting outcomes that are not
assigned to a dedicated milestone plan.

| Candidate | Outcome | Owning Module or affected contexts | Dependencies | Required knowledge | State | Materialized as |
| --- | --- | --- | --- | --- | --- | --- |
| `DC001-...` | | `none | <module-id> | <context-id>,...` | `none | Mxx-name, DCxxx-name` | `<canonical paths>` | `planned | eligible | blocked | deferred | promoted | completed | cancelled` | `none | DUxxx-name` |

## Known future contexts and direction

| Context or area | Expected role | Planning posture | Coverage source | Related milestone |
| --- | --- | --- | --- | --- |
| | | `unplanned | planned | deferred | excluded` | `PROJECT_READINESS.md` | `none | Mxx-name` |

This table records planning posture, not bounded-context maturity. Coverage
values remain owned by `PROJECT_READINESS.md`.

## Ordering constraints

- `none | <constraint>`

## Queue policy

- default insertion: `append`
- insert before dependents when: `<dependency or blocker condition>`
- active work interruption rule: `only with evidenced material impact`
- completed work rule: `preserve history; add corrective or follow-up work`
- planning revision rule: `increment for material objective, scope, ordering, dependency, candidate, or current-scope changes`

## Blueprint increment queue impact

Record only current or latest unapplied planning impact. Persist durable facts
in the owning sources and decisions.

- increment source: `none | <source>`
- classification: `none | new | extension | correction | replacement | integration`
- affected candidates: `none | DCxxx-name,...`
- insertion decision: `none | append | before_dependents | replace_future | hold`
- active work impact: `none | unaffected | revalidate | challenge | setup_invalidation`
- planning revision target: `none | <revision>`
- decision source: `none | user:<decision-reference>`

## Deferred work

- `none | <outcome and reason>`

## Completion-gap review

Run when the queue is empty or no candidate is eligible but project completion
criteria, current scope, milestone, or bounded-context completion has not been
proven.

- status: `not_assessed | not_required | gap_found | resolved`
- empty queue or blocked surface: `none | <candidate set, milestone, context, or scope>`
- unproven criteria: `none | <criteria or gaps>`
- next required action: `none | select_context | define_context | blueprint_increment | shape_candidate | corrective_work | stop_with_rationale`
- documentation required: `none | <source or question>`
- decision source: `none | user:<decision-reference>`

## Rule

Keep this document outcome-oriented. It owns global objective, completion
criteria, planning authority, milestone ordering, and current delivery scope.
Dedicated milestone plans own their local candidate detail. Module files may
link this plan but never duplicate candidate state. Operational task state
belongs in materialized Delivery Unit artifacts and the cursor. Project vision
completion requires project completion criteria review; an empty queue is only
evidence for a completion-gap review.
