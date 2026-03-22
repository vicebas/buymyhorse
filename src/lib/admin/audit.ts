import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db/prisma";

export async function logAdminAction({
  actorUserId,
  actionType,
  targetType,
  targetId,
  reason,
  metadata,
}: {
  actorUserId: string;
  actionType:
    | "BARN_DISABLED"
    | "BARN_RESTORED"
    | "HORSE_DISABLED"
    | "HORSE_RESTORED"
    | "HORSE_PLATFORM_FEATURED"
    | "HORSE_PLATFORM_UNFEATURED"
    | "BILLING_OVERRIDE_SET"
    | "BILLING_OVERRIDE_CLEARED"
    | "BILLING_SETTINGS_UPDATED"
    | "HORSE_SLOT_ADJUSTED"
    | "USER_ROLE_CHANGED"
    | "ADMIN_GRANT_REVOKED";
  targetType: "BARN" | "HORSE" | "BILLING" | "USER" | "ACCESS_GRANT";
  targetId: string;
  reason?: string | null;
  metadata?: Prisma.InputJsonObject | null;
}) {
  await prisma.adminActionLog.create({
    data: {
      actorUserId,
      actionType,
      targetType,
      targetId,
      reason: reason || null,
      metadata: metadata || undefined,
    },
  });
}
