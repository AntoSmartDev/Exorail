# Testing strategy

| Check | Purpose | Use when | Skip only when |
| --- | --- | --- | --- |
| Unit tests | prove local behavior | new logic or regression risk | no supported unit boundary exists |
| Integration tests | prove boundary behavior | a Task crosses components or services | no integration boundary is affected |
| Structural checks | prove dependency and naming rules | structural constraints are in scope | no structural rule is affected |
| Text/workflow checks | prove protocol artifacts | workflow files change | never for workflow changes |
