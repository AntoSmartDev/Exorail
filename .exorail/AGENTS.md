# AGENTS.md - Project Workflow

## Purpose

This is the canonical shared agent contract. The root `AGENTS.md` is only its fail-closed discovery bridge.

## Workflow location

- root: `.exorail/`
- configuration: `.exorail/WORKFLOW_CONFIG.md`

## Start of session

1. Read `.exorail/WORKFLOW_CONFIG.md`.
2. Read `.exorail/PROJECT_READINESS.md`.
3. Read `.exorail/CURRENT_CURSOR.md`.
4. If setup is incomplete, follow `.exorail/method/PROJECT_SETUP.md`.
5. If the cursor names a Delivery candidate and no Delivery Unit, read the
   planning source and candidate source before shaping; treat the candidate as
   non-executable until a Delivery Contract is materialized and approved.
6. If the cursor names a Blueprint Increment, follow the incremental setup
   procedure before changing roadmap, cursor, active contract, or queue order.
7. If the cursor names a task candidate and no task file, read the active
   Delivery Unit contract, `BACKLOG.md`, dependency results, and required
   sources before materializing only the current `TASK.md`.
8. Otherwise read the owning `MODULE.md` when the cursor names one, then the active Delivery Unit contract, task, and required sources when present.
9. Read `TARGET_STRUCTURE.md` or `PATTERN_MAP.md` only when its `KNOWLEDGE_INDEX.md` row is required for active or next work.

Before crossing a material workflow gate, consult only the matching row in the [Gate Loading Index](./method/OPERATING_FLOW.md#gate-loading-index), then load its referenced procedure. If applicability is uncertain, inspect the index rather than loading the complete method.

The complete responsibility and authority model is owned by `.exorail/method/PLAYBOOK.md`.

## Non-negotiable rules

- Do not implement while readiness is `not_ready` or `invalidated`.
- Use only the Canonical State Vocabulary in `.exorail/method/OPERATING_FLOW.md`; never normalize an unsupported state alias silently.
- Treat setup invalidation as a scoped baseline recovery owned by `PROJECT_READINESS.md` and `.exorail/method/PROJECT_SETUP.md`; keep local contract problems inside their Delivery Unit.
- Do not invent missing product, architecture, or delivery decisions.
- Materialize durable facts and accepted decisions in their owning repository sources.
- Require an approved Delivery Unit before implementation.
- Treat Delivery candidates, task candidates, cursor selection, and planning
  revision approval as shaping/planning evidence only, not implementation
  authority.
- Treat proposals and recommendations as unapproved until the actual user explicitly approves the current contract revision.
- Use the smallest Human Decision Brief level allowed by `.exorail/method/OPERATING_FLOW.md` only at material human-authority gates.
- Keep implementation and review as distinct phases; never represent agent review as human validation.
- Pause on a material contract mismatch and follow the Contract Challenge Rule in `.exorail/method/OPERATING_FLOW.md`; do not challenge for preference or style.
- Keep tasks small, independently verifiable, reviewable, and resumable.
- Run the transition check before every downstream task.
- Preserve unrelated worktree changes.
- Obtain explicit action-specific approval before every Git mutation.
- Run configured verification and workflow validation before closure.

## Canonical method

- setup: `.exorail/method/PROJECT_SETUP.md`
- operation: `.exorail/method/OPERATING_FLOW.md`
- invariants: `.exorail/method/WORKFLOW_RULES.md`
- structure: `.exorail/method/STRUCTURE_REFERENCE.md`
