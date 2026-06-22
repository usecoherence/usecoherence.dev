---
layout: layout.njk
title: "Wiring intent to CI/CD"
description: "Specs describe promises. Tests verify code. CI checks tests. But does CI know which promise it's protecting?"
---

# Wiring intent to CI/CD

Most teams already have CI.

CI can tell you:

```txt
tests passed
tests failed
lint failed
build failed
```

That is useful.

But it does not answer the harder question:

```txt
Which promise did this change break?
```

That is the problem Coherence is trying to make visible.

Not by replacing CI.

By wiring intent into it.

## The problem

Imagine a tiny URL shortener.

The product promise is simple:

```txt
A user can submit a URL and receive a short URL.
The short URL redirects to the original URL.
```

That promise becomes a spec:

```coh
SPEC product/url-shortener/create-short-url
```

Then we add acceptance criteria:

```coh
AC accepts-valid-http-url
AC rejects-invalid-url
AC generates-unique-short-code
AC persists-short-url-before-response
AC redirects-short-code-to-original-url
```

Now the code changes.

Someone edits:

```txt
app/controllers/short_urls_controller.rb
app/models/short_url.rb
spec/requests/short_urls_spec.rb
```

Normal CI can say:

```txt
RSpec failed
```

But it cannot say:

```txt
The product claim "invalid URLs are rejected with a useful error" is broken.
```

That is the missing layer.

## The naive solution fails

The obvious solution is:

> Make developers update the specs every time they change code.

This fails.

People forget.

Agents forget.

Senior engineers forget because they are tired and trying to ship.

Another obvious solution is:

> Regenerate specs from code on every CI run.

That also fails.

You do not want CI to silently rewrite product intent because a controller changed.

That is backwards.

Code is not intent.

A test is not intent.

A generated summary of code is not intent.

The useful move is smaller:

```txt
Keep intent durable.
Keep code normal.
Keep tests normal.
Add links between them.
Run those links in CI.
```

## The actual relationship

Coherence adds a graph edge between the claim and the evidence.

```coh
SPEC product/url-shortener/create-short-url
  AC rejects-invalid-url
    implemented_by app/controllers/short_urls_controller.rb#create
    implemented_by app/models/short_url.rb
    verified_by spec/requests/short_urls_spec.rb:rejects_invalid_url
```

The test stays a normal test:

```ruby
RSpec.describe "Short URLs", type: :request do
  it "rejects invalid URLs" do
    post "/short_urls", params: { url: "not a url" }

    expect(response).to have_http_status(:unprocessable_entity)
    expect(response.body).to include("URL is invalid")
  end
end
```

Coherence records why that test matters:

```json
{
  "spec_slug": "product/url-shortener/create-short-url",
  "ac_slug": "rejects-invalid-url",
  "verified_by": "bundle exec rspec spec/requests/short_urls_spec.rb:12",
  "implemented_by": [
    "app/controllers/short_urls_controller.rb#create",
    "app/models/short_url.rb"
  ]
}
```

Now CI has something better than a pile of tests.

It has a map.

## What CI can do with the map

On every pull request, CI already knows the changed files:

```sh
git diff --name-only origin/main...HEAD
```

Suppose the result is:

```txt
app/models/short_url.rb
```

Coherence can ask:

```sql
select
  specs.slug as spec,
  acceptance_criteria.slug as ac,
  evidence.command as command
from code_artifacts
join ac_code_links on ac_code_links.code_artifact_id = code_artifacts.id
join acceptance_criteria on acceptance_criteria.id = ac_code_links.ac_id
join specs on specs.id = acceptance_criteria.spec_id
join evidence on evidence.ac_id = acceptance_criteria.id
where code_artifacts.path = 'app/models/short_url.rb';
```

That produces:

```coh
product/url-shortener/create-short-url
  AC accepts-valid-http-url
    bundle exec rspec spec/requests/short_urls_spec.rb:4

  AC rejects-invalid-url
    bundle exec rspec spec/requests/short_urls_spec.rb:12

  AC generates-unique-short-code
    bundle exec rspec spec/models/short_url_spec.rb:28
```

Now CI can run the relevant evidence.

Not the whole world.

Not a random test selection.

The evidence linked to the claims touched by the change.

## Example CI output

Bad output:

```txt
1 test failed
```

Better output:

```coh
BROKEN claim:

SPEC product/url-shortener/create-short-url
AC   rejects-invalid-url

INTENT:
When the user submits something that is not a valid http/https URL,
the system rejects it with a useful validation error and does not persist it.

EVIDENCE:
bundle exec rspec spec/requests/short_urls_spec.rb:12

Changed implementation:
app/models/short_url.rb
```

That is a much better review object.

A reviewer can now ask:

```txt
Did we intentionally change this behavior?
Should this AC be updated?
Should the code be fixed?
Is this test still proving the claim?
```

That is the point.

## What happens when intent changes

Sometimes the code is correct and the spec is old.

For example, maybe the product decision changes:

```txt
We should accept ftp:// URLs too.
```

Then the intent should change.

But that change should be explicit.

You write a changelist:

