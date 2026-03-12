
# BuyMyHorse — Codex Project Specification

## 1. Product Overview

BuyMyHorse is a horse marketplace platform connecting horse sellers (barns) with buyers.

Users can:
- Browse horses in a marketplace
- Message sellers
- Request access to private horse documents
- View seller barns
- Manage horse listings

User roles:
- BUYER
- SELLER
- ADMIN (future)

---

## 2. Technology Stack

Frontend
- Next.js (App Router)
- React
- TailwindCSS
- shadcn/ui
- lucide-react

Backend
- Next.js API routes
- NextAuth authentication
- Prisma ORM
- PostgreSQL

File storage
- Local filesystem (MVP)
- Future: S3

---

## 3. Core Concepts

### Users
Users can:
- Browse marketplace
- Send messages
- Request access
- Create seller profile

Roles:
- BUYER
- SELLER
- ADMIN (future)

---

### Seller Profile (Barn)

Seller profiles represent a barn or stable.

Fields:
- id
- userId
- displayName
- description
- logo
- location
- createdAt

Example URL:
/barn/[slug]

---

### Horses

Fields:
- id
- sellerProfileId
- name
- breed
- age
- height
- gender
- discipline
- level
- location
- description
- price
- saleStatus
- image
- isPublished
- createdAt
- updatedAt

Sale Status Enum:
- FOR_SALE
- CONSIDERING_OFFERS
- LEASE
- SOLD
- NOT_AVAILABLE

---

### Access Requests

Buyers may request access to private horse documents.

Flow:
Buyer → Request Access  
Seller → Approve  
Buyer → Access Documents

---

### Conversations

Buyers can message sellers regarding a horse.

Stored entities:
- HorseConversation
- HorseMessage

Real-time messaging is not required for MVP.

---

## 4. Database Schema (Prisma)

### User

model User {
  id
  name
  email
  password
  role
  sellerProfile SellerProfile?
}

### SellerProfile

model SellerProfile {
  id
  userId
  displayName
  description
  logo
  location
  horses Horse[]
}

### Horse

model Horse {
  id
  sellerProfileId
  name
  breed
  age
  height
  gender
  discipline
  level
  location
  description
  price
  saleStatus HorseSaleStatus
  image
  isPublished
  createdAt
  updatedAt
}

### AccessRequest

model AccessRequest {
  id
  horseId
  buyerId
  status
  createdAt
}

### HorseConversation

model HorseConversation {
  id
  horseId
  buyerId
  sellerId
  createdAt
  messages HorseMessage[]
}

### HorseMessage

model HorseMessage {
  id
  conversationId
  senderId
  message
  createdAt
}

---

## 5. Core Pages

Landing
/
- Marketing page
- Redirect to dashboard if logged in

Buyer Dashboard
/dashboard
- Horse listings
- Search
- Featured horses

Marketplace
/marketplace
- Search
- Filters
- Horse cards

Horse Page
/hor ses/[id]
- Horse image
- Description
- Seller information
- Request access
- Message seller

Seller Barn
/barn/[slug]
- Barn logo
- Barn description
- Horse listings

Seller Dashboard (MyBarn)
/seller
Metrics:
- total horses
- for sale
- drafts
- views
- document requests
- avg response time

Add Horse
/seller/horses/new

Edit Horse
/seller/horses/[id]/edit

---

## 6. UI Components

HorseMarketplaceCard
Used in:
- Buyer dashboard
- Marketplace
- Seller barn
- Search results

Displays:
- image
- name
- discipline
- level
- age
- height
- gender
- price
- location
- seller

HorseForm
Used for:
- create horse
- edit horse

Sections:
- image
- basic details
- description
- marketplace toggle

RequestAccessButton
POST /api/access/request

HorseChat
Messaging interface for buyer and seller.

---

## 7. API Routes

Horses
POST /api/horses/create
POST /api/horses/[id]/update
DELETE /api/horses/[id]

Access
POST /api/access/request
POST /api/access/approve

Messaging
POST /api/messages/send
GET /api/messages/[horseId]

---

## 8. File Uploads

MVP:
/public/uploads/horses
/public/uploads/barns

Future:
- S3
- Cloudflare R2

---

## 9. Analytics

Seller dashboard calculations:

Total Horses
COUNT horses

Active Listings
WHERE saleStatus = FOR_SALE

Draft Listings
isPublished = false

Pending Requests
status = PENDING

Average Response Time
difference between first buyer message and first seller response

---

## 10. Permissions

Buyers
- browse marketplace
- message sellers
- request documents

Sellers
- manage horses
- approve requests
- reply to messages

Admin
Future role.

---

## 11. Search

Search fields:
- name
- discipline
- location
- seller

Future:
- OpenSearch
- Meilisearch

---

## 12. Future Features

Favorites
- saved horses
- heart icon

Notifications
- new messages
- new access requests

Real-time chat
- WebSockets
- Pusher
- Supabase realtime

Horse documents
- registration papers
- x-rays
- vet reports
- videos

---

## 13. Development Phases

Phase 1
- marketplace UI
- buyer dashboard
- horse cards

Phase 2
- seller barn page
- seller settings
- logo upload

Phase 3
- messaging
- access requests
- analytics

Phase 4
- filters
- favorites
- notifications

---

## 14. Folder Conventions

components/
components/horses/
components/layout/

app/marketplace
app/dashboard
app/horses/[id]
app/seller

app/api/

---

## 15. UI Design Rules

Colors
- neutral stone palette

Typography
- serif titles
- sans body

Cards
- rounded
- shadow-sm
- border-stone-200

---

## 16. Definition of Done

A feature is complete when:
- UI implemented
- API implemented
- Prisma schema updated
- error handling added
- type-safe
- builds successfully

---

## 17. Codex Execution Instructions

Codex should:
1. Read this specification
2. Inspect repository structure
3. Create missing pages
4. Generate Prisma migrations
5. Implement API routes
6. Implement UI components
7. Ensure TypeScript compiles
8. Run lint and build