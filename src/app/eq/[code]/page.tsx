import { notFound, redirect } from "next/navigation";

import prisma from "@/lib/db/prisma";
import { isBarnPubliclyVisible, isHorsePubliclyVisible } from "@/lib/billing/entitlements";
import { recordEquiTagVisit } from "@/lib/equitag/service";

export default async function EquiTagEntryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const equiTag = await prisma.equiTag.findUnique({
    where: { code },
    include: {
      attachedBarn: {
        select: {
          id: true,
          slug: true,
          adminDisabledAt: true,
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
        },
      },
      attachedHorse: {
        select: {
          id: true,
          isPublished: true,
          deletedAt: true,
          adminDisabledAt: true,
          sellerProfile: {
            select: {
              adminDisabledAt: true,
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
            },
          },
        },
      },
    },
  });

  if (!equiTag) {
    notFound();
  }

  const logVisit = async () => {
    try {
      await recordEquiTagVisit({
        id: equiTag.id,
        code: equiTag.code,
        ownerSellerProfileId: equiTag.ownerSellerProfileId,
        attachedEntityType: equiTag.attachedEntityType,
        attachedBarnId: equiTag.attachedBarnId,
        attachedHorseId: equiTag.attachedHorseId,
      });
    } catch (error) {
      console.error("Failed to record EquiTag visit", error);
    }
  };

  if (
    equiTag.attachedEntityType === "HORSE" &&
    equiTag.attachedHorse &&
    isHorsePubliclyVisible(equiTag.attachedHorse)
  ) {
    await logVisit();
    redirect(`/horses/${equiTag.attachedHorse.id}`);
  }

  if (
    equiTag.attachedEntityType === "BARN" &&
    equiTag.attachedBarn &&
    isBarnPubliclyVisible(equiTag.attachedBarn)
  ) {
    await logVisit();
    redirect(`/barn/${equiTag.attachedBarn.slug}`);
  }

  notFound();
}
