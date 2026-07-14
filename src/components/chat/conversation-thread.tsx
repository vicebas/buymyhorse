"use client";

import { useState } from "react";
import { useFloatingMessage } from "@/components/ui/floating-message";

import HorseMessageItem from "@/components/horses/horse-message-item";
import { Button } from "@/components/ui/button";
import { useLivePoll } from "@/hooks/use-live-poll";

export type ConversationMessage = {
  id: string;
  body: string | null;
  messageType: "TEXT" | "GRANT";
  accessGrantId?: string | null;
  metadata?: unknown;
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
  onMessageSent,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: ConversationMessage[];
  emptyState?: string;
  placeholder?: string;
  onMessageSent?: (message: ConversationMessage) => void;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  // attempt to get floating message API; provider may be absent in some contexts
  let floatingMsgApi: { showMessage: (s: string, l?: "info" | "error") => void } | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    floatingMsgApi = useFloatingMessage();
  } catch {
    floatingMsgApi = null;
  }

  const { refreshNow } = useLivePoll({
    enabled: true,
    intervalMs: 5000,
    onPoll: async () => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { messages: ConversationMessage[] };
      setMessages((currentMessages) =>
        areMessagesEqual(currentMessages, data.messages) ? currentMessages : data.messages
      );
    },
  });

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

    if (!res.ok) {
      if (res.status === 403) {
        if (floatingMsgApi) {
          floatingMsgApi.showMessage("You are blocked from sending messages to this participant.", "error");
        } else {
          alert("You are blocked from sending messages to this participant.");
        }
      }

      return;
    }

    const message = (await res.json()) as ConversationMessage;
    setMessages((prev) =>
      prev.some((existingMessage) => existingMessage.id === message.id)
        ? prev
        : [...prev, message]
    );
    setText("");
    onMessageSent?.(message);
    refreshNow();
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

      <div className="mt-6 flex flex-col gap-3 border-t border-[color:var(--border)] pt-4 sm:flex-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-3 text-sm text-[color:var(--foreground)] outline-none placeholder:text-[color:var(--foreground-soft)]"
          placeholder={placeholder}
        />

        <Button type="button" onClick={sendMessage} disabled={sending} className="w-full sm:w-auto">
          {sending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}

function areMessagesEqual(
  currentMessages: ConversationMessage[],
  nextMessages: ConversationMessage[]
) {
  if (currentMessages.length !== nextMessages.length) {
    return false;
  }

  return currentMessages.every((message, index) => message.id === nextMessages[index]?.id);
}
