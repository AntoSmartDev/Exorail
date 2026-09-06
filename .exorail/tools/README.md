# Schema 0.2 workflow tools

Read-only Node.js tooling for the canonical schema 0.2 workflow. The
authoritative hierarchy is Epic → Feature → User Story → Task; milestones are
Story collections and contexts are transversal tags.

## Commands

From the target repository root. On Windows, enable `core.longpaths` first:
canonical record paths exceed `MAX_PATH` in ordinary projects, and Git then
skips them with a stderr warning and exit code 0 while these tools, which read
the working tree, still report the workspace valid.

```bash
node ./.exorail/tools/validate-workflow.mjs
node ./.exorail/tools/generate-projections.mjs
node ./.exorail/tools/generate-projections.mjs --check
node ./.exorail/tools/derive-executable-frontier.mjs --story US-<slug>
node ./.exorail/tools/derive-review-readiness.mjs --base-sha <base> --head-sha <head> --json
node ./.exorail/tools/derive-review-brief.mjs --story US-<slug> --base-sha <base> --head-sha <head> --json
node ./.exorail/tools/derive-team-view.mjs --json
node ./.exorail/tools/derive-team-view.mjs --local --json
node ./.exorail/tools/validate-text-files.mjs AGENTS.md .exorail/AGENTS.md
```

The commands above are the ones an adopted workspace runs. The rest of this
section describes the protocol source repository and does not apply to an
adopted project, which has no `package.json` and no npm scripts.

In the protocol source repository, use `npm run verify:workflow-fixture` to
validate the maintained materialized schema 0.2 fixture. `npm run
verify:workflow` intentionally validates the current directory as a target
workspace and therefore requires a root `.exorail/` tree; it is not a source
repository self-check.

`validate-workflow.mjs` validates canonical artifact identity, topology,
front matter, policy inheritance, task prerequisites, revision, optional or
Policy-required forecast/timing, Team references, generic Adapter Profiles,
minimal Execution Runs, consequential External Actions, execution isolation,
receipt history, and generator-owned projections. It emits the stable
AG201–AG609 findings. See
`../method/FINDINGS.md` for the authoritative finding reference. `--json`
emits machine-readable findings.

`derive-executable-frontier.mjs` emits deterministic
`executable-frontier@1` JSON from canonical records and resolved Policy. It
refuses canonical state the validator rejects, reporting `workflow_invalid`
with the blocking findings; a stale generated projection is not one of them,
because a projection is derived from the records rather than an input to them.

Its two lists mean different things. `eligible` is work that may actually start
now. `blocked` is work that is relevant and may not start, and every entry
carries deterministic reasons: a Task held by its own status reports
`status_blocked`, and one whose question is open also reports
`decision_request_open`. `status_blocked` is a reason emitted by this
derivation, never a canonical status: the record's own status remains
`blocked`. Blocked work appears here rather than being omitted, so the launch
surface can say what is held and why instead of only what is free. It is
a Runtime output, never stored back into Core and never supplied by an adapter.
Its delegation capability metadata does not block the complete no-adapter path.
The shipped runtime library also exposes deterministic capability resolution,
effective-configuration explanation and governance-input digest derivation;
local bindings are passed by the host and never read from canonical state.

`generate-projections.mjs` generates the seven derived read models:
`WORK_INDEX.md`, `STORY_INDEX.md`, `MILESTONE_FORECAST.md`,
`DEPENDENCY_GRAPH.md`, `TEAM_VIEW.md`, `EPISODE_INDEX.md`, and
`RESUMPTION.md`. Projections are never authoritative; manual or stale content
is rejected as AG501.

`generate-payload-manifest.mjs` generates the schema 0.2 technical payload
inventory. It is run by maintainers during payload closeout, not by a target
workflow.

`validate-text-files.mjs` verifies UTF-8 without BOM, line-ending consistency,
and common mojibake markers for supplied repository-relative text paths. Run it
from the target Git worktree root; it rejects an arbitrary non-Git directory so
repository-relative paths cannot escape the intended project.

The installed tool runtime is Node.js. The legacy PowerShell parity helper is
kept only as historical evidence and is not an operational dependency. Adapter
families and namespaced capabilities are opaque descriptors without implicit
trust, authority, dispatch or Core access. These tools do not contact external
systems or perform provider side effects.

`derive-review-readiness.mjs` is a read-only Runtime observation for a generic
Git checkout. It requires both commits to be locally available (CI must fetch
the base and head), reports stable JSON, and compares observed change paths
conservatively with canonical Task `affected_paths`. It derives preparation
only: `ready_for_review` is never approval, authority, PR creation, merge,
publication or queue movement. Provider examples may invoke this command but
are not a runtime dependency. Patch identity uses `git patch-id --stable`; the
head SHA is used only when that identity cannot be computed.

For review after an integration receipt, take the reviewed commit from that
receipt's `reviewed_sha`; do not substitute an arbitrary current `HEAD`. When
the command reports stale readiness, regenerate it from the recorded identity,
inspect the reported scope, and replan or repeat review as needed before asking
for human acceptance. The command diagnoses preparation and provides no
authority or automated recovery.

`derive-review-brief.mjs` is a read-only Projection command. It combines the
Git-backed readiness observation with declared Task scope, Result review
context and links to canonical sources. Claim state and provenance remain
separate: Git facts are `mechanically_verified`/`git_linked`; Result context is
`agent_declared`/`declared`; open decisions are `human_decision_required`.
Its output is a rebuildable CI artifact, never a canonical review record.

`derive-team-view.mjs` is a read-only Projection query. It renders the tracked
`TEAM.json` registry and canonical member attribution without a provider,
runtime binding, authentication or authority grant. `--local` reads only the
ignored `.exorail/local/identity.json` binding and prints a useful message when
that local file is absent. It never writes a versioned projection or changes
canonical work.
