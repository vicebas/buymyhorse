"use client";

import { useEffect, useState } from "react";

import HorseMessageItem from "@/components/horses/horse-message-item";

type Message = {
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

export default function HorseChat({
  horseId,
  currentUserId,
}: {
  horseId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMessages() {
      const res = await fetch(`/api/horses/${horseId}/messages`);

      if (!res.ok) {
        return;
      }

      const data = (await res.json()) as Message[];
      setMessages(data);
    }

    void loadMessages();
  }, [horseId]);

  async function sendMessage() {
    if (!text.trim()) return;

    setLoading(true);

    const res = await fetch(`/api/horses/${horseId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: text,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      return;
    }

    const message = (await res.json()) as Message;
    setMessages((prev) => [...prev, message]);
    setText("");
  }

  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="mb-4 max-h-60 space-y-3 overflow-y-auto">
        {messages.map((message) => (
          <HorseMessageItem
            key={message.id}
            message={message}
            mine={currentUserId === message.sender.id}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 rounded border px-3 py-2"
          placeholder="Write a message..."
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="rounded bg-black px-4 text-white"
        >
          Send
        </button>
      </div>
    </div>
  );
}
