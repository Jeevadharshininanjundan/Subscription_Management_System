# Brightloop Subscription Management System Requirements

## 1. Purpose and Scope

Brightloop Software needs one system for configuring products and plans, managing customers and subscriptions, generating recurring invoices, recording payments, and reporting revenue. This document consolidates the approved brief and the four-page `Subscription_Management_System.pdf`.

Phase 0 defines requirements and architecture only. It does not implement application features.

## 2. Users and Roles

| Role | Responsibilities | Access boundary |
|---|---|---|
| Admin | Manage products, variants, plans, tax rules, discounts, staff, and analytics | Full system administration |
| Staff | Manage customers, quotations, subscriptions, invoices, payments, and overdue follow-up | Operational records; no staff administration |
| Customer | Register, authenticate, view and manage own subscriptions, invoices, payments, and requests | Own customer portal data only |

Every protected operation must enforce both authentication and role/resource authorization on the server. Client-side route guards are UX controls, not security controls.

## 3. Functional Requirements

### 3.1 Authentication and authorization

- Register with a unique email address.
- Require passwords longer than eight characters with at least one uppercase letter, one lowercase letter, and one special character.
- Hash passwords with bcrypt; never store or log plaintext passwords.
- Support login, logout, forgot-password, and time-limited email reset links.
- Enforce role-based authorization.
- Allow only Admin users to create internal staff accounts.
- Prevent a Customer from reading or changing another customer's records.
- Prefer short-lived access tokens and securely handled refresh/reset tokens; exact token transport is an implementation decision for Phase 3.

### 3.2 Product and variant management

- Admin creates and updates product name, type, sales price, cost price, and notes.
- Products may have variants.
- A variant may add a variant-specific price adjustment, such as a brand surcharge.
- Products and variants used by historical documents must be archived rather than hard-deleted.

### 3.3 Subscription plan management

- Admin configures daily, weekly, monthly, and yearly billing intervals.
- Configure base price, minimum quantity, availability start/end dates, and closure behavior.
- Configure whether a plan may close automatically, close early, pause, or renew.
- Do not allow new subscriptions outside plan availability dates.
- Preserve the plan snapshot used by an existing subscription when later catalog prices change.

### 3.4 Customer and quotation management

- Staff can create and manage customer records.
- Staff can create reusable quotation templates containing product and plan lines.
- Quotations have a configurable validity period and explicit status/expiry behavior.
- Staff can prepare quotations and convert an eligible quotation into one subscription.
- Conversion must be idempotent and must not create multiple subscriptions for one quotation.

### 3.5 Subscription management

- Generate a unique subscription number.
- Store customer, plan, start date, expiry date, payment terms, product lines, quantities, unit prices, taxes, discounts, and totals.
- Lifecycle: `Draft -> Quotation -> Confirmed -> Active -> Closed`.
- Permit only documented forward or controlled transitions; reject invalid transitions.
- Support pause and renewal only when enabled by the plan and allowed by subscription state.
- Do not bill closed, cancelled, or otherwise ineligible subscriptions.

### 3.6 Invoice management

- Generate invoices automatically from subscriptions when billing is due.
- Copy customer, product lines, taxes, discounts, totals, currency, and billing-period information into an invoice snapshot.
- Invoice statuses: `Draft`, `Confirmed`, `Paid`; cancellation must be represented explicitly so cancelled invoices cannot be paid or billed again.
- Staff can confirm, cancel, send, and print invoices.
- Prevent duplicate billing for the same subscription and billing period.
- Mark invoices overdue based on due date and outstanding balance.

### 3.7 Discounts

- Admin creates fixed-amount or percentage discounts.
- Configure minimum purchase amount, minimum quantity, active dates, usage limit, and product-specific or subscription-wide scope.
- Apply eligible discounts automatically during invoice calculation.
- Enforce caps so a percentage discount cannot create a negative subtotal and a fixed discount cannot exceed the eligible base.
- Count usage only after the invoice is successfully confirmed, using an atomic operation.
- Do not apply expired, not-yet-active, exhausted, or ineligible discounts.
- Store a discount snapshot and calculation explanation on the invoice.

### 3.8 Taxes and payments

- Admin configures tax rules and rates.
- Calculate tax consistently from taxable line bases and the selected tax configuration.
- Support multiple payment methods.
- Record payment amount, date, method, note, and invoice association.
- Reject payments that exceed the invoice outstanding balance unless a later-approved credit/overpayment policy exists.
- Recalculate invoice payment status transactionally after payment recording.

### 3.9 Analytics

- Show active subscriptions.
- Show collected revenue, outstanding payments, and overdue invoices.
- Provide revenue summaries with date and status filters.
- Dashboard and common listing requests should respond in under two seconds under the intended demonstration workload.
- Analytics must use indexed, bounded queries and pre-aggregated or carefully aggregated data where needed; correctness takes precedence over premature caching.

## 4. Non-functional Requirements

- JavaScript MERN implementation: React/Vite/Tailwind/React Router/Axios/Recharts; Node/Express/Mongoose/JWT/bcrypt/Zod.
- Use Jest or Vitest, Supertest, and React Testing Library.
- Use Nodemailer for email notifications and Node Cron for recurring billing.
- Keep secrets in environment configuration, never in source control or documentation examples.
- Validate all external input at API boundaries with Zod or equivalent server-side validation.
- Use UTC timestamps and an explicit ISO 4217 currency code on monetary documents.
- Represent money using integer minor units or a decimal-safe strategy; never rely on binary floating-point for persisted totals.
- Provide structured errors, request correlation identifiers, audit-relevant actor metadata, and safe logs without credentials or tokens.
- Preserve historical financial and catalog snapshots for auditability.

## 5. Acceptance Criteria for Phase 0

- Requirements from the PDF and approved prompt are represented without introducing Odoo or unrelated paid services.
- Roles, lifecycle states, billing rules, discount rules, payment constraints, and performance target are explicit.
- Data model, API boundaries, architecture, and implementation roadmap are documented.
- No application feature code is created.

