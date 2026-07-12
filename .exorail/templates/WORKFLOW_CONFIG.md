# WORKFLOW_CONFIG.md

## Schema

- version: `0.5`

## Project

- mode: `unconfigured | greenfield | brownfield`
- setup profile: `core | structured`
- delivery profiles: `light | structured | light,structured`

## Agents

- primary: `codex | claude | other`
- supported: `codex,claude`

## Paths

- workflow root: `.exorail/`
- canonical docs root: `.exorail/project/`
- delivery unit root: `.exorail/delivery-units/`
- module root: `.exorail/modules/`
- archive root: `.exorail/archive/`

## State policy

- mode: `tracked | local | hybrid`
- tracked paths:
- ignored paths:
- backup requirement:

## Git policy

- approval mode: `explicit`
- approval scope: `action_specific`
- structured delivery branch: `required`
- light delivery branch: `optional`
- task commit: `propose_after_verification`
- delivery integration: `propose_after_acceptance`

## Quality commands

- build:
- test:
- lint or format:
- workflow validator:

## Optional artifacts

- context map: `enabled | disabled`
- task routing: `enabled | disabled`
- results index: `enabled | disabled`
- active constraints: `enabled | disabled`
- ready checklist: `enabled | disabled`

## Rule

Paths, enabled artifacts, and policy values in this file are authoritative for mechanical validation. Semantic readiness remains in `PROJECT_READINESS.md`.
