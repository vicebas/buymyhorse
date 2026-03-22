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
    | "BILLING_OVERRIDE_SET"
    | "BILLING_OVERRIDE_CLEARED"
    | "BILLING_SETTINGS_UPDATED"
    | "HORSE_SLOT_ADJUSTED"
    | "USER_ROLE_CHANGED";
  targetType: "BARN" | "HORSE" | "BILLING" | "USER";
  targetId: string;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
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
