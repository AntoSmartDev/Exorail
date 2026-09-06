# Target structure

## Purpose

Record a target filesystem only when active work needs a durable ownership map.

## Areas

| Path | Responsibility | Owner/context | Constraints |
| --- | --- | --- | --- |
| | | `CTX-...` | |

## Change rule

Update this map when a Task adds, removes, splits, merges, or moves a structural
area. The Task remains owned by its User Story; a map never becomes a hierarchy
node.
