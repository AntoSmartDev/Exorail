# PATTERN_MAP.md

## Purpose and activation reason

- purpose: route recurring implementation patterns to evidence-backed representative code and tests without restating engineering standards
- activation reason: <evidence-backed reason this artifact is required>

## Evidence sources

- `current:<repository-relative-path>`

## Pattern table

| Pattern | Use when | Canonical example | Canonical tests | Constraints or invariants | Status or notes |
| --- | --- | --- | --- | --- | --- |
| <pattern> | <applicability> | `current:<path>` | `current:<path>` | <constraints> | `canonical` |

Use `legacy:<path>` only for an existing legacy example and mark that row `legacy`, never `canonical`.

## Canonical versus legacy distinction

- canonical examples represent the supported pattern for new work
- legacy examples are retained evidence or compatibility constraints, not implementation defaults
- bridge or coexistence patterns may be recorded explicitly when bluefield work
  still needs them temporarily

## Minimum readiness

- at least one active or foreseeable pattern has a representative example
- declared current and legacy paths exist
- canonical tests are linked when they exist, otherwise recorded as `none`
- exceptions and legacy examples cannot be mistaken for the standard

## Update triggers

- a canonical example or its representative tests move or change materially
- a legacy pattern becomes canonical or is retired
- implementation constraints or applicability change
