import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { logAdminAction } from "@/lib/admin/audit";
import { isSuperAdminRole } from "@/lib/admin/roles";
import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !isSuperAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as {
    role?: "BUYER" | "ADMIN" | "SUPER_ADMIN";
  } | null;

  if (!body?.role) {
    return NextResponse.json({ error: "Role is required." }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      sellerProfile: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (targetUser.sellerProfile?.id && (body.role === "ADMIN" || body.role === "SUPER_ADMIN")) {
    return NextResponse.json(
      { error: "Barn accounts cannot be promoted to admin roles in this version." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id },
    data: {
      role: body.role,
    },
  });

  await logAdminAction({
    actorUserId: session.user.id,
    actionType: "USER_ROLE_CHANGED",
    targetType: "USER",
    targetId: id,
    reason: `Role changed from ${targetUser.role} to ${body.role}`,
    metadata: {
      previousRole: targetUser.role,
      nextRole: body.role,
    },
  });

  return NextResponse.json({ success: true });
}
