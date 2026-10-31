# Brightloop Subscription Management System Database Design

## 1. Conventions

- MongoDB collections use plural lower-case names.
- Every document has `_id`, `createdAt`, and `updatedAt`; use Mongoose timestamps.
- Store dates as BSON `Date` values in UTC.
- Store `currency` explicitly on monetary aggregates, for example `USD`.
- Store money as integer minor units (`amountMinor`) plus currency, or use a decimal-safe representation consistently. This design assumes integer minor units for persisted calculations.
- Financial and document lines embed snapshots of names, prices, tax rates, and discount inputs so catalog edits do not rewrite history.
- References point to current aggregate roots; line snapshots are not substitutes for ownership references.

## 2. Collections

### Users (`users`)

Required: `email` (normalized), `passwordHash`, `role` (`ADMIN|STAFF|CUSTOMER`), `status`, `name`, `lastLoginAt`.

Optional: `customerId` for Customer users, reset-token hash/expiry fields, email verification fields.

Constraints/indexes: unique partial index on normalized email; index on role/status. Never return `passwordHash` or reset hashes.

### Customers (`customers`)

Required: `name`, `primaryEmail`, `status`.

Optional: phone, billing address, tax identifier, `userId`.

Constraints/indexes: unique normalized primary email where policy requires; unique `userId` for portal identity; indexes on name/email/status.

### Products (`products`)

Required: `name`, `type`, `salesPriceMinor`, `costPriceMinor`, `currency`, `status`.

Optional: notes, archivedAt.

Constraints/indexes: index on status/type/name. Prices are non-negative; cost and sales currencies must match unless multi-currency is explicitly added.

### Product Variants (`productVariants`)

Required: `productId`, `name`, `priceAdjustmentMinor`, `currency`, `status`.

Constraints/indexes: unique compound `(productId, normalizedName)`; index on product/status. Product deletion is archival only.

### Subscription Plans (`subscriptionPlans`)

Required: `name`, `billingInterval` (`DAILY|WEEKLY|MONTHLY|YEARLY`), `basePriceMinor`, `currency`, `minimumQuantity`, `availableFrom`, `status`.

Optional: `availableUntil`, `autoClose`, `allowEarlyClose`, `allowPause`, `allowRenewal`, description.

Constraints/indexes: validate date order and positive minimum quantity; index `(status, availableFrom, availableUntil)` and name. Plan price changes create a new version or are snapshotted when selected.

### Quotation Templates (`quotationTemplates`)

Required: `name`, `validityDays`, `status`, and template line snapshots/references for plans/products.

Indexes: status/name.

### Quotations (`quotations`)

Required: unique `quotationNumber`, `customerId`, `status`, `issuedAt`, `validUntil`, line snapshots, currency, subtotal/tax/discount/total amounts.

Optional: `templateId`, notes, `convertedSubscriptionId`.

Constraints/indexes: unique quotation number; index customer/status/validity; unique partial `convertedSubscriptionId` or an atomic conversion guard. Expired quotations cannot convert.

### Subscriptions (`subscriptions`)

Required: unique `subscriptionNumber`, `customerId`, `planId`, `status`, `startDate`, `paymentTerms`, `currency`, line snapshots, subtotal/tax/discount/total amounts, `nextBillingDate`.

Optional: `quotationId`, `expiryDate`, `closedAt`, `pausedAt`, `lastBilledPeriodKey`, renewal metadata.

Constraints/indexes: unique subscription number; unique quotation conversion reference; indexes `(customerId, status)`, `(status, nextBillingDate)`, `(planId, status)`. Validate lifecycle transitions and date order.

Embedded subscription lines: product/variant references where applicable, display snapshots, quantity, unit price, tax references/rates, line subtotal/tax/total.

### Discounts (`discounts`)

Required: `name`, `kind` (`FIXED|PERCENTAGE`), value, currency when fixed, `scope` (`PRODUCT|SUBSCRIPTION`), active dates, status, usage limit/usage count.

Optional: eligible product IDs, minimum purchase minor amount, minimum quantity.

Constraints/indexes: index active date/status; non-negative fixed values; percentage bounded to the approved range; atomic usage updates. Do not rely on an application-only uniqueness check for usage.

### Invoices (`invoices`)

Required: unique `invoiceNumber`, `subscriptionId`, `customerId`, `status`, `billingPeriodStart`, `billingPeriodEnd`, deterministic `billingPeriodKey`, `issueDate`, `dueDate`, `currency`, line snapshots, subtotal/tax/discount/total amounts, `paidAmountMinor`, `balanceDueMinor`.

Optional: `confirmedAt`, `sentAt`, `cancelledAt`, cancellation reason.

Constraints/indexes: unique compound `(subscriptionId, billingPeriodKey)`; unique invoice number; indexes customer/status/due date, subscription/status, and overdue query fields. Enforce `paidAmountMinor <= totalMinor` and balance consistency.

Embedded invoice lines: product/plan display snapshots, quantity, unit price, tax/discount snapshots, line totals.

### Payments (`payments`)

Required: `invoiceId`, `customerId`, `amountMinor`, `currency`, `method`, `paymentDate`, `status`.

Optional: note, external reference, recordedBy.

Constraints/indexes: positive amount; index invoice/date/status and customer/date. Payment recording and invoice balance update must be atomic. Reject a payment beyond the current balance.

### Tax Configurations (`taxConfigurations`)

Required: `name`, `rateBasisPoints`, `currencyScope` or applicability rules, active dates, status.

Optional: jurisdiction, product/type filters.

Constraints/indexes: index status/active dates; rates must be non-negative and bounded. Snapshot the selected rule and rate onto subscription/invoice lines.

## 3. Relationships

```text
User 1--0..1 Customer
Customer 1--many Quotations
Customer 1--many Subscriptions
Customer 1--many Invoices
Product 1--many ProductVariants
SubscriptionPlan 1--many Subscriptions
Quotation 0..1--1 Subscription
Subscription 1--many Invoices
Invoice 1--many Payments
Product/Plan/Discount/TaxConfiguration -> embedded immutable line snapshots
```

## 4. Validation and Consistency Rules

- Validate IDs, enums, dates, quantities, currency, and amount ranges before database access.
- Use unique indexes for emails, document numbers, and billing periods.
- Use optimistic versioning or transactions for state transitions and concurrent edits.
- Recompute totals on the server from line inputs; do not accept client totals as authoritative.
- Use soft archive for products, variants, plans, discounts, and tax rules referenced by history.
- Never mutate historical invoice/payment values when current catalog or tax configuration changes.
- Maintain a consistent currency per invoice/subscription; reject mixed currencies until explicitly supported.
- Keep `paidAmountMinor + balanceDueMinor = totalMinor` for non-cancelled invoices.
- Store actor IDs on operational mutations where auditability is required.

