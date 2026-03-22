import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";
import {
  type CopyGenerationRequest,
  generateCopyDraft,
} from "@/lib/ai/copy";
import { getCopyGenerationProvider } from "@/lib/ai/provider";

const requestSchema = z.object({
  entityType: z.enum(["barn", "horse"]),
  targetField: z.enum(["bio", "description"]),
  scope: z.enum(["barn-onboarding", "barn-settings", "horse-create", "horse-edit"]),
  mode: z.enum(["create", "edit"]),
  horseId: z.string().trim().optional().nullable(),
  context: z.record(z.string(), z.string()),
});

async function authorizeRequest(userId: string, input: CopyGenerationRequest) {
  if (input.scope === "barn-onboarding") {
    return;
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!seller) {
    throw new Error("Only barn accounts can generate this copy.");
  }

  if (input.scope === "horse-edit") {
    if (!input.horseId) {
      throw new Error("Horse ID is required for horse edit generation.");
    }

    const horse = await prisma.horse.findFirst({
      where: {
        id: input.horseId,
        sellerProfileId: seller.id,
      },
      select: { id: true },
    });

    if (!horse) {
      throw new Error("Horse not found for this barn.");
    }
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid AI generation request." }, { status: 400 });
    }

    const input = parsed.data as CopyGenerationRequest;

    if (input.entityType === "barn" && input.targetField !== "bio") {
      return NextResponse.json({ error: "Unsupported barn AI target." }, { status: 400 });
    }

    if (input.entityType === "horse" && input.targetField !== "description") {
      return NextResponse.json({ error: "Unsupported horse AI target." }, { status: 400 });
    }

    await authorizeRequest(session.user.id, input);

    const provider = getCopyGenerationProvider();
    const draft = await generateCopyDraft(provider, input);

    return NextResponse.json({ draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate copy right now.";
    const status =
      message === "Only barn accounts can generate this copy." ||
      message === "Horse not found for this barn." ||
      message === "Horse ID is required for horse edit generation."
        ? 403
        : message === "Missing ANTHROPIC_API_KEY."
          ? 503
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
