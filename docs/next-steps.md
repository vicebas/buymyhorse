# HorseRoster Next Steps

Last updated: 2026-03-20

## Purpose

This document groups the agreed remaining work into epics so it can be handed to AI assistants or engineers without re-explaining project context each time.

Use this together with:
- `AGENTS.md`
- `docs/horseroster-spec.md`
- `docs/project-status.md`

## Current Assumptions

- Client-approved scope changes override the older BuyMyHorse PDF where they conflict.
- EquiTag routing may resolve to either a barn or a horse destination.
- Billing scope is the activation-plus-extra-slots model.
- Website remains optional on the seller profile.
- Community features are not defined yet and should not be implemented without fresh client direction.
- Basic public-endpoint rate limiting is not in current scope.

## Epic Backlog

Completed epics:
- `1. Vault Epic`
- `2. Email Epic`
- `3. Admin Epic`
- `4. Seller Tools Epic`
- `5. Buyer Tools Epic`

Open epics:
- `6. Dev / Platform Epic`
- `7. Community Epic`

### 1. Vault Epic

Status:
- Completed in app code for the currently approved scope
- Remaining vault work is limited to future scope changes such as authenticated share-link strategy or later file-specific requests if reintroduced

Goal:
- Bring buyer request and vault management flows closer to the intended product shape.

Includes:
- category-based buyer requests
- intended-use capture in request flow
- grant-scoped access pages
- optional share-link support if scope changes later
- seller-side file rename
- seller-side move-between-categories
- seller-side soft-delete for vault files
- audit-log coverage for all vault actions

Dependencies:
- none required to start
- email infrastructure will improve notifications around this flow, but is not required for core implementation

Acceptance focus:
- buyers can request explicit categories instead of only free-text
- sellers can manage vault files after upload
- approved access is grant-aware, not only horse-aware
- revoke/expire behavior still works correctly

AI kickoff prompt:
```text
Read AGENTS.md, docs/horseroster-spec.md, docs/project-status.md, and docs/next-steps.md.
Work only on the Vault Epic.
Goal: inspect the completed Vault Epic implementation and only extend it if the request is for a new scoped follow-up such as authenticated share links or later file-specific request selection.
Do not re-implement the already completed category-request, grant-page, or vault-management work.
Keep website optional and do not reintroduce stale PDF assumptions that conflict with current docs.
Update docs/project-status.md after meaningful changes.
```

### 2. Email Epic

Goal:
- Add the auth and outbound email foundation the product still lacks.

Includes:
- email verification
- forgot password
- reset password
- base mail delivery integration
- reusable email event plumbing for future notifications

Dependencies:
- should be treated as a platform dependency for other notification-heavy epics

Acceptance focus:
- auth flows work end to end
- mail delivery is configurable by environment
- later product notifications can reuse the same infrastructure

AI kickoff prompt:
```text
Read AGENTS.md, docs/horseroster-spec.md, docs/project-status.md, and docs/next-steps.md.
Work only on the Email Epic.
Goal: add email verification, forgot/reset password, and the base outbound email infrastructure needed by the rest of the product.
Inspect the current auth stack and environment configuration first.
Do not add unsupported product features outside this epic.
Update docs/project-status.md after meaningful changes.
```

### 3. Admin Epic

Status:
- Completed in app code for the current agreed scope

Goal:
- Close the main admin tooling gaps around access control and reporting.

Includes:
- admin access-log UI
- platform-wide active-grant revoke actions
- featured-horse admin tool
- analytics expansion for requests, approvals, and messages

Dependencies:
- Vault Epic informs some access-log and grant data requirements

Acceptance focus:
- admins can inspect and act on grant/access data without manual DB work
- analytics cover the revised MVP reporting needs better
- featured-horse tooling exists in admin rather than via paid sponsored products

AI kickoff prompt:
```text
Read AGENTS.md, docs/horseroster-spec.md, docs/project-status.md, and docs/next-steps.md.
Work only on the Admin Epic.
Goal: inspect the completed Admin Epic implementation and only work on admin follow-ups that are not already shipped.
Do not rebuild the existing access console, grant revoke tooling, featured-horse controls, or revised analytics surfaces.
Inspect the current admin routes, analytics code, and grant/audit schema usage first.
Do not implement community features.
Update docs/project-status.md after meaningful changes.
```

