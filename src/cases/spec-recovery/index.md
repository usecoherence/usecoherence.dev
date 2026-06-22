---
layout: layout.njk
title: "Recovering specifications from existing code"
description: "Most codebases already contain specs. They just don't look like specs. A recovery pipeline that routes behavioral evidence into a reviewable spec tree."
---

# Recovering specifications from existing code

Most codebases already contain specs.

They just don't look like specs.

They look like CLI commands, tests, database migrations, model defaults, parser errors, file layouts, fixtures, and weird edge cases somebody fixed six months ago and forgot to document.

Coherence starts with three primitives:

```coh
Spec = promise the system makes
AC   = falsifiable claim under that promise
Evidence = executable proof linked to the claim
```

That's already how the bootstrap README frames the model: specs describe promises, acceptance criteria make those promises falsifiable, and evidence connects claims to executable verification. ([GitHub][1])

The interesting question is what happens when the spec didn't come first.

What if the code already exists?

Can we recover the spec tree from the implementation?

That is what `coherence-bootstrap` does to itself.

Not by generating pretty documentation.

By routing behavior.

## The problem

Imagine a small CLI command:

```bash
coherence-bootstrap ac add \
  --spec-id SPEC-demo-greeting \
  --title "Prints greeting"
```

From the outside, this looks simple.

But this command already implies several claims:

```text
The command accepts an existing spec id.
The operator must provide a title.
The operator may omit intent.
The operator may provide a stable slug.
The command returns the created AC identity.
The command rejects unknown spec ids.
```

Those are not implementation details.

They are product behavior.

If an agent changes the CLI and breaks one of them, a user will notice.

So we can recover this:

```coh
SPEC product/cli/ac
  AC ac-add-requires-existing-spec
  AC ac-add-requires-title
  AC ac-add-allows-empty-intent
  AC ac-add-allows-stable-slug
  AC ac-add-returns-created-identity
```

This is already much more useful than:

```text
src/main.rs has an ac add command
```

That sentence describes code.

The recovered ACs describe promises.

## The naive solution fails

The obvious move is:

> Let's scan the repo and document everything.

That produces garbage.

For example, suppose the codebase has this test helper:

```rust
pub struct TestWorld {
    repo_dir: TempDir,
    dolt_port: u16,
    env: TestEnv,
}

impl TestWorld {
    pub fn new() -> Self {
        // create isolated repo
        // start temporary Dolt server
        // run migrations
    }
}
```

A naive documentation generator might produce:

```text
The system has a TestWorld helper.
TestWorld creates a temporary repository.
TestWorld starts a Dolt server.
TestWorld runs migrations.
```

Technically true.

Mostly useless.

The user does not care that `TestWorld` exists.

The product does not promise `TestWorld`.

This should not become a product AC.

At most, it is evidence for another claim:

```coh
SYSTEM system/process/test-isolation
  AC tests run against isolated project catalogs
    verified_by tests/support/test_world.rs
```

That's the key move.

Not everything discovered in code becomes an acceptance criterion.

Some things become evidence.

Some are demoted.

Some move lower.

Some are ignored as accidental structure.

The bootstrap recovery explicitly uses this routing discipline: build inventory, convert it into a ledger, apply the taxonomy, group findings into specs, promote contract-level claims, and mark implementation-only details as evidence-only or demoted. ([GitHub][1])

## The actual recovery pipeline

The pipeline looks like this:

```coh
codebase
  ↓
inventory
  ↓
candidate ledger
  ↓
taxonomy
  ↓
routing decision
  ↓
spec tree
  ↓
AC catalog
  ↓
evidence links
```

A ledger row might start like this:

```text
source: tests/cli_ac_add.rs
observed: ac add rejects unknown spec id
surface: CLI
```

Then Coherence asks:

```text
Is this user-visible?
Is this a system process?
Is this a component contract?
Is this a foundation invariant?
Is this only evidence?
Is this accidental?
```

That produces a routed row:

```coh
final_spec: product/cli/ac
group: ac-add
action: promoted_to_ac
reason: AC authoring UX belongs to product/cli/ac
```

Now we have an actual acceptance criterion:

```json
{
  "spec_slug": "product/cli/ac",
  "ac_slug": "ac-add-rejects-unknown-spec",
  "title": "AC creation rejects unknown specs",
  "intent": "When the operator creates an AC for a missing spec, the CLI reports a not-found error and does not create the AC.",
  "review_mode": "automated",
  "risk_level": "medium"
}
```

