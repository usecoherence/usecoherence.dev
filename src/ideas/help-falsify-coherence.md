---
layout: layout.njk
title: "Help falsify Coherence"
description: "A request for prior art, failed attempts, sharp objections, and reasons this idea may be wrong."
date: 2026-06-21
tags:
  - ideas
  - coherence
  - prior-art
  - falsification
---

# Help falsify Coherence

I am building Coherence.

The short version:

> Coherence is an attempt to make product intent, specifications, acceptance criteria, code, and verification evidence part of one reviewable graph.

That sounds abstract, so here is the actual problem.

Software teams constantly lose the connection between:

* what was intended
* what was built
* why it was built this way
* how we know it still works
* what changed when the implementation changed
* which tests verify which claim
* which decisions are still valid
* which parts of the system are only accidentally correct

Most teams have fragments of this connection spread across tickets, pull requests, comments, tests, docs, Slack threads, architecture decision records, and human memory.

For a while, this works.

Then the people who understood the original intent leave, the tickets become stale, the docs drift, the tests become local facts without product context, and the codebase turns into an archaeological site.

You can still read the code.

But you can no longer easily answer:

> What is this code supposed to mean?

That is the problem I am trying to solve.

But this page is not a pitch.

This is a request for falsification.

I am not looking for encouragement. I am looking for prior art, failed attempts, sharp objections, and reasons this idea may be wrong.

If this reminds you of something, I want to know.

If someone already tried this and failed, I want to know.

If the hidden assumption is wrong, I want to know.

If the real solution is not a tool but a process, culture, market, incentive, or organizational change, I want to know.

## My current claim

My current claim is this:

> Durable intent should exist as a first-class artifact outside code, tickets, and tests.

By "durable intent" I mean a stable representation of what the system is supposed to do and why that outcome matters.

Not a vague requirement.

Not a meeting note.

Not a task title.

Not a doc that immediately starts drifting from reality.

Something smaller, sharper, and connected to verification.

In Coherence, the rough shape is:

```txt
Intent
  -> Specification
    -> Acceptance Criteria
      -> Code Artifacts
      -> Tests
      -> Evidence
      -> Decisions
```

A specification names an intended outcome.

Acceptance criteria make that outcome reviewable.

Code artifacts implement it.

Tests and evidence verify it.

Decisions explain why this shape exists instead of another one.

The important part is not any single node.

The important part is the graph.

## Why I think this matters

When teams work on software, they usually verify implementation locally.

A test passes.

A pull request is reviewed.

A ticket is closed.

A deploy succeeds.

But the broader meaning often stays implicit.

A test can verify behavior without explaining which product claim it protects.

A ticket can describe work without staying connected to the resulting code.

A pull request can explain a change without preserving the larger decision tree.

A document can describe intent without knowing whether the code still satisfies it.

This creates a strange failure mode.

The system can look healthy at the implementation level while becoming incoherent at the product and architecture level.

The code still runs.

The tests still pass.

The team still ships.

But nobody can clearly explain the shape of the system anymore.

When this happens, every meaningful change becomes expensive.

Not because changing code is always hard.

But because rebuilding understanding is hard.

## Adjacent things I know about

I know Coherence is not emerging in a vacuum.

At minimum, it is adjacent to:

* BDD and Gherkin
* requirements management
* traceability matrices
* test case management
* TCKs
* ADRs
* model-driven engineering
* Intentional Software
* JetBrains MPS
* language workbenches
* knowledge graphs
* code intelligence
* SCIP
* static analysis
* architecture fitness functions
* specification by example
* executable specifications
* formal methods
* product discovery workflows
* Jira / Linear / Notion / GitHub issue workflows
* internal platform engineering practices

Some of these are close in spirit.

Some are close in mechanism.

Some may already contain the answer.

Some may be dead ends that explain why this should not work.

That is exactly what I am trying to find out.

## What I am not claiming

I am not claiming that Coherence replaces tests.

It does not.

I am not claiming that every team needs heavyweight requirements management.

Most teams do not.

I am not claiming that specs should become giant documents.

They should not.

I am not claiming that developers should stop reading code.

They should not.

I am not claiming that every detail should be modeled.

That would probably kill the system.

The claim is narrower:

> Some product and engineering intent is important enough to preserve as a first-class, reviewable, connected artifact.

The question is whether that claim is true, useful, and practical.

## What would prove me wrong

I would be wrong if any of these are true:

1. This already exists and failed for structural reasons I have not understood.

2. Teams do not actually need durable intent outside existing tools.

3. The cost of maintaining the graph is higher than the cost of losing the context.

