# Brightloop Subscription Management System API Design

## 1. API Conventions

- Base path: `/api/v1`.
- JSON over HTTPS.
- Use `Authorization: Bearer <access-token>` or the approved secure cookie strategy.
- Every response includes a request ID in `meta.requestId`.
- Lists support `page`, `pageSize`, `sort`, and bounded filter parameters; maximum page size is server-defined.
- Dates are ISO 8601 UTC strings. Amounts are integer minor units with an explicit `currency`.
- Mutating requests may accept an `Idempotency-Key`; server behavior must be documented per endpoint.
- Errors use HTTP status plus a stable application code:

```json
{
  "data": null,
  "meta": { "requestId": "req_..." },
  "error": { "code": "INVALID_TRANSITION", "message": "The requested state change is not allowed." }
}
```

## 2. Authentication

| Method | Route | Roles | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Register Customer |
| POST | `/auth/login` | Public | Authenticate |
| POST | `/auth/logout` | Authenticated | Revoke/clear session |
| POST | `/auth/forgot-password` | Public | Request reset email without account enumeration |
| POST | `/auth/reset-password` | Public with token | Set a new password |
| GET | `/auth/me` | Authenticated | Get current safe user profile |

Registration and reset responses must not disclose whether an email exists where that would enable enumeration.

## 3. Catalog, Plans, Taxes, and Discounts

| Method | Route | Roles | Purpose |
|---|---|---|---|
| GET/POST | `/products` | Admin | List/create products |
| GET/PATCH | `/products/:id` | Admin | Read/update/archive product |
| POST/PATCH | `/products/:id/variants/:variantId` | Admin | Manage product variants |
| GET/POST | `/plans` | Admin | List/create plans |
| GET/PATCH | `/plans/:id` | Admin | Read/update/archive plans |
| GET/POST | `/tax-configurations` | Admin | Manage tax rules |
| GET/POST | `/discounts` | Admin | Manage discount rules |
| GET/PATCH | `/discounts/:id` | Admin | Read/update/archive discount |

Server validation must enforce date windows, prices, intervals, quantities, and allowed status changes.

## 4. Users and Customers

| Method | Route | Roles | Purpose |
|---|---|---|---|
| GET/POST | `/staff` | Admin | List/create staff |
| PATCH | `/staff/:id` | Admin | Update/deactivate staff |
| GET/POST | `/customers` | Admin, Staff | List/create customers |
| GET/PATCH | `/customers/:id` | Admin, Staff; self-read Customer | Manage customer |
| GET | `/portal/profile` | Customer | Own profile |

Customer resource access must be scoped by authenticated customer identity, never by a client-supplied customer ID alone.

## 5. Quotations and Subscriptions

| Method | Route | Roles | Purpose |
|---|---|---|---|
| GET/POST | `/quotation-templates` | Admin, Staff | Manage reusable templates |
| GET/POST | `/quotations` | Admin, Staff | List/create quotations |
| GET/PATCH | `/quotations/:id` | Admin, Staff; own Customer read | Manage quotation |
| POST | `/quotations/:id/convert` | Admin, Staff | Idempotently convert to subscription |
| GET/POST | `/subscriptions` | Admin, Staff | List/create subscriptions |
| GET/PATCH | `/subscriptions/:id` | Admin, Staff; own Customer read | Manage subscription |
| POST | `/subscriptions/:id/transition` | Admin, Staff | Validate lifecycle transition |
| POST | `/subscriptions/:id/pause` | Admin, Staff; eligible Customer request | Pause |
| POST | `/subscriptions/:id/renew` | Admin, Staff; eligible Customer request | Idempotently renew |
| GET | `/portal/subscriptions` | Customer | List own subscriptions |

Transition endpoints must use an allowed-transition map and return `INVALID_TRANSITION` for invalid requests.

## 6. Invoices and Payments

| Method | Route | Roles | Purpose |
|---|---|---|---|
| GET | `/invoices` | Admin, Staff | Filter and paginate invoices |
| GET | `/invoices/:id` | Admin, Staff; own Customer read | Read invoice |
| POST | `/invoices/:id/confirm` | Admin, Staff | Confirm invoice |
| POST | `/invoices/:id/cancel` | Admin, Staff | Cancel invoice with reason |
| POST | `/invoices/:id/send` | Admin, Staff | Send invoice email |
| GET | `/invoices/:id/print` | Admin, Staff; own Customer | Render/print representation |
| GET/POST | `/invoices/:id/payments` | Admin, Staff | List/record payments |
| GET | `/payments` | Admin, Staff | Search payments |
| GET | `/portal/invoices` | Customer | List own invoices |
| GET | `/portal/payments` | Customer | List own payments |

Payment creation must re-read the invoice under a transaction/lock strategy, reject cancelled invoices and overpayments, then update the balance and paid status atomically.

## 7. Billing and Analytics

| Method | Route | Roles | Purpose |
|---|---|---|---|
| POST | `/billing/run` | Admin or internal job credential | Run idempotent due billing |
| GET | `/dashboard/summary` | Admin, Staff | Active/revenue/outstanding/overdue summary |
| GET | `/dashboard/revenue` | Admin, Staff | Filtered revenue series |

The public API must not expose an unauthenticated billing trigger. A scheduled job should call an internal service or protected route with a narrowly scoped credential.

## 8. Status Codes and Error Codes

- `400`: malformed input (`VALIDATION_ERROR`)
- `401`: missing/invalid authentication (`UNAUTHENTICATED`)
- `403`: insufficient role/resource access (`FORBIDDEN`)
- `404`: missing resource (`NOT_FOUND`)
- `409`: uniqueness, idempotency, concurrency, or transition conflict (`DUPLICATE_BILLING_PERIOD`, `INVALID_TRANSITION`)
- `422`: valid shape but invalid business rule (`OVERPAYMENT`, `DISCOUNT_INELIGIBLE`)
- `429`: rate limit
- `500`: unexpected server error, with safe client message and server-side correlation logging

## 9. Contract Testing Requirements

- Validate request and response schemas for every route.
- Test each role against allowed and denied routes.
- Test customer ownership boundaries with another customer's IDs.
- Test duplicate conversion, billing retry, and payment retry using repeated requests.
- Test totals, tax, discounts, due dates, and status transitions at the API/service boundary.

