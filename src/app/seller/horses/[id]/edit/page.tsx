import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import AdminBlockedNotice from "@/components/admin/admin-blocked-notice";
import AppHeader from "@/components/layout/app-header";
import HorseForm from "@/components/horses/horse-form";
import { getHorseWriteBlockError } from "@/lib/admin/moderation";

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
    },
  });

  if (!horse) {
    notFound();
  }

  const horseWriteBlocked = getHorseWriteBlockError(horse);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppHeader variant="seller" />

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
            initialValues={{
              name: horse.name ?? "",
              breed: horse.breed ?? "",
              age: horse.age ? String(horse.age) : "",
              price: horse.price ? String(horse.price) : "",
              description: horse.description ?? "",
              discipline: horse.discipline ?? "",
              level: horse.level ?? "",
              height: horse.height ?? "",
              gender: horse.gender ?? "",
              location: horse.location ?? "",
              saleStatus: horse.saleStatus,
              isPublished: horse.isPublished,
              image: horse.image ?? null,
              keyDetails: horse.keyDetails ?? "",
            }}
          />
        )}
      </section>
    </main>
  );
}