```rust
coherence_slice! {
    changelist "allow-ftp-urls" {
        spec "product/url-shortener/create-short-url" {
            ac "accepts-valid-url" {
                title: "Valid URLs are accepted"

                intent: """
                When the user submits a valid URL using an allowed scheme,
                the system persists it and returns a short URL.
                """

                allowed_schemes: ["http", "https", "ftp"]

                links {
                    implemented_by file "app/models/short_url.rb"
                    verified_by test "bundle exec rspec spec/requests/short_urls_spec.rb:4"
                }
            }
        }
    }
}
```

The changelist compiles into database updates.

The source of truth remains the graph.

The file is only the editing surface.

That matters.

We are not mixing specs into the codebase as comments.

We are not pretending Markdown near code is a durable intent model.

We are editing intent as data, compiling the change, and storing the result in a versioned graph.

## What happens when code has no intent link

This is where CI becomes interesting.

Suppose a pull request changes:

```txt
app/services/short_code_generator.rb
```

But no AC links to that file.

Coherence should not pretend everything is fine.

It should report:

```coh
UNMAPPED code change:

app/services/short_code_generator.rb

No linked ACs.
No linked EVIDENCE.
No known product/system/foundation claim owns this change.
```

That does not mean the change is bad.

It means the change is invisible to the intent graph.

The reviewer now has a concrete question:

```txt
Is this implementation-only?
Is there already an AC that should link to it?
Did we add behavior without adding a claim?
```

That is how drift becomes visible.

## What happens when tests change

Test changes are also suspicious.

Suppose a pull request changes:

```txt
spec/requests/short_urls_spec.rb
```

Coherence can ask:

```txt
Which claims use this test as evidence?
```

Output:

```coh
Evidence changed:

spec/requests/short_urls_spec.rb

Affected ACs:
  product/url-shortener/create-short-url.accepts-valid-http-url
  product/url-shortener/create-short-url.rejects-invalid-url
  product/url-shortener/redirect.redirects-short-code-to-original-url
```

Now the reviewer does not have to guess.

They can inspect the exact claims whose proof changed.

## This is not automatic intent rewriting

This is the important boundary.

Coherence should automatically update evidence status.

It can automatically detect changed code.

It can automatically find linked ACs.

It can automatically run the commands that prove those ACs.

It can automatically report unmapped changes.

But it should not silently rewrite product intent.

Intent requires understanding.

If the behavior changed intentionally, update the AC.

If the behavior changed accidentally, fix the code.

If the evidence changed but the claim did not, verify that the test still proves the same thing.

That is the workflow.

## Pull request review changes

Normal review asks:

```txt
Did tests pass?
Does the code look okay?
```

Coherence-style review asks:

```txt
Which claims did this patch touch?
Which evidence was rerun?
Which claims are now broken?
Which changed files have no intent owner?
Did behavior change without a spec changelist?
```

Example PR summary:

```coh
Coherence report

Changed files:
  app/models/short_url.rb
  spec/models/short_url_spec.rb

Affected claims:
  product/url-shortener/create-short-url.accepts-valid-http-url
  product/url-shortener/create-short-url.rejects-invalid-url
  product/url-shortener/create-short-url.generates-unique-short-code

Evidence:
  PASS bundle exec rspec spec/requests/short_urls_spec.rb:4
  FAIL bundle exec rspec spec/requests/short_urls_spec.rb:12
  PASS bundle exec rspec spec/models/short_url_spec.rb:28

Unmapped files:
  none

Required review:
  product/url-shortener/create-short-url.rejects-invalid-url
```

This is not magic.

It is just a better object to review.

## Why this matters for agents

Agents can write code very quickly.

That makes the problem worse.

A human can sometimes review a small diff by intuition.

But when an agent changes ten files and the tests pass, the real question is still open:

```txt
Did the system still satisfy the same promises?
```

Without an intent graph, the agent has to infer intent from code, tests, names, comments, and vibes.

Sometimes that works.

Sometimes it confidently preserves the wrong thing.

With Coherence, the agent gets a slice:

```coh
You are changing URL validation.

Relevant claims:
  product/url-shortener/create-short-url.accepts-valid-http-url
  product/url-shortener/create-short-url.rejects-invalid-url
  foundation/domain/url.allowed-url-schemes

Relevant evidence:
  bundle exec rspec spec/requests/short_urls_spec.rb
  bundle exec rspec spec/models/short_url_spec.rb
```

Now the agent is not just coding against the repo.

It is coding against known claims.

The human still reviews the meaning.

CI checks the evidence.

## The point

The intent layer does not stay fresh because everyone remembers to update it.

That is wishful thinking.

It stays fresh because code, tests, and intent are wired together.

When code changes, CI asks:

```txt
Which claims does this touch?
```

When tests change, CI asks:

```txt
Which claims did this evidence support?
```

When no link exists, CI asks:

```txt
Why is this change outside the graph?
```

And when behavior changes, the human or agent must make the intent change explicit.

That is the trust boundary:

```coh
promise
→ claim
→ implementation
→ evidence
→ CI result
```

CI does not understand your product.

But it can keep asking the right question:

```txt
Which promise did this change affect?
```

That is already a massive upgrade over "tests passed".
