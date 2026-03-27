import type { Prisma, ProductEventType } from "@/generated/prisma/client";
import prisma from "@/lib/db/prisma";

export async function trackProductEvent({
  actorUserId,
  eventType,
  horseId,
  horseDocumentId,
  horseMediaId,
  metadata,
}: {
  actorUserId: string;
  eventType: ProductEventType;
  horseId?: string | null;
  horseDocumentId?: string | null;
  horseMediaId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.productEvent.create({
    data: {
      actorUserId,
      eventType,
      horseId: horseId || null,
      horseDocumentId: horseDocumentId || null,
      horseMediaId: horseMediaId || null,
      metadata: metadata ?? undefined,
    },
  });
}

export async function trackProductEventSafely(
  input: Parameters<typeof trackProductEvent>[0]
) {
  try {
    await trackProductEvent(input);
  } catch (error) {
    console.error("[product-events] failed to track event", {
      eventType: input.eventType,
      actorUserId: input.actorUserId,
      horseId: input.horseId ?? null,
      horseDocumentId: input.horseDocumentId ?? null,
      horseMediaId: input.horseMediaId ?? null,
      error,
    });
  }
}
