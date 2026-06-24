---
layout: layout.njk
title: Versioned Project Memory
description: A software project should have memory — versioned, queryable, traceable from source knowledge to decision to spec to code to evidence.
---

# Versioned Project Memory

## Thesis

A software project should have memory.

Not "documentation".
Not "Slack history".
Not "ask Pete, he left two years ago".

Actual operational memory.

Memory that can answer:

> Why did we build this?

And not by guessing from source code, but by tracing the chain:

source knowledge → decision → spec → acceptance criterion → code → evidence → incident/review.

## Problem

Code remembers the final shape of a decision.

It does not remember the reason.

A year later, you see:

```text
git blame payment.ts
commit: afgjksfgakjsdl
message: fix edge case
```

Great. Very useful.

The code says what changed.
The project forgot why it changed.

This is the gap Coherence can fill.

## Existing Coherence Primitives

Coherence already has the important pieces:

```text
specs
acceptance_criteria
acceptance_criterion_concerns
spec_relations
```

And the DSL already lets us describe intent as a changelist instead of manually editing database rows one by one.

Example:

```rust
coherence_slice! {
    changelist "clipboard-api-security" {
        reason: "Clipboard write requires explicit user intent and browser permission model."

        source rfc: "Clipboard API and Events"
        source doc: "Internal security review: browser permissions"

        spec "Clipboard writes require explicit user action" {
            level: System
            status: Active

            ac "Reject background clipboard write" {
                review_mode: Automated
                risk: High
                concerns: [Security]

                links {
                    implemented_by file "src/browser/clipboard/write.ts"
                    verified_by test "tests/clipboard/write_requires_user_action.test.ts"
                }
            }
        }

        memory "Decision accepted after security review" {
            kind: decision
            actor: "security-review"
            reason: "Background clipboard writes create user-trust and permission-model risk."
        }

        context {}
    }
}
```

This changelist can compile into normal relational records.

That matters because once intent is data, it can be reviewed, diffed, queried, linked, and versioned.

## Add One Layer: Project Memory

The memory layer should not replace the intent graph.

It should sit above it.

```text
knowledge graph -> intent graph -> code/evidence
        \              \
         \              -> memory events
          -> memory events
```

Concrete tables:

```sql
CREATE TABLE knowledge_sources (
  id VARCHAR(128) PRIMARY KEY,
  kind VARCHAR(32) NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  content_hash VARCHAR(128),
  captured_at TIMESTAMP NOT NULL
);

CREATE TABLE memory_events (
  id VARCHAR(128) PRIMARY KEY,
  kind VARCHAR(32) NOT NULL,
  summary TEXT NOT NULL,
  reason TEXT,
  actor VARCHAR(128),
  occurred_at TIMESTAMP NOT NULL
);

CREATE TABLE memory_event_links (
  event_id VARCHAR(128) NOT NULL,
  target_type VARCHAR(64) NOT NULL,
  target_id VARCHAR(128) NOT NULL,
  relation VARCHAR(64) NOT NULL,
  PRIMARY KEY (event_id, target_type, target_id, relation)
);

CREATE TABLE memory_embeddings (
  owner_type VARCHAR(64) NOT NULL,
  owner_id VARCHAR(128) NOT NULL,
  embedding VECTOR(1536),
  model VARCHAR(128) NOT NULL,
  content_hash VARCHAR(128) NOT NULL,
  PRIMARY KEY (owner_type, owner_id, model)
);
```

Now memory is not a blob of text.

It is linked project history.

An incident can link to a spec.
A spec can link to an acceptance criterion.
An acceptance criterion can link to code.
A code location can link to CI evidence.
A decision can link to external knowledge.

## Commit the Brain

When Coherence accepts a changelist, it writes all related records in one transaction:

```sql
START TRANSACTION;

INSERT INTO knowledge_sources (...)
VALUES (...);

INSERT INTO specs (...)
VALUES (...);

INSERT INTO acceptance_criteria (...)
VALUES (...);

INSERT INTO memory_events (...)
VALUES (...);

INSERT INTO memory_event_links (...)
VALUES (...);

CALL DOLT_ADD(
  'knowledge_sources',
  'specs',
  'acceptance_criteria',
  'memory_events',
  'memory_event_links'
);

CALL DOLT_COMMIT(
  '-m',
  'decision: require explicit user action for clipboard writes'
);
```

That Dolt commit is now a snapshot of the project brain.

Not just the code.
Not just the specs.
Not just the docs.

The whole reasoning state.

## Time Travel

A year later, someone asks:

> Why do we reject background clipboard writes?

Coherence can query the current graph:

```sql
SELECT
  m.summary,
  m.reason,
  l.target_type,
  l.target_id
FROM memory_events m
JOIN memory_event_links l ON l.event_id = m.id
WHERE l.target_type = 'acceptance_criterion'
  AND l.target_id = 'ac.clipboard.reject_background_write';
```

But the more interesting query is historical:

```sql
SELECT *
FROM acceptance_criteria AS OF 'HEAD~100'
WHERE id = 'ac.clipboard.reject_background_write';
```

Or:

```sql
SELECT *
FROM dolt_history_acceptance_criteria
WHERE id = 'ac.clipboard.reject_background_write'
ORDER BY commit_date;
```

Or:

```sql
SELECT *
FROM dolt_commit_diff_acceptance_criteria
WHERE from_commit = HASHOF('HEAD~1')
  AND to_commit = HASHOF('HEAD');
```

That gives us a real answer to:

> When did this intent change?
> Who changed it?
> What else changed in the same commit?
> Which memory event explains it?
> Which source knowledge justified it?

This is not RAG over vibes.

This is versioned reasoning.

## Vectors Are an Index, Not the Source of Truth

Semantic search is still useful.

You want to ask:

> Why did we change clipboard behavior?

And find related decisions even if the exact words do not match.

So memory records can have embeddings.

But embeddings should not be the durable source of truth.

The durable source of truth is relational:

```text
memory_event
memory_event_links
spec
acceptance_criterion
knowledge_source
code_location
evidence
```

The vector index is just the fast recall path.

The answer still comes from versioned records.

## Why This Matters

Most engineering systems preserve artifacts.

Git preserves files.
CI preserves logs.
Issue trackers preserve tasks.
Docs preserve narratives.
Slack preserves noise.

But the actual project brain lives between them.

Coherence can make that brain explicit.

And if the brain is stored in Dolt, it becomes:

```text
diffable
branchable
mergeable
reviewable
queryable
time-travelable
```

That unlocks a new workflow:

```text
git diff over code
dolt diff over intent
dolt diff over memory
```

Now a reviewer can ask:

> This code changed. Did the intent change?
> This spec changed. Was there evidence?
> This incident happened. Which acceptance criteria were updated?
> This external knowledge changed. Which product decisions depend on it?

## Killer Feature

The killer feature is not "AI memory".

The killer feature is:

> time travel for project understanding.

You can go back to the exact moment when the project believed something different.

Then ask:

> What did we know?
> What did we decide?
> What did we change?
> What did we verify?
> Why did we think this was correct?

That is project memory.

And once project memory is versioned, "why did we do this?" stops being archaeology.
