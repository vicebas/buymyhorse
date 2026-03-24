import prisma from "@/lib/db/prisma";
import { isBillingStateCurrentlyActive } from "@/lib/billing/entitlements";

export type HeaderCTA = {
  label: string;
  action: string;
};

export async function getHeaderCTAs(userId?: string | null): Promise<{
  primary: HeaderCTA;
  secondary: HeaderCTA | null;
}> {
  if (!userId) {
    return {
      primary: {
        label: "Create MyBarn",
        action: "/mybarn/create",
      },
      secondary: null,
    };
  }

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      plan: true,
      billingCadence: true,
      billingStatus: true,
      adminPlanOverride: true,
      adminBillingCadenceOverride: true,
      adminBillingStatusOverride: true,
      adminBillingOverrideReason: true,
      adminBillingOverrideExpiresAt: true,
      trialEndsAt: true,
      currentPeriodEndsAt: true,
      _count: {
        select: {
          horses: {
            where: {
              deletedAt: null,
            },
          },
        },
      },
    },
  });

  if (!sellerProfile) {
    return {
      primary: {
        label: "Create MyBarn",
        action: "/mybarn/create",
      },
      secondary: null,
    };
  }

  const isActivated = isBillingStateCurrentlyActive(sellerProfile);
  const horseProfilesCount = sellerProfile._count.horses;

  if (!isActivated) {
    return {
      primary: {
        label: "Upgrade MyBarn",
        action: "/billing",
      },
      secondary: null,
    };
  }

  if (horseProfilesCount === 0) {
    return {
      primary: {
        label: "Add Horse Profile",
        action: "/mybarn/add-horse",
      },
      secondary: null,
    };
  }

  return {
    primary: {
      label: "Buy EquiTags",
      action: "/shop/equitags",
    },
    secondary: {
      label: "Add Horse Profile",
      action: "/mybarn/add-horse",
    },
  };
}
