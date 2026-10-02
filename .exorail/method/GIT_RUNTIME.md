# Native Git execution

The opt-in native route prepares and integrates Story/Task work with Git and
Node.js. No Skill, adapter or remote is required for solo delivery. Canonical
records, the executable frontier, Results and human receipts remain the source
of project meaning. Git bindings are operational observations. The manual route
in OPERATING_FLOW remains available for existing projects.

## Targets and names

Declare an exact `refs/heads/...` delivery target and base commit; never infer
`main`, `developer` or a Feature target from names. A Story may deliver directly
to the project target. `prepare-target` selects optional aggregate Feature
delivery and binds its project target too.

```text
developer                                  explicit project target (example)
  feature/FEAT-0021-checkout                optional aggregate target
    story/FEAT-0021/US-0005-pagamenti
      task/TASK-us0005-01/attempt-1
      task/TASK-us0005-02/attempt-1
    story/FEAT-0021/US-0006-wallet
      task/TASK-us0006-01/attempt-1
```

Indentation means integration destination, not nested Git branches. Task IDs
identify their Story; titles and parents in records clarify meaning. Existing
canonical IDs remain valid. Numeric IDs are an optional allocation convention.
Worktrees use short hashed names outside the repository; `status` reports their
IDs, titles, owner, base, current ref, actual path and dirty state. Native Git
calls enable long paths and LF checkout per process, without global config.
Human shell operations still need appropriate Windows Git configuration.

## Approved requests

Run from the adopter repository, keeping request files outside the checkout:

```sh
node .exorail/tools/git-runtime.mjs --request <approved-request.json> --json
```

Each mutating request names the human `authority.reference`, authorized
`actions` and exact `bindings`. This references the act; it does not authenticate
the person or allow an agent to grant itself authority. One bounded Story act
may enumerate preparation, waves, technical review and integration; human
acceptance and delivery remain separate acts. `WORKFLOW_CONFIG` retains explicit
action-specific approval: one act can explicitly enumerate several actions.

Example (replace both the base placeholder and workspace path):

```json
{
  "action": "start-story",
  "story_id": "US-0005", "owner": "anna", "plan_revision": 1,
  "target_ref": "refs/heads/developer", "base_sha": "<exact-commit>",
  "slug": "pagamenti", "worktree_root": "C:/work/exorail-worktrees",
  "authority": {
    "reference": "user:approved-payments-story",
    "actions": ["start-story", "start-wave", "review-task", "integrate-task"],
    "bindings": {
      "story_id": "US-0005", "owner": "anna", "plan_revision": 1,
      "target_ref": "refs/heads/developer", "base_sha": "<exact-commit>"
    }
  }
}
```

The placeholder is invalid until replaced. Task execution uses the existing
workflow: implementation, Run and Result in its own worktree, then projections.
Technical review does not accept work.

| Action | Facts beyond the Story binding | Outcome |
| --- | --- | --- |
| `start-story` | slug, external worktree_root | Story and eligible Task wave |
| `start-wave` | expected_story_sha | newly eligible Tasks from current Story SHA |
| `review-task` | task_id, optional reviewed_sha/patch_id | exact premerge technical verdict |
| `accept-task` | task_id, reviewed_sha, expected_story_sha; authority also binds task_id/reviewed_sha | human Task-boundary receipt |
| `prepare-integration` / `integrate-task` | task_id, reviewed_sha, patch_id, expected_story_sha, unique request_id | candidate / serial integration and one receipt |
| `accept-story` | reviewed_sha; authority also binds reviewed_sha | complete aggregate human acceptance |
| `deliver-story` | reviewed_sha (accepted Story tip), expected_target_sha; authority binds both | delivery to declared target |
| `publish-task` | task_id, reviewed_sha; authority binds both | remote handoff; no acceptance |
| `status` | none | current observations |

Task-boundary integration requires the exact Task acceptance first.
Story-boundary integration releases dependents after technical integration;
later whole-Story acceptance writes batched Task acceptances and final Story
acceptance. When executable children end, the coordinator holds the Story
blocked until refinement or whole review. It does not pretend completion.
Only the coordinator edits shared Story governance; Task branches own their
Task/Contract/Result and Run. Actual scope escape, changed plans, missing evidence,
moved tips and open decisions stop. Only generator-owned projection conflicts
are regenerated automatically. Code and canonical conflicts retain the candidate
for inspection and new review. A merge commit followed by a receipt commit
preserves reviewed ancestry without a self-referential integration SHA.

## Team coordination and reservations

