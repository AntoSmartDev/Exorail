# Workflow validator tools

Read-only Node.js validators for a materialized Exorail workflow.

## Runtime and portability

The supported runtime is a maintained Node.js LTS release. The scripts are designed to run on Windows, Linux, and macOS; `npm` is not required to execute them once Node is
available. No public cross-platform CI matrix has executed this baseline, so this is not a claim of verified platform support. PowerShell is not part of the installed workflow runtime.

The portable contract consists of stable finding identifiers, `PASS`, `WARN`,
and `ERROR` severities, exit `0` for success, `1` for validation errors, `2`
for unsafe prerequisites, and optional JSON output. The scripts are
model-agnostic and operate only on repository-relative paths.

## Commands

From the target repository root:

```bash
node ./.exorail/tools/validate-workflow.mjs
node ./.exorail/tools/validate-text-files.mjs AGENTS.md .exorail/AGENTS.md
# Include CLAUDE.md only when the optional Claude bridge is installed:
# node ./.exorail/tools/validate-text-files.mjs AGENTS.md CLAUDE.md .exorail/AGENTS.md
```

Use `--json` for machine-readable output. To validate a non-default workflow
container, pass `--workflow-root path/to/workflow` to `validate-workflow.mjs`.

## Responsibilities

`validate-workflow.mjs` checks the root bridges, canonical workflow state,
readiness and cursor consistency, delivery artifacts, planning gates,
cross-artifact references, text integrity, and deterministic state rules.

`validate-text-files.mjs` checks supplied repository-relative text files for
UTF-8 without BOM, mixed line endings, and common mojibake markers.

These checks do not replace semantic readiness, code review, builds, tests, or
human architectural decisions. `ERROR` blocks closure; `WARN` requires review.
