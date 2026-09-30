---
schema: "0.2"
id: CTX-<slug>
type: context
title: <bounded context>
# `title` heads the document and `name` is the context's identity label. Both
# are required and the validator never compares them: the same phrase in both
# is normal, and a shorter `name` is equally valid.
name: <bounded context>
status: active
# Role IDs use [a-z][a-z0-9_-]*, for example payments_owner.
owners: [<domain-owner-role-id>]
aliases: []
created_at_utc: <RFC-3339 UTC>
updated_at_utc: <RFC-3339 UTC>
---

# Context: <title>

## Boundary

<key terms, integrations, and exclusions>

## Ubiquitous language

<terms used consistently inside this context>
