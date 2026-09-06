---
schema: "0.2"
id: ACT-<action-slug>
type: external_action
adapter_id: ADAPTER-<adapter-slug>
adapter_descriptor_revision: 1
work_id: US-<work-slug>
action_kind: <namespaced-action-kind>
target_ref: <opaque-target-reference>
consequence: consequential
idempotency_key: <stable-idempotency-key>
status: proposed
authority_ref: none
external_ref: none
evidence_refs: []
created_at_utc: <RFC-3339 UTC>
updated_at_utc: <RFC-3339 UTC>
---

# External Action: ACT-<action-slug>

## Purpose

Durable intent and outcome for one consequential or destructive external
mutation. Read-only and non-consequential integration activity creates no
canonical External Action.
The idempotency key identifies the logical project mutation independently of
which adapter implementation performs it. Retry an unresolved authorized
action with the same record and key; never create a duplicate under another
adapter.
