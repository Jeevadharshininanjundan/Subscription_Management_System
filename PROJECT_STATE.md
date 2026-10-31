# Project State

## Current phase

**Phase 7A — Authorization, ownership isolation and security fixes**

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
- Implemented customer registration with enforced password policy and customer-only role assignment.
- Implemented bcrypt password hashing, short-lived JWT authentication, server-side token-version logout revocation, and safe current-user profile responses.
- Implemented forgot-password and reset-password workflows with hashed, expiring, single-use cryptographic reset tokens.
- Added Nodemailer password-reset mail adapter using JSON transport in tests and SMTP configuration in non-test environments.
- Added authentication middleware, role authorization, customer ownership middleware, and login/registration/reset rate limiting.
- Added admin-only staff management endpoints.
- Added React authentication context, login/registration/forgot/reset pages, protected routes, bearer-token API service, session-expiry handling, and role-aware navigation.
- Added server-authoritative Phase 4 services and routes for products, variants, plans, taxes, discounts, customers, quotations, subscriptions, invoices, payments, and billing.
- Added archive semantics for catalog/customer records, compatible quarterly and half-yearly plan intervals, trial-day configuration, partial/overdue invoice states, and duplicate payment-reference protection.
- Added integer-minor-unit quotation/subscription calculation, discount eligibility checks, lifecycle transition validation, invoice period idempotency, and payment balance enforcement.
- Added an executable recurring billing job and authenticated staff billing trigger.
- Added a responsive authenticated application layout with sidebar, top navigation, profile/logout controls, protected routes, loading/error/empty states, and role-aware navigation.
- Added a live-data dashboard deriving customer, product, subscription, invoice, quotation, and collected-payment metrics from implemented backend endpoints.
- Added frontend business screens for products, plans, customers, taxes, discounts, quotations, subscriptions, invoices, and invoice payment balances.
- Added product/plan/customer creation forms and subscription and quotation lifecycle actions wired to the implemented backend routes.
- Added end-to-end integration coverage for quotation conversion, subscription activation, recurring billing, idempotent retry conditions, payment recording, and overpayment rejection.
- Corrected customer self-resource filtering and added authenticated payment-history, invoice confirmation/cancellation, and product-variant API endpoints.
- Added core request validation for products, plans, customers, quotations, payments, and invoice cancellation.
- Added product editing/archive controls, product variant detail management, quotation creation, customer/subscription/invoice detail views, invoice printing, and supported invoice actions.
- Restricted quotation acceptance to Admin/Staff and enforced customer ownership on quotation detail reads.
- Enforced customer ownership on invoice payment-history reads with standardized `403 FORBIDDEN` responses.
- Restricted tax and discount configuration reads to Admin/Staff.
- Added Phase 7A security regression coverage for cross-customer access, customer quotation acceptance, configuration access, staff administration, and invalid tokens.

## Phase 7A files changed

- `server/src/controllers/core.js`
- `server/src/routes/core.js`
- `server/test/authorization.security.test.js`

## Phase 7A validation

- `npm run check` — passed: client/server lint, 30 tests, and client production build.
- Security regression suite: 3 tests passed.
- Verified Admin and Staff legitimate access, Staff denial from staff administration, customer isolation, customer denial of administrative configuration, and invalid-token rejection.
- No Git commands, commits, pushes, branches, or PDF changes were made.

## Phase 7A remaining risks

- Demonstration bearer tokens remain in browser localStorage and require HttpOnly Secure cookies plus CSRF protection before production.
- Payment recording uses a standalone-MongoDB fallback when transactions are unavailable; production should use a replica set.
- Quotation/customer/invoice APIs still need broader pagination and audit logging in later phases.

## Architecture decisions

- Use a modular React/Vite client and Node/Express/Mongoose server.
- Keep controllers thin and put business rules in server application services.
- Use server-authoritative authorization, validation, totals, taxes, discounts, and billing.
- Reference aggregate roots while embedding immutable financial/catalog snapshots in subscriptions and invoices.
- Use deterministic subscription billing-period keys and unique database constraints to make recurring billing safe under retries and overlapping scheduler execution.
- Use integer minor units with explicit currency for persisted money.
- Treat historical financial and catalog records as immutable; archive referenced catalog records rather than hard-delete them.