And we can attach evidence:

```json
{
  "ac_slug": "ac-add-rejects-unknown-spec",
  "verified_by": "cargo test -p coherence-bootstrap cli_ac_add_rejects_unknown_spec"
}
```

This is the difference between docs and recovered specs.

Docs say:

```text
There is a command.
```

Recovered specs say:

```text
This command promises this behavior, and this test currently proves it.
```

## Example 1: product behavior

Start from a CLI test:

```rust
#[test]
fn ac_add_rejects_unknown_spec() {
    cmd()
        .args([
            "ac", "add",
            "--spec-id", "SPEC-does-not-exist",
            "--title", "Prints greeting",
        ])
        .assert()
        .failure()
        .stderr(contains("spec not found"));
}
```

A static scanner might say:

```text
There is a test named ac_add_rejects_unknown_spec.
```

That's not enough.

The recovered claim is:

```coh
SPEC product/cli/ac
  AC ac-add-rejects-unknown-spec
    intent: Creating an AC for a missing spec fails with a not-found error.
    evidence: cargo test ac_add_rejects_unknown_spec
```

Why `product/cli/ac`?

Because this is operator-facing CLI behavior.

It is not a repository invariant.

It is not a database invariant.

It is not a parser detail.

The user ran a command and got a promise.

So the claim belongs at the product level.

## Example 2: foundation behavior

Now take a different observation:

```rust
#[test]
fn new_ac_defaults_to_manual_review() {
    let ac = AcceptanceCriterion::new("SPEC-demo", "prints-message");

    assert_eq!(ac.review_mode, ReviewMode::Manual);
    assert_eq!(ac.risk_level, RiskLevel::Medium);
}
```

This is not product UX.

The CLI may expose this behavior, but the real promise belongs lower.

Recovered claim:

```coh
SPEC foundation/domain/model/acceptance-criteria
  AC new-acs-have-default-review-mode
    intent: New ACs default to manual review when no review mode is provided.

  AC new-acs-have-default-risk-level
    intent: New ACs default to medium risk when no risk level is provided.
```

This exact kind of routing appears in the bootstrap ledger: rows about AC review mode and risk level are routed to the foundation domain model, not to the product CLI. ([GitHub][1])

That decision matters.

If the product CLI spec repeats every model invariant, the graph becomes noisy.

Higher-level specs should not re-verify lower-level invariants. The README states this as a rule directly. ([GitHub][1])

So the CLI spec can say:

```text
ac add creates an AC
```

But the foundation spec owns:

```text
new ACs default to Manual review
new ACs default to Medium risk
```

That's cleaner.

## Example 3: moved lower

Here is a subtle one.

Suppose the CLI lets the operator omit a slug:

```bash
coherence-bootstrap ac add \
  --spec-id SPEC-demo-greeting \
  --title "Prints message"
```

The system generates an identity:

```text
AC-demo-greeting-prints-message
```

At first glance, this looks like product behavior.

The user sees the generated id.

But the actual rule is deeper:

```coh
AC identity generation belongs to the AC model lifecycle.
```

So the routing decision is:

```coh
original: product/ac-authoring
observed: CLI can generate an AC id when slug is omitted
action: moved_to_lower_level
final: foundation/domain/model/acceptance-criteria
reason: ID generation is part of AC model lifecycle
```

The bootstrap routing table has this exact shape: "CLI can generate an AC id when the operator does not provide…" is moved lower because identity generation belongs to the AC model lifecycle. ([GitHub][1])

This is the whole point.

The goal is not to ask:

> Where did we notice this behavior?

The goal is to ask:

> Who owns this promise?

The CLI may reveal identity generation.

The domain model owns identity generation.

## Example 4: evidence-only

Now take test infrastructure.

```rust
#[test]
fn project_env_selection_uses_isolated_catalog() {
    let world = TestWorld::new()
        .with_project_slug("demo-app")
        .with_env("test");

    world.run("coherence-bootstrap spec list")
        .assert()
        .success();
}
```

There is real behavior here.

But not all of it should become ACs.

Bad recovery:

```coh
PRODUCT
  AC TestWorld creates a temporary project
  AC TestWorld configures environment variables
  AC TestWorld starts Dolt
```

Better recovery:

