"use client";

import ConversationThread, {
  type ConversationMessage,
} from "@/components/chat/conversation-thread";

export default function SellerConversationPanel({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: ConversationMessage[];
}) {
  return (
    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
      <ConversationThread
        conversationId={conversationId}
        currentUserId={currentUserId}
        initialMessages={initialMessages}
        placeholder="Write a reply..."
      />
    </div>
  );
}
