import bcrypt from "bcrypt";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { createPasswordResetToken } from "@/lib/auth/tokens";
import { authOptions } from "@/lib/auth/options";
import { ensureHorseConversation } from "@/lib/conversations/horse-conversation";
import prisma from "@/lib/db/prisma";
import { getAppOrigin } from "@/lib/app-url";
import { sendDirectVaultShareEmail } from "@/lib/email/mailer";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

type ShareBody = {
  fileIds?: string[];
  recipientEmail?: string;
  message?: string;
};

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await req.json()) as ShareBody;
    const fileIds = uniqueStrings(body.fileIds ?? []);
    const recipientEmail = body.recipientEmail?.trim().toLowerCase() ?? "";
    const message = body.message?.trim() || null;

    if (fileIds.length === 0) {
      return NextResponse.json({ error: "Select at least one document to share." }, { status: 400 });
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: "Recipient email is required." }, { status: 400 });
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        displayName: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
    }

    const horse = await prisma.horse.findFirst({
      where: {
        id,
        sellerProfileId: seller.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!horse) {
      return NextResponse.json({ error: "Horse not found." }, { status: 404 });
    }

    if (seller.user.email?.toLowerCase() === recipientEmail) {
      return NextResponse.json({ error: "Use a different recipient email." }, { status: 400 });
    }

    const files = await prisma.horseDocument.findMany({
      where: {
        id: {
          in: fileIds,
        },
        horseId: horse.id,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        fileName: true,
      },
    });

    if (files.length !== fileIds.length) {
      return NextResponse.json({ error: "One or more selected documents are invalid." }, { status: 400 });
    }

    let recipient = await prisma.user.findUnique({
      where: {
        email: recipientEmail,
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    const appOrigin = getAppOrigin(req);
    let setupUrl: string | null = null;
    let needsSetup = false;

    if (!recipient) {
      needsSetup = true;
      const temporaryPassword = crypto.randomBytes(24).toString("hex");
      const passwordHash = await bcrypt.hash(temporaryPassword, 10);

      recipient = await prisma.user.create({
        data: {
          email: recipientEmail,
          password: passwordHash,
          role: "BUYER",
        },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
        },
      });
    }

    if (!recipient.password) {
      needsSetup = true;
    }

    const conversation = await ensureHorseConversation(horse.id, recipient.id, seller.id);

    const grant = await prisma.$transaction(async (tx) => {
      const upsertedGrant = await tx.accessGrant.upsert({
        where: {
          horseId_buyerId: {
            horseId: horse.id,
            buyerId: recipient.id,
          },
        },
        update: {
          grantedBySellerId: seller.id,
          revokedAt: null,
          note: message,
        },
        create: {
          horseId: horse.id,
          buyerId: recipient.id,
          grantedBySellerId: seller.id,
          note: message,
        },
        select: {
          id: true,
        },
      });

      await tx.accessGrantFile.deleteMany({
        where: {
          accessGrantId: upsertedGrant.id,
        },
      });

      await tx.accessGrantFile.createMany({
        data: files.map((file) => ({
          accessGrantId: upsertedGrant.id,
          horseDocumentId: file.id,
        })),
      });

      await tx.horseMessage.create({
        data: {
          conversationId: conversation.id,
          senderUserId: session.user.id,
          messageType: "GRANT",
          accessGrantId: upsertedGrant.id,
          metadata: {
            note: message,
            files,
            accessGrantId: upsertedGrant.id,
            source: "DIRECT_SHARE",
          },
        },
      });

      await tx.horseConversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          sellerLastReadAt: new Date(),
        },
      });

      await tx.vaultActivityLog.create({
        data: {
          horseId: horse.id,
          accessGrantId: upsertedGrant.id,
          actorUserId: session.user.id,
          activityType: "ACCESS_REQUEST_APPROVED",
          metadata: {
            source: "DIRECT_SHARE",
            recipientEmail,
            fileIds: files.map((file) => file.id),
            note: message,
          },
        },
      });

      return upsertedGrant;
    });

    const accessUrl = `${appOrigin}/horses/${horse.id}/access`;

    if (needsSetup) {
      const resetToken = await createPasswordResetToken(recipient.id);
      setupUrl = `${appOrigin}/reset-password?token=${encodeURIComponent(resetToken)}&callbackUrl=${encodeURIComponent(accessUrl)}`;
    }

    let warning: string | null = null;

    try {
      await sendDirectVaultShareEmail({
        toName: recipient.name ?? "there",
        toEmail: recipientEmail,
        horseName: horse.name,
        barnName: seller.displayName,
        senderName: seller.user.name ?? seller.displayName,
        accessUrl,
        setupUrl,
        message,
        documentTitles: files.map((file) => file.title || file.fileName),
      });
    } catch (emailError) {
      console.error("Direct vault share email failed:", emailError);
      warning = "Access was created, but the email could not be delivered right now.";
    }

    return NextResponse.json({
      ok: true,
      grantId: grant.id,
      warning,
    });
  } catch (error) {
    console.error("Direct document share failed:", error);
    return NextResponse.json({ error: "Unable to share documents right now." }, { status: 500 });
  }
}
