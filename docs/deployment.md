# HorseRoster — Deployment Guide

This guide covers a full production deployment of HorseRoster on a single AWS EC2 instance using Docker Compose, with a managed PostgreSQL database such as Amazon RDS, S3 + CloudFront for media, and Stripe for billing.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [S3 + CloudFront Setup](#2-s3--cloudfront-setup)
3. [Database Setup](#3-database-setup)
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
- Managed PostgreSQL database access
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

## 3. Database Setup

Choose one of these database connection approaches:

- Static PostgreSQL credentials via `DATABASE_URL`
- Amazon RDS IAM auth for the app runtime

For a static connection string, use the provider's standard PostgreSQL URL, for example:

```text
postgresql://user:password@db-host:5432/appdb?sslmode=require
```

For RDS IAM auth at runtime, the app uses `DB_AUTH_MODE=rds-iam` plus `RDSHOST`, `AWS_REGION`, `PGPORT`, `PGDATABASE`, and `PGUSER`. Prisma CLI commands still need a temporary `DATABASE_URL` in the shell session where you run them.

### 3.1 Run migrations

From your dev machine or the EC2 instance after cloning the repo:

```bash
DATABASE_URL="<connection-string>" npx prisma migrate deploy
```

This applies all migrations in `prisma/migrations/` to the production database without running the seeder.

If you are using RDS IAM instead of a static password, generate a temporary token-backed URL before running the command:

```bash
export RDSHOST="your-rds-host.us-east-2.rds.amazonaws.com"
export AWS_REGION="us-east-2"
export PGUSER="postgres"
export PGDATABASE="postgres"
export PGPORT="5432"

export DATABASE_URL="postgresql://${PGUSER}:$(aws rds generate-db-auth-token --hostname "$RDSHOST" --port "$PGPORT" --username "$PGUSER" --region "$AWS_REGION" | python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip(), safe=\"\"))')@${RDSHOST}:${PGPORT}/${PGDATABASE}?sslmode=require"

npx prisma migrate deploy
```

### 3.2 (Optional) Run the demo seeder

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

#### Option A — HTTPS with a GitHub Personal Access Token (recommended for public machines)

Using a Personal Access Token (PAT) avoids leaving an SSH key on a public or shared machine and lets you scope and revoke access at any time.

**Step 1 — Create a PAT on GitHub**

1. Log in to GitHub and go to **Settings → Developer settings → Personal access tokens**.
2. Choose one of the two token types:

   | Type | When to use |
   |------|-------------|
   | **Fine-grained token** (recommended) | Restrict to a single repo and grant only read access |
   | **Classic token** | Simpler; grant only the `repo` scope |

3. **Fine-grained token creation:**
   - Click **"Generate new token (beta)"**.
   - Set an **Expiration** (e.g. 7 days — expire it soon after deployment).
   - Under **Repository access** choose **"Only select repositories"** and pick this repo.
   - Under **Permissions → Contents** choose **"Read-only"**.
   - Click **Generate token** and **copy it immediately** — GitHub shows it only once.

4. **Classic token creation (alternative):**
   - Click **"Generate new token (classic)"**.
   - Set an **Expiration** (e.g. 7 days).
   - Tick only the **`repo`** scope.
   - Click **Generate token** and **copy it immediately**.

**Step 2 — Clone using the token**

```bash
# Replace <YOUR_TOKEN> with the token you just copied
git clone https://<YOUR_TOKEN>@github.com/vicebas/buymyhorse.git /home/ubuntu/horseroster
cd /home/ubuntu/horseroster
```

> ⚠️ **Security note for public / shared machines:** The token embedded in the clone URL is saved in plain text inside `.git/config`. Remove it immediately after cloning:

```bash
# Strip the token from the remote URL so it is no longer stored on disk
git remote set-url origin https://github.com/vicebas/buymyhorse.git
```

Future `git pull` commands will ask for credentials; supply your GitHub username and the token when prompted, or use the credential helper in Step 3.

**Step 3 — (Optional) Store the token temporarily in memory**

If you need to run `git pull` during the session without re-entering the token, store it in memory only (not on disk):

```bash
# Cache credentials in memory for 1 hour (3600 seconds)
git config credential.helper 'cache --timeout=3600'
```

After the cache expires the token is forgotten automatically. Never use `git config credential.helper store` on a public machine — that writes credentials to a plain-text file.

**Step 4 — Revoke the token when you are done**

Once the server is deployed and you no longer need to push or pull, revoke the token:

1. Go to **GitHub → Settings → Developer settings → Personal access tokens**.
2. Find the token you created and click **Delete**.

---

#### Option B — SSH deploy key (for automated / long-lived deployments)

If you prefer SSH and plan to redeploy regularly from this machine:

```bash
# Generate a new key pair on the EC2 instance (no passphrase for automation)
ssh-keygen -t ed25519 -C "horseroster-ec2-deploy" -f ~/.ssh/horseroster_deploy -N ""

# Print the public key — copy this
cat ~/.ssh/horseroster_deploy.pub
```

1. Go to **GitHub → repository → Settings → Deploy keys → Add deploy key**.
2. Paste the public key, give it a name (e.g. `EC2 deploy`), and leave **Allow write access** unchecked (read-only is sufficient).
3. Click **Add key**.

Configure SSH to use the key for this host:

```bash
cat >> ~/.ssh/config << 'EOF'
Host github-horseroster
  HostName github.com
  User git
  IdentityFile ~/.ssh/horseroster_deploy
  IdentitiesOnly yes
EOF
```

Then clone using the custom host alias:

```bash
git clone git@github-horseroster:vicebas/buymyhorse.git /home/ubuntu/horseroster
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

You need five prices in your Stripe account:

| Product | Billing type | Description |
|---------|-------------|-------------|
| Single Horse | Recurring, every 6 months | One active horse included |
| Barn Starter | Recurring, monthly | Five active horses included |
| Barn Growth | Recurring, monthly | Twenty active horses included |
| Barn Unlimited | Recurring, monthly | Unlimited active horses |
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
DATABASE_URL=postgresql://user:password@db-host:5432/appdb?sslmode=require
# Or use RDS IAM auth for the app runtime:
# DB_AUTH_MODE=rds-iam
# RDSHOST=your-rds-host.us-east-2.rds.amazonaws.com
# PGPORT=5432
# PGDATABASE=postgres
# PGUSER=postgres

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
docker compose --env-file .env.production build
```

The multi-stage `Dockerfile` compiles Next.js into a standalone output and installs FFmpeg in the runner stage. Expect 3–5 minutes on the first build.
This `--env-file` flag matters for `NEXT_PUBLIC_PUBLIC_ASSET_BASE_URL`: Next.js reads `NEXT_PUBLIC_*` values at build time, and Docker Compose does not pull build-arg substitutions from a service `env_file`.

### 7.3 Start the services

```bash
docker compose --env-file .env.production up -d
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

Connect using your database provider's SQL console, or via `psql`:

```bash
psql "postgresql://user:password@db-host:5432/appdb?sslmode=require"
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

docker compose --env-file .env.production build
docker compose --env-file .env.production up -d
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