## Phase 6 files changed

- `server/src/controllers/core.js`
- `server/src/services/core.js`
- `server/src/routes/core.js`
- `server/src/validators/core.js`
- `server/test/core.integration.test.js`
- `client/src/App.jsx`
- `client/src/components/AppLayout.jsx`
- `client/src/pages/ResourcePages.jsx`
- `client/src/pages/DashboardPage.jsx`
- `client/src/styles.css`

## Phase 6 validation

- `npm run check` — passed: client/server lint, 27 tests, and client production build.
- Backend workflow integration test passed against the local MongoDB test database.
- Verified customer ownership filtering, role gates, invalid lifecycle/payment responses, and safe error responses.
- `npm audit --omit=dev --audit-level=moderate` — passed with 0 production vulnerabilities.
- No Git commands, commits, pushes, branches, or PDF changes were made.

## Phase 6 known issues and boundaries

- Billing catch-up may create successive due periods when a subscription is far behind; the unique subscription-period index prevents duplicate periods.
- MongoDB transactions require replica-set deployment; standalone local MongoDB uses a documented fallback payment path for development.
- Dashboard and list endpoints still return unpaginated collections; production-scale pagination and dedicated aggregation endpoints remain future work.
- Email delivery, scheduler deployment, and browser-level automated testing remain deployment/integration concerns.

## Phase 5 files changed

- `client/src/App.jsx`
- `client/src/styles.css`
- `client/src/components/AppLayout.jsx`
- `client/src/components/ResourceState.jsx`
- `client/src/pages/DashboardPage.jsx`
- `client/src/pages/ResourcePages.jsx`
- `client/src/pages/LoginPage.jsx`
- `client/src/pages/RegisterPage.jsx`
- `client/src/App.business.test.jsx`

## Phase 5 validation

- `npm run check` — passed: client/server lint, 26 tests, and client production build.
- Frontend tests: 8 passed, including dashboard rendering, role-aware navigation, protected route behavior, product form submission, and existing authentication flows.
- Backend regression tests: 18 passed.
- No Git commands, commits, pushes, branches, or PDF changes were made.

## Phase 5 known issues and boundaries

- The backend currently has no standalone `GET /payments` endpoint; the Payments page therefore displays invoice payment balances from `GET /invoices` and does not fabricate individual payment history.
- Product edit/archive, variant management UI, quotation creation form, detailed record pages, invoice confirmation/cancellation/send/print, and chart visualizations remain incomplete.
- Dashboard metrics are bounded by current backend list responses; pagination and dedicated dashboard aggregation endpoints are still required for production-scale data.

## Phase 4 files changed

- `server/src/models/Product.js`
- `server/src/models/SubscriptionPlan.js`
- `server/src/models/Subscription.js`
- `server/src/models/Invoice.js`
- `server/src/models/Payment.js`
- `server/src/models/common.js`
- `server/src/services/core.js`
- `server/src/controllers/core.js`
- `server/src/controllers/billing.js`
- `server/src/routes/core.js`
- `server/src/jobs/billing.js`
- `server/src/middleware/errorHandler.js`
- `server/src/app.js`

## Phase 4 validation

- Existing backend regression tests passed: 17 tests.
- `npm run check` — passed: client/server lint, 23 tests, and client production build.
- `npm audit --omit=dev --audit-level=moderate` — passed with 0 production vulnerabilities.
- Persistence behavior for unique invoice periods remains covered by the Phase 2 MongoDB suite.
- No Git commands, commits, pushes, branches, or PDF changes were made.

## Phase 4 known issues and boundaries

- Frontend business screens, analytics, notifications, and payment gateways remain out of scope.
- Billing scheduler deployment still needs an operational cron runner; `executeBillingJob` is the integration seam.
- Financial transaction behavior requires replica-set deployment for MongoDB transactions; the MVP payment service must be verified against the deployment topology.

## Pending tasks

- Add pagination and dashboard aggregation endpoints before production-scale demonstration data.
- Complete Phase 7 secondary notifications, renewal requests, and overdue follow-up.
- Decide whether to replace demonstration localStorage bearer-token storage with HttpOnly Secure cookies and CSRF protection before production deployment.
- Define concrete SMTP credentials and production mail delivery configuration outside source control.

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

