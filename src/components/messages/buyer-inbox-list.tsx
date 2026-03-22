"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLivePoll } from "@/hooks/use-live-poll";
import type { MessageInboxItem } from "@/lib/messages/inbox";

function BuyerInboxUnreadBadge({ unread }: { unread: boolean }) {
  if (!unread) {
    return null;
  }

  return (
    <span className="inline-flex items-center rounded-full bg-[color:var(--destructive)] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
      New
    </span>
  );
}

export default function BuyerInboxList({
  initialConversations,
}: {
  initialConversations: MessageInboxItem[];
}) {
  const [conversations, setConversations] = useState(initialConversations);

  useLivePoll({
    enabled: true,
    intervalMs: 5000,
    onPoll: async () => {
      const response = await fetch("/api/messages/inbox?scope=buyer", {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const nextConversations = (await response.json()) as MessageInboxItem[];
      setConversations(nextConversations);
    },
  });

  if (conversations.length === 0) {
    return (
      <Card className="rounded-3xl border-stone-200 shadow-sm">
        <CardContent className="p-10 text-center">
          <p className="text-lg text-[color:var(--foreground)]">No conversations yet</p>
          <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
            Messages will appear here after you contact a barn from a horse page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => (
        <Card
          key={conversation.id}
          className={`rounded-3xl border-stone-200 shadow-sm ${
            conversation.unread ? "ring-1 ring-[color:var(--destructive)]/30" : ""
          }`}
        >
          <CardHeader>
            <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                {conversation.horse.name}
              </div>

              <div className="flex items-center gap-3 text-sm font-normal text-[color:var(--foreground-soft)]">
                <span>Barn: {conversation.counterpartyName}</span>
                <BuyerInboxUnreadBadge unread={conversation.unread} />
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-[color:var(--foreground-strong)]">
                {conversation.counterpartyName}
              </p>
              <p className="text-sm text-[color:var(--foreground-soft)]">
                {conversation.lastMessagePreview}
              </p>
              <p className="text-xs text-[color:var(--muted-foreground)]">
                {new Date(conversation.lastActivityAt).toLocaleString()}
              </p>
            </div>

            <Link href={`/messages/${conversation.id}`}>
              <Button>Open Conversation</Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
