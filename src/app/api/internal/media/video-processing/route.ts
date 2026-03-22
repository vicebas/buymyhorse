import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "External video processor callbacks are deprecated in the EC2 container deployment." },
    { status: 410 }
  );
}