4. The only teams that need this are already using mature requirements, verification, or safety-critical engineering processes.

5. The useful version of this is just "write better tickets and tests."

6. The graph becomes stale faster than it creates value.

7. The right primitive is not intent, specs, or acceptance criteria, but something else entirely.

8. The problem is real, but the solution cannot be adopted bottom-up by developers.

9. This only works for solo developers or tiny teams.

10. The real buyer and the real user are different in a way that makes adoption impossible.

If you believe one of these is true, that is useful feedback.

Especially if you can point to a concrete example.

## The questions I am stuck on

These are the questions I am currently trying to answer.

### 1. What is the right primitive?

Is the core primitive:

* intent
* specification
* acceptance criterion
* decision
* changelist
* test
* evidence
* code artifact
* workflow
* something else?

My current bias is that intent is the smallest meaningful unit, but specs and acceptance criteria may be the first practical surface.

I may be wrong.

### 2. Where should the graph start?

Should Coherence start from product specs and connect down to code?

Or should it start from existing code and recover intent upward?

Or should it start from changelists, because changes are where intent becomes concrete?

Current bias:

* greenfield or explicit work starts from specs
* existing systems need reverse-specification from code
* day-to-day adoption probably starts from changelists

Again, I may be wrong.

### 3. Who is this for first?

Possible first users:

* solo developers building complex systems
* senior engineers trying to preserve design intent
* staff engineers reviewing cross-cutting changes
* platform teams
* QA / verification teams
* technical founders
* AI coding agent users
* teams modernizing legacy systems
* regulated / audit-heavy teams

I do not yet know which group feels the pain sharply enough to care.

### 4. Is this a product tool, developer tool, or verification tool?

It touches all three, which is dangerous.

Tools that touch too many categories often become impossible to explain.

My current framing is:

> Coherence is a verification layer for intent.

But that may still be too abstract.

### 5. What is the smallest useful version?

The full graph is not the first product.

The smallest useful version may be something like:

```txt
For this change:
  - what intent does it serve?
  - which acceptance criteria does it satisfy?
  - which files implement it?
  - which tests verify it?
  - what evidence was produced?
```

That may be enough.

Or even that may be too much.

## The kind of feedback I need

The most useful response is not:

> Cool idea.

The most useful response is one of these:

> This reminds me of X.

> You should look at Y.

> This failed before because Z.

> Your hidden assumption is wrong.

> The actual buyer is not who you think.

> The actual user is not who you think.

> This already exists in safety-critical systems as X.

> This is just Y with different words.

> The hard part is not the graph. The hard part is keeping it updated.

> The hard part is not the tool. The hard part is incentives.

> Developers will not maintain this manually.

> AI agents make this more useful.

> AI agents make this impossible.

> This only works if it is generated from existing workflows.

> This only works if it becomes part of code review.

> This only works if it is local-first.

> This only works if it integrates with GitHub / GitLab / Linear / Jira.

> This should not be a SaaS.

> This has to be a SaaS.

Any of these is more useful than validation.

## The response format

If you want to help, the best possible response looks like this:

```txt
This reminds me of:
- ...

You should look at:
- ...

This may have failed before because:
- ...

Your riskiest assumption seems to be:
- ...

The most useful next experiment would be:
- ...
```

A short reply is enough.

One good pointer can save me weeks.

## Why this page exists

I spent a long time trying to validate this mostly alone.

That is a terrible way to work on a problem with a lot of prior art.

LLMs were useful for making me more diligent. They helped me ask more questions, compare concepts, and keep refining the shape of the idea.

But they were not enough.

They did not reliably surface the most important historical references.

They did not know which attempts failed inside companies.

They could not tell me which ideas were obvious to someone who had spent 20 years in requirements engineering, model-driven engineering, verification, or developer tooling.

They could not replace a human saying:

> Wait, this reminds me of something. Go look at this.

That kind of feedback is extremely valuable.

And it is weirdly hard to get if you do not already have distribution.

So this page is my attempt to make the request explicit.

Not "please give feedback."

More specifically:

> Please help me falsify Coherence.

## Current working definition

Coherence is a system for preserving and verifying intent across software work.

It connects:

* product intent
* specifications
* acceptance criteria
* code artifacts
* tests
* evidence
* decisions
* change history

The goal is not to create more process.

The goal is to make understanding durable.

## Final request

If Coherence reminds you of prior art, failed tools, research projects, internal systems, academic work, standards, or old ideas with different names, please tell me.

If you think the premise is wrong, please tell me.

If you think the premise is right but the shape is wrong, please tell me.

The best outcome of this page is not that people agree with me.

The best outcome is that the idea becomes harder to fool myself about.
