import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { isAdminRole } from "@/lib/admin/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readEquiTagAsset } from "@/lib/equitag/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdminRole(session.user.email ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.equiTagOrder.findUnique({
    where: { id },
    include: { equiTag: { select: { id: true, code: true, svgPath: true } } },
  });

  if (!order?.equiTag) {
    return NextResponse.json({ error: "Order or tag not found" }, { status: 404 });
  }

  const svgBuffer = await readEquiTagAsset(order.equiTag.svgPath);
  if (!svgBuffer) {
    return NextResponse.json({ error: "QR asset not found" }, { status: 404 });
  }

  return new Response(svgBuffer, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="${order.equiTag.code}.svg"`,
    },
  });
}
