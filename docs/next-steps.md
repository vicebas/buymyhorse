# HorseRoster Next Steps

Last updated: 2026-07-12

## Purpose

This planning document is now focused on the approved EquiVault positioning work.

The goal is to make every seller understand that EquiVault is a core included part of HorseRoster, not a hidden or secondary feature.

Use this together with:
- `docs/horseroster-spec.md`
- `docs/project-status.md`
- the client mock dated 2026-07-12

## Primary Outcome

By the end of this work:
- every user sees EquiVault called out during plan selection and onboarding
- Billing & Add-Ons positions EquiVault as an included core product
- users are not dropped into a confusing EquiVault path before creating a barn
- EquiVault remains organized per horse inside the existing horse document flow

## Current Product Reality

These are the relevant touchpoints in the current codebase:
- `src/components/billing/pricing-plan-experience.tsx`
  Routes a non-barn user from pricing into `/mybarn/onboard?plan=...&step=included`
- `src/app/seller/onboard/page.tsx`
  Barn onboarding now includes `plan`, `included`, and `details`
- `src/components/billing/barn-plan-selector.tsx`
  Shows the plan cards plus the EquiVault side card
- `src/components/billing/billing-plan-manager.tsx`
  Still uses the shared selector while billing operations remain unchanged
- `src/app/mybarn/equivault/page.tsx`
  EquiVault overview exists for sellers with a barn and should show the no-barn guard flow otherwise

## Approved Scope

### 1. Insert an "Everything Included" onboarding step

Goal:
- after plan selection, but before barn creation, show one simple screen that introduces the four core HorseRoster parts

Required UI:
- heading: `Everything Included`
- items:
  - `Horse Profiles`
  - `My Barn`
  - `EquiVault`
  - `EquiTag`
- primary CTA: `Continue -> Create My Barn`

Implementation plan:
- add a new onboarding step between `plan` and `details`
- extend the onboarding query-state model in `src/app/seller/onboard/page.tsx`
- likely step naming:
  - `plan`
  - `included`
  - `details`
- update plan-selection actions so they move to `step=included`, not directly to `step=details`
- update pricing-entry routing in `src/components/billing/pricing-plan-experience.tsx` so non-barn users land on the new included step
- keep the selected plan in the query string throughout the flow
- include a back action from the included step to plan selection

Acceptance criteria:
- a user who selects a plan always sees EquiVault before barn creation
- the included step is visually simple and not a second pricing screen
- continuing from the included step lands on barn creation details, not checkout
- existing email-verification gating still works

### 2. Replace the informational add-on card with an EquiVault card

Goal:
- remove the `Additional Horse Profile` marketing card from the selector area and replace it with an EquiVault positioning card

Required UI copy:
- title: `EquiVault`
- subtitle: `Secure Horse Document Vault`
- description: `Store, organize, and securely transfer all of your horse documents in one place.`
- bullets:
  - `Health records, Coggins & PPEs`
  - `Registrations & contracts`
  - `Organize documents by horse`
  - `Securely transfer documents to buyers`
  - `Access anywhere`
- button: `Open EquiVault`

Implementation plan:
- replace the right-rail card in `src/components/billing/barn-plan-selector.tsx`
- do not remove the real extra-horse purchase flow from `src/components/billing/billing-plan-manager.tsx` unless separately requested
- treat this as a positioning change, not a billing-model change

Button behavior:
- if the user already has a barn, open `/mybarn/equivault`
- if the user does not have a barn, do not deep-link into a dead end
- preferred behavior for parity with the mock:
  - trigger a `Create Your Barn First` modal
- acceptable fallback if speed matters:
  - send the user into the new included/onboarding flow

Acceptance criteria:
- `Additional Horse Profile` no longer appears as the side card beside plan selection
- EquiVault is clearly framed as included, not sold as a separate add-on
- the extra-horse purchase control still exists where billing operations actually happen

