# KNOWLEDGE_INDEX.md

## States

- `required`: must be sufficient for active or next work
- `deferred`: relevant later but not blocking now
- `not_applicable`: not relevant to the current project or cycle

These states express whether a knowledge area is needed for active or next
work. They do not describe bounded-context maturity. Context maturity is owned
by the bounded-context coverage table in `PROJECT_READINESS.md`.

## Coverage layers

- global project-frame rows route purpose, system shape, ownership,
  technology, platform, data, integration, cross-cutting constraints, and
  delivery direction at the level needed by the selected slice
- bounded-context rows route the smallest canonical sources needed to
  understand one defined or currently selected slice
- one source may own both layers when its responsibility and read surface remain
  coherent; split only when ownership or recurring reads justify it

## Index

Core and active rows:

| Area or document | State | Minimum readiness | Input evidence | Canonical source | Blocking gap |
| --- | --- | --- | --- | --- | --- |
| Product intent | required | users, boundaries and next outcome are clear | | | |
| Functional flows and domain behavior | deferred | promote when active or next work depends on business flows, rules, or user journeys not already covered by Product intent | | | |
| System structure and ownership | required | relevant boundaries, ownership, and structural constraints are explicit | | | |
| Module or bounded-context guides | deferred | promote when recurring work needs stable local ownership and invariants | | | |
| Engineering and verification | required | stack, commands, standards, and required checks are known | | | |
| Migration or transition plan | deferred | promote when legacy-to-target movement, staged cutover, or coexistence rules affect active or next work | | | |
| Roadmap and delivery plan | required | immediate priority and next credible outcome are known | | | |
| Bounded-context map | required | known contexts or responsibility areas, their broad boundaries, and the selected first slice are explicit | | | |
| Target filesystem structure | deferred | promote when concrete target ownership is ambiguous | setup classification evidence | none | none |
| Implementation pattern map | deferred | promote when evidence-backed routing reduces repeated repository exploration | setup classification evidence | none | none |

Optional topical rows - include these only when their state is `required` or `deferred`. Omit them when they would only be `not_applicable`.

| Area or document | State | Minimum readiness | Input evidence | Canonical source | Blocking gap |
| --- | --- | --- | --- | --- | --- |
| Data and persistence | deferred | promote when active or next work changes data | | | |
| Integrations and messaging | deferred | promote when external or asynchronous behavior is involved | | | |
| Security and access control | deferred | promote for identity, permissions or sensitive data | | | |
| Observability and operations | deferred | promote when diagnostics, audit, runtime support, or release operations are part of the outcome | | | |

## Rule

Every `required` row must identify input evidence, a canonical source, and
either `none` or an explicit blocking gap. A row with a blocking gap prevents
readiness. Keep the two conditional structural rows and classify each with
evidence as `required`, `deferred`, or `not_applicable`; do not materialize its
file unless required.

Use `Input evidence` to preserve concise provenance: supplied source label or
path, repository evidence, interview decision reference, or an approved mixed
set. It is not a narrative discovery log. Use `Canonical source` for the single
owning destination or cohesive set; reference-only material may be named in
provenance but never presented as a second owner.

Keep the core routing rows explicit. Optional topical rows may be omitted only
when they would be merely `not_applicable` for the current cycle. If one of
those topical areas is relevant later but not blocking now, record it explicitly
as `deferred` instead of omitting it. Omission is therefore not a synonym for
`deferred`; it is only the compact form of an obviously inactive optional area.

Use the index for all canonical project knowledge, not architecture alone. When
setup proposes a knowledge tree, map each topical source to the smallest set of
rows it actually owns. Reference-only sources may remain in evidence, but
required rows must resolve to approved canonical sources.

Add context-specific routing rows such as `Bounded context: catalog` only when
the context is defined or selected and a dedicated source reduces ambiguity or
broad rereads. Do not copy the complete bounded-context coverage table here.
Outlined, deferred, unknown, and excluded context status remains a readiness
assessment; this index only records knowledge areas that active or next work
must route to.
