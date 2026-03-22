"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { useFloatingChat } from "@/components/chat/floating-chat-provider";
import { Button } from "@/components/ui/button";

export default function PublicBarnContactButton({
  isLoggedIn,
  isOwner,
  sellerName,
  barnHref,
  primaryHorse,
}: {
  isLoggedIn: boolean;
  isOwner: boolean;
  sellerName: string;
  barnHref: string;
  primaryHorse: {
    id: string;
    name: string;
  } | null;
}) {
  const { openHorseConversation } = useFloatingChat();

  if (isOwner || !primaryHorse) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(barnHref)}`}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-[color:var(--accent-foreground)] shadow-[var(--shadow-card)] transition hover:opacity-95"
      >
        <MessageSquare className="h-4 w-4" />
        Contact Barn
      </Link>
    );
  }

  return (
    <Button
      type="button"
      onClick={() =>
        openHorseConversation({
          horseId: primaryHorse.id,
          horseName: primaryHorse.name,
          counterpartyName: sellerName,
        })
      }
      className="inline-flex items-center gap-2"
    >
      <MessageSquare className="h-4 w-4" />
      Contact Barn
    </Button>
  );
}
