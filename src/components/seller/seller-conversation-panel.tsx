"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import HorseMessageItem from "@/components/horses/horse-message-item";

interface Message {
  id: string;
  body: string | null;
  messageType: "TEXT" | "GRANT";
  metadata?: {
    note?: string | null;
    expiresAt?: string | null;
    files?: Array<{
      id: string;
      title: string;
      fileName: string;
      category: string;
    }>;
  } | null;
  createdAt: string | Date;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export default function SellerConversationPanel({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function sendMessage() {
    if (!text.trim()) return;

    setSending(true);

    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body: text }),
    });

    setSending(false);

    if (!res.ok) return;

    const message = await res.json();
    setMessages((prev) => [...prev, message]);
    setText("");
    router.refresh();
  }

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="max-h-[480px] space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-stone-500">No messages yet.</p>
        ) : (
          messages.map((message) => {
            const mine = message.sender.id === currentUserId;

            return (
              <HorseMessageItem key={message.id} message={message} mine={mine} />
            );
          })
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none"
          placeholder="Write a reply..."
        />

        <Button type="button" onClick={sendMessage} disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
