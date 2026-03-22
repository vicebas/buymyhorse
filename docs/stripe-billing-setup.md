# Stripe Billing Setup

## Required Env Vars
- `NEXTAUTH_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Use [`.env.example`](/home/vicebas/Workspace/buymyhorse/buymyhorse/.env.example) as the local template.

## Admin Billing Configuration
Configure these in `/admin/billing` instead of `.env`:
- activation monthly price ID
- activation yearly price ID
- extra horse price ID
- activation trial enabled / days

## Local Wiring
1. Create the three Stripe Prices in the same Stripe account you want to test:
   - Activation Monthly
   - Activation Yearly
   - Additional Horse Profile
2. Put `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in your local `.env`.
3. Sign in as an admin and open `/admin/billing`.
4. Save the three Stripe `price_...` IDs in the billing settings form.
5. Set `NEXTAUTH_URL=http://localhost:3000`.

## Local Webhook Forwarding
If you use the Stripe CLI locally:

```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

Copy the emitted webhook signing secret into:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Manual Sanity Pass
1. Start the app normally:

```bash
npm run dev
```

2. Sign in with an admin account and confirm `/admin/billing` shows:
- Stripe secret key: configured
- Stripe webhook secret: configured
- saved price IDs for monthly activation, yearly activation, and extra horse

3. Sign in with a buyer account and open:

```text
/mybarn/onboard
```

4. Choose `Monthly` or `Yearly` activation and submit the barn form.
Expected:
- barn is created
- if the admin trial is enabled, the user lands in `/mybarn` with a trialing activation
- if the admin trial is disabled, the app redirects to Stripe Checkout

5. From MyBarn billing:

```text
/mybarn/billing
```

Expected:
- activation cadence and billing status are visible
- published horse usage is visible against total capacity
- purchased/admin extra horse slots are visible
- `Manage Billing` opens Stripe portal once a Stripe customer exists

6. Buy one or more additional horse slots from MyBarn billing.
Expected:
- Stripe Checkout opens
- successful webhook delivery records the purchased slots
- total horse capacity increases

7. Try publishing horses beyond available capacity or without the required listing fields/image.
Expected:
- publish is blocked with a clear activation/capacity error message

8. If activation becomes inactive, verify that public horse pages, barn pages, marketplace exposure, and EquiTag redirects are hidden until billing is active again.

## Notes
- There is one activation product with two cadences: monthly and yearly.
- Additional Horse Profile is a one-time purchase that adds reusable capacity whenever activation is active.
- Stripe secrets remain env-only; the admin UI only manages non-secret billing configuration.
- Trial is controlled globally by admin settings and only affects new barn onboardings after the setting changes.
- Existing horses are not deleted when activation is inactive; public exposure is simply hidden until billing is active again.
