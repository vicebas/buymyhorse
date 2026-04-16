import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import AdminBlockedNotice from "@/components/admin/admin-blocked-notice";
import HorseForm from "@/components/horses/horse-form";
import SellerAppHeader from "@/components/layout/seller-app-header";
import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";
import { getBarnModerationMessage } from "@/lib/admin/moderation";
import { getActiveListingOptions } from "@/lib/horses/listing-options";

export default async function NewHorsePage() {
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
      adminDisabledAt: true,
      adminDisableReason: true,
    },
  });

  if (!seller) {
    redirect("/mybarn/onboard");
  }

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
            Add New Horse
          </h1>
          <p className="mt-3 max-w-2xl text-[color:var(--foreground-soft)]">
            Build a new listing with a polished lead photo, clear sale type, and marketplace-ready details.
          </p>
        </div>

        {seller.adminDisabledAt ? (
          <AdminBlockedNotice
            title="Horse creation is disabled"
            message={getBarnModerationMessage(seller.adminDisableReason)}
          />
        ) : (
          <HorseForm mode="create" options={options} />
        )}
      </section>
    </main>
  );
}
