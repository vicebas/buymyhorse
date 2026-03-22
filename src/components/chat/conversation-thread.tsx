"use client";

import { useState } from "react";

import HorseMessageItem from "@/components/horses/horse-message-item";
import { Button } from "@/components/ui/button";

export type ConversationMessage = {
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
};

export default function ConversationThread({
  conversationId,
  currentUserId,
  initialMessages,
  emptyState = "No messages yet.",
  placeholder = "Write a message...",
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: ConversationMessage[];
  emptyState?: string;
  placeholder?: string;
}) {
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

    const message = (await res.json()) as ConversationMessage;
    setMessages((prev) => [...prev, message]);
    setText("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-[color:var(--foreground-soft)]">{emptyState}</p>
        ) : (
          messages.map((message) => (
            <HorseMessageItem
              key={message.id}
              message={message}
              mine={message.sender.id === currentUserId}
            />
          ))
        )}
      </div>

      <div className="mt-6 flex gap-3 border-t border-[color:var(--border)] pt-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-3 text-sm text-[color:var(--foreground)] outline-none placeholder:text-[color:var(--foreground-soft)]"
          placeholder={placeholder}
        />

        <Button type="button" onClick={sendMessage} disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
