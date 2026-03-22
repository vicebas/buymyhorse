import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import AppHeader from "@/components/layout/app-header";
import SellerConversationPanel from "@/components/seller/seller-conversation-panel";

export default async function SellerConversationPage({
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

  const conversation = await prisma.horseConversation.findUnique({
    where: {
      id,
    },
    include: {
      horse: {
        select: {
          id: true,
          name: true,
        },
      },
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            email: true,
            },
          },
        },
      },
    },
  });

  if (!conversation || conversation.sellerId !== seller.id) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <AppHeader variant="seller" />

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
            Conversation
          </p>
          <h1 className="mt-2 text-4xl font-extrabold">{conversation.horse.name}</h1>
          <p className="mt-3 text-[color:var(--foreground-soft)]">
            Buyer: {conversation.buyer.name || conversation.buyer.email}
          </p>
        </div>

        <SellerConversationPanel
          conversationId={conversation.id}
          currentUserId={session.user.id}
          initialMessages={conversation.messages}
        />
      </section>
    </main>
  );
}
