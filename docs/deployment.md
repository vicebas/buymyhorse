# HorseRoster — Deployment Guide

This guide covers a full production deployment of HorseRoster on a single AWS EC2 instance using Docker Compose, with Neon (or any managed PostgreSQL) for the database, S3 + CloudFront for media, and Stripe for billing.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [S3 + CloudFront Setup](#2-s3--cloudfront-setup)
3. [Database Setup (Neon)](#3-database-setup-neon)
4. [EC2 Instance Setup](#4-ec2-instance-setup)
5. [Stripe Webhook Setup](#5-stripe-webhook-setup)
6. [Environment File](#6-environment-file)
7. [Build & Deploy](#7-build--deploy)
8. [Post-Deploy Steps](#8-post-deploy-steps)
9. [Updates & Redeployment](#9-updates--redeployment)
10. [Monitoring & Logs](#10-monitoring--logs)

---

## 1. Prerequisites

- An AWS account with IAM access
- A domain name with DNS control
- Stripe account (for billing)
- Neon account (or any managed PostgreSQL provider)
- SendGrid account (transactional email)
- Anthropic API key (AI highlights feature)
- Git access to this repository on the EC2 machine

---

## 2. S3 + CloudFront Setup

HorseRoster uses two S3 buckets: one public (horse photos, barn logos) and one private (vault documents).

### 2.1 Create the public bucket

```bash
aws s3api create-bucket \
  --bucket horseroster-public \
  --region us-east-1
```

Disable "Block all public access" on the public bucket, then add this bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::horseroster-public/*"
    }
  ]
}
```

### 2.2 Create the private bucket

```bash
aws s3api create-bucket \
  --bucket horseroster-private \
  --region us-east-1
```

Keep all public access **blocked** on the private bucket. The app generates short-lived signed URLs for private file access.

### 2.3 Set CORS on both buckets

Apply to both buckets (required for browser-side uploads via presigned URLs):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 2.4 Create a CloudFront distribution

1. Go to **CloudFront → Create distribution**.
2. Set the **Origin domain** to `horseroster-public.s3.amazonaws.com`.
3. Set **Viewer protocol policy** to "Redirect HTTP to HTTPS".
4. Note the distribution domain — e.g. `d1xxxxxxxxxx.cloudfront.net`. This becomes `NEXT_PUBLIC_PUBLIC_ASSET_BASE_URL`.

### 2.5 IAM credentials for the app

Create an IAM user or use an EC2 instance role (preferred). Attach this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": [
        "arn:aws:s3:::horseroster-public/*",
        "arn:aws:s3:::horseroster-private/*"
      ]
    }
  ]
}
```

If using an **EC2 instance role**, attach the policy to the role and omit `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` from the env file — the AWS SDK picks up the role automatically.

If using a **dedicated IAM user**, generate an access key pair and add both values to the env file.

---

## 3. Database Setup (Neon)

### 3.1 Create a Neon project

1. Go to [neon.tech](https://neon.tech) and create a new project.
2. Choose a region close to your EC2 instance.
3. Copy the connection string:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 3.2 Run migrations

From your dev machine or the EC2 instance after cloning the repo:

```bash
DATABASE_URL="<connection-string>" npx prisma migrate deploy
```

This applies all migrations in `prisma/migrations/` to the production database without running the seeder.

### 3.3 (Optional) Run the demo seeder

If you want the demo barns and horses pre-loaded:

```bash
DATABASE_URL="<connection-string>" npx prisma db seed
```

This creates 5 demo barn accounts and 26 published horses. All accounts use password `Demo1234!`. See `prisma/seed.ts` for the full list.

---

## 4. EC2 Instance Setup

### 4.1 Launch the instance

- **AMI:** Ubuntu 24.04 LTS or Amazon Linux 2023
- **Instance type:** `t3.small` minimum; `t3.medium` recommended for build headroom
- **Storage:** 20 GB gp3 root volume
- **Security group inbound rules:**

| Type  | Protocol | Port | Source    |
|-------|----------|------|-----------|
| SSH   | TCP      | 22   | Your IP   |
| HTTP  | TCP      | 80   | 0.0.0.0/0 |
| HTTPS | TCP      | 443  | 0.0.0.0/0 |

### 4.2 Point your domain

Add an **A record** from `your-domain.com` to the EC2 public IP **before** deploying. Caddy needs DNS to resolve in order to obtain a TLS certificate from Let's Encrypt automatically.

### 4.3 SSH and install Docker

```bash
ssh ubuntu@<ec2-public-ip>

# Add Docker's official GPG key and repo
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y \
  docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# Run Docker without sudo
sudo usermod -aG docker ubuntu
newgrp docker
```

### 4.4 Clone the repository

```bash
git clone https://github.com/your-org/horseroster.git /home/ubuntu/horseroster
cd /home/ubuntu/horseroster
```

---

## 5. Stripe Webhook Setup

### 5.1 Register the webhook endpoint

1. **Stripe Dashboard → Developers → Webhooks → Add endpoint**
2. Set the URL to:
   ```
   https://your-domain.com/api/stripe/webhook
   ```
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Click **Add endpoint**, then reveal the **Signing secret** (`whsec_...`). This becomes `STRIPE_WEBHOOK_SECRET`.

### 5.2 Create Stripe products and prices

You need three prices in your Stripe account:

| Product | Billing type | Description |
|---------|-------------|-------------|
| Barn Activation — Monthly | Recurring, monthly | Monthly barn subscription |
| Barn Activation — Yearly | Recurring, yearly | Annual barn subscription |
| Additional Horse Profile | One-time | Extra horse listing slot |

Note each `price_...` ID. You will enter these in the admin panel after deploy — **not** in the env file.

---

## 6. Environment File

On the EC2 instance, create `.env.production` in the project root:

```bash
nano /home/ubuntu/horseroster/.env.production
```

```env
# Database
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Auth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<run: openssl rand -base64 32>

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS
AWS_REGION=us-east-1
AWS_PUBLIC_BUCKET_NAME=horseroster-public
AWS_PRIVATE_BUCKET_NAME=horseroster-private
NEXT_PUBLIC_PUBLIC_ASSET_BASE_URL=https://d1xxxxxxxxxx.cloudfront.net
AWS_PRIVATE_URL_EXPIRES_SECONDS=300

# Omit the two lines below if using an EC2 instance role
# AWS_ACCESS_KEY_ID=AKIA...
# AWS_SECRET_ACCESS_KEY=...

# AI
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-haiku-latest

# Email
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@your-domain.com

# Media
HORSE_VIDEO_MAX_UPLOAD_BYTES=78643200
HORSE_VIDEO_ALLOWED_MIME_TYPES=video/mp4,video/quicktime,video/webm
FFMPEG_PATH=/usr/bin/ffmpeg

# Caddy — used by docker-compose.yml, not by the Next.js app
APP_DOMAIN=your-domain.com
LETSENCRYPT_EMAIL=ops@your-domain.com
```

Lock down the file:

```bash
chmod 600 .env.production
```

---

## 7. Build & Deploy

All commands run from `/home/ubuntu/horseroster` on the EC2 instance.

### 7.1 Run database migrations

```bash
export $(grep -v '^#' .env.production | xargs)
npx prisma migrate deploy
```

Alternatively, run migrations from your dev machine before deploying if Node.js is not installed on the host.

### 7.2 Build the Docker image

```bash
docker compose build
```

The multi-stage `Dockerfile` compiles Next.js into a standalone output and installs FFmpeg in the runner stage. Expect 3–5 minutes on the first build.

### 7.3 Start the services

```bash
docker compose up -d
```

This starts two containers:

| Container | Role |
|-----------|------|
| `app` | Next.js server on port 3000 (internal only) |
| `caddy` | Reverse proxy on 80/443, auto-TLS via Let's Encrypt |

Caddy automatically handles the TLS certificate on first startup. No manual cert management needed.

### 7.4 Verify

```bash
# Check both containers are running
docker compose ps

# Tail the app logs
docker compose logs -f app

# Tail the Caddy logs (TLS provisioning visible here)
docker compose logs -f caddy
```

Visit `https://your-domain.com` — you should see the HorseRoster homepage served over HTTPS.

---

## 8. Post-Deploy Steps

### 8.1 Create the first admin account

1. Register a normal account at `https://your-domain.com/login`.
2. Elevate it to `SUPER_ADMIN` directly in the database:

```sql
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'admin@your-domain.com';
```

Connect via the Neon SQL editor in the dashboard, or via `psql`:

```bash
psql "postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### 8.2 Configure Stripe prices in the admin panel

1. Log in as the admin account.
2. Navigate to `/admin/billing`.
3. Enter the three `price_...` IDs from step 5.2.
4. Configure trial settings (enabled/disabled, duration in days).
5. Save.

### 8.3 Verify Stripe webhook delivery

In **Stripe Dashboard → Developers → Webhooks → your endpoint → Recent deliveries**, confirm events are returning `200`. If you see errors, check app logs:

```bash
docker compose logs -f app
```

---

## 9. Updates & Redeployment

```bash
ssh ubuntu@<ec2-public-ip>
cd /home/ubuntu/horseroster

git pull

# If the update includes schema changes, run migrations first
export $(grep -v '^#' .env.production | xargs)
npx prisma migrate deploy

docker compose build
docker compose up -d
```

Compose replaces the running `app` container in place. Caddy TLS data is stored in the `caddy_data` and `caddy_config` named volumes and is preserved across every redeploy.

---

## 10. Monitoring & Logs

```bash
# Live app logs
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100 app

# Caddy / TLS logs
docker compose logs -f caddy

# Restart the app without touching Caddy
docker compose restart app

# Full stop
docker compose down

# Disk and memory on the host
df -h
free -h
docker system df

# Free up disk space from old build layers
docker builder prune -f
docker image prune -f
```