### 4. Seller Tools Epic

Goal:
- Improve seller-side operational controls and profile completeness.

Includes:
- mute buyer controls
- block buyer controls
- seller-facing notifications once email infrastructure exists
- seller phone
- primary notification email
- seller-side soft-delete horse flow

Dependencies:
- Email Epic is a dependency for seller-facing email notifications

Acceptance focus:
- sellers can manage difficult messaging situations
- seller profile contains the missing contact fields
- website remains optional
- horses can be soft-deleted from seller tools without losing history

AI kickoff prompt:
```text
Read AGENTS.md, docs/horseroster-spec.md, docs/project-status.md, and docs/next-steps.md.
Work only on the Seller Tools Epic.
Goal: add seller mute/block controls, seller phone + primary notification email, and seller-side horse soft-delete flow.
Treat website as optional.
Email notifications should only be built if the email infrastructure already exists in the repo.
Inspect current seller settings, messaging, and horse management flows first.
Update docs/project-status.md after meaningful changes.
```

### 5. Buyer Tools Epic

Goal:
- Add the first buyer retention feature.

Includes:
- save/favorite horses
- buyer-facing saved-horses surface
- integration from marketplace and horse pages

Dependencies:
- none required to start

Acceptance focus:
- buyers can save and unsave horses
- saved horses are visible in a coherent buyer flow
- public browse surfaces expose the action consistently

AI kickoff prompt:
```text
Read AGENTS.md, docs/horseroster-spec.md, docs/project-status.md, and docs/next-steps.md.
Work only on the Buyer Tools Epic.
Goal: add horse favorites/saved horses for buyers, including marketplace and horse-page actions plus a buyer-facing saved list.
Inspect current buyer routes and horse card/detail components first.
Update docs/project-status.md after meaningful changes.
```

### 6. Dev / Platform Epic

Goal:
- Finish core cleanup and production-readiness work already in progress.

Includes:
- semantic token migration cleanup
- remaining seller/barn wording cleanup
- S3 upload/render/download verification
- media pipeline hardening

Dependencies:
- none required, but should stay coordinated with ongoing feature work

Acceptance focus:
- fewer fixed-light surfaces remain
- docs and UI wording match the current product language
- S3-backed flows are reliable in realistic environments

AI kickoff prompt:
```text
Read AGENTS.md, docs/horseroster-spec.md, docs/project-status.md, and docs/next-steps.md.
Work only on the Dev / Platform Epic.
Goal: continue theme/copy cleanup and finish S3/media production-readiness work already in progress.
Inspect the current token usage, storage code, and media flows first.
Do not expand product scope while doing platform cleanup.
Update docs/project-status.md after meaningful changes.
```

### 7. Community Epic

Goal:
- Define future scope only. Do not implement yet.

Includes:
- clarify what "community interaction" means with the client
- identify whether this is feed, comments, reactions, posts, or something else
- decide whether it belongs in MVP follow-up or a separate roadmap track

Dependencies:
- explicit client direction

Acceptance focus:
- written scope definition exists before any implementation begins

AI kickoff prompt:
```text
Read AGENTS.md, docs/horseroster-spec.md, docs/project-status.md, and docs/next-steps.md.
Work only on the Community Epic.
Goal: define possible community scope without implementing any product changes.
Summarize likely options, constraints, dependencies, and questions that need client answers.
Do not write code unless explicitly asked after scope is clarified.
```

## Suggested Delivery Order

If no other business priority overrides it, the cleanest dependency-aware order is:
1. Email Epic
2. Seller Tools Epic
3. Buyer Tools Epic
4. Dev / Platform Epic
5. Community Epic

Completed already:
- Vault Epic
- Admin Epic

## Notes For AI Use

- Always ask the AI to inspect the existing implementation first.
- Always include the current docs in the prompt so it does not follow stale BuyMyHorse assumptions.
- Keep epic work scoped. Do not mix multiple epics in one implementation pass unless you explicitly want a larger refactor.
- After each meaningful implementation, update `docs/project-status.md`.
