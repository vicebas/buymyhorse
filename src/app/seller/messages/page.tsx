import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import AppHeader from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
      displayName: true,
    },
  });

  if (!seller) {
    redirect("/mybarn/onboard");
  }

  const conversations = await prisma.horseConversation.findMany({
    where: {
      sellerId: seller.id,
    },
    include: {
      horse: {
        select: {
          id: true,
          name: true,
          image: true,
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
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <AppHeader variant="seller" />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
            Barn Messages
          </p>
          <h1 className="mt-2 text-4xl font-extrabold">Buyer Conversations</h1>
          <p className="mt-3 max-w-2xl text-[color:var(--foreground-soft)]">
            Keep track of buyers interested in your horses and continue conversations.
          </p>
        </div>

        {conversations.length === 0 ? (
          <Card className="rounded-3xl border-stone-200 shadow-sm">
            <CardContent className="p-10 text-center">
              <p className="text-lg text-[color:var(--foreground)]">No conversations yet</p>
              <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                Buyer messages will appear here after they contact you from a horse page.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const lastMessage = conversation.messages[0];

              return (
                <Card
                  key={conversation.id}
                  className="rounded-3xl border-stone-200 shadow-sm"
                >
                  <CardHeader>
                    <CardTitle className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                        {conversation.horse.name}
                      </div>

                      <div className="text-sm font-normal text-[color:var(--foreground-soft)]">
                        Buyer: {conversation.buyer.name || conversation.buyer.email}
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[color:var(--foreground-strong)]">
                        {conversation.buyer.email}
                      </p>
                      <p className="text-sm text-[color:var(--foreground-soft)]">
                        {lastMessage
                          ? lastMessage.messageType === "GRANT"
                            ? "Document access granted"
                            : lastMessage.body
                          : "No messages yet"}
                      </p>
                      {lastMessage ? (
                        <p className="text-xs text-[color:var(--muted-foreground)]">
                          {new Date(lastMessage.createdAt).toLocaleString()}
                        </p>
                      ) : null}
                    </div>

                    <Link href={`/mybarn/messages/${conversation.id}`}>
                      <Button>Open Conversation</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
