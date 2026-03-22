import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Direct S3 video uploads are deprecated. Use POST /api/horses/[id]/media." },
    { status: 410 }
  );
}