```coh
SYSTEM system/process/test-isolation
  AC verification uses isolated project catalogs
    evidence:
      tests/project_env_selection.rs
      tests/support/test_world.rs
```

The helper stays evidence.

The claim is about isolation.

The bootstrap spec tree calls out `system/test/world` as evidence-only rows, not ACs in the catalog. ([GitHub][1])

That is a good result.

It means the recovery process did not blindly turn every helper into a promise.

## The taxonomy

The recovery needs levels.

Otherwise every finding becomes a flat pile.

The bootstrap catalog uses:

```coh
FOUNDATION  → domain models + infrastructure contracts
MODULE      → bounded capabilities using foundation models
COMPONENT   → concrete adapters
SYSTEM      → end-to-end processes
PRODUCT     → user-facing surfaces
```

The README describes the same five-level taxonomy and explicitly separates product surfaces, system processes, concrete adapters, bounded modules, and foundation contracts. ([GitHub][1])

This gives routing rules:

```text
CLI output?              → PRODUCT
End-to-end workflow?     → SYSTEM
Parser/router/repo?      → COMPONENT
Bounded capability?      → MODULE
Domain model / DB rule?  → FOUNDATION
Test helper?             → EVIDENCE
Accidental structure?    → DEMOTED
```

So a raw inventory can become a reviewable graph.

Example:

```coh
raw finding:
  verify-spec prints per-AC outcome

routing:
  level: PRODUCT
  final_spec: product/cli/verify
  group: verify-cli
  action: promoted_to_ac

recovered AC:
  verify-spec surfaces per-AC outcome within the spec
```

The bootstrap routing table ends with product verification rows like `verify-spec surfaces per-AC outcome within the spec` and `verification output structure is consistent...`, routed to `product/cli/verify`. ([GitHub][1])

That's concrete.

A user runs `verify-spec`.

The product promises useful output.

The AC captures the promise.

The evidence proves it.

## What the recovered tree looks like

After routing, the tree is no longer "files and functions".

It becomes behavior:

```coh
PRODUCT
  product/cli/spec
    spec-add
    spec-list-show

  product/cli/ac
    ac-add
    ac-list-show

  product/cli/verify
    verify-ac
    verify-spec

  product/cli/ac-tests
    materialize-check
    test-file-layout

  product/tui/navigation
  product/tui/editing
  product/tui/verification

SYSTEM
  system/process/ac-authoring
  system/process/spec-authoring
  system/process/verification
  system/process/evidence-capture
  system/process/test-isolation

COMPONENT
  component/cli/parser
  component/cli/router
  component/repository/spec-store

FOUNDATION
  foundation/domain/model/specs
  foundation/domain/model/acceptance-criteria
  foundation/infra/dolt/catalog-naming
  foundation/infra/dolt/migrations
  foundation/infra/filesystem/project-manifest
```

The current README lists the final phases in this shape: foundation specs first, then component specs, system process specs, and product CLI/TUI specs. ([GitHub][1])

Now review becomes possible.

Not easy.

Possible.

Instead of reading every line of code, a reviewer can ask:

```coh
Is this behavior real?
Is this claim worded correctly?
Is it at the right level?
Is the linked test actually proving it?
Did we accidentally promote implementation detail into product promise?
```

That is much sharper than:

```text
Does this generated documentation look okay?
```

## The bootstrap result

The current recovered bootstrap catalog has:

```coh
252 ledger rows
219 promoted ACs
27 evidence-only rows
4 demoted rows
2 moved to lower level
28 final specs
```

The README reports those numbers directly and describes the goal as exhaustive routing where no row disappears. ([GitHub][1])

That is the holy-shit part.

Not because 219 ACs is a magical number.

Because the system found 252 pieces of behavioral evidence and did not treat them all the same.

This is what the split means:

```coh
promoted_to_ac
  This is a real claim the system should continue to satisfy.

evidence_only
  This supports another claim, but is not itself a promise.

demoted
  This was too implementation-specific or too low-level.

moved_to_lower_level
  This was noticed higher up, but owned lower down.
```

That is the difference between "generate docs" and "recover intent".

## Why this matters for agents

Agents are very good at producing code.

That is the problem.

A human can review a small patch by intuition.

But when an agent produces a large coherent-looking diff, the hard question is not:

```text
Does this compile?
```

The hard question is:

```text
Which promises did this change touch?
```

