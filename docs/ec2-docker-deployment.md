# HorseRoster EC2 Docker Deployment

Last updated: 2026-03-21

## Overview

HorseRoster can run as a single Dockerized Next.js app on one EC2 instance.

- Neon remains the PostgreSQL database
- S3/CloudFront remain the media layer
- FFmpeg runs inside the main app container
- Caddy handles HTTPS and reverse proxying on the EC2 host
- No Lambda, ngrok, or S3 video trigger is required in the active production path

## Required files

- [`Dockerfile`](/home/vicebas/Workspace/buymyhorse/buymyhorse/Dockerfile)
- [`docker-compose.yml`](/home/vicebas/Workspace/buymyhorse/buymyhorse/docker-compose.yml)
- [`Caddyfile`](/home/vicebas/Workspace/buymyhorse/buymyhorse/Caddyfile)

## EC2 host setup

1. Launch an Ubuntu 24.04 or Amazon Linux 2023 EC2 instance.
2. Point your domain DNS `A` record to the instance public IP.
3. Open security-group ports:
   - `22` for SSH
   - `80` for HTTP
   - `443` for HTTPS
4. Install Docker Engine and the Docker Compose plugin.

## Application env file

Create `.env.production` on the EC2 instance in the project root.

Include your normal app env vars, including:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `AWS_REGION`
- `AWS_PUBLIC_BUCKET_NAME`
- `AWS_PRIVATE_BUCKET_NAME`
- `NEXT_PUBLIC_PUBLIC_ASSET_BASE_URL`
- `AWS_PRIVATE_URL_EXPIRES_SECONDS`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ANTHROPIC_API_KEY`
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`

Add these Compose/Caddy variables in the same shell session or `.env` file used by Docker Compose:

- `APP_DOMAIN=yourdomain.com`
- `LETSENCRYPT_EMAIL=ops@yourdomain.com`

## Build and start

From the project root on the EC2 instance:

```bash
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d
```

`env_file: .env.production` only applies to the running containers. Any `NEXT_PUBLIC_*` values used by Next.js must also be available to Docker Compose itself during the image build so they can be passed as build args into the `builder` stage.

## Manual updates

When you ship a new version:

```bash
git pull
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d
```

## Notes

- The app container sets `FFMPEG_PATH=/usr/bin/ffmpeg`
- `POST /api/horses/[id]/media` is the active photo/video upload path
- The older async video routes are deprecated and not part of the container deployment
