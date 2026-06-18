---
layout: layout.njk
title: Code Quality Is a Specification
description: Architecture, abstractions, and readability can be represented as verifiable claims instead of review-time taste.
---

# Code Quality Is a Specification

## 1. Problem

Behavioral tests can pass while code quality gets worse.

A change can preserve user-visible behavior and still make the system harder to change, reason about, or review:

* dependency direction slowly drifts from the intended architecture;
* domain rules become duplicated across layers;
* modules grow until they are technically correct but no longer reviewable.

The repository can usually verify:

* whether tests pass;
* whether the code compiles;
* whether a feature behaves as expected.

It often cannot verify:

* whether architecture constraints still hold;
* whether an abstraction still has one clear responsibility;
* whether the implementation remains readable enough to review safely.

## 2. What broke

“Maintainable”, “readable”, and “well-architected” existed only as expectations.

They were not represented as claims with observable evidence.

This makes code quality dependent on review timing, reviewer taste, team memory, and undocumented convention.

A reviewer may write:

> This does not feel right.

That feedback may be correct, but the repository has no structured way to explain which quality expectation was violated, how to verify it, or when an exception is acceptable.

## 3. Typical solution

Teams usually rely on a mix of conventions:

* code review comments;
* architecture documents;
* linter rules;
* style guides;
* senior engineers remembering why a boundary exists.

Each of these helps, but none of them is the stable unit of truth.

The architecture document may drift. The linter may check only syntax-level properties. The review comment may disappear into pull request history. The senior engineer may not review the next change.

## 4. Coherence solution

Code quality becomes part of the specification.

The shape is:

```text
value → claim → observable property → verifier → evidence
```

Coherence does not define what “good code” means for every organization.

It requires the organization to define what it means here, in this repository, for this system.

That definition can then be reviewed, tested, revised, and linked to code changes like any other bounded claim.

## 5. Architecture

Architecture is a set of constraints over allowed dependencies and responsibilities.

Instead of relying on a diagram that is never verified, the team can define a claim about the chosen structure:

```text
value: maintainability
claim: HTTP handlers depend on application services, not on database repositories
property: no import path from inbound adapters to persistence adapters
verifier: dependency graph analysis
evidence: structured dependency report for the changed files
```

The point is not that this architecture is universally correct. It is that what would otherwise be a gradually fading convention becomes an explicit, verifiable claim.

## 6. Abstractions

Abstraction quality is about ownership and responsibility.

When a domain concept exists in more than one place, the team pays a maintenance cost. Instead of relying on a reviewer to notice duplication, the team can define a claim about ownership:

```text
value: maintainability
claim: a given business rule has exactly one implementation location
property: all call sites reference the same definition
verifier: code ownership check and targeted tests
evidence: report of call sites and test results
```

The important part is not the exact verifier. It is that “do not duplicate this logic” becomes a bounded claim, not an informal preference repeated during review.

## 7. Readability

Readability cannot be reduced to one metric.

But some signals are observable: a module that grows past a reasonable size, a function with high cyclomatic complexity, an import list that keeps expanding.

```text
value: reviewability
claim: each module remains reviewable by an engineer familiar with the system
property: module size and orchestration complexity stay within agreed bounds
verifier: complexity thresholds and, where needed, explicit reviewer sign-off
evidence: metric output and recorded reviewer acceptance
```

Human judgment still matters. Coherence does not replace it. It records what was judged, why it mattered, and which evidence supported the judgment.

## 8. Limits

A metric is a model, not the property itself.

“Cyclomatic complexity <= 10” does not mean the code is readable. It means the team has chosen one signal that may indicate when readability needs attention.

The claim should remain open to revision when the signal stops matching reality.

That is the point of treating code quality as a specification: not to freeze taste into rules, but to make quality expectations explicit, reviewable, and revisable.
