import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Async video finalization is deprecated. Use POST /api/horses/[id]/media." },
    { status: 410 }
  );
}