Without a recovered spec graph, the agent has to infer that from the whole repo.

That means the agent reads code, tests, names, comments, previous decisions, file layout, and maybe a README. Then it guesses the intent.

Sometimes the guess is good.

Sometimes the guess is cursed.

With Coherence, the agent gets a slice:

```coh
Change request:
  Improve verify-spec output.

Relevant spec slice:
  product/cli/verify
    AC verify-spec-accepts-id
    AC verify-spec-reports-aggregate-counts
    AC verify-spec-surfaces-per-ac-outcome
    AC verification-output-is-consistent

  system/process/verification
    AC verification-aggregates-link-results
    AC no-evidence-is-reported-clearly

  foundation/domain/model/ac-verification-latest
    AC latest-result-is-stored-per-ac
```

Now the agent can work against known claims.

The human reviews whether the claims changed.

The test runner verifies linked evidence.

The important part is not that the agent has more context.

The important part is that the context is routed.

## Pull request review changes

A normal PR review asks:

```text
Did the code change look sane?
Did tests pass?
Did the agent break anything obvious?
```

A Coherence-style review asks:

```coh
Which ACs changed?
Which evidence links changed?
Did new behavior get a new claim?
Did removed behavior delete or deprecate a claim?
Did a product claim accidentally depend on a foundation invariant?
Did a test still verify the claim it says it verifies?
```

Example PR note:

```coh
This patch changes verify-spec output.

Affected ACs:
  product/cli/verify.verify-spec-reports-aggregate-counts
  product/cli/verify.verify-spec-surfaces-per-ac-outcome

Evidence updated:
  cargo test verify_spec_reports_aggregate_counts
  cargo test verify_spec_surfaces_per_ac_outcome

No foundation claims changed.
No product claims were added.
```

That is a review surface.

A reviewer can actually attack it.

They can say:

```text
No, this also changes no-links behavior.
Add/update the AC for that.
```

That is exactly the kind of correction agents need.

Not vague "be careful".

A concrete missing claim.

## What Coherence adds

Coherence does not replace tests.

It does not replace docs.

It does not replace code review.

It adds a durable relationship:

```coh
SPEC
  has AC
    implemented_by code
    verified_by test
    constrained_by another spec
```

The README describes this as a graph of requirements where specs relate to each other and ACs connect outcomes to implementation and executable evidence. ([GitHub][1])

The test stays normal Rust:

```rust
#[test]
fn verify_spec_surfaces_per_ac_outcome() {
    let world = TestWorld::new();

    world.seed_spec("SPEC-demo");
    world.seed_ac("AC-one");
    world.seed_ac("AC-two");

    world.run("coherence-bootstrap verify-spec SPEC-demo")
        .assert()
        .success()
        .stdout(contains("AC-one"))
        .stdout(contains("AC-two"))
        .stdout(contains("OVERALL"));
}
```

Coherence records why that test matters:

```json
{
  "spec_slug": "product/cli/verify",
  "ac_slug": "verify-spec-surfaces-per-ac-outcome",
  "verified_by": "cargo test verify_spec_surfaces_per_ac_outcome"
}
```

That link is the trust boundary.

A passing test alone is not enough.

Someone must confirm that this test actually verifies that AC.

After that, automation can keep checking it.

## The point

Reverse-spec recovery is not:

```text
read code → generate docs
```

It is:

```text
read code
→ discover behavioral evidence
→ route each finding
→ promote only real claims
→ keep helpers as evidence
→ move lower-level invariants down
→ produce a reviewable spec tree
```

That is why this matters.

Most teams do not have clean specs.

They have working code.

They have tests.

They have production behavior.

They have old decisions buried in implementation.

Coherence gives you a way to recover a map from that mess.

Not perfectly.

Not magically.

But concretely.

A recovered spec is a claim you can review:

```text
Is this true?
Should this remain true?
Is this at the right level?
What proves it?
```

That is already a better object than a giant diff.

And once the map exists, both humans and agents can stop pretending the only source of truth is "read the whole repo and vibe-check it".

Code is not enough.

Tests are not enough.

Docs are not enough.

The durable object is the relationship:

```coh
promise
→ claim
→ implementation
→ evidence
```

Reverse-spec recovery is how you build that relationship when the code came first.

[1]: https://github.com/usecoherence/coherence-bootstrap "GitHub - usecoherence/coherence-bootstrap · GitHub"
