import { readFile } from "node:fs/promises";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { getBuyerHorseAccess } from "@/lib/vault/access";

interface RouteContext {
  params: Promise<{
    id: string;
    documentId: string;
  }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id, documentId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const access = await getBuyerHorseAccess(session.user.id, id);

    if (access.status !== "ACTIVE") {
      return NextResponse.json({ error: "Access is not active." }, { status: 403 });
    }

    const document = access.documents.find((item) => item.id === documentId);

    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const fileBuffer = await readFile(document.filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${document.fileName}"`,
      },
    });
  } catch (error) {
    console.error("Vault document download failed:", error);
    return NextResponse.json(
      { error: "Unable to download document right now." },
      { status: 500 }
    );
  }
}
