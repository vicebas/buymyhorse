"use client";

import Link from "next/link";
import { createContext, useContext, useState } from "react";
import { MessageSquare, Minimize2, PanelRightOpen, X } from "lucide-react";

import ConversationThread, {
  type ConversationMessage,
} from "@/components/chat/conversation-thread";
import { Button } from "@/components/ui/button";

type ChatBootstrapResponse = {
  conversationId: string;
  messages: ConversationMessage[];
  currentUserId: string;
  horseId: string;
  horseName: string;
  counterpartyName: string;
  fullConversationHref: string;
};

type FloatingChatContextValue = {
  openHorseConversation: (payload: {
    horseId: string;
    horseName: string;
    counterpartyName: string;
  }) => Promise<void>;
};

const FloatingChatContext = createContext<FloatingChatContextValue | null>(null);

export function FloatingChatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [conversation, setConversation] = useState<ChatBootstrapResponse | null>(null);
  const [mode, setMode] = useState<"closed" | "minimized" | "open">("closed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openHorseConversation({
    horseId,
    horseName,
    counterpartyName,
  }: {
    horseId: string;
    horseName: string;
    counterpartyName: string;
  }) {
    if (conversation?.horseId === horseId) {
      setMode("open");
      return;
    }

    setMode("open");
    setLoading(true);
    setError("");

    const res = await fetch(`/api/horses/${horseId}/conversation`, {
      method: "POST",
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setConversation(null);
      setMode("closed");
      setError(data?.error || "Unable to open conversation.");
      return;
    }

    const data = (await res.json()) as ChatBootstrapResponse;
    setConversation({
      ...data,
      horseName: data.horseName || horseName,
      counterpartyName: data.counterpartyName || counterpartyName,
    });
    setMode("open");
  }

  return (
    <FloatingChatContext.Provider value={{ openHorseConversation }}>
      {children}

      {error ? (
        <div className="fixed bottom-4 right-4 z-[60] rounded-2xl border border-[color:var(--destructive)] bg-[color:var(--background-elevated)] px-4 py-3 text-sm text-[color:var(--destructive)] shadow-[var(--shadow-card)]">
          {error}
        </div>
      ) : null}

      {conversation && mode === "minimized" ? (
        <button
          type="button"
          onClick={() => setMode("open")}
          className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-3 text-sm font-semibold text-[color:var(--foreground-strong)] shadow-[var(--shadow-card)]"
        >
          <MessageSquare className="h-4 w-4" />
          {conversation.horseName}
        </button>
      ) : null}

      {conversation && mode === "open" ? (
        <div className="fixed bottom-4 right-4 z-50 flex h-[560px] w-[min(92vw,420px)] flex-col overflow-hidden rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-hover)]">
          <div className="border-b border-[color:var(--border)] bg-[color:var(--background-elevated)] px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--foreground-soft)]">
                  Active Conversation
                </p>
                <h2 className="mt-1 truncate text-lg font-extrabold text-[color:var(--foreground-strong)]">
                  {conversation.horseName}
                </h2>
                <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
                  Barn: {conversation.counterpartyName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Minimize chat"
                  onClick={() => setMode("minimized")}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Close chat"
                  onClick={() => {
                    setMode("closed");
                    setConversation(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <Link
                href={conversation.fullConversationHref}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground-strong)] transition hover:text-[color:var(--accent)]"
              >
                <PanelRightOpen className="h-4 w-4" />
                Open full conversation
              </Link>
            </div>
          </div>

          <div className="flex-1 p-5">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-[color:var(--foreground-soft)]">
                Loading conversation...
              </div>
            ) : (
              <ConversationThread
                conversationId={conversation.conversationId}
                currentUserId={conversation.currentUserId}
                initialMessages={conversation.messages}
              />
            )}
          </div>
        </div>
      ) : null}
    </FloatingChatContext.Provider>
  );
}

export function useFloatingChat() {
  const value = useContext(FloatingChatContext);

  if (!value) {
    throw new Error("useFloatingChat must be used within FloatingChatProvider");
  }

  return value;
}
