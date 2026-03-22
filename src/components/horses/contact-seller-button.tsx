"use client";

import Link from "next/link";
import { AlertTriangle, MessageSquare } from "lucide-react";

import { useFloatingChat } from "@/components/chat/floating-chat-provider";
import { Button } from "@/components/ui/button";

export default function ContactSellerButton({
  horseId,
  horseName,
  sellerName,
  isLoggedIn,
  emailVerified,
  className,
  onAction,
}: {
  horseId: string;
  horseName: string;
  sellerName: string;
  isLoggedIn: boolean;
  emailVerified?: boolean;
  className?: string;
  onAction?: () => void;
}) {
  const { openHorseConversation } = useFloatingChat();

  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(`/horses/${horseId}`)}`}
        onClick={onAction}
        className={`inline-flex w-full items-center justify-center rounded-lg border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-2 text-sm font-medium text-[color:var(--foreground-strong)] transition hover:bg-[color:var(--muted)] ${
          className ?? ""
        }`}
      >
        Contact Barn
      </Link>
    );
  }

  if (!emailVerified) {
    return (
      <div
        className={`inline-flex w-full items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300 ${
          className ?? ""
        }`}
      >
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
        Verify your email to contact this barn.
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        onAction?.();
        openHorseConversation({
          horseId,
          horseName,
          counterpartyName: sellerName,
        });
      }}
      className={`inline-flex w-full items-center justify-center gap-2 ${className ?? ""}`}
    >
      <MessageSquare className="h-4 w-4" />
      Contact Barn
    </Button>
  );
}
