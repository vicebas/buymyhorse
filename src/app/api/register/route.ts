import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db/prisma";
import { createEmailVerificationToken } from "@/lib/auth/tokens";
import { sendVerificationEmail } from "@/lib/email/mailer";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is required."),
  email: z.email("Invalid email address.").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request." },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Fire-and-forget verification email — don't block the response
    createEmailVerificationToken(email)
      .then((token) =>
        sendVerificationEmail({ toName: name, toEmail: email, token })
      )
      .catch((err) => console.error("[register] verification email error:", err));

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create account right now." },
      { status: 500 }
    );
  }
}