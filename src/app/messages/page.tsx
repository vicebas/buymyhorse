import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import AppHeader from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function BuyerMessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const conversations = await prisma.horseConversation.findMany({
    where: {
      buyerId: session.user.id,
    },
    include: {
      horse: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      sellerProfile: {
        select: {
          displayName: true,
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
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <AppHeader variant="buyer" />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
            Buyer Messages
          </p>
          <h1 className="mt-2 font-serif text-4xl">Your Conversations</h1>
          <p className="mt-3 max-w-2xl text-stone-600">
            Keep track of sellers you have contacted about specific horses.
          </p>
        </div>

        {conversations.length === 0 ? (
          <Card className="rounded-3xl border-stone-200 shadow-sm">
            <CardContent className="p-10 text-center">
              <p className="text-lg text-stone-700">No conversations yet</p>
              <p className="mt-2 text-sm text-stone-500">
                Messages will appear here after you contact a seller from a horse page.
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
                      <div className="font-serif text-2xl text-stone-900">
                        {conversation.horse.name}
                      </div>

                      <div className="text-sm font-normal text-stone-500">
                        Seller: {conversation.sellerProfile.displayName}
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-stone-900">
                        {conversation.sellerProfile.displayName}
                      </p>
                      <p className="text-sm text-stone-500">
                        {lastMessage
                          ? lastMessage.messageType === "GRANT"
                            ? "Document access granted"
                            : lastMessage.body
                          : "No messages yet"}
                      </p>
                      {lastMessage ? (
                        <p className="text-xs text-stone-400">
                          {new Date(lastMessage.createdAt).toLocaleString()}
                        </p>
                      ) : null}
                    </div>

                    <Link href={`/messages/${conversation.id}`}>
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
