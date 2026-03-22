import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const SIGNED_URL_EXPIRES_SECONDS = Number(process.env.AWS_PRIVATE_URL_EXPIRES_SECONDS || "300");
const PUBLIC_ASSET_BASE_URL = process.env.NEXT_PUBLIC_PUBLIC_ASSET_BASE_URL?.replace(/\/$/, "") || "";

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

function getS3Client() {
  return new S3Client({
    region: requiredEnv("AWS_REGION"),
  });
}

function getPublicBucketName() {
  return requiredEnv("AWS_PUBLIC_BUCKET_NAME");
}

function getPrivateBucketName() {
  return requiredEnv("AWS_PRIVATE_BUCKET_NAME");
}

export function getPublicAssetBaseUrl() {
  if (!PUBLIC_ASSET_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_PUBLIC_ASSET_BASE_URL.");
  }

  return PUBLIC_ASSET_BASE_URL;
}

export function resolvePublicAssetUrl(pathOrKey?: string | null) {
  if (!pathOrKey) {
    return null;
  }

  if (
    pathOrKey.startsWith("http://") ||
    pathOrKey.startsWith("https://") ||
    pathOrKey.startsWith("/")
  ) {
    return pathOrKey;
  }

  if (!PUBLIC_ASSET_BASE_URL) {
    return null;
  }

  return `${PUBLIC_ASSET_BASE_URL}/${pathOrKey.replace(/^\/+/, "")}`;
}

function isLikelyPublicObjectKey(pathOrKey: string) {
  return !pathOrKey.startsWith("/") && !pathOrKey.startsWith("http://") && !pathOrKey.startsWith("https://");
}

function extractPublicObjectKey(pathOrKey: string) {
  if (isLikelyPublicObjectKey(pathOrKey)) {
    return pathOrKey.replace(/^\/+/, "");
  }

  if (PUBLIC_ASSET_BASE_URL && pathOrKey.startsWith(PUBLIC_ASSET_BASE_URL)) {
    return pathOrKey.slice(PUBLIC_ASSET_BASE_URL.length).replace(/^\/+/, "");
  }

  return null;
}

async function bodyToBuffer(
  body:
    | {
        transformToByteArray?: () => Promise<Uint8Array>;
      }
    | null
    | undefined
) {
  if (!body) {
    return Buffer.alloc(0);
  }

  if ("transformToByteArray" in body && typeof body.transformToByteArray === "function") {
    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  }

  throw new Error("Unable to read S3 object body.");
}

export async function uploadPublicAsset({
  key,
  body,
  contentType,
  cacheControl = "public, max-age=31536000, immutable",
}: {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  cacheControl?: string;
}) {
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: getPublicBucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  );

  return key;
}

export async function createPublicUploadUrl({
  key,
  contentType,
  expiresInSeconds = 60,
}: {
  key: string;
  contentType?: string;
  expiresInSeconds?: number;
}) {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: getPublicBucketName(),
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function readPublicAssetHead(pathOrKey: string) {
  const key = extractPublicObjectKey(pathOrKey);

  if (!key) {
    throw new Error("Invalid public asset key.");
  }

  const client = getS3Client();
  const response = await client.send(
    new HeadObjectCommand({
      Bucket: getPublicBucketName(),
      Key: key,
    })
  );

  return {
    key,
    contentLength: typeof response.ContentLength === "number" ? response.ContentLength : null,
    contentType: response.ContentType || null,
    eTag: response.ETag || null,
  };
}

export async function deletePublicAsset(pathOrKey?: string | null) {
  if (!pathOrKey) {
    return;
  }

  const key = extractPublicObjectKey(pathOrKey);

  if (!key) {
    return;
  }

  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getPublicBucketName(),
      Key: key,
    })
  );
}

export async function readPublicAsset(pathOrKey: string) {
  const key = extractPublicObjectKey(pathOrKey);

  if (!key) {
    throw new Error("Invalid public asset key.");
  }

  const client = getS3Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: getPublicBucketName(),
      Key: key,
    })
  );

  return bodyToBuffer(response.Body);
}

export async function uploadPrivateAsset({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
}) {
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: getPrivateBucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return key;
}

export async function deletePrivateAsset(key?: string | null) {
  if (!key) {
    return;
  }

  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getPrivateBucketName(),
      Key: key,
    })
  );
}

export async function createPrivateDownloadUrl({
  key,
  fileName,
  contentType,
  expiresInSeconds = SIGNED_URL_EXPIRES_SECONDS,
}: {
  key: string;
  fileName?: string | null;
  contentType?: string | null;
  expiresInSeconds?: number;
}) {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: getPrivateBucketName(),
    Key: key,
    ResponseContentType: contentType || undefined,
    ResponseContentDisposition: fileName
      ? `attachment; filename="${fileName.replace(/"/g, "")}"`
      : undefined,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}
