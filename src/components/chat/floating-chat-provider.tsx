"use client";

import Link from "next/link";
import { createContext, useContext, useState } from "react";
import { MessageSquare, Minimize2, PanelRightOpen, X } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";

import ConversationThread, {
  type ConversationMessage,
} from "@/components/chat/conversation-thread";
import { Button } from "@/components/ui/button";
import EmailVerificationBanner from "@/components/auth/email-verification-banner";

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
  return (
    <SessionProvider>
      <FloatingChatInner>{children}</FloatingChatInner>
    </SessionProvider>
  );
}

function FloatingChatInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const showVerificationBanner =
    !!session?.user?.id && session.user.emailVerified === false;
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
      {showVerificationBanner && <EmailVerificationBanner />}
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
          style={{
            bottom: "max(1rem, env(safe-area-inset-bottom))",
            right: "max(1rem, env(safe-area-inset-right))",
          }}
        >
          <MessageSquare className="h-4 w-4" />
          {conversation.horseName}
        </button>
      ) : null}

      {conversation && mode === "open" ? (
        <div
          className="fixed inset-x-0 bottom-0 top-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden bg-[color:var(--card)] sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[560px] sm:w-[min(92vw,420px)] sm:rounded-[1.75rem] sm:border sm:border-[color:var(--border)] sm:shadow-[var(--shadow-hover)]"
          style={{
            paddingTop: "max(0px, env(safe-area-inset-top))",
            paddingBottom: "max(0px, env(safe-area-inset-bottom))",
          }}
        >
          <div className="border-b border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-4 sm:px-5">
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

          <div className="min-h-0 flex-1 p-4 sm:p-5">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-[color:var(--foreground-soft)]">
                Loading conversation...
              </div>
            ) : (
              <ConversationThread
                key={conversation.conversationId}
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
