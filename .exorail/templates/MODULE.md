# MODULE.md - <module-id> - <Title>

## Identity

- module: `<module-id>`
- status: `active | deprecated`
- represented bounded context: `none | <context-id>`
- bounded-context coverage source: `PROJECT_READINESS.md | <canonical source>`

Do not copy the bounded-context maturity value here. The referenced readiness
assessment remains authoritative.

## Responsibility

Describe the stable business or system capability owned by this Module.

## Boundaries

- includes:
- excludes:

## Canonical sources

- `<path>`

## Dependencies

- allowed: `none | <module-id>,...`
- prohibited: `none | <module-id>,...`

## Invariants and checks

- invariant:
- verification:

## Global capability applicability

| Capability or constraint | Applicability | Canonical source | Local implication |
| --- | --- | --- | --- |
| | `applies_now | expected_later | not_applicable` | | |

Record only how global project-frame decisions constrain this Module. Do not
duplicate their complete architecture or claim implementation before a Delivery
Unit provides it.

## Planning references

- milestones: `none | <canonical milestone-plan paths>`
- Delivery candidates: `none | <DCxxx-name links>`

These links improve navigation. Roadmap and milestone plans own candidate state,
ordering, dependencies, and completion.

## Delivery Units

Use `delivery-units/` below this Module only when the Module is the clear owner.
Do not create folders for Delivery candidates. Link materialized active or
recent Delivery Units only when that index materially improves navigation.