### 3. Add a pre-barn EquiVault guard state

Goal:
- if a user tries to open EquiVault before creating a barn, explain the dependency clearly

Required modal copy:
- title: `Create Your Barn First`
- body intent:
  `EquiVault is organized inside your Barn so every horse's documents stay connected.`
- CTA: `Create My Barn`
- secondary action: `Maybe Later`

Current product behavior:
- direct `/mybarn/equivault` visits for no-barn users should use the same guard flow instead of exposing a working EquiVault view

Implementation plan:
- add the modal at the CTA level rather than relying only on a redirect
- use the modal only in no-barn contexts
- route the primary action into the onboarding flow with the selected plan preserved when possible
- direct `/mybarn/equivault` visits for no-barn users should show the same `Create Your Barn First` explanation and route into onboarding

Acceptance criteria:
- users understand why EquiVault is not standalone before barn creation
- no confusing redirect happens after clicking an EquiVault CTA from plan-selection surfaces

### 4. Add EquiVault inclusion language anywhere plan value is summarized

Goal:
- reinforce that EquiVault is included in paid HorseRoster plans

Likely touchpoints:
- onboarding plan summary in `src/app/seller/onboard/page.tsx`
- pricing-plan feature bullets in `src/components/billing/barn-plan-selector.tsx`
- any pricing or billing summaries that currently mention only horse capacity and EquiTags

Implementation plan:
- add a concise included-value bullet such as:
  `EquiVault secure document storage and transfer is included`
- keep copy consistent across pricing and onboarding surfaces
- avoid creating a separate EquiVault upsell price

Acceptance criteria:
- a user can understand from plan-related UI that EquiVault comes with the plan
- no surface implies that EquiVault must be bought separately

### 5. Keep EquiVault inside each horse

Goal:
- preserve the existing per-horse document model

Decision:
- no structural change is needed here
- EquiVault should continue to live in each horse's document area and in the seller overview

Notes:
- the existing overview at `src/app/mybarn/equivault/page.tsx` already supports this direction
- this item is a guardrail, not a new feature build

## Explicit Non-Goals

Do not do these as part of this scope unless requested separately:
- remove or redesign the actual extra-horse billing purchase flow
- change Stripe products or pricing model
- redesign the per-horse EquiVault document manager
- introduce public document-sharing scope changes beyond the existing product behavior
- expand this work into a broader homepage or brand refresh

## Recommended Delivery Order

1. Add the new onboarding `included` step
2. Replace the selector-side card with the EquiVault card
3. Add the no-barn EquiVault modal behavior
4. Sweep pricing and plan-summary copy for EquiVault inclusion language
5. QA the full path from pricing -> onboarding -> barn creation -> billing -> EquiVault

## QA Checklist

- logged-out user selects a plan and is routed into account creation, then the included step
- logged-in user without a barn sees the included step before barn details
- logged-in user with a barn still gets correct billing behavior
- EquiVault CTA opens the overview for existing barns
- EquiVault CTA shows the pre-barn explanation for non-barn users
- additional horse purchases still work from Billing & Add-Ons
- no copy still suggests EquiVault is hidden or optional in a confusing way

## AI Kickoff Prompt

```text
Read docs/horseroster-spec.md, docs/project-status.md, and docs/next-steps.md.
Work only on the EquiVault positioning plan in docs/next-steps.md.
Implement the approved UX changes that make EquiVault visibly included in HorseRoster:
1. Add an "Everything Included" step between plan selection and barn creation.
2. Replace the informational "Additional Horse Profile" side card with an EquiVault card.
3. Add a pre-barn guard/modal when an EquiVault CTA is clicked before barn creation.
4. Update plan-summary and pricing-adjacent copy so EquiVault is clearly included.
Do not remove the real extra-horse purchase flow unless explicitly asked.
Do not change the underlying billing model.
Update docs/project-status.md after meaningful product changes.
```
