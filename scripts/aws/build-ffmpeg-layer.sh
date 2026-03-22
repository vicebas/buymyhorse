#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/dist"
IMAGE_NAME="horseroster-ffmpeg-layer"

mkdir -p "${OUTPUT_DIR}"

docker build \
  -f "${SCRIPT_DIR}/Dockerfile.ffmpeg-layer" \
  -t "${IMAGE_NAME}" \
  "${SCRIPT_DIR}"

docker run --rm \
  -v "${OUTPUT_DIR}:/out" \
  "${IMAGE_NAME}"

echo
echo "Built layer zip:"
echo "  ${OUTPUT_DIR}/ffmpeg-layer.zip"
