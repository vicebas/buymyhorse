import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { getMessageInboxItems, type MessageInboxScope } from "@/lib/messages/inbox";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const scopeParam = searchParams.get("scope");
  const scope: MessageInboxScope = scopeParam === "all" ? "all" : "buyer";

  const includeMutedBlockedParam = searchParams.get("includeMutedBlocked");
  const includeMutedBlocked = includeMutedBlockedParam === "true";

  const inboxItems = await getMessageInboxItems(
    session.user.id,
    scope,
    includeMutedBlocked
  );

  return NextResponse.json(inboxItems);
}
