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
- an accepted human decision records `user:<decision-reference>` as its actual source
- policy or process exceptions and material residual-risk acceptances record their affected scope and concise rationale; the complete Human Decision Brief remains in chat
- a `deferred` decision must be explicitly non-blocking for active or next work
- a `superseded` decision points to its replacement
- do not duplicate full ADR content here
