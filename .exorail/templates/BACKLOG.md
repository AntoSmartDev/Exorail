# BACKLOG.md - DUXXX - <Title>

## Task candidates

Task candidates are backlog records, not executable tasks. Create a task folder
and `TASK.md` only for the current candidate after previous results and the
transition check are valid.

| Candidate | Outcome | Depends on | Required knowledge | Based on contract revision | State | Previous result reviewed | Transition | Materialized task |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `TC001-first-task` | | `none` | `<canonical paths>` | `1` | `planned | ready_for_materialization | materialized | completed | blocked | deferred | cancelled` | `not_applicable | yes | no` | `valid | update_required | reshape_required | blocked | not_checked` | `none | tasks/T001-first-task/TASK.md` |

## Materialized tasks

- [ ] `T001-first-task` - depends on: `none` - based on contract revision: `1`
- [ ] `T002-second-task` - depends on: `T001-first-task` - based on contract revision: `1`

## Decomposition review

- status: `pending | approved | split_required | blocked`
- reviewed at: `YYYY-MM-DD`
- single outcome per task: `yes | no`
- independently verifiable: `yes | no`
- boundaries and checks are coherent: `yes | no`
- hidden decisions: `none`
- split or merge required: `none`
- rationale:

## Resync log

Record only changes to future work caused by completed or corrective tasks.

- date:
- source task:
- changed assumptions or decisions:
- affected task candidates:
- required action: `none | update | reshape | block | defer | cancel`
- materialization decision: `none | materialize_next_task | wait`
