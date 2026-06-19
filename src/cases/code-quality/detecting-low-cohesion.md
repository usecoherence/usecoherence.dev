---
layout: layout.njk
title: Case — Detecting Low Cohesion During Feature Development
description: One business decision duplicated across five entry points. Coherence connects specification cohesion to code structure.
---

# Case: Detecting Low Cohesion During Feature Development

## 1. Problem

A Rails application supports several ways to add a member to a project:

```text
REST API
GraphQL mutation
CSV import
external directory sync
invitation acceptance
admin interface
```

Each entry point creates the membership directly.

The REST endpoint:

```ruby
class ProjectMembersController < ApplicationController
  def create
    membership = project.memberships.create!(
      user: User.find(params[:user_id])
    )

    render json: membership
  end
end
```

The GraphQL mutation:

```ruby
class Mutations::AddProjectMember < BaseMutation
  def resolve(project_id:, user_id:)
    project = Project.find(project_id)

    {
      membership: project.memberships.create!(
        user: User.find(user_id)
      )
    }
  end
end
```

The import service:

```ruby
class BulkMemberImport
  def import(project, rows)
    rows.each do |row|
      project.memberships.create!(
        user: User.find_by!(email: row.fetch("email"))
      )
    end
  end
end
```

The synchronization job and invitation flow perform the same write through their own paths.

A new requirement is introduced:

> Archived projects must not accept new members.

The requirement is small.

The implementation is not.

```text
8 files changed, 46 insertions(+), 11 deletions(-)
```

Every entry point receives another version of the same decision:

```ruby
raise ProjectArchived if project.archived?
```

The REST endpoint checks it.

The GraphQL mutation checks it.

The importer checks it.

The synchronization job checks it.

The invitation flow checks it.

The frontend also hides the button:

```tsx
{!project.archived && (
  <AddMemberButton projectId={project.id} />
)}
```

The feature works.

The tests pass.

But one business decision now exists independently across several modules.

## 2. What broke

The specification describes one responsibility:

```text
project membership
└─ archived projects reject new members
```

The code represents it as several unrelated decisions:

```text
ProjectMembersController
└─ checks archived state
   └─ creates membership

AddProjectMember mutation
└─ checks archived state
   └─ creates membership

BulkMemberImport
└─ checks archived state
   └─ creates membership

SyncExternalMembersJob
└─ checks archived state
   └─ creates membership

ProjectInvitation
└─ checks archived state
   └─ creates membership
```

No implementation boundary owns the operation:

```text
admit a member to a project
```

This is low cohesion.

The code is grouped around delivery mechanisms:

```text
controllers
graphql
jobs
imports
models
```

But the business capability is distributed between them.

Changing one membership rule requires finding and modifying every path that happens to create a membership.

This creates change amplification:

```text
one acceptance criterion
        ↓
five independent decision sites
        ↓
eight modified files
        ↓
multiple opportunities to miss a path
```

The number of files alone is not the problem.

The frontend, API adapters, domain implementation, and tests may reasonably live in different files.

The problem is that several modules independently decide whether the operation is allowed.

Each decision site can drift without the others.

## 3. Typical solution

The engineer searches for membership creation:

```bash
rg 'memberships\.create|ProjectMembership\.create' app
```

They find the known entry points and patch each one:

```ruby
raise ProjectArchived if project.archived?
```

A reviewer may notice the duplication:

> This rule should probably live in one place.

The code is then extracted into a service:

```ruby
module ProjectMembership
  class AddMember
    def self.call(project:, user:)
      raise ProjectArchived if project.archived?

      project.memberships.create!(user:)
    end
  end
end
```

Each entry point is expected to delegate to it:

```ruby
ProjectMembership::AddMember.call(
  project:,
  user:
)
```

This improves the implementation.

But the repository still cannot answer:

```text
Did every membership creation path migrate?

Does any entry point still write directly?

Will a future feature bypass this service?

Does this class own one coherent capability,
or has it merely become another generic service object?
```

