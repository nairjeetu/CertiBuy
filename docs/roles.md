CertiBuy — Roles & Permissions

## 1. Two axes

CertiBuy separates **who you are** from **which side you are looking at**:

- **`app_role`** — `customer` | `technician` | `ops`. This is the permission axis.
- **`active_mode`** — `buyer` | `seller`. This is a *view preference* for customers only. It never grants or removes access.
- **platform `role`** — `admin` | `user`. The hosting platform's own role. `admin` is reserved for the person who set the workspace up and for ops staff who need staff management; it is not a business role.

A single person buys and sells, so a customer holds **both** marketplace areas at once. Gating a page on `active_mode` would lock a seller out of their own order history — the guard only ever checks `app_role`.

The product proposal names four personas; the app models them as **three `app_role` values plus the platform admin**: Seller and Buyer are the same `customer` account seen from two sides, Technician and Operations are staff accounts. Anything that assumes four distinct account types will not match this data.

## 2. Permission matrix

| Capability | customer | technician | ops | admin |
| --- | --- | --- | --- | --- |
| Create/edit own submission before handover | ✅ | — | — | ✅ |
| See own offers, deals, payouts | ✅ | — | — | ✅ |
| Browse shop, see listings + reports | ✅ | — | — | ✅ |
| Place order, raise return on own order | ✅ | — | — | ✅ |
| See another customer's submission/order | ❌ | scoped to hub, staff view | ✅ | ✅ |
| Hub queue, identity, checklist, grade | ❌ | ✅ own hub | ✅ any hub | ✅ |
| Handover, reject, return re-inspection | ❌ | ✅ own hub | ✅ | ✅ |
| Resolve a return, retry a payout | ❌ | ❌ | ✅ | ✅ |
| Catalogue, pricing, hubs, users, liquidity, metrics | ❌ | ❌ | ✅ | ✅ |
| Run jobs (daily job, liquidity, metrics, outbox) from Ops → Jobs | ❌ | ❌ | ✅ | ✅ |
| Move the business clock, reset demo data | ❌ | ❌ | ✅ (demo mode) | ✅ |
| Cancel an order before dispatch | ✅ own order | ❌ | ✅ | ✅ |
| Invite staff, read/answer support requests, view the audit log | ❌ | ❌ | ✅ | ✅ |
| Assign `app_role` / `hub_id` / trust score | ❌ | ❌ | ⚠️ through the staff endpoints (admin-only write rule) | ✅ |

⚠️ Field-level: `app_role`, `hub_id`, `trust_score`, `return_count` and `account_flagged` on a user record may only be written by an admin. A customer may write their own `active_mode`, `phone`, `city`, `avatar_url`, `payout_account`, `delivery_address` and password/email through the auth flows.

## 3. Role resolution

```
effectiveRole(user) =
    user.app_role                       if set
    "ops"                               if user.role === "admin"     // a fresh builder lands in the console
    "customer"                          otherwise
```

Why the fallback exists: the very first sign-in has no `app_role` yet. A **server-side bootstrap** sets `customer` once, and only when the field is empty — an existing role is never overwritten. The builder's own account (platform `admin`, no `app_role`) therefore opens the console instead of a buyer page.

`homeFor(user)`:

| Role | Landing |
| --- | --- |
| technician | `/hub` |
| ops | `/ops` |
| customer with a saved mode | `/shop` (buyer) or `/seller` (seller) |
| customer with no mode yet | a one-time chooser (Buying / Selling) |

`canOpenArea(user, allowedRoles)` — the guard. Platform admins bypass it (to preview any area); everyone else must carry an allowed `app_role`.

`canSeeAll(user)` — ops or platform admin. Used for staff-only projections, never to relax a customer's own-data rule.

## 4. Guard pattern (UI layer)

Every non-public area is wrapped by one guard component that receives the allowed roles and, for customers, the expected mode:

```
<RoleGate roles={["customer"]} mode="seller">   // /seller/*
<RoleGate roles={["customer"]} mode="buyer">    // /shop/*
<RoleGate roles={["technician","ops"]}>         // /hub/*
<RoleGate roles={["ops"]}>                      // /ops/*
<RoleGate roles={["customer"]}>                 // /help
```

Behaviour:

1. While the session is resolving → spinner, never a redirect.
2. If the role is not allowed → toast "That page is for another role" and replace-navigate to `homeFor(user)`.
3. If a customer opens the *other* mode's area (from a notification or a shared link) → the page is allowed, and their `active_mode` is quietly updated to match, so the header switch stays truthful. This is a convenience, never a permission.
4. Ops with demo mode on may open any area (role preview).

The gate is **not** a security boundary — it is UX. Every rule is re-checked on the server.

