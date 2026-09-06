---
schema: "0.2"
id: ADAPTER-<slug>
type: adapter_profile
title: <adapter contract profile>
status: active
family: <integration|execution|projection|x-vendor-family>
contract_version: 1
descriptor_revision: 1
capabilities: [<family.capability@1>]
created_at_utc: <RFC-3339 UTC>
updated_at_utc: <RFC-3339 UTC>
---

# Adapter profile: <title>

## Contract

<portable contract, capability rationale and known lossy boundaries>

Entrypoints, package paths, endpoints, credentials, provider mappings and local
binding state are adapter-owned configuration and never canonical fields here.
Presence and capability declaration do not activate or authorize this adapter.
Project Policy activates capabilities in `WORKFLOW_CONFIG.md`; Runtime resolves
binding, live conformance, health and deterministic selection. A referenced
descriptor may be retired but remains as the logical identity for historical
Runs and External Actions.
