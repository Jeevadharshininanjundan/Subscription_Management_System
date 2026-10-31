# Brightloop Subscription Management System Architecture

## 1. Architectural Direction

Use a modular monorepo-style MERN application:

```text
subscription-management/
  client/
    src/
      assets/
      components/
      context/
      hooks/
      layouts/
      pages/
      routes/
      services/
      utils/
  server/
    src/
      config/
      controllers/
      jobs/
      middleware/
      models/
      routes/
      services/
      utils/
      validators/
  docs/
  PROJECT_STATE.md
```

The client owns presentation and navigation. The server owns authorization, validation, lifecycle rules, monetary calculation, billing orchestration, persistence, and audit-sensitive decisions. MongoDB is accessed through Mongoose. No business rule is trusted to the browser.

## 2. Runtime Boundaries

```text
React/Vite browser
        |
        | HTTPS JSON API
        v
Express API -> middleware -> controllers -> application services -> Mongoose models -> MongoDB
                                      |
                                      +-> Nodemailer email adapter
                                      +-> Node Cron billing trigger
```

- Controllers translate HTTP requests and responses only.
- Validators parse request bodies, query strings, and route parameters.
- Services contain use cases and transaction/idempotency logic.
- Models define persistence shape, indexes, and local invariants.
- Jobs call the same application services as an API; jobs must not duplicate business logic.
- External adapters are isolated so email delivery and scheduling can be replaced or tested.

## 3. Client Design

- React with Vite and JavaScript.
- React Router defines public, authenticated, role-gated, and customer-portal routes.
- Axios service modules provide one API client, consistent error handling, and auth behavior.
- Context is limited to cross-cutting session/auth state; page data remains local to pages/hooks.
- Reusable form, table, status, monetary, and permission components live under `components/`.
- Tailwind CSS provides the visual system.
- Recharts is used only for dashboard visualizations.
- The client must not calculate authoritative totals or authorize actions.

## 4. Server Design

Suggested modules:

- `config/`: environment parsing, database, mail, and application settings.
- `middleware/`: authentication, role/resource authorization, validation error handling, request IDs, rate limiting, and error mapping.
- `controllers/`: thin HTTP adapters.
- `services/`: auth, catalog, plans, quotations, subscriptions, billing, invoices, discounts, taxes, payments, and analytics.
- `models/`: Mongoose schemas and indexes.
- `validators/`: Zod request and domain input schemas.
- `jobs/`: recurring billing and overdue status jobs.
- `utils/`: money, dates, status transitions, pagination, and identifiers.

Use a consistent response shape:

```json
{
  "data": {},
  "meta": { "requestId": "..." },
  "error": null
}
```

Errors should expose a stable code and safe message, not stack traces, secrets, or database details.

## 5. Security Architecture

- Phase 3 uses short-lived JWT access tokens in the `Authorization: Bearer` header. The browser stores the access token in `localStorage` for this demonstration foundation, which is vulnerable to token theft if a future XSS defect exists; production hardening should prefer an HttpOnly Secure cookie with CSRF protection before deployment.
- Passwords use bcrypt with a current cost factor selected during implementation.
- JWT claims contain a user identifier, role, issuer, audience, and expiry; validate all claims.
- Reset tokens are random, single-use, hashed at rest, and expire quickly.
- Authorization is checked on every protected server route, including object ownership.
- Validate and normalize emails, IDs, dates, statuses, quantities, and monetary inputs.
- Apply rate limits to login, registration, and password reset endpoints.
- Use secure HTTP-only cookie transport if refresh tokens are used; otherwise define a documented token storage policy before implementation.
- Configure CORS to known client origins and use Helmet/security headers.
- Do not log authorization headers, passwords, reset tokens, or full payment-sensitive data.
- Logout increments the user's server-side token version, invalidating previously issued access tokens.

## 6. Billing and Consistency Architecture

Billing is a service-level workflow:

1. Select eligible active subscriptions whose next billing period is due.
2. Derive a deterministic billing-period key.
3. Atomically claim or create the period record/invoice under a unique subscription-period constraint.
4. Calculate lines, taxes, discounts, totals, and due date from immutable snapshots.
5. Confirm/send according to configured workflow.
6. Advance the subscription's next billing date only after the invoice workflow succeeds.

MongoDB transactions should be used for invoice creation, discount usage reservation, payment recording, and related state changes when the deployment supports them. A unique index and idempotency key remain mandatory because cron can overlap, retry, or run on multiple processes.

## 7. Performance and Observability

- Paginate all list endpoints; cap page size.
- Index every frequent equality/sort/filter field documented in `DATABASE_DESIGN.md`.
- Avoid unbounded population and N+1 queries.
- Select only required fields for list views.
- Measure API latency, billing job duration, invoice creation counts, and failed jobs.
- Add health/readiness endpoints without exposing configuration secrets.
- Treat the two-second target as a testable demonstration-workload acceptance criterion.

## 8. Architecture Decisions and Deferred Decisions

Decided in Phase 0:

- MERN, JavaScript, modular client/server boundaries.
- MongoDB references for aggregate roots and embedded line snapshots for immutable financial history.
- Server-authoritative permissions and calculations.
- Idempotent recurring billing using deterministic period keys and unique constraints.
- Explicit currency and minor-unit/decimal-safe money representation.

To decide during implementation:

- Access token transport and refresh-token policy.
- Exact MongoDB transaction deployment configuration.
- Email provider SMTP configuration and retry policy.
- Initial pagination defaults and dashboard aggregation strategy.
- Whether audit events receive a dedicated collection or an append-only event table.
