---
layout: layout.njk
title: Case — Revising an Earlier Decision During Feature Development
description: Git cannot mutate an earlier commit while preserving its descendants. Coherence decouples logical change identity from snapshot history.
---

# Case: Revising an Earlier Decision During Feature Development

### 1. Problem

We implement username uniqueness:

```text
main
 └─ A  add users.username
     └─ B  validate username uniqueness
         └─ C  expose username through API
```

```ruby
# commit B
validates :username, uniqueness: true
```

While implementing `C`, we discover the actual requirement:

```gherkin
Usernames must be unique regardless of letter case.
```

The change belongs logically to commit `B`, not after `C`.

```ruby
validates :username,
  uniqueness: { case_sensitive: false }
```

Git cannot mutate `B` while preserving its descendants:

```bash
git commit --fixup B
git rebase -i --autosquash main
```

Result:

```text
A  → A'
B  → B'
C  → C'
```

The commit graph was rewritten because an earlier implementation decision changed.

### 2. What broke

The feature is one mutable logical change:

```text
Add usernames
 ├─ persist username
 ├─ enforce case-insensitive uniqueness
 └─ expose username through API
```

Git represents it only as immutable snapshots:

```text
A → B → C
```

The semantic relation between the requirement and commit `B` exists nowhere.

### 3. Typical solution

```bash
git commit --fixup B
git rebase --autosquash main
git push --force-with-lease
```

Or developers leave this history:

```text
A  add username
B  validate uniqueness
C  expose through API
D  actually make uniqueness case-insensitive
E  fix tests
```

### 4. Coherence solution

The stable unit of work is the changelist, not an individual Git commit:

```rust
coherence_slice! {
    changelist "add-usernames" {
        spec "product/usernames" {
            title: "Usernames"
            level: System
            status: Active

            ac "stores-username" {
                title: "Stores the username"
                intent: "A chosen username is persisted for the user"
                risk: Medium
                concerns: [Correctness]

                links {
                    implemented_by file "app/models/user.rb"
                    verified_by test "bundle exec rspec spec/models/user_spec.rb"
                }
            }

            ac "requires-unique-username" {
                title: "Requires a unique username"
                intent: "Duplicate usernames are rejected"
                risk: High
                concerns: [Correctness, Security]

                links {
                    implemented_by file "app/models/user.rb"
                    verified_by test "bundle exec rspec spec/models/user_spec.rb"
                }
            }

            ac "exposes-username-through-api" {
                title: "Exposes the username through the API"
                intent: "API clients can read the user's username"
                risk: Medium
                concerns: [Correctness]

                links {
                    implemented_by file "app/serializers/user_serializer.rb"
                    verified_by test "bundle exec rspec spec/requests/users_spec.rb"
                }
            }
        }
    }
}
```

While implementing the API criterion, we discover that the uniqueness requirement was incomplete.

The specification changes:

```diff
 ac "requires-unique-username" {
     title: "Requires a unique username"
-    intent: "Duplicate usernames are rejected"
+    intent: "Usernames differing only by letter case are rejected"
     risk: High
     concerns: [Correctness, Security]
 }
```

The changelist and acceptance criterion retain their stable identities:

```text
changelist: add-usernames
ac:         requires-unique-username
```

The implementation may still produce this temporary Git history:

```text
A  implements stores-username
B  implements requires-unique-username
C  implements exposes-username-through-api
D  corrects requires-unique-username
```

Git may later rewrite or squash `B–D`.

Coherence does not pretend that commit `B` is the stable feature object. It records another version of the same changelist and acceptance criterion, preserving the evolving intent independently of the temporary commit graph.
