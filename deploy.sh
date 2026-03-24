#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${GITHUB_USERNAME:-}" ]]; then
  echo "GITHUB_USERNAME is required."
  exit 1
fi

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "GITHUB_TOKEN is required."
  exit 1
fi

origin_url="$(git remote get-url origin)"
branch_name="$(git rev-parse --abbrev-ref HEAD)"

if [[ "$origin_url" =~ ^git@github\.com:(.+)$ ]]; then
  repo_path="${BASH_REMATCH[1]}"
elif [[ "$origin_url" =~ ^https://github\.com/(.+)$ ]]; then
  repo_path="${BASH_REMATCH[1]}"
else
  echo "Unsupported origin remote: $origin_url"
  exit 1
fi

pull_url="https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/${repo_path}"

git pull "$pull_url" "$branch_name"
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d