A reviewer can search for direct writes.

A linter can forbid selected calls.

A code ownership rule can require approval.

A large-diff warning can report that eight files changed.

Each mechanism detects part of the problem.

None of them connects the evidence to the original claim:

> Membership admission has one coherent implementation boundary.

## 4. Coherence solution

The behavioral requirement and the cohesion requirement are represented together:

```rust
coherence_slice! {
    changelist "reject-members-for-archived-projects" {
        spec "product/project-membership" {
            title: "Project membership"
            level: System
            status: Active

            links {
                constrained_by "quality/project-membership-cohesion"
            }

            ac "rejects-members-for-archived-projects" {
                title: "Archived projects reject new members"
                intent: "No production path can add a member to an archived project"
                risk: High
                concerns: [Correctness, Maintainability]

                links {
                    implemented_by file "app/domain/project_membership/add_member.rb"
                    verified_by test "bundle exec rspec spec/domain/project_membership/add_member_spec.rb"
                    verified_by feature "features/project_membership.feature"
                }
            }
        }

        context {
            spec "quality/project-membership-cohesion" {
                title: "Project membership cohesion"
                level: Module
                status: Active

                ac "membership-admission-has-one-owner" {
                    title: "Membership admission has one implementation owner"
                    intent: "All production paths delegate membership admission decisions to one cohesive domain boundary"
                    risk: High
                    concerns: [Maintainability, Correctness]

                    links {
                        verified_by test "bin/check-project-membership-cohesion"
                    }
                }

                ac "membership-writes-pass-through-owner" {
                    title: "Membership writes pass through the domain boundary"
                    intent: "Adapters do not create project memberships directly"
                    risk: High
                    concerns: [Maintainability, Correctness]

                    links {
                        verified_by test "bin/check-project-membership-write-paths"
                    }
                }
            }
        }
    }
}
```

The verifier combines the specification graph with the SCIP code graph.

Before the change, it discovers:

```text
product/project-membership
└─ rejects-members-for-archived-projects
   ├─ decision sites: 5
   ├─ direct membership writes: 5
   ├─ production entry points: 5
   └─ cohesive implementation owners: 0
```

It can show the affected code surface:

```text
Archived projects reject new members
├─ app/controllers/project_members_controller.rb
├─ app/graphql/mutations/add_project_member.rb
├─ app/services/bulk_member_import.rb
├─ app/jobs/sync_external_members_job.rb
├─ app/models/project_invitation.rb
├─ app/policies/project_policy.rb
├─ app/frontend/components/AddMemberButton.tsx
└─ spec/requests/project_members_spec.rb
```

The report does not conclude:

> Eight files are too many.

It reports a more specific problem:

```text
quality/project-membership-cohesion
└─ membership-admission-has-one-owner

Five production paths independently decide whether
a project member may be added.

No cohesive implementation owner was found.
```

After the responsibility is centralized, the code graph becomes:

```text
REST controller ───────────────┐
GraphQL mutation ──────────────┤
CSV import ────────────────────┤
directory synchronization ────┼─→ ProjectMembership::AddMember
invitation acceptance ─────────┘              │
                                               ├─ checks project state
                                               └─ creates membership
```

The verifier now reports:

```text
membership admission
├─ production entry points: 5
├─ implementation owners: 1
├─ policy decision sites: 1
├─ direct writes outside owner: 0
└─ behavioral verification: passed
```

The engineer still has several valid choices:

1. centralize the responsibility behind one domain boundary;
2. split the operation if the entry points genuinely implement different policies;
3. revise the cohesion specification;
4. record a scoped exception for a deliberate direct path.

Coherence does not require one class, one function, or one file.

It verifies that one business responsibility maps to a coherent region of the code graph.

A tiny requirement producing a large diff is no longer merely inconvenient.

It becomes evidence that the implementation may not preserve the shape of the responsibility it implements.
