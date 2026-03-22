import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import {
  getMessageNotificationSummary,
  type MessageSummaryScope,
} from "@/lib/messages/inbox";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const scopeParam = searchParams.get("scope");
  const scope: MessageSummaryScope =
    scopeParam === "seller" ? "seller" : "buyer";

  const summary = await getMessageNotificationSummary(session.user.id, scope);

  return NextResponse.json(summary);
}
