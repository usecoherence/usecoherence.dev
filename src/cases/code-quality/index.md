---
layout: layout.njk
title: Code Quality Cases
description: Architecture, abstractions, and readability as verifiable specifications.
---

# Code Quality

Architecture, abstractions, and readability as verifiable specifications.

Code quality is often treated as taste until it fails. Coherence treats it as a set of bounded claims: each claim names an observable property, the verifier that checks it, and the evidence produced by that verifier.

- [Code quality is a specification](/cases/code-quality/treating-code-quality-as-specification/) — why tests are not enough, and how quality claims can be made reviewable
- [Enforcing dependency direction](/cases/code-quality/enforcing-architectural-boundaries/) — an HTTP handler bypasses the application layer and imports a database repository directly
- [Making readability observable](/cases/code-quality/making-readability-verifiable/) — a method grows from 10 to 230 lines; tests still pass, but the cost of change has increased
- [Verifying abstraction boundaries](/cases/code-quality/verifying-abstraction-boundaries/) — four unrelated business rules share one abstraction; the code no longer reflects domain distinctions
