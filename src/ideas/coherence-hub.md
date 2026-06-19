---
layout: layout.njk
title: Coherence Hub
description: A web interface that turns a repository into a version-controlled graph of intent, implementation, and evidence.
---

# Coherence Hub

GitHub stores how the code changed.

Coherence Hub should show what that change means.

The basic model is familiar:

* one repository is one project
* a project may be connected to GitHub or GitLab
* the repository remains the source of truth
* Coherence Hub provides the specification, analysis, and review layer above it

A project would live at:

```text
hub.usecoherence.dev/{owner}/{project}
```

## Importing a project

The minimum required input is a repository URL.

A compatible repository contains:

```text
.coherence/
├── project.toml
└── specs.jsonl
```

From there, the Hub can discover the rest.

It detects the languages used by the project, runs the appropriate SCIP indexers, imports the specification graph, connects specifications to code locations, and generates the required artifacts.

The user should not need to configure the entire analysis pipeline before seeing anything useful.

Add the repository. Let Coherence inspect it.

## Project view

A project page should provide a web interface for exploring:

* specifications and acceptance criteria
* relations between specifications
* specification slices
* the editable Coherence DSL
* code locations and tests linked to individual claims
* generated code graphs
* verification and coverage results
* historical revisions of the specification graph

The same project should remain accessible through the CLI, TUI, and public API.

The web interface is not a replacement for local tools. It is another client for the same underlying model.

## Change review

A normal pull request shows a code diff.

A Coherence change review should show:

* the code diff
* the specification diff
* acceptance criteria added, changed, or removed
* relations added or removed from the graph
* code locations affected by the change
* claims whose verification status changed
* the minimal specification slice required to understand the change

This turns a pull request from:

> Here are the lines that changed.

into:

> Here is the intended outcome, the claims that define it, the code that implements it, and the evidence that verifies it.

Initially, Coherence Hub does not need to replace GitHub or GitLab pull requests.

It can attach analysis to an existing upstream pull request, publish checks, and provide a richer review page.

Later, Coherence changelists may become native review objects of their own and materialize into branches and commits in the connected repository.

## Specification issues and pull requests

Specifications are version-controlled project data.

They should therefore support the same collaboration model as code:

* issues proposing missing or incorrect behavior
* pull requests updating specifications
* inline review comments
* approvals
* automated checks
* historical blame and revision browsing

A specification update may exist without an immediate code change.

A code change may reveal that the specification is incomplete.

Both are valid changes to the same project model.

## Project discovery

Public repositories containing a valid `.coherence` directory can be indexed automatically.

This creates a discovery layer for Coherence-compatible projects:

* browse public specification graphs
* inspect how other projects structure acceptance criteria
* explore reusable rules and architectural constraints
* find projects with unusually strong specification coverage
* fork an existing project together with its specification graph

GitHub lets us discover code.

Coherence Hub could let us discover explicit software intent.

## Authentication and permissions

The Hub should support:

* GitHub authentication
* GitLab authentication
* email authentication
* public SSH keys for CLI and TUI access

Private repositories should mirror the permissions of their connected provider.

A user who cannot access the upstream repository must not be able to inspect its specification graph, code index, generated artifacts, or change history through Coherence Hub.

## Architecture

The Hub is primarily a control plane over repositories and generated artifacts.

It needs to coordinate:

* repository synchronization
* webhook processing
* SCIP indexing
* specification imports
* graph materialization
* asynchronous verification jobs
* pull request checks
* live review updates
* API and client sessions

Elixir, Erlang, and Phoenix are a natural fit for this workload: many concurrent projects, supervised background processes, streaming updates, and long-running indexing pipelines.

The Coherence runtime itself does not need to be rewritten in Elixir.

The Hub coordinates existing tools and stores their results.

## First version

The first useful version only needs to:

1. import a public GitHub repository
2. read `.coherence/project.toml` and `specs.jsonl`
3. detect and index supported source languages
4. render specifications, acceptance criteria, links, slices, and DSL
5. compare two repository revisions
6. show specification and code changes together
7. expose the project through a public API

Native issues, native pull requests, private repositories, GitLab integration, and project discovery can follow later.

The smallest valuable product is not another Git forge.

It is a place where a repository becomes understandable as a version-controlled graph of intent, implementation, and evidence.

GitHub stores the software.

Coherence Hub explains it.
