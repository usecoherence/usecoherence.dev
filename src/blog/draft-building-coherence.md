---
layout: layout.njk
title: Building Coherence
description: Why software engineering needs a language for intent.
---

# Building Coherence

<div class="lede">
Why software engineering needs a language for intent.
</div>

## The common pain

There are three kinds of engineers today:

- **(a)** writes code without modern AI tooling — requirements are scattered across external sources, inconsistent, and often drift from what the code does;
- **(b)** uses agentic workflows daily and prefers to describe systems at a high level — the cognitive effort to understand code written by agents grows with system complexity, eventually leading to cognitive surrender;
- **(c)** uses agents occasionally and stays close to the code — the time spent reviewing and fixing agent-written code rivals writing it from scratch, creating friction that skews teams toward either 100% hand-written or 100% agent-generated code.

In all three cases, generated code is poorly connected to external knowledge and artifacts. This creates friction between understanding two sources of truth:

- intent of product requirements derived from external sources;
- intent of code semantics created by an agent, by the engineer themselves, or by another teammate.

This problem is not new. Previous attempts — IBM DOORS, SRS documents, formal specifications — share a common flaw: they are expensive to maintain, not wired into modern CI/CD tooling, or too complex for an average developer.

The failure of these methods pushed companies toward the path of least resistance: accepting code as the single source of truth. This approach is becoming increasingly difficult to justify. Agents change code too fast without respecting intent.

Recent work has bridged the gap between external knowledge and agent runtime — MCPs, knowledge graphs, source code graphs — connected into a single system with a human operator as the main oracle. But this tooling still doesn't address the problem of **formulating intent**.

## Why formulating intent is a problem

### What exactly is intent?

A decision for a single constraint of a system, aligned with defined outcomes, and bounded by two aspects simultaneously:

1. The system itself.
2. The boundaries around it.

Intent can change under multiple scenarios:

- evolution of the outcome;
- evolution of the system;
- evolution of the boundaries.

Intent exists to reduce chaos emanating from real-world uncertainty, ambiguous requirements, and the system itself.

But the very first step before defining intent is formulating an outcome. A single granular decision is meaningless without it. And before we can do that, we have to understand why chaos makes formulating outcomes difficult.

### What is chaos?

From physics:

> The property of a complex system whose behavior is so unpredictable as to appear random, owing to great sensitivity to small changes in conditions.

Pragmatically, we cannot predict how a dynamic system will behave under the same conditions. A slight change yields widely diverging outcomes, even if the parts of the system are deterministic.

### What is an outcome?

From probability theory:

> An outcome is a possible result of an experiment or trial.

This aligns with chaos theory, because we are designing a complex system with events, processes, and changing elements. All of that creates chaos. An outcome is a possible future that can happen in this system.

Formulating an outcome means deciding which observable future state of the system we want to make more likely. This does not eliminate uncertainty or make the system predictable. It reduces the space of acceptable futures. Before an outcome is defined, many system states may appear equally valid. Our goal is to distinguish wanted from unwanted behavior.

### Outcomes are subjective

We do not observe the world from nowhere.

Every observation is made by a subject with limited knowledge, previous experiences, beliefs, incentives, responsibilities, and a particular model of what mattered before the observation.

We know the glass is never half full or empty. Even though it is the same object, we do not observe the same problem. Across a population of subjects, we can model these interpretations as a probability distribution over possible problem formulations. Some will be more likely than others because we share similar experiences, roles, and models of the world.

But the distribution itself is not fixed. If we change the population, the available evidence, or the system boundaries — the shape changes too.

This brings us to consensus:

> Consensus is the concentration of probability around a shared formulation.

One important point people often miss: consensus does not mean the formulation is correct. It is simply a mechanism to reduce social uncertainty. We agree because we come from a similar set of past observations about the world. That does not make us right about it.

Science is where shared formulation comes into contact with reality. New evidence can emerge. Assumptions can be invalidated. Unexpected system behavior can be discovered. Competing interpretations can find their way in.

Consensus helps us coordinate around a shared model, but research allows us to challenge it. We move forward only when we question what we believe, understand the reasons behind disagreement, and revise conclusions based on new evidence.

A better outcome might lie where most disagree. That must not stop us from challenging beliefs. But it is genuinely hard, because people are social creatures. They do not want to stand far from consensus. Paul Graham talks about this in depth.

### How to formulate an outcome under uncertainty?

This is the question Coherence exists to answer.

*To be continued.*
