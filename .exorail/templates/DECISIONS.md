# DECISIONS.md

## Purpose

Record operating and technical decisions that affect setup and delivery without requiring an ADR for every choice.

Use a separate ADR only for significant architectural decisions that require detailed context, alternatives, and consequences.

## States

- `proposed`: awaiting confirmation
- `accepted`: consolidated and applicable
- `deferred`: deliberately postponed and non-blocking now
- `superseded`: replaced by a later decision

## Decisions

| ID | Decision | State | Blocking | Scope | Evidence or rationale | Decision source | ADR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D001 | | proposed | yes | | | none | |

## Rules

- a `proposed` decision with `Blocking: yes` prevents readiness
- an accepted human decision records the declared
  `user:<decision-reference>` authority-reference form
- routine Decision requests record a recommendation, evidence and the requested
  human decision; material changes, exceptions, residual-risk acceptance and
  Story outcome acceptance additionally record impact, practical options and
  consequences
- a `deferred` decision must be explicitly non-blocking for active or next work
- a `superseded` decision points to its replacement
- do not duplicate full ADR content here
