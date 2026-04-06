import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db/prisma";

export async function trackBackendError({
  error,
  route,
  method,
  userId,
  metadata,
}: {
  error: unknown;
  route?: string;
  method?: string;
  userId?: string | null;
  metadata?: Prisma.InputJsonObject;
}) {
  const message =
    error instanceof Error ? error.message : String(error);
  const stack =
    error instanceof Error ? (error.stack ?? null) : null;

  await prisma.backendError.create({
    data: {
      message,
      stack,
      route: route ?? null,
      method: method ?? null,
      userId: userId ?? null,
      metadata: metadata ?? undefined,
    },
  });
}

export async function trackBackendErrorSafely(
  input: Parameters<typeof trackBackendError>[0]
) {
  try {
    await trackBackendError(input);
  } catch (trackingError) {
    console.error("[backend-errors] failed to track error", {
      originalMessage:
        input.error instanceof Error ? input.error.message : String(input.error),
      route: input.route,
      trackingError,
    });
  }
}
