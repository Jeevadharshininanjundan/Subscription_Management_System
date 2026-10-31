# Project State

## Current phase

**Phase 0 — Requirements and architecture**

## Completed work

- Verified the workspace is accessible and writable.
- Verified terminal execution.
- Verified `Subscription_Management_System.pdf` exists and read its complete four-page contents.
- Defined the approved MERN technology direction.
- Documented roles, modules, lifecycle states, business rules, security boundaries, monetary handling, billing idempotency, and the two-second demonstration target.
- Created the Phase 0 documentation set:
  - `docs/REQUIREMENTS.md`
  - `docs/ARCHITECTURE.md`
  - `docs/DATABASE_DESIGN.md`
  - `docs/API_DESIGN.md`
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `PROJECT_STATE.md`

## Architecture decisions

- Use a modular React/Vite client and Node/Express/Mongoose server.
- Keep controllers thin and put business rules in server application services.
- Use server-authoritative authorization, validation, totals, taxes, discounts, and billing.
- Reference aggregate roots while embedding immutable financial/catalog snapshots in subscriptions and invoices.
- Use deterministic subscription billing-period keys and unique database constraints to make recurring billing safe under retries and overlapping scheduler execution.
- Use integer minor units with explicit currency for persisted money.
- Treat historical financial and catalog records as immutable; archive referenced catalog records rather than hard-delete them.

## Pending tasks

- Review and approve Phase 0 documentation.
- Initialize the project foundation in Phase 1.
- Decide token transport/refresh strategy and production MongoDB transaction configuration during implementation.
- Define concrete environment variables, CI commands, and deployment target after Phase 0 approval.

## Outstanding risks

- Email delivery, reset-token handling, and scheduler deployment need production configuration and failure/retry testing.
- Billing concurrency and transaction behavior must be tested against the selected MongoDB deployment.
- Dashboard performance depends on representative data volume and index/aggregation validation.
- Tax, currency, overpayment, cancellation, and renewal policies may require business-owner decisions before implementation.
- No Git repository or remote was present at inspection time, so a GitHub commit/push cannot yet be verified.

## Next phase

**Phase 1 — Project foundation.** Do not begin until Phase 0 documentation is approved.

## Remaining prompt budget

14 of 15 initially, adjusted for subsequent requests.
