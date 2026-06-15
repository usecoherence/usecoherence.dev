---
layout: layout.njk
title: Built-in Distribution
description: Coherence should not require a separate distribution strategy.
---

# Built-in Distribution

Coherence should not require a separate distribution strategy.

The project itself should distribute Coherence to every contributor.

A repository contains its specifications, acceptance criteria, relations, and code links in a portable format:

```text
.coherence/
  project.toml
  specs.jsonl
```

When someone clones the repository, they receive not only the code, but also the intent behind it.

## MVP

The first version uses JSONL as the canonical interchange format.

JSONL is:

* easy to generate and parse;
* readable without special tooling;
* diffable in Git;
* portable between implementations;
* usable offline;
* simple enough to bootstrap Coherence itself.

The expected workflow:

```text
clone repository
→ read Coherence graph
→ change code or specifications
→ generate a changelist
→ review code and intent together
→ commit the updated graph
```

Every clone distributes Coherence.

Every pull request exposes it to contributors and reviewers.

Every updated repository carries it forward.

## Why this may work

Coherence becomes useful to other people automatically:

* contributors understand why code exists;
* reviewers see which outcomes may be affected;
* future maintainers inherit product knowledge;
* tools and agents receive structured context.

Using Coherence makes collaboration easier for everyone else, so users have an incentive to preserve and propagate it.

## Scaling

A single JSONL file may eventually become too large.

That is not an MVP problem.

Possible future storage models include:

* JSONL split by domain or specification;
* content-addressed immutable chunks;
* local SQLite materialization;
* Dolt as the canonical database;
* a hosted service that returns only the required graph slice.

The repository may eventually contain only a manifest and the latest relevant state.

The important part is not JSONL itself.

The important part is that the repository distributes the Coherence protocol and enough state to participate in it.
