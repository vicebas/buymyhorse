import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";
import { readEquiTagAsset } from "@/lib/equitag/service";
import { resolvePublicAssetUrl } from "@/lib/storage/public-assets";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  });

  if (!seller) {
    return NextResponse.json({ error: "Barn profile not found." }, { status: 404 });
  }

  const equiTag = await prisma.equiTag.findFirst({
    where: {
      id,
      ownerSellerProfileId: seller.id,
    },
    select: {
      code: true,
      svgPath: true,
      pngPath: true,
    },
  });

  if (!equiTag) {
    return NextResponse.json({ error: "EquiTag not found." }, { status: 404 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "png" ? "png" : "svg";
  const publicPath = format === "png" ? equiTag.pngPath : equiTag.svgPath;

  if (format === "png") {
    const assetUrl = resolvePublicAssetUrl(publicPath);

    if (assetUrl) {
      return NextResponse.redirect(assetUrl, { status: 302 });
    }
  }

  const file = await readEquiTagAsset(publicPath);

  return new NextResponse(file, {
    headers: {
      "Content-Type": format === "png" ? "image/png" : "image/svg+xml",
      "Content-Disposition": `attachment; filename="${seller.slug || "barn"}-${equiTag.code}.${format}"`,
    },
  });
}
