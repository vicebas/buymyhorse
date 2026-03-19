import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import Image from "next/image";
import AppHeader from "@/components/layout/app-header";
import RequestAccessButton from "@/components/horses/request-access-button";
import HorseChatPanel from "@/components/horses/horse-chat-panel";
import { authOptions } from "@/lib/auth/options";
import { getBuyerHorseAccess } from "@/lib/vault/access";

export default async function HorsePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const horse = await prisma.horse.findUnique({
    where: { id },
    include: {
      sellerProfile: true,
    },
  });

  if (!horse || !horse.isPublished) {
    notFound();
  }

  const access = session?.user?.id
    ? await getBuyerHorseAccess(session.user.id, horse.id)
    : null;

  const latestRequest = session?.user?.id
    ? await prisma.accessRequest.findFirst({
        where: {
          horseId: horse.id,
          buyerId: session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          status: true,
        },
      })
    : null;

  const currentAccessStatus =
    access?.status === "ACTIVE"
      ? "ACTIVE"
      : latestRequest?.status || access?.status || "NONE";

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <AppHeader variant="buyer" />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.9fr] lg:items-start">
          <div>
            <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
              <Image
                src={horse.image || "/img/default-horse.png"}
                alt={horse.name}
                width={1400}
                height={950}
                className="h-[320px] w-full object-cover md:h-[480px]"
                priority
              />
            </div>
          </div>

          <aside className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
              Horse Listing
            </p>

            <h1 className="mt-3 font-serif text-4xl text-stone-900">
              {horse.name}
            </h1>

            <p className="mt-2 text-lg text-stone-500">
              {horse.breed || "Breed not specified"}
            </p>

            <div className="mt-6">
              <p className="font-serif text-3xl text-stone-900">
                {horse.price
                  ? `$${Number(horse.price).toLocaleString()}`
                  : "Price on request"}
              </p>
            </div>

            <div className="mt-8 grid gap-4 rounded-2xl bg-stone-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-stone-500">Age</span>
                <span className="text-sm font-medium text-stone-900">
                  {horse.age ?? "Not specified"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-stone-500">Discipline</span>
                <span className="text-sm font-medium text-stone-900">
                  {horse.discipline || "Not specified"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-stone-500">Gender</span>
                <span className="text-sm font-medium text-stone-900">
                  {horse.gender || "Not specified"}
                </span>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-stone-200 p-5">
              <p className="text-sm text-stone-500">Seller</p>
              <p className="mt-1 text-base font-medium text-stone-900">
                {horse.sellerProfile.displayName}
              </p>
            </div>

            <div className="mt-6">
              <RequestAccessButton
                horseId={horse.id}
                isLoggedIn={Boolean(session?.user?.id)}
                currentStatus={currentAccessStatus}
              />
            </div>
          </aside>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.25fr_0.9fr]">
          <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="font-serif text-2xl text-stone-900">About this horse</h2>

            <div className="mt-5 text-base leading-8 text-stone-700">
              {horse.description ? (
                <p>{horse.description}</p>
              ) : (
                <p className="text-stone-500">No description provided yet.</p>
              )}
            </div>
          </div>

          <div>
            <HorseChatPanel horseId={horse.id} currentUserId={session?.user?.id || ""} />
          </div>
        </div>
      </section>
    </main>
  );
}
