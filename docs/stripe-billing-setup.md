# Stripe Billing Setup

## Required Env Vars
- `NEXTAUTH_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Use [`.env.example`](/home/vicebas/Workspace/buymyhorse/buymyhorse/.env.example) as the local template.

## Admin Billing Configuration
Configure these in `/admin/billing` instead of `.env`:
- Single Horse price ID
- Barn Starter price ID
- Barn Growth price ID
- Barn Unlimited price ID
- extra horse price ID
- launch trial enabled / days

## Local Wiring
1. Create the five Stripe Prices in the same Stripe account you want to test:
   - Single Horse
   - Barn Starter
   - Barn Growth
   - Barn Unlimited
   - Additional Horse Profile
2. Put `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in your local `.env`.
3. Sign in as an admin and open `/admin/billing`.
4. Save the five Stripe `price_...` IDs in the billing settings form.
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
- saved price IDs for the four launch plans and extra horse

3. Sign in with a buyer account and open:

```text
/mybarn/onboard
```

4. Choose a launch plan and submit the barn form.
Expected:
- barn is created
- if the admin trial is enabled, the user lands in `/mybarn` with a trialing plan
- if the admin trial is disabled, the app redirects to Stripe Checkout

5. From MyBarn billing:

```text
/mybarn/billing
```

Expected:
- current launch plan and billing status are visible
- published horse usage is visible against total capacity
- purchased/admin additional horse profiles are visible
- `Manage Billing` opens Stripe portal once a Stripe customer exists

6. Buy one or more additional horse profiles from MyBarn billing.
Expected:
- Stripe Checkout opens
- successful webhook delivery records the purchased horse profiles
- total horse capacity increases

7. Try publishing horses beyond available capacity or without the required listing fields/image.
Expected:
- publish is blocked with a clear billing-plan/capacity error message

8. If billing becomes inactive, verify that public horse pages, barn pages, marketplace exposure, and EquiTag redirects are hidden until billing is active again.

## Notes
- The launch plans are `Single Horse` (6 months), `Barn Starter` (monthly), `Barn Growth` (monthly), and `Barn Unlimited` (monthly).
- Additional Horse Profile is a one-time purchase that adds reusable capacity whenever billing is active.
- Stripe secrets remain env-only; the admin UI only manages non-secret billing configuration.
- Trial is controlled globally by admin settings and only affects new barn onboardings after the setting changes.
- Existing horses are not deleted when billing is inactive; public exposure is simply hidden until billing is active again.
