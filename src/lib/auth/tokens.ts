import crypto from "crypto"

import prisma from "@/lib/db/prisma"

// ── Email Verification Tokens (uses NextAuth's VerificationToken table) ──────

/**
 * Creates (or replaces) a 24-hour email verification token for the given email.
 */
export async function createEmailVerificationToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  // VerificationToken uses composite unique [identifier, token]
  // Delete any existing token for this identifier first
  await prisma.verificationToken.deleteMany({ where: { identifier: email } })

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })

  return token
}

/**
 * Validates the token and, if valid, returns the email it belongs to.
 * Deletes the token on success (single-use).
 * Returns null if not found or expired.
 */
export async function consumeEmailVerificationToken(
  token: string
): Promise<string | null> {
  const record = await prisma.verificationToken.findUnique({ where: { token } })
  if (!record) return null
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } })
    return null
  }
  await prisma.verificationToken.delete({ where: { token } })
  return record.identifier
}

// ── Password Reset Tokens ────────────────────────────────────────────────────

/**
 * Creates a 1-hour password reset token for the given user.
 * Deletes any previously issued (unused) tokens for that user.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } })

  await prisma.passwordResetToken.create({
    data: { userId, token, expiresAt },
  })

  return token
}

/**
 * Validates the token (not used, not expired) and marks it as used.
 * Returns the associated userId on success, null otherwise.
 */
export async function consumePasswordResetToken(
  token: string
): Promise<string | null> {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (!record) return null
  if (record.usedAt) return null
  if (record.expiresAt < new Date()) return null

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  })

  return record.userId
}
