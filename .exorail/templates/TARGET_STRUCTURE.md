# TARGET_STRUCTURE.md

## Purpose and activation reason

- purpose: describe the concrete target filesystem and ownership representation without duplicating architectural rationale
- activation reason: <evidence-backed reason this artifact is required>

## Evidence and related decisions

- evidence sources:
  - `current:<repository-relative-path>`
- related decisions:
  - `current:.exorail/DECISIONS.md`

## Relevant current structure

| Current path | Responsibility | Evidence |
| --- | --- | --- |
| `current:<path>` | <current responsibility> | <evidence> |

Use `none` when a greenfield project has no relevant current path.

## Target structure

| Target path | Responsibility | Boundary exposed |
| --- | --- | --- |
| `target:<path>` | <target responsibility> | <boundary> |

## Ownership and boundaries

- <directory or module ownership rule>

## Current-to-target delta

| Current | Target | Change |
| --- | --- | --- |
| `current:<path>` | `target:<path>` | <move, create, split, merge, or remove> |

## Migration constraints

- sequencing: <constraint or `none`>
- compatibility: <constraint or `none`>
- coexistence note: <allowed overlap between current and target or `none`>

## Deferred areas

- `none`

## Minimum readiness

- target destinations have explicit responsibilities
- current claims use `current:` and planned destinations use `target:`
- required evidence and decisions are reachable
- migration ordering required by active or next work is explicit

## Update triggers

- target ownership or boundaries change materially
- migration sequencing changes
- a Delivery Unit adds, removes, splits, merges, or moves a structural area
