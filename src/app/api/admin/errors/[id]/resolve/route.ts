import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { isAdminRole } from "@/lib/admin/roles";
import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { resolved?: boolean } | null;

  if (typeof body?.resolved !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const error = await prisma.backendError.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!error) {
    return NextResponse.json({ error: "Error not found." }, { status: 404 });
  }

  await prisma.backendError.update({
    where: { id },
    data: { resolvedAt: body.resolved ? new Date() : null },
  });

  return NextResponse.json({ ok: true });
}
