# MY CLUB: paid subscriptions with TBC Pay (recurring saved card)

## What the club owner will see
- **Trial (7 days, unchanged):** a small banner with days left and a "Choose plan" button.
- **Pricing page:** two cards.
  - Weekly: $3 / week, renews automatically.
  - Yearly: ~~$156~~ **$124.80** / year, "-20% / Save 20%" badge, marked "Best value".
- **Payment:** "Pay" opens TBC's hosted payment page. The card is saved for renewals. After TBC confirms the payment, the user lands back in the app on a "Confirming payment..." screen. It becomes "Active" only once the server has confirmed the payment.
- **Failed renewal:** status changes to "past due". A warning banner shows for 3 days. After that the dashboard switches to a limited mode: the pricing page plus read-only data, and nothing is deleted.
- **Settings > Billing:** current plan, status, next charge date, saved card (masked), payment history, switch weekly/yearly (takes effect at the next renewal), cancel (access stays until the end of the paid period), "Update card".
- **Super-admin page:** every club with plan, status (trial / active / past_due / canceled / exempt), next charge date, last payment, total revenue, and revenue for the current month.
- **Exempt:** your Martve account (8e835aa2-...) is marked permanently free, so it never sees a paywall or banner. Coaches inherit their club's status and never see payment prompts. If the club's access is limited, the coach sees a neutral "Club access paused" message.

## Database (new tables only; existing rows untouched)
- `billing_subscriptions` (one row per club owner): user_id, plan (`weekly` | `yearly`), status (`trial` | `active` | `past_due` | `canceled` | `limited` | `exempt`), trial_ends_at, current_period_start, current_period_end, cancel_at_period_end, pending_plan, grace_until, tbc_rec_id (the saved-card token), card_mask, failed_attempts, last_charge_at, created_at, updated_at.
- `billing_payments`: user_id, plan, amount, currency, kind (`initial` | `recurring`), tbc_pay_id, status (`created` | `succeeded` | `failed` | `refunded`), raw_status, idempotency_key (unique), period_start, period_end, error, created_at.
- `billing_events`: a log of every webhook received (pay_id, payload hash, processed_at). It makes repeated webhooks safe to process twice.
- Your account gets one `exempt` row in `billing_subscriptions`. That row lives in the new table, so no existing data changes.
- Trial: on first load, `trial_ends_at` is copied from the existing `user_subscriptions.expires_at`. The old table is only read, never changed, so current trials continue exactly as they are.
- Access check: a new `billing_has_access(user_id)` returns true for exempt, an active trial, active, past_due inside grace, or canceled before period end. Admins always have access. The existing `is_subscription_active` is left as is. The app's gate switches to the new function.
- Security: users can read only their own rows. All writes happen on the server with the privileged key, and the admin list goes through a role-checked function.
- No test rows go into existing tables. Sandbox payments go only into the new tables, tagged `env = sandbox`.

## Server endpoints
This project's platform rule is no new Edge Functions, so the same logic runs as server routes on the app's own backend:
- `POST /api/billing/checkout` (signed in): creates a TBC payment with `saveCard`, the amount from the server-side plan table, and the callback URL. Returns the hosted page URL.
- `POST /api/public/tbc/webhook`: TBC calls this with `PaymentId`. The browser is never trusted. The server re-fetches `GET /payments/{id}` from TBC with our credentials, then checks the amount, currency and that the payment belongs to the user. Only then does it mark the payment succeeded, store `recId` and the card mask, and extend the period. Processing it twice gives the same result.
- `POST /api/public/billing/renew` (cron only, protected by a generated secret): finds subscriptions with `current_period_end <= now()` that are not canceled. It charges each saved card through TBC's recurring endpoint with the `recId`, then confirms the same way. On success it extends the period and applies `pending_plan`. On failure it sets past_due with a 3-day grace period and retries once a day. After grace it sets limited. If the period ends with cancel set, it sets canceled.
- `POST /api/billing/cancel`, `/switch-plan`, `/update-card` (signed in).
- Admin: a role-checked server function that lists clubs and revenue.

## Recurring schedule
- One background job runs **every hour** (24 runs per day) and calls the renew endpoint. Hourly keeps charges within about an hour of the due time at low cost. Daily would mean weekly renewals could charge up to a day late.

## What you need to configure in TBC
1. A TBC e-commerce merchant agreement with **recurring / saved-card payments enabled**. It must be requested explicitly.
2. From the developer portal: **API key (apikey), Client ID, Client Secret**, for sandbox first and live later.
3. Allow **USD** on the merchant account. Otherwise we charge GEL at a fixed rate (see questions).
4. Set the callback URL to `https://my-club.live/api/public/tbc/webhook` and the return URL to `https://my-club.live/?tab=billing`.
5. Secrets you will enter: `TBC_API_KEY`, `TBC_CLIENT_ID`, `TBC_CLIENT_SECRET`, `TBC_ENV` (`sandbox` | `live`). The cron secret is generated automatically.

## Languages
- Georgian and English as you asked. The four other languages in the switcher fall back to English unless you want them translated too.

## Open questions
1. Does TBC let your merchant charge in **USD**, or should we charge GEL (fixed price or daily rate)?
2. What happens to the current **bank-transfer payment** flow and the admin approval panel: remove it, or keep it as a fallback?
3. Existing users who **already paid by bank transfer**: should their paid-until date carry over as "active until X", then switch to the card at renewal?
4. **Limited mode**: read-only dashboard, or only the pricing page (data hidden but kept)?
5. Should failed renewals **email** the owner, or show only the in-app banner?
6. Proration when switching weekly to yearly: I propose no proration, with the switch applied at the next renewal. Is that OK?

## Technical details
- Plan prices live only on the server (`src/lib/billing-plans.ts`). The client shows them but never sends an amount.
- The TBC access token comes from `POST /v1/tpay/access-token` and is cached in memory until it expires. It runs on workerd using `fetch`.
- The webhook's only input is the payment id, and every decision is based on TBC's own response.
- The renew endpoint checks a `Bearer` cron secret. Per-row locking (`FOR UPDATE SKIP LOCKED`) plus idempotency keys prevent double charges.
- Coach routes resolve the club owner's id and call `billing_has_access(owner_id)`.
- The old PayPal and bank-transfer code stays until question 2 is answered.
