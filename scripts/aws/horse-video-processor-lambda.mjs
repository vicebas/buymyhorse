import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const execFileAsync = promisify(execFile);

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

const CALLBACK_URL = requiredEnv("HORSE_MEDIA_PROCESSOR_CALLBACK_URL");
const CALLBACK_SECRET = requiredEnv("HORSE_MEDIA_PROCESSOR_SECRET");
const FFMPEG_PATH = process.env.FFMPEG_PATH || "/opt/bin/ffmpeg";

export async function handler(event) {
  const record = event?.Records?.[0];

  if (!record?.s3?.bucket?.name || !record?.s3?.object?.key) {
    throw new Error("Missing S3 event payload.");
  }

  const bucket = record.s3.bucket.name;
  const originalKey = decodeURIComponent(record.s3.object.key).replace(/\+/g, " ");
  const parsed = parseOriginalVideoKey(originalKey);

  if (!parsed) {
    console.log(`Skipping unsupported key: ${originalKey}`);
    return { skipped: true, reason: "unsupported_key" };
  }

  const { horseId, mediaId } = parsed;
  const tempDir = await mkdtemp(path.join(os.tmpdir(), `horse-video-${mediaId}-`));
  const inputPath = path.join(tempDir, "input");
  const outputPath = path.join(tempDir, "output.mp4");
  const posterPath = path.join(tempDir, "poster.jpg");
  const processedKey = `horses/media/${horseId}/processed/${mediaId}.mp4`;
  const finalPosterKey = `horses/media/${horseId}/posters/${mediaId}.jpg`;

  try {
    const originalVideo = await readS3ObjectToBuffer(bucket, originalKey);
    await writeFile(inputPath, originalVideo);

    await execFileAsync(FFMPEG_PATH, [
      "-y",
      "-i",
      inputPath,
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
      outputPath,
    ]);

    await createPosterWithFallback(outputPath, posterPath);

    const [processedVideo, posterImage] = await Promise.all([
      readFile(outputPath),
      readFile(posterPath),
    ]);

    await Promise.all([
      s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: processedKey,
          Body: processedVideo,
          ContentType: "video/mp4",
          CacheControl: "public, max-age=31536000, immutable",
        })
      ),
      s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: finalPosterKey,
          Body: posterImage,
          ContentType: "image/jpeg",
          CacheControl: "public, max-age=31536000, immutable",
        })
      ),
    ]);

    await notifyApp({
      mediaId,
      status: "READY",
      processedPath: processedKey,
      posterPath: finalPosterKey,
      mimeType: "video/mp4",
    });

    return {
      success: true,
      mediaId,
      originalKey,
      processedKey,
      posterKey: finalPosterKey,
    };
  } catch (error) {
    console.error("Horse video processing failed", {
      mediaId,
      originalKey,
      error: error instanceof Error ? error.message : error,
    });

    await notifyApp({
      mediaId,
      status: "FAILED",
    }).catch((callbackError) => {
      console.error("Horse video failure callback failed", callbackError);
    });

    throw error;
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => null);
  }
}

async function createPosterWithFallback(videoPath, posterPath) {
  try {
    await execFileAsync(FFMPEG_PATH, [
      "-y",
      "-ss",
      "00:00:01",
      "-i",
      videoPath,
      "-frames:v",
      "1",
      "-vf",
      "scale=960:-2",
      posterPath,
    ]);
  } catch {
    await execFileAsync(FFMPEG_PATH, [
      "-y",
      "-i",
      videoPath,
      "-frames:v",
      "1",
      "-vf",
      "scale=960:-2",
      posterPath,
    ]);
  }
}

async function readS3ObjectToBuffer(bucket, key) {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  if (!response.Body?.transformToByteArray) {
    throw new Error("Could not read S3 object body.");
  }

  const byteArray = await response.Body.transformToByteArray();
  return Buffer.from(byteArray);
}

async function notifyApp(payload) {
  const response = await fetch(CALLBACK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-horse-media-processor-secret": CALLBACK_SECRET,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new Error(
      `Processor callback failed with ${response.status}: ${responseText || "no response body"}`
    );
  }
}

function parseOriginalVideoKey(key) {
  const match = key.match(/^horses\/media\/([^/]+)\/originals\/([^/]+)\/.+$/);

  if (!match) {
    return null;
  }

  return {
    horseId: match[1],
    mediaId: match[2],
  };
}

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}
