# HorseRoster Project Status

Last updated: 2026-03-20

## Overall Summary
- Project branding is in transition from BuyMyHorse to HorseRoster.
- The public dashboard, marketplace, horse pages, barn pages, MyBarn, messaging, vault access, EquiTag QR flow, and admin dashboard all exist in app code.
- Light/dark theme support exists at the token and shell level, but full page-by-page migration is still in progress.
- Billing is now modeled in app code around a single HorseRoster activation product, monthly/yearly cadence, one-time extra horse slot purchases, admin-controlled trial settings, and admin-managed Stripe price IDs while Stripe secrets remain env-only.
- Barn onboarding/settings and horse create/edit forms now support explicit AI-assisted English copy generation for barn stories and horse descriptions through a shared Anthropic-backed preview flow.
- File storage is now moving to AWS S3 in app code: public horse/barn/EquiTag media uses a CDN-backed public bucket path model and EquiVault downloads redirect to short-lived signed URLs from a private bucket.

## Active Workstreams
- HorseRoster rebrand rollout across app shell, metadata, logos, and docs
- Seller-to-barn product-language and route migration (`/seller` -> `/mybarn`, `/sellers` -> `/barn`)
- Theme migration from fixed light surfaces to semantic theme tokens
- Dedicated horse media upload/gallery flow and compression pipeline
- Documentation refresh so agent instructions and project spec match the current repo

## Completed
- Root branding updated to HorseRoster in layout metadata and brand assets
- Theme initialization and user theme switching added at the app shell level
- Public `/dashboard` flow established as the logged-out landing experience
- Logged-out dashboard interactions route through auth prompts instead of direct privileged access
- Global floating chat infrastructure exists for horse-page messaging, and `/horses/[id]` uses a grouped action row instead of the older embedded chat section
- Public barn pages now support cover imagery, featured-roster curation, a hero contact CTA, and URL-driven roster filters/sort
- Public horse profiles now support gallery/video surfaces and stronger key-info presentation
- Seller horse create/edit/vault flows now use theme-aware HorseRoster surfaces instead of fixed stone/white panels
- Horse media upload now supports drag/drop, preview, replace, remove-draft, and client-side crop before submit
- `/seller/horses` was removed as a standalone management index; MyBarn is the canonical barn home
- Canonical barn-facing routes now exist:
  - `/mybarn/*`
  - `/barn/[slug]`
- Legacy `/seller/*` and `/sellers/[slug]` URLs redirect to barn/MyBarn language
- EquiTag is now presented as a horse-only frontend feature:
  - `/equitag` redirects away
  - horse creation auto-generates and auto-attaches a horse EquiTag
  - MyBarn horse cards open the horse QR modal
  - public horse pages keep the EquiTag modal
  - barn-facing EquiTag manager/print workflow is no longer part of the product surface
- EquiTag entry now resolves directly through `/eq/[code]`, and successful uses are tracked for admin analytics
- Logout is available in both public/authenticated headers
- Buyer users remain in buyer mode during barn onboarding until the barn form is actually submitted
- Admin foundations now exist in app code:
  - `SUPER_ADMIN` role support
  - `/admin` overview dashboard with range-based KPI cards and trend charts
  - Barns, Horses, Billing, and Users admin sections
  - soft-disable / restore actions for barns and horses
  - local billing overrides, slot adjustments, and global trial settings in admin
  - admin action logging
  - full-height left admin sidebar shell
  - admin accounts can still browse the main app in buyer mode
- Public horse, barn, marketplace, EquiTag, and barn-side write surfaces now respect admin-disabled barn/horse state in app code
- AI copy generation now exists in app code for long-form profile text:
  - `POST /api/ai/copy/generate` provides authenticated, user-triggered draft generation
  - barn onboarding and barn settings can generate/refine the `bio` field from the current form state
  - horse create/edit can generate/refine the `description` field from the current form state
  - users review, replace, append, or retry drafts before saving
  - Anthropic/Claude is wired through env configuration while the service layer stays provider-agnostic
