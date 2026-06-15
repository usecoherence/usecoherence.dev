---
layout: layout.njk
title: Changelists as a Thin Semantic Layer over Dolt
description: Coherence should provide a semantic interface that translates user actions into Dolt operations.
---

# Changelists as a Thin Semantic Layer over Dolt

Dolt already provides almost all of the state and version-control mechanics Coherence needs.

Coherence should not build its own snapshot format, patch merge engine, conflict resolution model, or commit graph. It should provide a thin semantic interface that translates user actions into graph queries, SQL mutations, and Dolt operations.

```text
user intent
→ Coherence command
→ graph query or DSL compiler
→ SQL mutations
→ Dolt
```

## What Dolt already provides

Dolt owns:

* database state;
* working sets;
* branches;
* commits;
* history;
* row-level diffs;
* merges;
* conflict detection.

The candidate state of a changelist can therefore be represented directly by the working set of a Dolt branch.

There is no need for separate artifacts such as:

```text
candidate.jsonl
current-db-merged.jsonl
custom merge result
```

## What Coherence adds

Coherence owns the domain semantics:

* what a spec is;
* what an acceptance criterion is;
* what relations and evidence links mean;
* how relevant graph slices are selected;
* how a graph slice is rendered as an editable DSL;
* how DSL changes are translated into database mutations;
* how domain invariants are validated;
* how a raw Dolt diff is presented as a semantic change.

```text
Dolt versions the graph.

Coherence explains and edits the graph.
```

## The changelist model

A changelist is not primarily a patch file.

It is a controlled editing session over a candidate Dolt branch.

```rust
struct ChangelistWorkspace {
    id: ChangelistId,
    title: String,
    base_commit: DoltCommitHash,
    branch: DoltBranchName,
    selection: SliceSelection,
}
```

### `id`

Identifies the change across CLI commands, editors, agents, and temporary artifacts.

```text
payment-api-auth-change
```

### `title`

A human-readable description of the intended change.

```text
Require authenticated clients for the Payment API
```

### `base_commit`

The Dolt commit from which the changelist was created.

This defines the base state used for comparison and review.

### `branch`

The Dolt branch containing the proposed state.

```text
changelist/payment-api-auth-change
```

### `selection`

Describes which part of the graph should be presented to the user.

```rust
struct SliceSelection {
    roots: Vec<SpecId>,
    editable: Vec<SpecId>,
    relation_kinds: Vec<SpecRelationKind>,
    traversal_depth: u8,
    include_acceptance_criteria: bool,
    include_code_links: bool,
}
```

This does not duplicate graph data. It is a query describing which graph slice to load from Dolt.

## Candidate specs

Candidate specs are references to existing graph nodes, not copies of those nodes.

```rust
struct CandidateSpec {
    spec_id: SpecId,
    state: CandidateState,
    reason: Option<String>,
}
```

```rust
enum CandidateState {
    Suggested,
    Selected,
    Excluded,
}
```

A candidate may be:

* selected manually;
* discovered by traversing typed relations;
* suggested by semantic search or an agent;
* explicitly excluded by the user.

The `reason` explains why it was selected or suggested:

```text
Payment API depends_on Authentication
```

This is changelist metadata, not part of the specification graph itself.

## Graph slices

A graph slice is a runtime projection of the current Dolt state.

```rust
struct GraphSlice {
    editable: GraphEntities,
    context: GraphEntities,
}
```

`editable` contains entities the user is allowed to change.

`context` contains connected entities shown for understanding and navigation, but not modified by this changelist.

For example:

```text
editable:
- Authentication
- Payment API

context:
- PCI Compliance
- Session Management
```

The slice is queried from Dolt whenever it is needed. It does not have to become another persistent source of truth.

## DSL as a bidirectional projection

The DSL is an editing interface over Dolt rows.

```text
Dolt rows
→ graph slice
→ DSL renderer
→ editable DSL
```

After editing:

```text
DSL
→ parser
→ domain validation
→ comparison with the original slice
→ SQL mutations
→ Dolt working set
```

The compiler may internally produce operations such as:

```rust
enum RowMutation {
    Insert {
        table: TableName,
        row: DomainRow,
    },
    Update {
        table: TableName,
        primary_key: PrimaryKey,
        values: ColumnPatch,
    },
    Delete {
        table: TableName,
        primary_key: PrimaryKey,
    },
}
```

This is transient compiler IR. It does not need to become a second persistent changelist format.

The Dolt branch remains the authoritative candidate state.

## User workflow

### 1. Create a changelist

```bash
coherence changelist create payment-auth \
  --title "Require authentication for the Payment API"
```

Internally:

```text
read current Dolt HEAD
→ create changelist/payment-auth branch
→ store lightweight workspace metadata
```

### 2. Select relevant specs

Manual selection:

```bash
coherence changelist select \
  spec/authentication \
  spec/payment-api
```

Relation-based discovery:

```bash
coherence changelist discover \
  spec/authentication \
  --relations depends_on,constrained_by \
  --depth 1
```

The user can then review the candidates:

```text
selected   spec/authentication
suggested  spec/payment-api
suggested  spec/session-management
excluded   spec/admin-dashboard
```

### 3. Materialize and edit the DSL

```bash
coherence changelist materialize > change.coherence.rs
```

The user edits the file in Vim, VS Code, another editor, or through an agent.

Then:

```bash
coherence changelist apply change.coherence.rs
```

Coherence:

```text
parses the DSL
→ validates references and domain rules
→ computes row mutations
→ applies them to the Dolt working set
```

The DSL is not a new persistence format. It is a human-readable editing surface for the database.

### 4. Preview the change

```bash
coherence changelist diff
```

The source of the diff is:

```text
base Dolt commit
vs
candidate branch working set
```

The same underlying change can be presented in several forms:

```bash
coherence changelist diff --format dsl
coherence changelist diff --format semantic
coherence changelist diff --format sql
coherence changelist diff --format stakeholder
```

For editor-native review, Coherence can render two temporary DSL files:

```bash
nvim -d base.coherence.rs proposed.coherence.rs
```

or:

```bash
code --diff base.coherence.rs proposed.coherence.rs
```

These files do not need to be committed. They are deterministic projections of two Dolt states.

### 5. Validate, commit, and merge

```bash
coherence changelist validate
coherence changelist commit
coherence changelist merge
```

Internally:

```text
validate domain invariants
→ stage Dolt tables
→ create Dolt commit
→ review
→ merge the Dolt branch
```

Dolt remains responsible for stale branches, merge conflicts, commit history, and state transitions.

## Minimal architecture

The first version may require only four components:

```text
coherence-changelist
coherence-graph-slice
coherence-dsl
coherence-dolt-catalog
```

Their responsibilities are:

```text
coherence-changelist
- coordinates the user workflow
- manages workspace metadata and branches

coherence-graph-slice
- selects roots
- traverses typed relations
- separates editable nodes from context

coherence-dsl
- renders graph slices
- parses user changes
- validates DSL semantics

coherence-dolt-catalog
- reads domain entities
- applies SQL mutations
- delegates versioning, diff, and merge to Dolt
```

## Core principle

```text
A changelist is not a separate patch database.

It is a semantic view and controlled editing session
over a candidate Dolt branch.
```

This keeps the Coherence layer small.

Dolt remains the database and version-control system. Coherence only adds the product language required to make specification changes understandable, editable, reviewable, and useful to both humans and agents.