Shared mode requires atomic push and server support for
`refs/exorail/runtime/state`. `connect-shared` consumes remote, worktree_root and
allowed_refs; authority binds remote/worktree_root and lists `connect-shared`,
`publish-runtime` and, separately, `publish-target` for code refs. allowed_refs
contains exact refs or prefixes ending `/`; narrow it to approved namespaces.
This transfers work and coordination data, without tag/Release/publication
authority. Unsupported atomic push or namespace stops shared mode.

Admission compares currently executable and reserved scopes across Stories
sharing a project delivery target. Paths normalize separators, case and
directory overlap conservatively; resources and approved disjoint regions reuse
the existing wave conflict rule. Regions declare ownership, not semantic
independence or absence of merge conflict. Known manual active work must be
reconciled. Only admission and target updates serialize; independent Story/Task
execution stays concurrent. Every wave rechecks, without requiring a complete
future Feature decomposition.

The registry CAS and branch leases advance atomically. Takeover changes the
writer token even at unchanged target SHA. Admission may lose its CAS; observe
the winner and replay the same approved request. Reservations never expire into
reuse. Unregistered external writers and actors bypassing the route are outside
assurance. Administrators own access control, required registration, reservation
retention and remote history protection.

`reserve-id` requires kind (`epic`, `feature`, `story`), owner, request_id,
optional start, and optional remote plus public_base_ref. Authority binds kind,
owner and remote (`none` for local). A unique token carries an already-public
tree; conditional creation of a number-only ref decides the claim. Lost claims
retry a new number; uncertain transfers remain for replay/inspection. Claims
are never deleted or reused. Solo mode cannot guarantee cross-clone uniqueness.
`allocate-task-id` binds story_id, owner and optional remote to a coordinator
and advances the Story ordinal, without one remote claim per Task.

This route consumes `user_story.dependencies`: current upstream acceptance and
accepted SHA ancestry in the selected target are required. Unknown, self/cyclic,
changed-revision or absent-ancestry dependencies stop. The dependent starts from
the current target. Legacy manual verdicts remain unchanged.

`prepare-target` binds feature_id, target_ref, project_target_ref and base_sha;
authority binds target refs and base. `deliver-feature` binds feature_id, both
target refs, reviewed_sha (Feature tip) and expected_target_sha (project tip),
including all five in its separate authority bindings. It checks all current
non-superseded Story acceptances and ancestry before aggregate delivery. A
completed status alone cannot prove it.

## Failure and recovery

After a successful `integrate-task`, `deliver-story` or `deliver-feature`, the
response provides `active_workspace`, `active_branch`, `active_sha` and
`caller_navigation_required: true`. Move the coding agent's working directory
and subsequent operations to that workspace immediately: Task to Story, Story
to its declared delivery target, Feature to its declared project target.
The destination is a verified branch checkout; an absent target worktree is
materialized separately before delivery. Never check out the parent inside a
finished child's worktree: parallel worktrees and retained evidence stay intact.
The CLI cannot change its invoking shell's directory; the caller must adopt the
returned context. Failed merges return no successful transition. A replay uses
the existing parent checkout, without creating duplicate worktrees or receipts.

Nonzero exits, signals and timeouts stop without certifying integration. Dirty
worktrees, unexpected refs/paths and substantive conflicts are preserved. No
automatic reset, rebase, forced overwrite, deletion or cleanup is performed.
An identical request_id can reconstruct a preparing candidate from the exact
original target and reviewed source, retaining the interrupted candidate intact.
It never imports manual resolutions or other candidate edits. Recovery stops
after three reconstructions; original substantive conflicts reproduce refusal
and require inspection. Prepared/published integration replays without duplicate
receipts. Delivery refuses a Story tip moved after its acceptance commit or a
Feature aggregate tip moved outside the registered delivery path.

After a crash, `inspect-lock` observes a retained PID/digest. `recover-lock`
requires a separately inspected human act binding pid and lock_digest and
refuses a live PID; it archives the dead-owner lock without accepting work.
`reconcile-transaction` requires an exact state_sha and separate authority
binding, and finishes local observation only when remote registry and code refs
still equal the recorded next SHAs. Divergence or dirty edits stop.

`recover-story` is an explicit takeover on another connected clone, binding
story_id, previous_owner, new owner, plan_revision, target_ref and original
base_sha. It fetches journal and work refs, refuses pending integrations and
divergent/dirty work, changes the token and reconstructs worktrees. It cannot
recover untransferred code or infer acceptance. Failed preparation requires its
current owner's inspection; deleting refs does not make a failed request new.

Operational delivery grants no deployment/release permission and no guarantee
that multiple developers will never create conflicting changes.
