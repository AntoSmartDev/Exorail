# KNOWLEDGE_INDEX.md

This index routes only the knowledge needed by active or next work. It is not a
hierarchy or a competing source of project truth.

A Promote-when condition reads on the work, not on the subject matter: a row
promotes when a Task changes the rules in that area, not when it touches data
the area describes. A Task that reads sensitive data does not promote Security;
a Task that changes who may read it does.

`State` is `required` or `deferred`. A `required` row must resolve to a
canonical source before readiness is `ready`; a `deferred` row is promoted to
`required` when its Promote-when condition holds, and there is no third value.

| Area | State | Promote when | Canonical source | Blocking gap |
| --- | --- | --- | --- | --- |
| Product intent | required | always | none | setup required |
| Functional flows | deferred | Story acceptance depends on it | none | none |
| System structure | required | always | none | setup required |
| Context catalogue | required | always | `.exorail/planning/contexts/` | setup required |
| Data and persistence | deferred | active Task changes data rules | none | none |
| Integrations | deferred | active Task uses external system | none | none |
| Security | deferred | active Task changes access or sensitive data | none | none |
| Engineering and verification | required | always | none | setup required |
| Roadmap | required | always | Epic/Feature/Story tree and projections, created by planning before readiness is set | setup required |
| Known defects | deferred | active Task touches an area the project's defect register, issue list or known-issues document records | none | none |

Setup maps each required row to one reachable canonical source. Context-specific
knowledge may be added when it reduces repeated broad reads. Historical records
may support provenance but never become runtime authority.
