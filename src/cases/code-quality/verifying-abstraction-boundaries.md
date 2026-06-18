---
layout: layout.njk
title: Case — Verifying Abstraction Boundaries During Feature Development
description: Four unrelated business rules share one abstraction. Coherence connects specification responsibilities to code structure.
---

# Case: Verifying Abstraction Boundaries During Feature Development

## 1. Problem

An e-commerce system has several kinds of business rules:

```text
discount eligibility
tax calculation
fraud screening
shipping restrictions
```

They all receive an order and return a result.

To remove duplication, the team introduces a common abstraction:

```ruby
class Rule
  def evaluate(order)
    raise NotImplementedError
  end
end
```

Every new policy becomes another rule:

```ruby
class VipDiscountRule < Rule
end

class VatRule < Rule
end

class FraudScoreRule < Rule
end

class RestrictedShippingRule < Rule
end
```

A shared rule engine evaluates them:

```ruby
rules.each do |rule|
  results << rule.evaluate(order)
end
```

The abstraction appears elegant.

The code is consistent.

The tests pass.

But the four concepts do not share the same meaning:

* discount eligibility selects an offer;
* tax calculation produces a legally required amount;
* fraud screening may suspend an order;
* shipping restrictions determine whether fulfilment is possible.

They have different invariants, failure modes, owners, and reasons to change.

The implementation has made unrelated concepts look identical because their method signatures happen to match.

## 2. What broke

The code abstraction no longer preserves the distinctions present in the domain.

The specification graph describes separate responsibilities:

```text
pricing
└─ discount eligibility

compliance
└─ tax calculation

risk
└─ fraud screening

fulfilment
└─ shipping restrictions
```

The code graph collapses them:

```text
Rule
├─ VipDiscountRule
├─ VatRule
├─ FraudScoreRule
└─ RestrictedShippingRule
```

This creates coupling that is invisible at the feature level.

Changing the common `Rule` contract for fraud evaluation may now affect taxation and shipping.

Adding retry semantics for an external fraud provider may leak asynchronous behaviour into otherwise deterministic pricing rules.

The abstraction is reusable, but not coherent.

The repository can verify that every rule implements `evaluate`.

It cannot verify whether those implementations represent the same kind of responsibility.

## 3. Typical solution

A reviewer comments:

> These things should probably not use the same abstraction.

But the distinction is difficult to defend.

All implementations accept an order.

All return a result.

All can technically run through the same engine.

The discussion becomes subjective:

> This feels too generic.

> But extracting a common interface removes duplication.

> We can split it later if it becomes a problem.

Static analysis can detect coupling, inheritance depth, or a large number of implementations.

It still does not know whether the abstraction groups concepts that belong together.

Eventually, the shared abstraction accumulates options:

```ruby
rule.evaluate(
  order,
  async: true,
  fail_open: false,
  jurisdiction: jurisdiction,
  audit: true
)
```

Each option exists for only some implementations.

The common abstraction remains syntactically shared while its semantic contract disappears.

## 4. Coherence solution

The responsibilities are represented explicitly in the specification graph.

```rust
coherence_slice! {
    changelist "restricted-region-shipping" {
        spec "product/fulfilment/shipping-restrictions" {
            title: "Shipping restrictions"
            level: System
            status: Active

            links {
                constrained_by "quality/responsibility-boundaries"
            }

            ac "rejects-restricted-destination" {
                title: "Rejects a restricted destination"
                intent: "An order cannot be fulfilled when its destination is restricted"
                risk: High
                concerns: [Correctness, Maintainability]

                links {
                    implemented_by file "app/fulfilment/shipping_policy.rb"
                    verified_by test "bundle exec rspec spec/fulfilment/shipping_policy_spec.rb"
                }
            }
        }

        context {
            spec "quality/responsibility-boundaries" {
                title: "Semantic responsibility boundaries"
                level: System
                status: Active

                ac "shared-abstractions-preserve-domain-meaning" {
                    title: "Shared abstractions preserve domain meaning"
                    intent: "One abstraction does not couple policies with different invariants and lifecycles"
                    risk: High
                    concerns: [Maintainability]

                    links {
                        verified_by test "bin/check-responsibility-boundaries"
                    }
                }

                ac "code-units-have-coherent-responsibilities" {
                    title: "Code units have coherent responsibilities"
                    intent: "A shared code unit implements a coherent region of the specification graph"
                    risk: Medium
                    concerns: [Maintainability]

                    links {
                        verified_by test "bin/check-spec-code-cohesion"
                    }
                }
            }
        }
    }
}
```

The verifier combines the specification and code graphs.

It observes that one shared abstraction implements acceptance criteria from unrelated specification regions:

```text
Rule
├─ pricing/discount-eligibility
├─ compliance/tax-calculation
├─ risk/fraud-screening
└─ fulfilment/shipping-restrictions
```

It can also inspect whether those concepts share:

```text
invariants
failure semantics
lifecycle
ownership
dependencies
reasons to change
```

The verifier does not conclude:

> Four implementations are too many.

It reports a more specific problem:

```text
quality/responsibility-boundaries
└─ shared-abstractions-preserve-domain-meaning

Rule couples four specification regions with different
invariants, owners, and failure semantics.
```

The engineer can then choose to:

1. keep separate domain abstractions;
2. extract a smaller shared mechanism beneath them;
3. redefine the taxonomy if the concepts genuinely share one responsibility;
4. record a deliberate exception.

For example, the team may preserve distinct domain concepts:

```text
DiscountPolicy
TaxCalculator
FraudAssessment
ShippingPolicy
```

while extracting only the common execution mechanism:

```text
PolicyTelemetry
EvaluationContext
AuditRecorder
```

The mechanism is shared.

The meaning is not collapsed.

Coherence does not decide that inheritance is bad, that duplication is bad, or that every responsibility must map to one file.

It verifies whether the abstractions in code remain consistent with the distinctions, relationships, and responsibilities expressed by the specification graph.

A good abstraction is not merely reusable.

It preserves the shape of the problem.
