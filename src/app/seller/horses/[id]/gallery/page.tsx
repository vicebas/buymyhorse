import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Images } from "lucide-react";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import AdminBlockedNotice from "@/components/admin/admin-blocked-notice";
import SellerAppHeader from "@/components/layout/seller-app-header";
import HorseGalleryManager from "@/components/horses/horse-gallery-manager";
import { Button } from "@/components/ui/button";
import { getHorseWriteBlockError } from "@/lib/admin/moderation";

export default async function HorseGalleryPage({
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
      media: {
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "asc" },
        ],
      },
    },
  });

  if (!horse) {
    notFound();
  }

  const horseWriteBlocked = getHorseWriteBlockError(horse);

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <SellerAppHeader />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
              MyBarn
            </p>
            <h1 className="mt-2 text-4xl font-extrabold text-[color:var(--foreground-strong)]">
              Horse Gallery
            </h1>
            <p className="mt-3 max-w-2xl text-[color:var(--foreground-soft)]">
              Upload, process, and manage the public gallery for {horse.name}. Images and videos are compressed for fast public browsing.
            </p>
          </div>

          <Link href={`/mybarn/`}>
            <Button variant="outline" className="inline-flex items-center gap-2">
              <Images className="h-4 w-4" />
              Back to My Barn
            </Button>
          </Link>
        </div>

        {horseWriteBlocked ? (
          <AdminBlockedNotice
            title="Horse gallery is disabled"
            message={horseWriteBlocked}
          />
        ) : (
          <HorseGalleryManager
            horseId={horse.id}
            horseName={horse.name}
            existingMedia={horse.media.map((media) => ({
              id: media.id,
              type: media.type,
              status: media.status,
              processedPath: media.processedPath,
              posterPath: media.posterPath,
              fileName: media.fileName,
            }))}
          />
        )}
      </section>
    </main>
  );
}