- S3-backed storage now exists in app code:
  - public horse images, gallery media, barn logos/covers, and EquiTag assets upload to a public S3 bucket and render through `NEXT_PUBLIC_PUBLIC_ASSET_BASE_URL`
  - EquiVault documents upload to a private S3 bucket and the vault download route now redirects to short-lived signed URLs after access checks
  - local `public/uploads` and `private/uploads` writes have been removed from the main app-managed upload flows
  - `.env.example` now includes AWS region, bucket, public asset base URL, and signed-download expiry configuration
- Barn billing has been redesigned in app code around a single activation product:
  - monthly/yearly activation cadence
  - one-time extra horse slot purchases
  - activation checkout route
  - extra horse checkout route
  - Stripe portal route
  - Stripe webhook sync for activation subscriptions and extra horse purchases
  - MyBarn billing dashboard showing activation state, published horse usage, purchased/admin slot totals, and total capacity
  - onboarding now starts with activation cadence selection instead of multi-tier plan selection
  - pricing now explains one activation product plus add-on horse slots
  - admin billing shows activation state, slot totals, global trial controls, and editable Stripe price IDs
  - Stripe secret/webhook keys remain env-only while non-secret Stripe price IDs are managed from admin billing settings
  - `.env.example` and `docs/stripe-billing-setup.md` now document the env-only Stripe secrets plus admin-managed billing price configuration and local webhook flow
- Agent documentation baseline added:
  - `AGENTS.md`
  - `docs/project-status.md`
  - `docs/horseroster-spec.md`

## In Progress
- Rebrand/theme cleanup across remaining buyer, barn, horse-detail, and request pages
- Replacement of legacy BuyMyHorse language and stale documentation assumptions
- Converting older fixed-light UI components to semantic tokens
- Refining marketplace card parity with the brand package while keeping dark-theme behavior token-driven
- Converting remaining full-page messaging and request surfaces to match the newer token-based styling direction
- Media-management improvements for horse photos/videos, including a dedicated operational gallery surface and compression/transcoding
- AWS infrastructure wiring and end-to-end S3 verification for public media plus private EquiVault documents

## Known Issues / Cleanup Needed
- Several pages and components still use legacy fixed light-mode classes such as `bg-white`, `bg-stone-*`, and `text-stone-*`
- Some pages still expose seller-oriented internal wording or route assumptions even though barn/MyBarn is now the product language
- Barn dashboard analytics are only partially real; view metrics are still placeholder content
- `README.md` remains the default Next.js boilerplate and is not a reliable project guide
- Prisma migration execution and Prisma client generation for the latest schema changes are intentionally left manual in the local environment
- Stripe billing still depends on real local env secrets, saved admin price IDs, and webhook wiring before checkout flows can run end to end outside test setup
- Admin auth depends on `session.user.role`; sessions may need re-login after role changes or auth callback changes
- S3-backed media now depends on real AWS bucket/CDN env wiring and object access policies before uploads and rendering will work outside local code validation

## Next Recommended Tasks
- Finish the dedicated horse gallery upload/compression flow and move horse gallery management to its own operational page
- Finish end-to-end AWS S3 verification, including CDN image rendering and private vault signed downloads
- Add optional AI prompt expansion beyond barn bio / horse description only if the current form-based preview flow proves useful in real usage
- Upgrade buyer document requests from free-text asks to file/category-specific requests
- Continue theme and barn-language cleanup across remaining secondary pages and lower-traffic copy
- Finish end-to-end verification of the activation billing model with your own Prisma/client sync and Stripe test flows

## Decisions / Assumptions In Force
- `docs/project-status.md` is the live status ledger and must be updated for every meaningful repo change
- `AGENTS.md` is the agent-facing operating guide
- `docs/horseroster-spec.md` replaces the older BuyMyHorse spec as the active project reference
- Marketing docs under `docs/marketing` are visual/product references, not proof that all described features are already implemented
- Internal schema/code names remain seller-based for compatibility even though the product language is now barn/MyBarn
- Prisma migrations and Prisma commands are handled manually by the user in this environment
