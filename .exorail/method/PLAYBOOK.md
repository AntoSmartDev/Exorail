# Playbook — schema 0.2

## Authority

The manifest defines artifact shape, paths, inheritance, states, validators,
and adapters. This playbook explains use; it cannot weaken the manifest.

Schema 0.2 and release 0.2.0 are the canonical clean-break line. Schema 0.5
is historical public payload and schema 0.6 is retired internal design.
Neither is current, runtime-compatible or upgraded; legacy work is deliberately
reconstructed.

## Daily path

1. Navigate from the cursor to Epic, Feature, Story, and Task.
2. Read Story acceptance, plan revision, contexts, dependencies, execution
   choice and the current Task. Read a Task Contract only when required.
3. Before launch, present the Task waves, constraints and review choice in
   plain language; direct the operator to `Show details` for full state.
4. Execute only the active Task scope in the runtime isolation selected by
   resolved Policy; runtime workspace and branch names are local observations.
5. Verify every acceptance reference. Remediate safely for at most three
   cycles, then record an internally clean immutable Result in `review_pending`.
6. Use the Task review boundary by default, or follow the explicitly authorized
   Story boundary. Reconcile integration before unblocking dependents.
7. When every Task is integrated, run whole-Story review and ask for Story
   outcome validation. Offer one optional Story PR only after approval.

## Policy

Execution modes are `sequential` or `parallel`; derived Task isolation decides
whether work is parallel-safe, hunk-disjoint or sequential-only. Dependencies
always win. Verification profiles are `minimal`, `standard`, or `full`; children
may not weaken them. `task` review is the default boundary. `story` requires
explicit current human authority and resolved Policy eligibility; it never
removes the mandatory whole-Story review.

## Evidence and history

Clean Results are immutable evidence, not self-acceptance. Store durable design
alternatives in ADRs and typed decisions/challenges in `DECISIONS.md`. A
protected human record uses `user:<decision-reference>` and must resolve outside
agent-authored prose. Legacy work records may be retained as historical evidence
but must not direct schema 0.2 execution.

## Trust boundary

Claim state and provenance are independent labels; neither grants authority.
Use exactly one claim-state label for a reported fact:
`mechanically_verified` means a defined local check observed the fact;
`agent_declared` means an agent supplied it without independent verification;
`human_decision_required` means only a current human Decision can settle it;
and `not_verified` means Exorail has no verification basis for it.

Use provenance separately to describe where supporting evidence came from:
`declared`, `git_linked`, `externally_attested`, or
`cryptographically_attested`. A Git link is not human authority, and an external
or cryptographic attestation does not itself approve progression.

`ready_for_review` is preparation only. It is not human acceptance, correctness,
release approval, authenticated identity, or permission to create a PR, merge,
publish, or move queue state. Completion attribution is repository-declared, not
proof of a person's identity. Retrieved knowledge is non-authoritative until a
separate verification or current human Decision establishes how it may be used.

## Native operation without an adapter

An adapter is optional. When no capability activation and no local binding are
present, derive the executable frontier, perform the authorized work
interactively, write the Result and record the existing receipt/replan flow,
then refresh projections. A declared capability whose binding is unavailable
fails closed for delegation; it does not invalidate or replace this native
path. Local entrypoints, credentials, checkpoints and runtime event streams
remain outside canonical records.
