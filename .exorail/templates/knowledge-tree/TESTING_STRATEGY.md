# TESTING_STRATEGY.md

## Purpose

- explain how the project verifies behavior safely

## Verification layers

| Layer | Goal | Typical scope | Required when | Usually not required when | Default entrypoints or evidence |
| --- | --- | --- | --- |
| UnitTests | prove local behavior in isolation | domain logic, branching, mappers, validators, policy code | the change introduces or alters logic that can be proven without infrastructure | the change is only wiring, configuration, or another surface with no meaningful isolated behavior | |
| IntegrationTests | prove collaboration across boundaries | persistence, HTTP, messaging, filesystem, DI wiring, runtime configuration | the outcome depends on component interaction or infrastructure behavior | the change is purely local and no integration surface is affected | |
| ArchitectureTests | prove structural rules do not drift | layering, dependency direction, naming, module boundaries | the change depends on structural rules staying true over time | no structural rule is part of the outcome or regression risk | |
| Manual checks | prove surfaces not credibly automated | UI, ops, diagnostics, third-party flows, exploratory checks | automation is absent or insufficient for the observable behavior | reliable automation already covers the same proof surface | |

## Standard checks

- build:
- tests:
- static analysis:
- manual verification:
- known intentional gaps:

## Representative examples

- canonical test locations:
- preferred fixtures or harnesses:
- architecture-rule examples:

## Change guidance

- minimum checks for common change types:
- when deeper verification is required:
- how results should record executed checks, evidence references, and limitations:
