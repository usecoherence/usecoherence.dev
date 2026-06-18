---
layout: layout.njk
title: Case — Enforcing Dependency Direction During Feature Development
description: An HTTP handler imports a database adapter directly, violating hexagonal architecture. How Coherence connects the architectural boundary to the change.
---

# Case: Enforcing Dependency Direction During Feature Development

## 1. Problem

A payment service follows hexagonal architecture:

```text
HTTP adapter
    ↓
application service
    ↓
domain port
    ↓
database adapter
```

While adding refund support, an engineer needs to load a payment.

The existing application service does not expose the required operation, so the HTTP handler imports the database repository directly:

```rust
use payment::database::PaymentRepository;

async fn create_refund(...) {
    let payment = PaymentRepository::find(payment_id).await?;
    // ...
}
```

The feature works.

The tests pass.

But the dependency direction has changed:

```text
HTTP adapter ──────────────→ database adapter
       └→ application service → domain port
```

The handler now knows how payments are stored.

## 2. What broke

The repository claimed to follow hexagonal architecture, but that claim existed only in documentation and shared expectations.

The behavioral requirement was verified:

```text
A valid refund request creates a refund.
```

The architectural requirement was not:

```text
Inbound adapters must access persistence through application and domain boundaries.
```

Nothing connected that requirement to:

* the modules it constrained;
* the dependency graph that represented it;
* the check capable of detecting a violation.

The architecture was treated as context for humans, not as part of the system specification.

## 3. Typical solution

A reviewer notices the import:

> The handler should not call the repository directly.

The engineer introduces a new application-service method and moves the repository access behind the port.

Or nobody notices.

The direct dependency remains until another engineer copies the pattern:

```text
refund handler   → payment repository
dispute handler  → payment repository
admin endpoint   → payment repository
```

Eventually the architecture diagram and the implementation describe different systems.

A linter may prevent the imports, but by itself it does not explain:

* which architectural claim the rule protects;
* why the boundary exists;
* which features and modules depend on it;
* whether an exception changes the architecture or merely suppresses the tool.

## 4. Coherence solution

The architectural boundary is represented as a specification:

```rust
coherence_slice! {
    changelist "refund-support" {
        spec "product/refunds" {
            title: "Refund support"
            level: System
            status: Active

            links {
                constrained_by "architecture/payment-boundaries"
            }

            ac "creates-refund" {
                title: "Creates a refund"
                intent: "A valid refund request creates a refund for the payment"
                risk: High
                concerns: [Correctness]

                links {
                    implemented_by file "crates/payment/src/http/refunds.rs"
                    implemented_by file "crates/payment/src/application/refunds.rs"
                    verified_by test "cargo test -p payment refund"
                }
            }
        }

        context {
            spec "architecture/payment-boundaries" {
                title: "Payment dependency boundaries"
                level: System
                status: Active

                ac "inbound-adapters-use-application-services" {
                    title: "Inbound adapters use application services"
                    intent: "HTTP handlers do not access database adapters directly"
                    risk: High
                    concerns: [Maintainability]

                    links {
                        verified_by test "cargo test -p architecture-tests payment_dependencies"
                    }
                }
            }
        }
    }
}
```

The architecture test inspects the import or SCIP dependency graph:

```text
allowed:
    payment::http
        → payment::application
        → payment::domain

forbidden:
    payment::http
        → payment::database
```

When the handler imports `PaymentRepository`, the verifier does not merely report a forbidden import.

It reports that the change violates:

```text
architecture/payment-boundaries
└─ inbound-adapters-use-application-services
```

The engineer now has three explicit choices:

1. implement the feature without crossing the boundary;
2. revise the architectural specification;
3. record a deliberate exception with its scope and justification.

The linter enforces dependency direction.

Coherence preserves what that direction means, why it exists, and which change attempted to cross it.
