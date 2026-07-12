# KNOWLEDGE_INDEX.md

Knowledge-area states express whether a source is needed for active or next
work. They do not describe bounded-context maturity; that assessment belongs to
`PROJECT_READINESS.md`.

| Area or document | State | Minimum readiness | Input evidence | Canonical source | Blocking gap |
| --- | --- | --- | --- | --- | --- |
| Product intent | required | problem, users, outcomes, boundaries, and non-goals are sufficient for the next delivery | none | none | setup required |
| Functional flows and domain behavior | deferred | promote when active or next work depends on business flows, rules, or user journeys not already covered by Product intent | initial setup has not justified activation | none | none |
| System structure and ownership | required | relevant boundaries, ownership, and structural constraints are explicit | none | none | setup required |
| Module or bounded-context guides | deferred | promote when recurring work needs stable local ownership and invariants | initial setup has not justified activation | none | none |
| Data and persistence | deferred | promote when active or next work changes storage, schema, or transactional rules | initial setup has not justified activation | none | none |
| Integrations and messaging | deferred | promote when external or asynchronous behavior is involved | initial setup has not justified activation | none | none |
| Security and access control | deferred | promote when identity, permissions, or sensitive-data handling are in scope | initial setup has not justified activation | none | none |
| Observability and operations | deferred | promote when diagnostics, audit, runtime support, or release operations are part of the outcome | initial setup has not justified activation | none | none |
| Engineering and verification | required | stack, commands, standards, and required checks are known | none | none | setup required |
| Migration or transition plan | deferred | promote when legacy-to-target movement, staged cutover, or coexistence rules affect active or next work | initial setup has not justified activation | none | none |
| Roadmap and delivery plan | required | immediate priority and next credible outcome are known | none | none | setup required |
| Bounded-context map | required | known contexts or responsibility areas, broad boundaries, and the selected first slice are explicit | none | none | setup required |
| Target filesystem structure | deferred | setup must promote only when concrete target ownership is ambiguous | initial setup has not justified activation | none | none |
| Implementation pattern map | deferred | setup must promote only when evidence-backed pattern routing reduces repeated exploration | initial setup has not justified activation | none | none |

## Rule

This index routes all required project knowledge, not architecture alone. Setup
replaces `none` evidence and sources with reachable canonical project sources.
Deferred areas must remain explicit and non-blocking.

The `Input evidence` column preserves concise provenance from supplied files,
repository evidence, interviews, or an approved mixed set. It is not a
discovery log. `Canonical source` identifies the owning destination;
reference-only material may support provenance but never becomes a competing
owner.

When supplied or discovered documentation is large, mixed, or independently
owned, setup may propose a navigable knowledge tree so later Delivery Units read
only the topical sources they need. Canonical sources own durable project truth.
Reference-only material may inform the index and setup evidence, but it does not
satisfy a required row until an approved canonical source is mapped.

One canonical source may still satisfy several rows when ownership and update
events are shared. Promote extra rows only when they reduce ambiguity or
repeated broad rereads for future work.

Use global rows to reconstruct the project frame and add context-specific rows
such as `Bounded context: catalog` only for a defined or selected slice when a
dedicated source improves routing. Do not duplicate the bounded-context coverage
table from `PROJECT_READINESS.md` in this index.
