import path from "node:path";

import { buildHorseMediaBaseName, getExtensionFromMimeType } from "@/lib/media/horse-media";

const DEFAULT_ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

const DEFAULT_MAX_VIDEO_UPLOAD_BYTES = 75 * 1024 * 1024;

export function getAllowedVideoMimeTypes() {
  const configured = process.env.HORSE_VIDEO_ALLOWED_MIME_TYPES
    ?.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return configured?.length ? configured : [...DEFAULT_ALLOWED_VIDEO_MIME_TYPES];
}

export function getMaxVideoUploadBytes() {
  const configured = Number(process.env.HORSE_VIDEO_MAX_UPLOAD_BYTES || "");

  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }

  return DEFAULT_MAX_VIDEO_UPLOAD_BYTES;
}

export function isAllowedVideoMimeType(mimeType: string) {
  return getAllowedVideoMimeTypes().includes(mimeType.toLowerCase());
}

export function buildHorseVideoOriginalKey({
  horseId,
  mediaId,
  fileName,
  mimeType,
}: {
  horseId: string;
  mediaId: string;
  fileName: string;
  mimeType: string;
}) {
  const baseName = buildHorseMediaBaseName(fileName);
  const extension = path.extname(fileName) || getExtensionFromMimeType(mimeType);

  return `horses/media/${horseId}/originals/${mediaId}/${baseName}${extension}`;
}

export function buildProcessedVideoKey({
  horseId,
  mediaId,
}: {
  horseId: string;
  mediaId: string;
}) {
  return `horses/media/${horseId}/processed/${mediaId}.mp4`;
}

export function buildVideoPosterKey({
  horseId,
  mediaId,
}: {
  horseId: string;
  mediaId: string;
}) {
  return `horses/media/${horseId}/posters/${mediaId}.jpg`;
}

export function getMediaProcessorSecret() {
  const secret = process.env.HORSE_MEDIA_PROCESSOR_SECRET;

  if (!secret) {
    throw new Error("Missing HORSE_MEDIA_PROCESSOR_SECRET.");
  }

  return secret;
}
