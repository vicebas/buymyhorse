"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import SellerConversationPanel from "@/components/seller/seller-conversation-panel";
import { FloatingMessageProvider } from "@/components/ui/floating-message";
import type { ConversationMessage } from "@/components/chat/conversation-thread";
import { Button } from "@/components/ui/button";
import { useLivePoll } from "@/hooks/use-live-poll";

export type SellerInboxListItem = {
  id: string;
  roleInConversation: "seller" | "buyer";
  horse: {
    id: string;
    name: string;
  };
  contextLabel: string;
  contextDescription: string;
  counterpartyLabel: string;
  counterpartyName: string;
  counterpartyDetail: string;
  lastMessagePreview: string;
  lastActivityAt: string;
  unread: boolean;
};

type ConversationDetailResponse = {
  conversationId: string;
  roleInConversation: "seller" | "buyer";
  horseId: string;
  horseName: string;
  counterpartLabel: string;
  counterpartName: string;
  helperText: string;
  messages: ConversationMessage[];
};

export default function SellerInboxShell({
  currentUserId,
  initialConversations,
}: {
  currentUserId: string;
  initialConversations: SellerInboxListItem[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [showFlagged, setShowFlagged] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(
    initialConversations[0]?.id ?? null
  );
  const [activeConversation, setActiveConversation] =
    useState<ConversationDetailResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(initialConversations[0]));
  const [error, setError] = useState("");
  const [mobileStage, setMobileStage] = useState<"list" | "conversation">("list");

  useLivePoll({
    enabled: true,
    intervalMs: 5000,
    onPoll: async () => {
      const response = await fetch(
        `/api/messages/inbox?scope=all&includeMutedBlocked=${showFlagged ? "true" : "false"}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return;
      }

      const nextConversations = (await response.json()) as SellerInboxListItem[];

      setConversations(nextConversations);
      setActiveConversationId((currentActiveConversationId) => {
        if (
          currentActiveConversationId &&
          nextConversations.some((conversation) => conversation.id === currentActiveConversationId)
        ) {
          return currentActiveConversationId;
        }

        return nextConversations[0]?.id ?? null;
      });
    },
  });

  useEffect(() => {
    let cancelled = false;

    if (!activeConversationId) {
      return () => {
        cancelled = true;
      };
    }

    async function loadConversation(conversationId: string) {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = (await res.json()) as ConversationDetailResponse | { error?: string };

      if (cancelled) {
        return;
      }

      if (!res.ok) {
        setActiveConversation(null);
        setError("Unable to load this conversation right now.");
        setLoading(false);
        return;
      }

      setActiveConversation(data as ConversationDetailResponse);
      setLoading(false);
    }

    void loadConversation(activeConversationId);

    return () => {
      cancelled = true;
    };
  }, [activeConversationId]);

  function handleMessageSent(message: ConversationMessage) {
    if (!activeConversation) {
      return;
    }

    setConversations((currentConversations) => {
      const updated = currentConversations.map((conversation) =>
        conversation.id === activeConversation.conversationId
          ? {
              ...conversation,
              lastActivityAt: new Date(message.createdAt).toISOString(),
              lastMessagePreview:
                message.messageType === "GRANT"
                  ? "Document access granted"
                  : message.body || "No messages yet",
            }
          : conversation
      );

      return [...updated].sort(
        (a, b) =>
          new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
      );
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside
        className={`rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-card)] ${
          mobileStage === "conversation" ? "hidden lg:block" : ""
        }`}
      >
        <div className="border-b border-[color:var(--border)] px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[color:var(--foreground-strong)]">Conversations</p>
            <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
              Pick a thread to continue the conversation without leaving this page.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              aria-pressed={showFlagged}
              className={showFlagged ? "border-[color:var(--accent)] bg-[color:var(--muted)] text-[color:var(--foreground-strong)]" : ""}
              onClick={async () => {
                const next = !showFlagged;
                setShowFlagged(next);

                const res = await fetch(
                  `/api/messages/inbox?scope=all&includeMutedBlocked=${next ? "true" : "false"}`,
                  { cache: "no-store" }
                );

                if (!res.ok) return;
                const nextConversations = (await res.json()) as SellerInboxListItem[];
                setConversations(nextConversations);
                setActiveConversationId((current) =>
                  nextConversations.some((c) => c.id === current) ? current : nextConversations[0]?.id ?? null
                );
              }}
            >
              {showFlagged ? "Showing muted / blocked" : "Show muted / blocked"}
            </Button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-3">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;

            return (
              <div
                key={conversation.id}
                onClick={() => {
                  setActiveConversationId(conversation.id);
                  setMobileStage("conversation");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveConversationId(conversation.id);
                    setMobileStage("conversation");
                  }
                }}
                role="button"
                tabIndex={0}
                className={`mb-3 w-full rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? "border-[color:var(--accent)] bg-[color:var(--muted)]"
                    : "border-[color:var(--border)] bg-[color:var(--background)] hover:bg-[color:var(--muted)]"
                }`}
              >
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-soft)]">
                  <span className="rounded-full bg-[color:var(--muted)] px-2.5 py-1">
                    {conversation.contextLabel}
                  </span>
                  <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">
                    {conversation.contextDescription}
                  </span>
                  {conversation.unread ? (
                    <span className="rounded-full bg-[color:var(--destructive)] px-2.5 py-1 text-white">
                      New
                    </span>
                  ) : null}
                </div>

                <Link
                  href={`/horses/${conversation.horse.id}`}
                  onClick={(event) => event.stopPropagation()}
                  className="mt-3 inline-flex text-lg font-bold text-[color:var(--foreground-strong)] underline-offset-4 hover:underline"
                >
                  {conversation.horse.name}
                </Link>

                <div className="mt-1 text-sm text-[color:var(--foreground-soft)]">
                  {conversation.counterpartyLabel}: {conversation.counterpartyName}
                </div>

                <div className="mt-3 line-clamp-2 text-sm text-[color:var(--foreground-soft)]">
                  {conversation.lastMessagePreview}
                </div>

                <div className="mt-3 text-xs text-[color:var(--muted-foreground)]">
                  {new Date(conversation.lastActivityAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <section
        className={`min-h-[560px] rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-card)] ${
          mobileStage === "list" ? "hidden lg:block" : ""
        }`}
      >
        {!activeConversationId ? (
          <div className="flex h-full items-center justify-center p-10 text-center">
            <div>
              <p className="text-lg font-semibold text-[color:var(--foreground-strong)]">
                No conversation selected
              </p>
              <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                Choose a conversation from the list to open it here.
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex h-full items-center justify-center p-10 text-sm text-[color:var(--foreground-soft)]">
            Loading conversation...
          </div>
        ) : error || !activeConversation ? (
          <div className="flex h-full items-center justify-center p-10 text-center">
            <div>
              <p className="text-lg font-semibold text-[color:var(--foreground-strong)]">
                Conversation unavailable
              </p>
              <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                {error || "Unable to load this conversation."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[560px] flex-col p-4 sm:p-6">
            <div className="mb-4 lg:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMobileStage("list")}
                className="inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to conversations
              </Button>
            </div>

            <div className="border-b border-[color:var(--border)] pb-5">
              <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
                {activeConversation.roleInConversation === "seller"
                  ? "Your Horse Conversation"
                  : "Sent Inquiry"}
              </p>
              <Link
                href={`/horses/${activeConversation.horseId}`}
                className="mt-2 inline-flex text-2xl font-extrabold text-[color:var(--foreground-strong)] underline-offset-4 hover:underline sm:text-3xl"
              >
                {activeConversation.horseName}
              </Link>
              <p className="mt-3 text-[color:var(--foreground-soft)]">
                {activeConversation.counterpartLabel}: {activeConversation.counterpartName}
              </p>
              <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
                {activeConversation.helperText}
              </p>
            </div>

            <div className="mt-6 min-h-0 flex-1">
              <FloatingMessageProvider>
                <SellerConversationPanel
                  conversationId={activeConversation.conversationId}
                  currentUserId={currentUserId}
                  initialMessages={activeConversation.messages}
                  onMessageSent={handleMessageSent}
                />
              </FloatingMessageProvider>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
