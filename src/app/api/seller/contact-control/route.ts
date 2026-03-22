import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import { getSellerWriteBlockError } from "@/lib/admin/moderation";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } });

    if (!seller) {
      return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
    }

    const sellerWriteBlocked = getSellerWriteBlockError(seller);
    if (sellerWriteBlocked) {
      return NextResponse.json({ error: sellerWriteBlocked }, { status: 403 });
    }

    const body = await req.json();
    const targetUserId = String(body.targetUserId || "").trim();
    const action = String(body.action || "").trim(); // mute, unmute, block, unblock

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required." }, { status: 400 });
    }

    if (!["mute", "unmute", "block", "unblock"].includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const isMuted = action === "mute";
    const isBlocked = action === "block";

    const updated = await prisma.sellerContactControl.upsert({
      where: { sellerProfileId_targetUserId: { sellerProfileId: seller.id, targetUserId } },
      create: {
        sellerProfileId: seller.id,
        targetUserId,
        isMuted,
        isBlocked,
      },
      update: {
        isMuted,
        isBlocked,
      },
    });

    // For unmute/unblock, we should clear flags if record exists
    if (action === "unmute" || action === "unblock") {
      const next = await prisma.sellerContactControl.update({
        where: { sellerProfileId_targetUserId: { sellerProfileId: seller.id, targetUserId } },
        data: {
          isMuted: action === "unmute" ? false : updated.isMuted,
          isBlocked: action === "unblock" ? false : updated.isBlocked,
        },
      });

      return NextResponse.json(next);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("contact-control failed:", error);
    return NextResponse.json({ error: "Unable to update contact control." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } });

    if (!seller) {
      return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
    }

    const url = new URL(req.url);
    const targetUserId = String(url.searchParams.get("targetUserId") || "").trim();

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId query required." }, { status: 400 });
    }

    const control = await prisma.sellerContactControl.findUnique({
      where: { sellerProfileId_targetUserId: { sellerProfileId: seller.id, targetUserId } },
    });

    return NextResponse.json(control || { isMuted: false, isBlocked: false });
  } catch (error) {
    console.error("contact-control GET failed:", error);
    return NextResponse.json({ error: "Unable to load contact control." }, { status: 500 });
  }
}