## 5. Enforcement layers (must all agree)

| Layer | Purpose | Example |
| --- | --- | --- |
| Route guard | don't render a page the role cannot use | `/ops` blocked for a customer |
| Server read model | project only the fields the audience may see | buyer's order bundle has no seller id, no cost, no floor |
| Command endpoint | re-check caller + business preconditions | `resolveReturn` requires `app_role === "ops"` or `role === "admin"` |
| Record access rule | last line of defence at the data store | a seller may only read `Submission`s where `seller_id = caller` |
| Hub scoping | staff cannot cross hubs | `assertHubAccess(me, hubId)` and hub-filtered queries |

Never rely on a single layer. A screen that hides a button is not a permission.

## 6. Record access rules (translate directly to SQL RLS)

The reference build stores these next to each schema; on SQL they become `ROW LEVEL SECURITY` policies. `{{user.id}}` = the caller's user id, `user_condition` = a predicate on the caller's user record.

| Entity | read | create | update | delete |
| --- | --- | --- | --- | --- |
| Submission | owner or admin/ops/tech-as-staff | owner or admin | owner or admin | admin |
| Offer | owner (`seller_id`) or admin | staff (server only) | staff (server only) | admin |
| GradeAssessment | owner or technician or admin | technician or admin | technician or admin | admin |
| Payout | owner (`seller_id`) or admin | admin/system | admin/system | admin |
| Device | owner seller **or** technician in the same hub **or** admin | system | system | admin |
| Listing | `status ∈ {active, reserved, sold}` **or** admin | system | system | admin |
| Order | buyer or admin | system | system | admin |
| ReturnRequest | buyer or admin | buyer (own) or admin | ops/admin | admin |
| EscrowTransaction | buyer or admin | system | system | admin |
| Booking | seller or technician of that hub or admin | seller (own) or admin | technician (own hub) or admin | admin |
| InspectionReport | technician of that hub or admin | technician or admin | technician of that hub or admin | admin |
| Notification | own (`user_id`) or admin | system | own (mark read) or admin | admin |
| SupportRequest | own (`customer_id`, including the reply), ops, admin | customer (own) | ops/admin (reply, resolve) | ops/admin |
| Invitation | ops/admin | ops/admin | system (accept) | admin |
| ExceptionCase / ActivityLog / BlacklistedImei | ops/admin | system | system | admin |
| DeviceModel / Hub / Settings / LiquidityScore | everyone signed in (catalogue, prices, rules are not secret) | admin | admin | admin |

Two consequences worth restating:

- **Writes are almost always system writes.** A browser cannot set a price, a status or a payout. Customers write only their own draft submission, their own return request and their own notification's `read` flag.
- **Public read is narrow.** Only `Listing` (live states), `DeviceModel`, `Hub`, `Settings` and `LiquidityScore` are readable beyond their owner, because the storefront needs them.

## 7. Staff onboarding

1. Ops opens **Users → Invite staff**, enters the email, the `app_role` and, for technicians, the `hub_id`. The app creates an invitation and shows an **invite link** for ops to copy and send (no email delivery needed in the capstone). Links expire.
2. The person opens the link, sets a password and enrols MFA (required for staff).
3. On first sign-in the invited role and hub are applied server-side; a technician lands on `/hub` for that hub only.
4. Removing a person: set `app_role` back to `customer` (they keep their buying/selling history) and sign them out of all sessions, or revoke the account.

Ops accounts that manage staff should also carry `is_platform_admin` (the rebuild's replacement for the platform `admin` role) so they can manage users and open every area.

## 8. Escalation paths

| Situation | Who acts |
| --- | --- |
| Grade dispute raised by a seller | ops resolves from Exceptions (re-inspect, reprice, or refund the mismatch fee) |
| Payout failed 3× | auto exception `payment_hold`; ops retries or pays manually, then marks it resolved |
| Return not resolved in the hub | exception stays open with an ageing hint; ops can resolve without re-inspection in a documented case |
| Customer complaint | `SupportRequest` in Ops → Support with the related order/deal; ops replies and resolves |
| Day-45 unsold device | ops liquidates to B2B at the floor price (one click) or reprices |
| Hub capacity/quality issue | ops toggles the hub inactive (bookings stop) or edits slots |

## 9. Anti-patterns

- Checking `active_mode` in a guard or a query.
- Letting a customer read a submission because they can read *a* submission — always filter by owner on the server.
- Adding a new role to `app_role` for a sub-team (e.g. "senior technician"): model staff types in a separate field and use them only for screens, not for data access.
- Trusting a role sent from the browser, or a role cached in the client store: re-read the user record in the endpoint.