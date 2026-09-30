# Workflow invariants — schema 0.2

- The only value hierarchy is Epic → Feature → User Story → Task.
- Milestones collect Stories; Contexts tag artifacts; neither is a parent.
- Every Task has exactly one Story parent. A Contract and Result are sibling
  files conditional on Task state.
- The Story owns sufficient non-generic executable backlog, acceptance, plan
  revision, policy, and risk. The Task owns executable scope, paths,
  dependencies, optional forecast, and
  handoff.
- An exceptional Task Contract must match its Task ID, parent, plan revision,
  paths and verification policy; normal Tasks require no universal Contract.
  The resolver derives `contract_required`; it is not an agent waiver.
- A Task reaches `clean` only after internal acceptance-criterion verification
  and no more than three remediation cycles. Its immutable Result begins in
  `review_pending`; human acceptance, Story-base integration and whole-Story
  outcome are distinct protected events.
- The Story records `execution_mode: sequential|parallel` and
  `review_boundary: task|story`. The default is `task`. Story-boundary review
  requires explicit current human authority permitted by resolved Policy and never skips
  final whole-Story validation.
- Protected routes require the declared `user:<decision-reference>`
  authority-reference form. Role, agent, chat and session labels are
  descriptive and cannot approve, accept or authorize; the baseline checks the
  form, not human origin or identity.
- Parallel Tasks have isolated runtime workspaces and atomic review artifacts.
  Derived dependencies constrain only their downstream subgraph; manual Git
  integration is reconciled before dependent work starts.
- A typed Decision or Contract Challenge is required for unsafe scope,
  non-convergence, missing evidence, material replan or a contradiction of an
  approved plan. It records evidence, impact, options, recommendation and
  requested human decision.
- Never silently change a future Task on new information: increment the
  revision and replan or supersede it. The validator checks that an unfinished
  Task carries the current revision, not that its content was preserved, so
  rewriting one in place is detectable by review rather than by tooling. This
  rule binds the operator.
- Generated projections and adapters do not become source authority. Adapter
  family/capability names are claims and grant no dispatch, trust, authority or
  Core write. Project Policy activation is fail-closed; Runtime selection also
  requires an allowed active descriptor, local binding, matching live
  capability, conformance and health. None of these host facts is canonical.
- `execution_run` is a durable open-or-terminal attempt summary, never an event
  log. Its governance digest covers only inputs actually consumed at dispatch.
  `external_action` exists only for consequential/destructive mutations, and
  its idempotency key identifies the logical mutation across adapter changes.
- Bounded contexts are chosen from the Context catalogue and are inherited only
  by union; ownership and risk use nearest-parent fallback.
- Preserve unrelated repository changes and require explicit approval for Git
  mutations.
