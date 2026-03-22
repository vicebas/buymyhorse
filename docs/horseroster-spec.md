# HorseRoster Project Specification

## 1. Product Overview

HorseRoster is a sport horse marketplace and barn management platform. It supports public browsing, buyer-to-barn messaging, controlled access to private horse documents, detached EquiTag inventory, and owner-side listing management inside MyBarn.

Current user roles in the data model:
- `BUYER`
- `SELLER`
- `ADMIN`

Current product reality:
- Logged-out users land on `/dashboard`
- Buyers browse listings, message barns, and request vault access
- Barn owners manage horses, requests, conversations, documents, profile settings, and EquiTag inventory under `/mybarn` and `/equitag`
- EquiTag now exists as barn-owned inventory with direct barn/horse destination routing and attachable barn/horse targets

## 2. Technology Stack

Frontend:
- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn-style UI primitives
- lucide-react

Backend:
- Next.js route handlers
- NextAuth credentials authentication
- Prisma ORM
- PostgreSQL

Storage:
- Local filesystem and local paths in current MVP-style flows
- No production object-storage integration is wired as the source of truth in this repo

## 3. Current Product Areas

### Public dashboard and marketplace
- `/dashboard` is the public landing surface
- Logged-out users can browse listings there, but gated interactions open auth prompts
- `/marketplace` provides public listing browse/filter behavior

### Horse detail and seller barn pages
- `/horses/[id]` shows published horse details, barn information, and request-access/conversation entry points
- `/barn/[slug]` is the public barn frontpage
- `/eq/[code]` resolves directly to the attached horse or barn destination
- `/scan/[code]` is a compatibility redirect to the EquiTag entry route
- `/equitag` is the authenticated EquiTag manager

### Buyer messaging and access
- `/messages` and `/messages/[id]` are buyer conversation views
- Buyers can request access to private horse documents
- Access status is derived from requests and grants

### Barn MyBarn
- `/mybarn` is the barn dashboard and operations home
- Supporting routes exist for:
  - `/mybarn/horses/new`
  - `/mybarn/horses/[id]/edit`
  - `/mybarn/horses/[id]/vault`
  - `/mybarn/messages`
  - `/mybarn/messages/[id]`
  - `/mybarn/requests`
  - `/mybarn/settings`
  - `/mybarn/onboard`
- Legacy `/seller/*` routes redirect to the `/mybarn/*` equivalents

## 4. Data Model Summary

The Prisma schema in `prisma/schema.prisma` is the authoritative data model.

Core models:
- `User`
- `SellerProfile`
- `Horse`
- `EquiTag`
- `HorseDocument`
- `AccessRequest`
- `AccessGrant`
- `AccessGrantFile`
- `VaultActivityLog`
- `HorseConversation`
- `HorseMessage`
- `Account`
- `Session`
- `VerificationToken`

Important enums:
- `UserRole`
- `HorseSaleStatus`
- `DocumentCategory`
- `VaultActivityType`
- `AccessRequestStatus`
- `HorseMessageType`
- `EquiTagAttachmentType`

Notable current schema behavior:
- `SellerProfile` is a one-to-one extension of `User`
- `Horse` belongs to a seller profile and supports publication state, sale status, and barn-frontpage curation flags
- `EquiTag` belongs to a barn account and can be unattached or attached to either a barn or a horse
- Access control for private documents uses both request and grant records
- Conversations are scoped to horse + buyer pairs
- Messages support `TEXT` and `GRANT` types

## 5. Current Routes and APIs

Primary pages:
- `/`
- `/dashboard`
- `/marketplace`
- `/horses/[id]`
- `/horses/[id]/access`
- `/barn/[slug]`
- `/eq/[code]`
- `/scan/[code]`
- `/messages`
- `/messages/[id]`
- barn route set under `/mybarn`
- `/login`
- `/register`
- `/pricing`

Implemented route handlers include:
- auth: `api/auth/[...nextauth]`
- registration: `api/register`
- seller profile creation/settings
- horse create, update, publish
- EquiTag inventory create / attach / download flow
- horse document upload/download
- horse request-access flow
- request approve/deny flow
- conversation and horse messaging endpoints
- grant revoke flow

Admin note:
- the `ADMIN` role exists, and root routing redirects admins to `/admin`
- a complete admin route surface is not present in the current repo tree

## 6. UI and Brand Direction

Current design direction:
- HorseRoster branding replaces the old BuyMyHorse identity
- DM Sans is the primary font
- IBM Plex Mono is used for metadata-style text
- the app uses semantic theme tokens in `src/app/globals.css`
- light/dark theme support exists, but not every page has been fully migrated away from older fixed light-surface styling

Primary visual references:
- `docs/marketing/04_Reference_Docs/horseroster-brand-package.html`
- `docs/marketing/04_Reference_Docs/horseroster-dev-handoff.html`

Implementation guidance:
- prefer semantic token-driven surfaces and text colors
- prefer shared headers, buttons, cards, and listing-card patterns already in the repo
- avoid reintroducing serif/stone-palette conventions from the old BuyMyHorse spec

## 7. Current State Notes

Implemented well enough to treat as active product areas:
- public dashboard landing behavior
- marketplace listing browse/filter flow
- barn MyBarn dashboard
- buyer/barn conversation surfaces
- barn access-request review flow
- horse document and vault concepts in schema and route handlers
- detached EquiTag inventory and attachment flows

Known partial areas:
- some pages still use older fixed light-mode styling
- barn analytics are not fully production-grade; for example, the MyBarn dashboard still contains placeholder view metrics
- some lower-traffic UI and API copy still uses seller-oriented internal wording for compatibility

## 8. Definition of Done for Changes

A task should generally be considered complete when:
- the UI or backend behavior is implemented
- affected routes/components/types are updated consistently
- theme behavior is preserved on touched surfaces
- relevant lint/build checks are run as appropriate
- `docs/project-status.md` is updated to reflect the change

## 9. Agent Instructions

Agents working in this repo should:
1. Read `AGENTS.md`
2. Check `docs/project-status.md` before starting work
3. Inspect the current implementation before editing
4. Use the HorseRoster marketing docs as visual reference, not as proof that a feature already exists
5. Update `docs/project-status.md` after every meaningful implemented change
