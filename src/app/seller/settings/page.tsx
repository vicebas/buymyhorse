import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import AppHeader from "@/components/layout/app-header";
import SellerSettingsForm from "@/components/seller/seller-settings-form";

export default async function SellerSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!seller) {
    redirect("/seller/onboard");
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <AppHeader variant="seller" />

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
            Seller Settings
          </p>
          <h1 className="mt-2 font-serif text-4xl">Edit Seller Profile</h1>
          <p className="mt-3 max-w-2xl text-stone-600">
            Update your public marketplace presence, branding, and seller information.
          </p>
        </div>

        <SellerSettingsForm seller={seller} />
      </section>
    </main>
  );
}