import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import AdminBlockedNotice from "@/components/admin/admin-blocked-notice";
import SellerAppHeader from "@/components/layout/seller-app-header";
import HorseForm from "@/components/horses/horse-form";
import { getHorseWriteBlockError } from "@/lib/admin/moderation";
import { HorseDivisionContext } from "@/generated/prisma/enums";
import { getActiveListingOptions } from "@/lib/horses/listing-options";

export default async function EditHorsePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!seller) {
    redirect("/mybarn/onboard");
  }

  const horse = await prisma.horse.findFirst({
    where: {
      id,
      sellerProfileId: seller.id,
    },
    include: {
      sellerProfile: {
        select: {
          adminDisabledAt: true,
          adminDisableReason: true,
        },
      },
      breedOption: true,
      sexOption: true,
      primaryDiscipline: true,
      pricingVisibilityOption: true,
      colorOption: true,
      importStatusOption: true,
      sireOption: true,
      damOption: true,
      damSireOption: true,
      secondaryDisciplines: true,
      divisionTags: true,
      saleTypes: true,
      horseTypes: true,
      media: {
        where: {
          type: "IMAGE",
          status: "READY",
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          processedPath: true,
          fileName: true,
        },
      },
    },
  });

  if (!horse) {
    notFound();
  }

  const horseWriteBlocked = getHorseWriteBlockError(horse);
  const options = await getActiveListingOptions();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SellerAppHeader />

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
            MyBarn
          </p>
          <h1 className="mt-2 text-4xl font-extrabold text-[color:var(--foreground-strong)]">
            Edit Horse
          </h1>
          <p className="mt-3 max-w-2xl text-[color:var(--foreground-soft)]">
            Update the listing story, media, and marketplace settings for this horse inside MyBarn.
          </p>
        </div>

        {horseWriteBlocked ? (
          <AdminBlockedNotice
            title="Horse editing is disabled"
            message={horseWriteBlocked}
          />
        ) : (
          <HorseForm
            mode="edit"
            horseId={horse.id}
            options={options}
            initialValues={{
              name: horse.name ?? "",
              age: horse.age ? String(horse.age) : "",
              description: horse.description ?? "",
              height: horse.height ?? "",
              location: horse.location ?? "",
              isPublished: horse.isPublished,
              image: horse.image ?? null,
              keyDetails: horse.keyDetails ?? "",
              breedOptionId: horse.breedOptionId ?? "",
              sexOptionId: horse.sexOptionId ?? "",
              primaryDisciplineId: horse.primaryDisciplineId ?? "",
              pricingVisibilityOptionId: horse.pricingVisibilityOptionId ?? "",
              saleTypeIds: horse.saleTypes.map((item) => item.saleTypeOptionId),
              colorOptionId: horse.colorOptionId ?? "",
              importStatusOptionId: horse.importStatusOptionId ?? "",
              secondaryDisciplineIds: horse.secondaryDisciplines.map((item) => item.disciplineId),
              bestSuitedForIds: horse.divisionTags
                .filter((item) => item.context === HorseDivisionContext.BEST_SUITED_FOR)
                .map((item) => item.divisionOptionId),
              currentlyCompetingInIds: horse.divisionTags
                .filter((item) => item.context === HorseDivisionContext.CURRENTLY_COMPETING_IN)
                .map((item) => item.divisionOptionId),
              experiencedThroughIds: horse.divisionTags
                .filter((item) => item.context === HorseDivisionContext.EXPERIENCED_THROUGH)
                .map((item) => item.divisionOptionId),
              horseTypeIds: horse.horseTypes.map((item) => item.horseTypeOptionId),
              feiPassport: horse.feiPassport,
              equiVaultAvailable: horse.equiVaultAvailable,
              sireOptionId: horse.sireOptionId ?? "",
              damOptionId: horse.damOptionId ?? "",
              damSireOptionId: horse.damSireOptionId ?? "",
              showHighlights: horse.showHighlights ?? "",
            }}
            existingGalleryImages={horse.media}
          />
        )}
      </section>
    </main>
  );
}
