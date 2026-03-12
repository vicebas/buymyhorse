import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import AppHeader from "@/components/layout/app-header";
import HorseForm from "@/components/horses/horse-form";

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
    redirect("/seller/onboard");
  }

  const horse = await prisma.horse.findFirst({
    where: {
      id,
      sellerProfileId: seller.id,
    },
  });

  if (!horse) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <AppHeader variant="seller" />

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
            MyBarn
          </p>
          <h1 className="mt-2 font-serif text-4xl">Edit Horse</h1>
          <p className="mt-3 max-w-2xl text-stone-600">
            Update your horse listing details and marketplace information.
          </p>
        </div>

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
          }}
        />
      </section>
    </main>
  );
}