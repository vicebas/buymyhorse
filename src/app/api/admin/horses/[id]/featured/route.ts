import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { logAdminAction } from "@/lib/admin/audit";
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
  const body = (await req.json().catch(() => null)) as { featured?: boolean } | null;

  if (typeof body?.featured !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const horse = await prisma.horse.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      isPlatformFeatured: true,
    },
  });

  if (!horse) {
    return NextResponse.json({ error: "Horse not found." }, { status: 404 });
  }

  const platformFeaturedAt = body.featured ? new Date() : null;

  await prisma.horse.update({
    where: { id },
    data: {
      isPlatformFeatured: body.featured,
      platformFeaturedAt,
    },
  });

  await logAdminAction({
    actorUserId: session.user.id,
    actionType: body.featured ? "HORSE_PLATFORM_FEATURED" : "HORSE_PLATFORM_UNFEATURED",
    targetType: "HORSE",
    targetId: horse.id,
    reason: body.featured ? "Horse marked as an admin pick." : "Horse removed from admin picks.",
    metadata: {
      horseName: horse.name,
      previousFeatured: horse.isPlatformFeatured,
      nextFeatured: body.featured,
      platformFeaturedAt: platformFeaturedAt?.toISOString() || null,
    },
  });

  return NextResponse.json({ success: true });
}