## Phase 1 validation (completed)

- `npm run check` — passed: lint, client/server tests, and client production build.
- `npm run lint --workspace client` — passed.
- `npm run lint --workspace server` — passed.
- `npm test --workspace client` — 1 test passed.
- `npm test --workspace server` — 3 tests passed.
- `npm run build --workspace client` — passed.
- Live health endpoint probe — `/health/live` and `/api/v1/health/ready` returned expected responses.
- `npm audit --omit=dev --audit-level=moderate` — passed with 0 production vulnerabilities after upgrading Zod to `^4.6.7`.

## Phase 2 known issues and boundaries

- Products, subscriptions, quotations, invoices, payments, billing, and analytics are intentionally not implemented.
- Full development startup requires `npm install` and local `.env` files copied from the committed templates.
- Persistence tests require a reachable MongoDB instance at `MONGO_TEST_URI`; the Phase 2 suite was run against the local MongoDB 8.0 service.
- Development dependency advisories remain in the full npm audit report; production dependencies report zero vulnerabilities.
- Bearer access tokens stored in localStorage are suitable only for this demonstration foundation and require production hardening against XSS.

## Phase 3 files changed

- `server/package.json`
- `server/package-lock.json`
- `server/.env.example`
- `server/src/config/env.js`
- `server/src/models/User.js`
- `server/src/utils/password.js`
- `server/src/utils/jwt.js`
- `server/src/utils/crypto.js`
- `server/src/services/auth.js`
- `server/src/services/mail.js`
- `server/src/validators/auth.js`
- `server/src/controllers/auth.js`
- `server/src/controllers/staff.js`
- `server/src/middleware/auth.js`
- `server/src/middleware/validate.js`
- `server/src/middleware/rateLimiters.js`
- `server/src/routes/auth.js`
- `server/src/routes/staff.js`
- `server/src/app.js`
- `server/src/server.js`
- `server/vitest.config.js`
- `server/test/setup.js`
- `server/test/auth.test.js`
- `client/src/services/api.js`
- `client/src/context/AuthContext.jsx`
- `client/src/routes/ProtectedRoute.jsx`
- `client/src/pages/LoginPage.jsx`
- `client/src/pages/RegisterPage.jsx`
- `client/src/pages/ForgotPasswordPage.jsx`
- `client/src/pages/ResetPasswordPage.jsx`
- `client/src/App.jsx`
- `client/src/styles.css`
- `client/src/App.auth.test.jsx`

## Phase 3 validation

- `npm run check` — passed: client/server lint, tests, and client production build.
- Backend authentication/authorization suite — 6 tests passed.
- Backend Phase 2 regression suites — 11 tests passed.
- Frontend authentication suite — 5 tests passed.
- Live MongoDB persistence remained covered by the backend model suite.
- Password reset email tests used Nodemailer's JSON transport; no real email was sent.
- Expired and malformed JWTs, logout revocation, role denial, customer isolation, rate limiting, reset expiry, and reset single-use behavior were verified.
- `npm audit --omit=dev --audit-level=moderate` — passed with 0 production vulnerabilities after upgrading Nodemailer.

## Phase 3 completion status

- Customer registration creates a Customer user and linked Customer record; public requests cannot assign Admin or Staff roles.
- Login returns a short-lived JWT with issuer, audience, expiry, role, subject, and token-version claims.
- Logout increments the server-side token version, invalidating the prior token.
- Password reset tokens use cryptographically random values, SHA-256 hashes at rest, one-hour expiry, and single-use clearing.
- Forgot-password responses are identical for existing and missing email addresses.
- Staff list/create/update routes require Admin authorization.
- Customer ownership middleware rejects requests whose route customer ID differs from the authenticated user's linked customer ID.
- Client authentication pages, context, protected route, API bearer-token interceptor, session expiry handling, and role-aware navigation are implemented.
- Selected token transport: short-lived bearer access token stored in browser localStorage for this demonstration. This is documented as an XSS exposure and must be replaced with HttpOnly Secure cookies plus CSRF protection before production.

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

**Phase 4 — Core backend functionality.** Do not begin until Phase 3 authentication and authorization are approved.

## Remaining prompt budget

14 of 15 initially, adjusted for subsequent requests.
