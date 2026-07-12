# <Bounded context or responsibility area>

## Purpose and responsibility

- context identifier:
- responsibility:
- local outcomes:
- explicitly excluded responsibilities:

## Boundaries and ownership

- owned concepts or capabilities:
- owned data:
- upstream dependencies:
- downstream consumers:
- decisions this context may make locally:
- decisions that remain global or external:

## Invariants and behavior

- invariants:
- primary flows:
- failure or compensation expectations:

## Integration and cross-cutting applicability

- inbound interactions:
- outbound interactions:
- persistence expectations:
- security expectations:
- resilience or messaging expectations:
- observability expectations:

Record only project-frame capabilities that materially constrain this context.
Do not duplicate global architecture or imply that every global capability must
be implemented in the first local outcome.

## Delivery and verification guidance

- first credible outcome:
- acceptance boundary:
- required verification layers:
- known dependencies or sequencing:

## Canonical routing and provenance

- `KNOWLEDGE_INDEX.md` rows owned:
- authoritative inputs or decisions:
- reference-only inputs:
- minimum read before this source:
- deeper sources to read only when applicable:

## Update triggers

- update when responsibility, boundary, ownership, invariant, interaction, or
  local delivery direction changes materially
- do not update for implementation detail already owned by a Delivery Unit,
  task, result, or code-local documentation

## Open questions and deferred detail

- ...
