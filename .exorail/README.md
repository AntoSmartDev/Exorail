# Exorail workflow

This directory is the static Exorail payload. Project authority is materialized
only in the registered paths configured by `WORKFLOW_CONFIG.md`.

Schema 0.2 and release 0.2.0 are the canonical clean-break line. Schema 0.5
is historical public payload and schema 0.6 is retired internal design.
Neither is current, runtime-compatible or upgraded; legacy work is deliberately
reconstructed.

- [Workflow method](method/OPERATING_FLOW.md)

Project authority and generated projections are materialized in configured
project paths. Episode payload assets are introduced only by the owned EP001
G3 implementation, with their configuration, lifecycle and validation. This
README is static payload navigation and never lists current work, milestones,
or delivery status.

The stable boundary is: runtimes execute; Exorail governs, records, validates
and authorizes progression. Integration, Execution and Projection Adapters are
replaceable descriptors around the repository-native protocol. A repository
without adapters remains valid and retains all canonical history.
Adapter presence never activates behavior. Project capability Policy is
fail-closed, and Runtime invocation requires deterministic eligibility from
that Policy plus an active descriptor, local binding, live capability,
conformance and health. Host availability remains derived and non-canonical.
