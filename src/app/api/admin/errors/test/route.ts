import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { isAdminRole } from "@/lib/admin/roles";
import { authOptions } from "@/lib/auth/options";
import { trackBackendError } from "@/lib/errors/track";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as { message?: string } | null;
  const message = body?.message?.trim() || "Test error created from admin console.";

  const syntheticError = new Error(message);

  await trackBackendError({
    error: syntheticError,
    route: "/api/admin/errors/test",
    method: "POST",
    userId: session.user.id,
    metadata: { triggeredBy: session.user.email ?? session.user.id },
  });

  return NextResponse.json({ ok: true });
}
