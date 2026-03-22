import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";
import { getUserAppHeaderVariant } from "@/lib/auth/get-user-app-header-variant";
import ResolvedAppHeader from "@/components/layout/resolved-app-header";
import BuyerInboxList from "@/components/messages/buyer-inbox-list";
import { getMessageInboxItems } from "@/lib/messages/inbox";

export default async function BuyerMessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const headerVariant = await getUserAppHeaderVariant(session.user.id);

  const conversations = await getMessageInboxItems(session.user.id, "buyer");

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <ResolvedAppHeader variant={headerVariant} />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
            Buyer Messages
          </p>
          <h1 className="mt-2 text-4xl font-extrabold">Your Conversations</h1>
          <p className="mt-3 max-w-2xl text-[color:var(--foreground-soft)]">
            Keep track of barns you have contacted about specific horses.
          </p>
        </div>

        <BuyerInboxList initialConversations={conversations} />
      </section>
    </main>
  );
}
