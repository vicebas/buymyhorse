"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { useFloatingChat } from "@/components/chat/floating-chat-provider";
import { Button } from "@/components/ui/button";

export default function ContactSellerButton({
  horseId,
  horseName,
  sellerName,
  isLoggedIn,
}: {
  horseId: string;
  horseName: string;
  sellerName: string;
  isLoggedIn: boolean;
}) {
  const { openHorseConversation } = useFloatingChat();

  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(`/horses/${horseId}`)}`}
        className="inline-flex w-full items-center justify-center rounded-lg border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-2 text-sm font-medium text-[color:var(--foreground-strong)] transition hover:bg-[color:var(--muted)]"
      >
        Contact Barn
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() =>
        openHorseConversation({
          horseId,
          horseName,
          counterpartyName: sellerName,
        })
      }
      className="inline-flex w-full items-center justify-center gap-2"
    >
      <MessageSquare className="h-4 w-4" />
      Contact Barn
    </Button>
  );
}
