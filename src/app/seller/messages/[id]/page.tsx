import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import SellerAppHeader from "@/components/layout/seller-app-header";
import { markSellerConversationRead } from "@/lib/notifications/seller";
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
      displayName: true,
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
      sellerProfile: {
        select: {
          id: true,
          displayName: true,
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

  if (!conversation) {
    notFound();
  }

  const isSellerConversation = conversation.sellerId === seller.id;
  const isBuyerConversation = conversation.buyerId === session.user.id;

  if (!isSellerConversation && !isBuyerConversation) {
    notFound();
  }

  if (isSellerConversation) {
    await markSellerConversationRead(conversation.id, seller.id);
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <SellerAppHeader />

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
            {isSellerConversation ? "Your Horse Conversation" : "Sent Inquiry"}
          </p>
          <Link
            href={`/horses/${conversation.horse.id}`}
            className="mt-2 inline-flex text-4xl font-extrabold text-[color:var(--foreground)] underline-offset-4 hover:underline"
          >
            {conversation.horse.name}
          </Link>
          <p className="mt-3 text-[color:var(--foreground-soft)]">
            {isSellerConversation
              ? `Buyer: ${conversation.buyer.name || conversation.buyer.email}`
              : `Barn: ${conversation.sellerProfile.displayName}`}
          </p>
          <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
            {isSellerConversation
              ? "This conversation is about one of your horses."
              : `You contacted ${conversation.sellerProfile.displayName} about this horse.`}
          </p>
        </div>

        <SellerConversationPanel
          conversationId={conversation.id}
          currentUserId={session.user.id}
          initialMessages={conversation.messages}
          buyerId={conversation.buyer.id}
        />
      </section>
    </main>
  );
}
