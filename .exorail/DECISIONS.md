# DECISIONS.md

Record proposed, accepted, deferred, and superseded project decisions.

| ID | Decision | State | Scope | Evidence or rationale | Decision source | ADR |
| --- | --- | --- | --- | --- | --- | --- |

## Rules

- A proposed blocking decision prevents the affected Task from becoming ready.
- An accepted human decision records its actual `user:<reference>` source.
- A Decision request lives in its affected Story or Task, in that record's
  `## Decision requests` table. This file is the durable register of decisions,
  not a request host: a decision arrives here when it is taken.
- A recorded decision carries the recommendation, evidence and requested human
  decision from the request it resolves. Material changes, exceptions, residual-risk acceptance and
  Story outcome acceptance additionally record impact, practical options and
  consequences.
- A blocked or superseded artifact records reason, actor, UTC timestamp, and
  successor ID when applicable.
- Use an ADR for durable alternatives and consequences. An ADR is linked
  evidence, not a hierarchy node.
