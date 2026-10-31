# Project State

## Current phase

**Phase 2 — Database and data contracts**

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
- Initialized the Phase 1 npm workspace with separate `client` and `server` packages.
- Added Vite/React/Tailwind client foundation with React Router and an intentionally feature-free landing/status shell.
- Added Express server foundation with Helmet, CORS, JSON limits, request IDs, safe environment validation, standard errors, and live/readiness health endpoints.
- Added client and server smoke tests.
- Added lint, test, build, and combined check scripts.
- Added development-safe `.env.example` templates and `.gitignore` protections.
- Added Mongoose database configuration with safe connection error handling and database-backed readiness reporting.
- Added modular Mongoose models for Users, Customers, Products, Product Variants, Subscription Plans, Quotation Templates, Quotations, Subscriptions, Discounts, Invoices, Payments, and Tax Configurations.
- Added shared schema conventions for timestamps, normalized names/emails, enums, references, immutable line snapshots, integer minor-unit money, and UTC date ranges.
- Added documented compound and unique indexes, including subscription billing-period uniqueness.
- Added money and UTC date utilities with unit coverage.

## Architecture decisions

- Use a modular React/Vite client and Node/Express/Mongoose server.
- Keep controllers thin and put business rules in server application services.
- Use server-authoritative authorization, validation, totals, taxes, discounts, and billing.
- Reference aggregate roots while embedding immutable financial/catalog snapshots in subscriptions and invoices.
- Use deterministic subscription billing-period keys and unique database constraints to make recurring billing safe under retries and overlapping scheduler execution.
- Use integer minor units with explicit currency for persisted money.
- Treat historical financial and catalog records as immutable; archive referenced catalog records rather than hard-delete them.

## Pending tasks

- Begin Phase 2 database schemas and data contracts.
- Decide token transport/refresh strategy and production MongoDB transaction configuration during implementation.
- Define concrete environment variables, CI commands, and deployment target after Phase 0 approval.

## Outstanding risks

- Email delivery, reset-token handling, and scheduler deployment need production configuration and failure/retry testing.
- Billing concurrency and transaction behavior must be tested against the selected MongoDB deployment.
- Dashboard performance depends on representative data volume and index/aggregation validation.
- Tax, currency, overpayment, cancellation, and renewal policies may require business-owner decisions before implementation.
- npm audit currently reports dependency advisories; these must be reviewed before production deployment and are not addressed by Phase 1 feature work.

## Phase 2 files changed

- `package.json`
- `package-lock.json`
- `README.md`
- `server/package.json`
- `server/.env.example`
- `server/src/config/env.js`
- `server/src/config/database.js`
- `server/src/utils/money.js`
- `server/src/utils/dates.js`
- `server/src/utils/validation.js`
- `server/src/models/`
- `server/src/routes/health.js`
- `server/src/server.js`
- `server/test/models.test.js`
- `server/test/utils.test.js`
- `server/test/health.test.js`

## Phase 1 validation

- `npm run check` — passed: lint, client/server tests, and client production build.
- `npm run lint --workspace client` — passed.
- `npm run lint --workspace server` — passed.
- `npm test --workspace client` — 1 test passed.
- `npm test --workspace server` — 3 tests passed.
- `npm run build --workspace client` — passed.
- Live health endpoint probe — `/health/live` and `/api/v1/health/ready` returned expected responses.
- `npm audit --omit=dev --audit-level=moderate` — passed with 0 production vulnerabilities after upgrading Zod to `^4.6.7`.

## Phase 2 known issues and boundaries

- Authentication, authorization, domain routes, billing, email, and analytics are intentionally not implemented.
- Full development startup requires `npm install` and local `.env` files copied from the committed templates.
- Persistence tests require a reachable MongoDB instance at `MONGO_TEST_URI`; the Phase 2 suite was run against the local MongoDB 8.0 service.
- Development dependency advisories remain in the full npm audit report; production dependencies report zero vulnerabilities.

## Phase 2 models and indexes

- `User`: unique normalized email; role/status index.
- `Customer`: unique normalized primary email; unique sparse portal user reference; name/status index.
- `Product`: status/type/name index.
- `ProductVariant`: unique product/name compound index; product/status index.
- `SubscriptionPlan`: status/availability compound index; name/status index.
- `QuotationTemplate`: status/name index.
- `Quotation`: unique quotation number; customer/status/validity index; unique sparse conversion reference.
- `Subscription`: unique subscription number; customer/status, status/next billing, and plan/status indexes; unique sparse quotation reference.
- `Discount`: status/active-window index.
- `Invoice`: unique invoice number; unique subscription/billing-period compound index; customer/status/due-date and subscription/status indexes.
- `Payment`: invoice/date/status and customer/date indexes.
- `TaxConfiguration`: status/active-window index.

## Phase 2 validation

- `npm run check` — passed: client/server lint, tests, and client production build.
- Server persistence suite — 4 model tests passed against local MongoDB.
- Server utility suite — 4 money/date tests passed.
- Server health suite — 3 tests passed.
- Total server tests — 11 passed.
- Live `/health/live` and `/api/v1/health/ready` probes — HTTP 200; database check `ok`.
- `npm audit --omit=dev --audit-level=moderate` — passed with 0 production vulnerabilities.

## Next phase

**Phase 3 — Authentication and user management.** Do not begin until Phase 2 database contracts and indexes are approved.

## Remaining prompt budget

14 of 15 initially, adjusted for subsequent requests.
