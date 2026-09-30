# Project setup — schema 0.2

## Repository prerequisites

Canonical record paths are deep: a Result under a Story with realistic slugs
runs past 200 characters before the repository root is counted. On Windows,
enable `core.longpaths` before creating canonical records, and prefer a short
repository root.

A Git mutation is a change to history, refs or the index: a commit, a tag, a
merge, a reset, a staged change. Repository-local configuration this document
requires is not one, and an agent applies it without asking. Enabling
`core.longpaths` is therefore not a decision to defer: the failure it prevents
is silent, and it stages nothing while reporting success.

Without it Git does not fail loudly. It prints `Filename too long` on stderr,
exits 0, and stages nothing from the affected subtree; `git status` then reports
a clean tree, and validation still passes because it reads the working tree and
not the index. The symptom of the missing prerequisite is therefore canonical
records that appear committed and are not. Parallel Tasks are affected first,
because their declared worktree adds a further prefix.

## Baseline

Baseline knowledge lives in `.exorail/project/` as `PRODUCT.md`,
`ENGINEERING.md` and `ARCHITECTURE.md`; `STRUCTURE_REFERENCE.md` carries the
full topology. Establish product intent, engineering verification, system constraints, and a
Context catalogue before changing readiness to ready. Map each required source
in `KNOWLEDGE_INDEX.md`; keep missing evidence explicit rather than invented.

## Local team identity

`TEAM.json` is the shared, project-local member registry. If a collaborator
wants the optional local personal view, create
`.exorail/local/identity.json` with exactly one `member_id` from that registry.
The shipped `.exorail/local/.gitignore` keeps this binding local. It is neither
authentication nor authority, and its absence never invalidates the shared
repository.

## Starting in a repository that already has code

Existing code is evidence, not backlog. Do not backfill delivered behaviour as
completed Epics, Features, Stories or Tasks: a record whose acceptance never
happened would claim evidence that does not exist. Leave what is there outside
the canonical hierarchy and describe it in the baseline knowledge documents,
which is what they are for.

An existing defect register, issue list or known-issues document is a knowledge
source. Route it from `KNOWLEDGE_INDEX.md` and cite it from the Contexts it
informs. Its entries become canonical records only when a Story takes one on,
and then as new work at the current revision.

Where existing code has no verification, say so in `ENGINEERING.md` rather than
assuming it. The first Story that touches such code carries establishing a
non-regression baseline as its own Task, or records a Decision request if the
baseline cannot be established within it. A Quality gate over untested code is
not satisfied by asserting that nothing broke.

Refine that baseline Task alone, and leave the Tasks that follow it as light
records until it completes. A sequential Story offers only its first eligible
Task, and it selects that Task by identifier order, not by the order the Story's
`## Task backlog` lists. Refining the later change first therefore hands the
slice to the very change the baseline exists to protect, and the frontier reports
the baseline as waiting on it.

## First work

A Story requires a parent Feature and a Feature requires a parent Epic, so
both exist for every Story. Keep them thin when they carry little navigation
value; do not omit them. Create a
specific User Story for the selected outcome, then materialize all intended
Tasks as light Task records. The Story carries acceptance, policy, risk,
contexts, dependencies, and `plan_revision: 1`.

Do not create pre-0.2 hierarchy or candidate records. Preserve an existing
decision in `DECISIONS.md` or an ADR.

## Readiness

Readiness permits Story planning, not implementation. A Task becomes ready only
through its approved Story plan and execution-ready guard; a Task Contract is
needed only when its resolver declares `contract_required: required`. A local
Task defect or replan does not invalidate the project baseline unless the
canonical project context is materially false. Invalidation records Decision
evidence, affected areas, recovery and resolution; it blocks new execution but
does not cancel unrelated active work.
