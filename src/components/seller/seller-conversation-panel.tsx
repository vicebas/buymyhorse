"use client";

import ConversationThread, { type ConversationMessage } from "@/components/chat/conversation-thread";
import { useEffect, useState } from "react";

export default function SellerConversationPanel({
  conversationId,
  currentUserId,
  initialMessages,
  onMessageSent,
  buyerId: propBuyerId,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: ConversationMessage[];
  onMessageSent?: (message: ConversationMessage) => void;
  buyerId?: string | null;
}) {
  const buyerId = propBuyerId ?? initialMessages.find((m) => m.sender.id !== currentUserId)?.sender.id;

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-3">
        {buyerId ? <ContactControls targetUserId={buyerId} /> : null}
      </div>

      <div className="h-full rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-[var(--shadow-card)] sm:p-6">
        <ConversationThread
          key={conversationId}
          conversationId={conversationId}
          currentUserId={currentUserId}
          initialMessages={initialMessages}
          placeholder="Write a reply..."
          onMessageSent={onMessageSent}
        />
      </div>
    </div>
  );
}

function ContactControls({ targetUserId }: { targetUserId: string }) {
  const [loading, setLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/seller/contact-control?targetUserId=${encodeURIComponent(targetUserId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setIsMuted(Boolean(data.isMuted));
        setIsBlocked(Boolean(data.isBlocked));
      } catch {
        // ignore
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [targetUserId]);

  async function doAction(action: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/seller/contact-control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setIsMuted(Boolean(data.isMuted));
      setIsBlocked(Boolean(data.isBlocked));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        className="rounded-md border px-3 py-1 text-sm"
        onClick={() => doAction(isMuted ? "unmute" : "mute")}
        disabled={loading}
      >
        {isMuted ? "Unmute Buyer" : "Mute Buyer"}
      </button>
      <button
        className={`rounded-md border px-3 py-1 text-sm ${isBlocked ? "bg-red-600 text-white" : ""}`}
        onClick={() => doAction(isBlocked ? "unblock" : "block")}
        disabled={loading}
      >
        {isBlocked ? "Unblock Buyer" : "Block Buyer"}
      </button>
    </div>
  );
}
