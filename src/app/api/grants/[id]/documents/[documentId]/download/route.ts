import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { createPrivateDownloadUrl } from "@/lib/storage/private-assets";
import { getBuyerGrantAccess } from "@/lib/vault/access";

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

    const access = await getBuyerGrantAccess(id, session.user.id);

    if (!access || access.status !== "ACTIVE") {
      return NextResponse.json({ error: "Access is not active." }, { status: 403 });
    }

    const document = access.documents.find((item) => item.id === documentId);

    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const downloadUrl = await createPrivateDownloadUrl({
      key: document.filePath,
      fileName: document.fileName,
      contentType: document.mimeType,
    });

    return NextResponse.redirect(downloadUrl, { status: 302 });
  } catch (error) {
    console.error("Grant document download failed:", error);
    return NextResponse.json(
      { error: "Unable to download document right now." },
      { status: 500 }
    );
  }
}
