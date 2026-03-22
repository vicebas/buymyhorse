import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import SellerAppHeader from "@/components/layout/seller-app-header";
import { Card, CardContent } from "@/components/ui/card";
import SellerInboxShell from "@/components/seller/seller-inbox-shell";
import { getMessageInboxItems } from "@/lib/messages/inbox";

export default async function SellerMessagesPage() {
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

  const inboxItems = await getMessageInboxItems(session.user.id, "all");

  if (inboxItems.length === 0) {
    return (
      <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
        <SellerAppHeader />

        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-8">
            <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
              Barn Messages
            </p>
            <h1 className="mt-2 text-4xl font-extrabold">All Conversations</h1>
            <p className="mt-3 max-w-2xl text-[color:var(--foreground-soft)]">
              Track conversations about your own horses and the horses you have contacted elsewhere.
            </p>
          </div>

          <Card className="rounded-3xl border-stone-200 shadow-sm">
            <CardContent className="p-10 text-center">
              <p className="text-lg text-[color:var(--foreground)]">No conversations yet</p>
              <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                Conversations will appear here after someone contacts one of your horses or you message another barn.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <SellerAppHeader />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
            Barn Messages
          </p>
          <h1 className="mt-2 text-4xl font-extrabold">All Conversations</h1>
          <p className="mt-3 max-w-2xl text-[color:var(--foreground-soft)]">
            Track conversations about your own horses and the horses you have contacted elsewhere.
          </p>
        </div>

        <SellerInboxShell
          currentUserId={session.user.id}
          initialConversations={inboxItems}
        />
      </section>
    </main>
  );
}
