# WORKFLOW_CONFIG.md

## Schema

- version: `0.5`

## Project

- mode: `unconfigured`
- setup profile: `core`
- delivery profiles: `light,structured`

## Agents

- primary: `codex`
- supported: `codex,claude`

## Paths

- workflow root: `.exorail/`
- canonical docs root: `.exorail/project/`
- delivery unit root: `.exorail/delivery-units/`
- module root: `.exorail/modules/`
- archive root: `.exorail/archive/`

## State policy

- mode: `tracked`
- tracked paths: `.exorail/; AGENTS.md; CLAUDE.md`
- ignored paths: `none`
- backup requirement: `git`

## Git policy

- approval mode: `explicit`
- approval scope: `action_specific`
- structured delivery branch: `required`
- light delivery branch: `optional`
- task commit: `propose_after_verification`
- delivery integration: `propose_after_acceptance`

## Quality commands

- build: `not_configured`
- test: `not_configured`
- lint or format: `not_configured`
- workflow validator: `node .exorail/tools/validate-workflow.mjs`

## Optional artifacts

- context map: `disabled`
- task routing: `disabled`
- results index: `disabled`
- active constraints: `disabled`
- ready checklist: `disabled`

## Rule

Initial values are deliberately non-project-specific. Setup must replace inferred choices with approved project values before readiness becomes `baseline_ready` or `delivery_ready`.
