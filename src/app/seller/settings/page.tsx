import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import AdminBlockedNotice from "@/components/admin/admin-blocked-notice";
import prisma from "@/lib/db/prisma";
import { getBarnModerationMessage } from "@/lib/admin/moderation";
import { authOptions } from "@/lib/auth/options";
import SellerAppHeader from "@/components/layout/seller-app-header";
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
    include: {
      horses: {
        orderBy: [
          { isBarnFeatured: "desc" },
          { barnDisplayOrder: "asc" },
          { createdAt: "desc" },
        ],
      },
    },
  });

  if (!seller) {
    redirect("/mybarn/onboard");
  }

  if (seller.adminDisabledAt) {
    return (
      <main className="min-h-screen bg-stone-50 text-stone-900">
        <SellerAppHeader />

        <section className="mx-auto max-w-5xl px-6 py-10">
          <AdminBlockedNotice
            title="Barn editing is disabled"
            message={getBarnModerationMessage(seller.adminDisableReason)}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <SellerAppHeader />

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
            Barn Settings
          </p>
          <h1 className="mt-2 font-serif text-4xl">Edit Barn Profile</h1>
          <p className="mt-3 max-w-2xl text-stone-600">
            Update your public barn identity, frontpage imagery, and featured roster.
          </p>
        </div>

        <SellerSettingsForm seller={seller} />
      </section>
    </main>
  );
}
