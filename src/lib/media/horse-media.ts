import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

import { deletePublicAsset, uploadPublicAsset } from "@/lib/storage/public-assets";

const execFileAsync = promisify(execFile);

type ProcessedHorseMedia = {
  type: "IMAGE" | "VIDEO";
  originalPath: string;
  processedPath: string;
  posterPath: string | null;
  mimeType: string;
  fileName: string;
};

export async function processHorseMediaUpload({
  horseId,
  file,
}: {
  horseId: string;
  file: File;
}): Promise<ProcessedHorseMedia> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const mediaDir = await mkdtemp(path.join(os.tmpdir(), `horseroster-media-${horseId}-`));
  const originalsDir = path.join(mediaDir, "originals");
  const processedDir = path.join(mediaDir, "processed");
  const postersDir = path.join(mediaDir, "posters");
  const originalStoragePrefix = `horses/media/${horseId}/originals`;
  const processedStoragePrefix = `horses/media/${horseId}/processed`;
  const posterStoragePrefix = `horses/media/${horseId}/posters`;

  const baseName = `${Date.now()}-${safeFileName(file.name.replace(/\.[^/.]+$/, ""))}`;
  const originalExtension = path.extname(file.name) || getExtensionFromMimeType(file.type);
  const originalFileName = `${baseName}${originalExtension}`;
  const originalFsPath = path.join(originalsDir, originalFileName);

  try {
    await Promise.all([
      mkdir(originalsDir, { recursive: true }),
      mkdir(processedDir, { recursive: true }),
      mkdir(postersDir, { recursive: true }),
    ]);

    await writeFile(originalFsPath, bytes);

    if (file.type.startsWith("image/")) {
      const processedFileName = `${baseName}.webp`;
      const posterFileName = `${baseName}-thumb.webp`;
      const processedFsPath = path.join(processedDir, processedFileName);
      const posterFsPath = path.join(postersDir, posterFileName);
      const originalKey = `${originalStoragePrefix}/${originalFileName}`;
      const processedKey = `${processedStoragePrefix}/${processedFileName}`;
      const posterKey = `${posterStoragePrefix}/${posterFileName}`;

      await sharp(bytes)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(processedFsPath);

      await sharp(bytes)
        .rotate()
        .resize(480, 480, { fit: "cover", position: "attention" })
        .webp({ quality: 72 })
        .toFile(posterFsPath);

      await Promise.all([
        uploadPublicAsset({
          key: originalKey,
          body: bytes,
          contentType: file.type || "application/octet-stream",
        }),
        uploadPublicAsset({
          key: processedKey,
          body: await readFile(processedFsPath),
          contentType: "image/webp",
        }),
        uploadPublicAsset({
          key: posterKey,
          body: await readFile(posterFsPath),
          contentType: "image/webp",
        }),
      ]);

      return {
        type: "IMAGE",
        originalPath: originalKey,
        processedPath: processedKey,
        posterPath: posterKey,
        mimeType: "image/webp",
        fileName: file.name,
      };
    }

    if (!file.type.startsWith("video/")) {
      throw new Error("Only image and video uploads are supported.");
    }

    if (!ffmpegPath) {
      throw new Error("Video processing is not available.");
    }

    const processedFileName = `${baseName}.mp4`;
    const posterFileName = `${baseName}-poster.jpg`;
    const processedFsPath = path.join(processedDir, processedFileName);
    const posterFsPath = path.join(postersDir, posterFileName);
    const originalKey = `${originalStoragePrefix}/${originalFileName}`;
    const processedKey = `${processedStoragePrefix}/${processedFileName}`;
    const posterKey = `${posterStoragePrefix}/${posterFileName}`;

    await execFileAsync(ffmpegPath, [
      "-y",
      "-i",
      originalFsPath,
      "-vf",
      "scale='min(1280,iw)':-2",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "28",
      "-movflags",
      "+faststart",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      processedFsPath,
    ]);

    await execFileAsync(ffmpegPath, [
      "-y",
      "-ss",
      "00:00:01",
      "-i",
      processedFsPath,
      "-frames:v",
      "1",
      "-vf",
      "scale=960:-2",
      posterFsPath,
    ]);

    await Promise.all([
      uploadPublicAsset({
        key: originalKey,
        body: bytes,
        contentType: file.type || "application/octet-stream",
      }),
      uploadPublicAsset({
        key: processedKey,
        body: await readFile(processedFsPath),
        contentType: "video/mp4",
      }),
      uploadPublicAsset({
        key: posterKey,
        body: await readFile(posterFsPath),
        contentType: "image/jpeg",
      }),
    ]);

    return {
      type: "VIDEO",
      originalPath: originalKey,
      processedPath: processedKey,
      posterPath: posterKey,
      mimeType: "video/mp4",
      fileName: file.name,
    };
  } finally {
    await rm(mediaDir, { recursive: true, force: true }).catch(() => null);
  }
}

export async function removeHorseMediaFiles(media: {
  originalPath: string;
  processedPath: string;
  posterPath: string | null;
}) {
  await Promise.all(
    [media.originalPath, media.processedPath, media.posterPath]
      .filter(Boolean)
      .map((filePath) => deletePublicAsset(filePath))
  );
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getExtensionFromMimeType(mimeType: string) {
  if (mimeType.includes("png")) return ".png";
  if (mimeType.includes("webp")) return ".webp";
  if (mimeType.includes("mp4")) return ".mp4";
  if (mimeType.includes("quicktime")) return ".mov";
  return ".bin";
}
