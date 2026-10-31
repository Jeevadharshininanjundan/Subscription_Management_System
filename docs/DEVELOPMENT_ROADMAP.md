# Brightloop Subscription Management System Development Roadmap

Each phase ends with reviewable deliverables and tests. Later phases must not silently expand earlier scope.

## Phase 0: Requirements and architecture

- **Objectives:** Analyze the brief/PDF; establish MERN architecture, domain model, API boundaries, business invariants, and delivery plan.
- **Files/modules:** `docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE_DESIGN.md`, `docs/API_DESIGN.md`, `docs/DEVELOPMENT_ROADMAP.md`, `PROJECT_STATE.md`.
- **Dependencies:** Approved problem statement.
- **Deliverables:** Consistent architecture and requirements documentation.
- **Acceptance:** Roles, workflows, data, security, idempotency, performance, and risks are explicit; no application features.
- **Testing:** Document consistency/security review; no runtime suite required.

## Phase 1: Project foundation

- **Objectives:** Initialize client/server workspace, scripts, environment templates, lint/format/test commands, base Express/Vite shells, and CI-friendly health checks.
- **Files/modules:** `client/`, `server/`, package manifests, `.env.example`, test configuration, foundational middleware.
- **Dependencies:** Phase 0 approval.
- **Deliverables:** Bootable client/server with no domain features and safe configuration loading.
- **Acceptance:** Install, lint, test, and development startup work; secrets are excluded.
- **Testing:** Smoke tests, health endpoint test, client render test.

## Phase 2: Database and data contracts

- **Objectives:** Implement Mongoose schemas, indexes, shared validation conventions, money/date utilities, seed-safe development fixtures only if approved.
- **Files/modules:** `server/src/models/`, `validators/`, `config/`, migrations/index setup, contract tests.
- **Dependencies:** Phase 1 foundation; Phase 0 database/API design.
- **Deliverables:** Validated collections and indexes.
- **Acceptance:** Unique constraints, snapshots, status enums, and monetary precision rules are enforced.
- **Testing:** Schema validation, index/uniqueness, contract and persistence tests.

## Phase 3: Authentication and user management

- **Objectives:** Registration, login/logout, password hashing/reset, roles, staff creation, authorization middleware.
- **Files/modules:** auth models/services/controllers/routes, user pages/context, mail adapter.
- **Dependencies:** Phases 1-2.
- **Deliverables:** Secure role-aware authentication.
- **Acceptance:** Password policy, reset expiry/single-use, Admin-only staff creation, and customer isolation work.
- **Testing:** Jest/Supertest auth matrix, rate-limit tests, React auth flow tests.

## Phase 4: Core backend functionality

- **Objectives:** Products, variants, plans, taxes, discounts, customers, quotations, subscriptions, invoices, payments, billing jobs.
- **Files/modules:** Server domain services/controllers/routes/jobs/models.
- **Dependencies:** Phases 2-3.
- **Deliverables:** Server-authoritative core API and idempotent billing.
- **Acceptance:** Lifecycle, calculation, invoice uniqueness, payment balance, discount eligibility, and recurring billing invariants pass.
- **Testing:** Unit, integration, transaction/concurrency, and Supertest API suites.
- **Implementation status:** Core server routes/services are implemented for the MVP. Phase 4 remains subject to dedicated API/financial integration and concurrency tests before release sign-off.

## Phase 5: Primary frontend experience

- **Objectives:** Auth screens, role-aware layouts, catalog/plan/customer screens, quotation/subscription/invoice/payment workflows, customer portal.
- **Files/modules:** Client pages, components, routes, services, hooks, context.
- **Dependencies:** Phase 4 stable API contracts.
- **Deliverables:** Usable operational workflows.
- **Acceptance:** Staff and customers can complete MVP flows with server errors surfaced clearly.
- **Testing:** React Testing Library component/page tests and API-mocked workflow tests.
- **Implementation status:** Core authenticated shell, dashboard, live-data listings, catalog/plan/customer creation forms, and quotation/subscription lifecycle controls are implemented. Detail/mutation coverage and payment-history API support remain before Phase 5 sign-off.

## Phase 6: End-to-end integration

- **Objectives:** Wire client to live API, email/reset flow, billing scheduler, realistic demonstration data, and cross-role workflows.
- **Files/modules:** Client services, server adapters/jobs, integration configuration.
- **Dependencies:** Phases 4-5.
- **Deliverables:** End-to-end happy paths and failure paths.
- **Acceptance:** Quote-to-subscription-to-invoice-to-payment works without manual database changes.
- **Testing:** Full API/UI integration and idempotency retry tests.

## Phase 7: Secondary features and integrations

- **Objectives:** Improve quotation templates, printing/sending, pause/renewal requests, overdue follow-up, and notification handling.
- **Files/modules:** Relevant domain services, email templates, portal pages.
- **Dependencies:** Phase 6.
- **Deliverables:** Secondary workflows without weakening core controls.
- **Acceptance:** Notifications and edge-case statuses are observable and recoverable.
- **Testing:** Mail adapter tests, notification failure/retry tests, role tests.

## Phase 8: Management dashboard

- **Objectives:** Analytics summaries, revenue charts, date/status filters, operational metrics.
- **Files/modules:** Analytics service/routes, dashboard pages/components, indexes/aggregation pipelines.
- **Dependencies:** Phase 6 data correctness.
- **Deliverables:** Admin/staff dashboard.
- **Acceptance:** Metrics reconcile with invoices/payments and common requests meet the two-second target under demonstration workload.
- **Testing:** Aggregation reconciliation, filter tests, performance measurements.

## Phase 9: UX polish

- **Objectives:** Responsive layouts, accessibility, loading/empty/error states, form usability, print presentation, consistent terminology.
- **Files/modules:** Client design components, layouts, pages, styles.
- **Dependencies:** Phases 5-8.
- **Deliverables:** Demonstration-ready experience.
- **Acceptance:** Keyboard navigation, responsive primary flows, and understandable failure feedback.
- **Testing:** Accessibility checks, browser smoke tests, visual review.

## Phase 10: Comprehensive QA

- **Objectives:** Regression, security, concurrency, data integrity, performance, backup/restore rehearsal, and release checklist.
- **Files/modules:** Test suites, CI, security configuration, observability.
- **Dependencies:** Feature complete Phases 1-9.
- **Deliverables:** QA report and resolved critical/high defects.
- **Acceptance:** All release gates pass; no known critical security or billing integrity defects.
- **Testing:** Unit/integration/E2E, authorization matrix, dependency/security scan, load/performance test.

## Phase 11: Deployment

- **Objectives:** Configure production environment, MongoDB, secrets, HTTPS, email, scheduled jobs, monitoring, and rollback.
- **Files/modules:** Deployment configuration and runbooks.
- **Dependencies:** Phase 10 approval and credentials.
- **Deliverables:** Reproducible deployment and operations checklist.
- **Acceptance:** Health checks, scheduled billing, mail delivery, logs, alerts, and rollback are verified.
- **Testing:** Production-like smoke, migration/index, backup/restore, and post-deploy checks.

## Phase 12: Final release and hackathon presentation

- **Objectives:** Freeze scope, prepare demo data/scripts, document known limitations, and present measurable outcomes.
- **Files/modules:** Release notes, demo scripts, final documentation.
- **Dependencies:** Phase 11.
- **Deliverables:** Versioned release and presentation-ready walkthrough.
- **Acceptance:** Demonstration covers admin, staff, customer, billing, payment, and analytics journeys.
- **Testing:** Final acceptance rehearsal and regression run.
