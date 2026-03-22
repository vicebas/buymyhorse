import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Async video retry is deprecated. Re-upload the video through POST /api/horses/[id]/media." },
    { status: 410 }
  );
}
