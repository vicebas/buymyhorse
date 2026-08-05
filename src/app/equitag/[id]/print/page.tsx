import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import EquiTagPrintActions from "@/components/equitag/equitag-print-actions";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";
import { getHorseBreedLabel } from "@/lib/horses/listing-data";
import { resolvePublicAssetUrl } from "@/lib/storage/public-assets";

function buildHorseMetaLine(horse: {
  age: number | null;
  location: string | null;
  breedOption?: { label: string } | null;
  breed?: string | null;
}) {
  const currentYear = new Date().getFullYear();
  const birthYear = horse.age && horse.age > 0 ? String(currentYear - horse.age) : null;
  const location = horse.location?.trim().toUpperCase() || null;
  const breed = getHorseBreedLabel(horse);

  return [breed, birthYear, location].filter(Boolean).join(" · ");
}

function buildTagDestination(tag: {
  code: string;
  attachedEntityType: "HORSE" | "BARN" | null;
  attachedHorseId: string | null;
  attachedBarn?: { slug: string } | null;
}) {
  if (tag.attachedEntityType === "HORSE" && tag.attachedHorseId) {
    return `/horses/${tag.attachedHorseId}`;
  }

  if (tag.attachedEntityType === "BARN" && tag.attachedBarn?.slug) {
    return `/barn/${tag.attachedBarn.slug}`;
  }

  return `/eq/${tag.code}`;
}

export default async function EquiTagPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!seller) {
    redirect("/mybarn/onboard");
  }

  const equiTag = await prisma.equiTag.findFirst({
    where: {
      id,
      ownerSellerProfileId: seller.id,
    },
    select: {
      id: true,
      code: true,
      svgPath: true,
      attachedEntityType: true,
      attachedHorseId: true,
      attachedBarn: {
        select: {
          displayName: true,
          location: true,
          slug: true,
        },
      },
      attachedHorse: {
        select: {
          id: true,
          name: true,
          age: true,
          location: true,
          breed: true,
          breedOption: {
            select: {
              label: true,
            },
          },
        },
      },
    },
  });

  if (!equiTag) {
    notFound();
  }

  const qrCodeSrc = resolvePublicAssetUrl(equiTag.svgPath) || "/img/default-horse.png";
  const destinationHref = buildTagDestination(equiTag);
  const attachedHorse = equiTag.attachedEntityType === "HORSE" ? equiTag.attachedHorse : null;
  const attachedBarn = equiTag.attachedEntityType === "BARN" ? equiTag.attachedBarn : null;
  const isHorseTag = attachedHorse !== null;
  const isBarnTag = attachedBarn !== null;

  const title = isHorseTag
    ? attachedHorse.name
    : isBarnTag
      ? attachedBarn.displayName
      : "Unassigned EquiTag";

  const metaLine = isHorseTag
    ? buildHorseMetaLine(attachedHorse)
    : isBarnTag
      ? attachedBarn.location?.trim().toUpperCase() || "BARN PROFILE"
      : "ATTACH TO A HORSE OR BARN";

  return (
    <main className="min-h-screen bg-[#f4f1ea] px-4 py-6 text-[#0f2a44] sm:px-6 sm:py-10 print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-5xl print:max-w-none">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href="/mybarn"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#4d5a68] hover:text-[#0f2a44]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to MyBarn
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Link href={destinationHref}>
              <Button variant="outline" className="inline-flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Open destination
              </Button>
            </Link>
            <EquiTagPrintActions />
          </div>
        </div>

        <div className="rounded-[2rem] bg-[linear-gradient(180deg,#eff3f6_0%,#edf1f4_100%)] p-4 shadow-[0_28px_90px_rgba(15,42,68,0.16)] print:rounded-none print:bg-white print:p-0 print:shadow-none sm:p-10">
          <div className="mx-auto w-full max-w-[540px] overflow-hidden rounded-[2.4rem] border border-white/70 bg-white shadow-[0_28px_80px_rgba(15,42,68,0.26)] print:max-w-[420px] print:rounded-[1.4rem] print:border-[#dce3e8] print:shadow-none">
            <div className={`${isHorseTag ? "bg-[#e9e3d8]" : "bg-[#173754]"} px-7 py-6`}>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg">
                  <Image
                    src={isHorseTag ? "/branding/horseroster-icon.svg" : "/branding/horseroster-icon-light.svg"}
                    alt="HorseRoster"
                    width={48}
                    height={48}
                    className="h-10 w-10"
                    priority
                  />
                </span>
                <span className={`flex items-baseline text-[2.1rem] leading-none tracking-[-0.05em] ${isHorseTag ? "text-[#0f2a44]" : "text-[#f8f6f2]"}`}>
                  <span className="font-light">Horse</span>
                  <span className="font-extrabold">Roster</span>
                </span>
              </div>
            </div>

            <div className="bg-white px-7 pb-10 pt-8 text-center">
              <div className="mx-auto flex w-full max-w-[360px] items-center justify-center">
                <Image
                  src={qrCodeSrc}
                  alt={`${equiTag.code} QR code`}
                  width={360}
                  height={360}
                  unoptimized
                  className="h-auto w-full"
                  priority
                />
              </div>

              <h1 className="mt-7 text-[3.3rem] font-extrabold tracking-[-0.06em] text-[#0f2a44]">
                {title}
              </h1>

              <p className="mt-4 text-[1.15rem] font-medium uppercase tracking-[0.22em] text-[#8f97a1]">
                {metaLine}
              </p>

              {!isHorseTag && !isBarnTag ? (
                <p className="mx-auto mt-5 max-w-[26rem] text-sm leading-6 text-[#66727f]">
                  Attach this EquiTag to a horse or your barn profile to generate the final production card.
                </p>
              ) : null}
            </div>

            <div className="bg-[#2d5438] px-7 py-7 text-center">
              <p className="text-[1.55rem] font-extrabold uppercase tracking-[0.34em] text-[#f7f3ea]">
                EquiTag
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
