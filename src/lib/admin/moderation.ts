import prisma from "@/lib/db/prisma";

export function getBarnModerationMessage(reason?: string | null) {
  return reason
    ? `This barn is currently disabled by admin. Reason: ${reason}`
    : "This barn is currently disabled by admin.";
}

export function getHorseModerationMessage(reason?: string | null) {
  return reason
    ? `This horse is currently disabled by admin. Reason: ${reason}`
    : "This horse is currently disabled by admin.";
}

export async function getSellerWriteGuard(userId: string) {
  return prisma.sellerProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      adminDisabledAt: true,
      adminDisableReason: true,
    },
  });
}

export async function getHorseWriteGuard(userId: string, horseId: string) {
  return prisma.horse.findFirst({
    where: {
      id: horseId,
      sellerProfile: {
        userId,
      },
    },
    select: {
      id: true,
      name: true,
      adminDisabledAt: true,
      adminDisableReason: true,
      sellerProfile: {
        select: {
          id: true,
          adminDisabledAt: true,
          adminDisableReason: true,
        },
      },
    },
  });
}

export function isBarnAdminDisabled(seller: {
  adminDisabledAt?: Date | null;
}) {
  return Boolean(seller.adminDisabledAt);
}

export function isHorseAdminDisabled(horse: {
  adminDisabledAt?: Date | null;
  sellerProfile?: {
    adminDisabledAt?: Date | null;
  } | null;
}) {
  return Boolean(horse.adminDisabledAt || horse.sellerProfile?.adminDisabledAt);
}

export function getSellerWriteBlockError(seller: {
  adminDisabledAt?: Date | null;
  adminDisableReason?: string | null;
}) {
  if (!seller.adminDisabledAt) {
    return null;
  }

  return getBarnModerationMessage(seller.adminDisableReason);
}

export function getHorseWriteBlockError(horse: {
  adminDisabledAt?: Date | null;
  adminDisableReason?: string | null;
  sellerProfile?: {
    adminDisabledAt?: Date | null;
    adminDisableReason?: string | null;
  } | null;
}) {
  if (horse.sellerProfile?.adminDisabledAt) {
    return getBarnModerationMessage(horse.sellerProfile.adminDisableReason);
  }

  if (horse.adminDisabledAt) {
    return getHorseModerationMessage(horse.adminDisableReason);
  }

  return null;
}
