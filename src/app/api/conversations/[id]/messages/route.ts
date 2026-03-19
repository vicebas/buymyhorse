import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await prisma.horseConversation.findUnique({
    where: {
      id,
    },
    include: {
      sellerProfile: {
        select: {
          userId: true,
        },
      },
      buyer: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const allowed =
    conversation.buyer.id === session.user.id ||
    conversation.sellerProfile.userId === session.user.id;

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();

  if (!body.body || !String(body.body).trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const message = await prisma.horseMessage.create({
    data: {
      conversationId: conversation.id,
      senderUserId: session.user.id,
      body: String(body.body).trim(),
      messageType: "TEXT",
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json(message);
}
