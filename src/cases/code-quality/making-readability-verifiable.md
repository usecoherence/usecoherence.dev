---
layout: layout.njk
title: Case — Making Readability Observable During Feature Development
description: A method grows from 10 to 230 lines. Tests pass. Coherence connects multiple signals to a readability claim.
---

# Case: Making Readability Observable During Feature Development

## 1. Problem

A pricing service calculates whether an order qualifies for a discount.

The original implementation is small:

```ruby
def eligible_for_discount?(order)
  order.total >= 100 &&
    order.customer.active?
end
```

A new feature adds regional campaigns, membership tiers, exclusions, and manually approved exceptions.

The method grows:

```ruby
def eligible_for_discount?(order)
  if order.region == "EU"
    if order.customer.vip?
      # ...
    elsif order.campaign
      # ...
    end
  elsif order.region == "US"
    # ...
  end

  # another 170 lines
end
```

The feature works.

The tests pass.

But understanding one acceptance criterion now requires tracing:

* a 230-line method;
* four helper modules;
* two callbacks;
* campaign configuration;
* an exception table;
* behavior copied into an admin endpoint.

The implementation is correct, but the cost of changing it has increased.

## 2. What broke

The team said that code should be readable and maintainable.

But “readable” was never represented as an observable property.

The repository could verify:

```text
A qualifying customer receives the campaign discount.
```

It could not verify:

```text
The rules governing campaign eligibility remain understandable
as one coherent responsibility.
```

Readability is not one number.

A 200-line method may be straightforward.

A 30-line method may hide behavior across twelve indirections.

Useful signals may include:

* cognitive complexity;
* dependency and call depth;
* implementation spread across files;
* code churn;
* ownership fragmentation;
* duplication;
* LoC associated with one specification or acceptance criterion;
* human review.

Without connecting those signals to a concrete quality claim, they remain isolated dashboard numbers.

## 3. Typical solution

A reviewer comments:

> This is getting difficult to follow.

The author extracts several methods:

```ruby
def eligible_for_discount?(order)
  regional_discount?(order) ||
    membership_discount?(order) ||
    approved_exception?(order)
end
```

The method is shorter.

But the underlying behavior may still be spread across unrelated modules and callbacks.

Alternatively, the team introduces a complexity threshold:

```text
Cognitive complexity must not exceed 15.
```

The implementation is then rearranged until the metric passes.

Neither approach necessarily preserves readability.

A metric can detect a signal.

It cannot, by itself, state:

* which behavior must remain understandable;
* what code belongs to that behavior;
* why the threshold matters;
* whether an exception is acceptable;
* whether the metric still models the property the team cares about.

## 4. Coherence solution

Readability is represented as a specification attached to the behavior being changed.

```rust
coherence_slice! {
    changelist "regional-campaign-discounts" {
        spec "product/discounts/campaign-eligibility" {
            title: "Campaign discount eligibility"
            level: System
            status: Active

            links {
                constrained_by "quality/discount-rule-readability"
            }

            ac "applies-regional-campaign" {
                title: "Applies a regional campaign"
                intent: "An eligible order receives the active campaign discount"
                risk: High
                concerns: [Correctness, Maintainability]

                links {
                    implemented_by file "app/domain/discount_policy.rb"
                    verified_by test "bundle exec rspec spec/domain/discount_policy_spec.rb"
                }
            }
        }

        context {
            spec "quality/discount-rule-readability" {
                title: "Discount rules remain understandable"
                level: Module
                status: Active

                ac "campaign-policy-has-one-owner" {
                    title: "Campaign eligibility has one implementation owner"
                    intent: "Campaign eligibility is not duplicated across endpoints or callbacks"
                    risk: High
                    concerns: [Maintainability]

                    links {
                        verified_by test "bin/check-discount-policy-ownership"
                    }
                }

                ac "campaign-policy-remains-local" {
                    title: "Campaign eligibility remains locally understandable"
                    intent: "The policy can be understood without tracing unrelated infrastructure"
                    risk: Medium
                    concerns: [Maintainability]

                    links {
                        verified_by test "bin/check-discount-policy-complexity"
                    }
                }
            }
        }
    }
}
```

The verifier evaluates several signals:

```text
campaign eligibility
├─ implementation owners: 1
├─ files containing policy decisions: 2
├─ cognitive complexity: 13
├─ duplicated decision branches: 0
├─ unrelated callbacks: 0
└─ human review required: yes
```

No individual value defines readability.

Together, they provide evidence for a specific claim:

```text
The campaign eligibility policy remains locally understandable
and has one clear implementation owner.
```

When a change duplicates the rule inside an admin endpoint, Coherence can report:

```text
quality/discount-rule-readability
└─ campaign-policy-has-one-owner

New implementation detected:
app/controllers/admin/discounts_controller.rb
```

When complexity grows beyond the agreed range, the result is not automatically:

> The code is unreadable.

It is:

> The evidence supporting this readability claim has changed and requires review.

The team can then:

1. simplify the implementation;
2. split the responsibility into separately specified policies;
3. revise the verifier;
4. accept a scoped exception;
5. change the quality specification.

Readability stops being an aesthetic reaction at review time.

It becomes an explicit claim, supported by measurable signals and human judgement, that evolves with the system.
