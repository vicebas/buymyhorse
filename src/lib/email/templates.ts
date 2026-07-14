const BRAND_NAME = "HorseRoster"
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000"

export function verificationEmailTemplate(params: {
  toName: string
  toEmail: string
  token: string
}) {
  const { toName, toEmail, token } = params
  const verifyUrl = `${BASE_URL}/verify-email?token=${encodeURIComponent(token)}`

  return {
    to: toEmail,
    subject: `Confirm your ${BRAND_NAME} email`,
    text: [
      `Hi ${toName},`,
      "",
      `Please confirm your email address to finish setting up your ${BRAND_NAME} account:`,
      verifyUrl,
      "",
      `This link expires in 24 hours. If you didn't create a ${BRAND_NAME} account, you can ignore this email.`,
    ].join("\n"),
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f6f6;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background-color:#1a1a1a;padding:28px 40px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">${BRAND_NAME}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1a1a1a;">Confirm your email</h1>
            <p style="margin:0 0 8px;color:#555;font-size:15px;line-height:1.6;">Hi ${toName},</p>
            <p style="margin:0 0 32px;color:#555;font-size:15px;line-height:1.6;">
              Confirm your email address to finish setting up your ${BRAND_NAME} account.
            </p>
            <a href="${verifyUrl}" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
              Confirm email
            </a>
            <p style="margin:32px 0 0;color:#999;font-size:13px;line-height:1.5;">
              This link expires in 24 hours. If you didn't create a ${BRAND_NAME} account, you can safely ignore this email.
            </p>
            <p style="margin:8px 0 0;color:#bbb;font-size:12px;">Or copy and paste this URL: <a href="${verifyUrl}" style="color:#16a34a;">${verifyUrl}</a></p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
            <p style="margin:0;color:#bbb;font-size:12px;">&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

export function passwordResetEmailTemplate(params: {
  toName: string
  toEmail: string
  token: string
}) {
  const { toName, toEmail, token } = params
  const resetUrl = `${BASE_URL}/reset-password?token=${encodeURIComponent(token)}`

  return {
    to: toEmail,
    subject: `Reset your ${BRAND_NAME} password`,
    text: [
      `Hi ${toName},`,
      "",
      `You requested a password reset for your ${BRAND_NAME} account.`,
      `Visit this link to set a new password:`,
      resetUrl,
      "",
      `This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.`,
    ].join("\n"),
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f6f6;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background-color:#1a1a1a;padding:28px 40px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">${BRAND_NAME}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1a1a1a;">Reset your password</h1>
            <p style="margin:0 0 8px;color:#555;font-size:15px;line-height:1.6;">Hi ${toName},</p>
            <p style="margin:0 0 32px;color:#555;font-size:15px;line-height:1.6;">
              We received a request to reset the password for your ${BRAND_NAME} account. Click the button below to choose a new password.
            </p>
            <a href="${resetUrl}" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
              Reset password
            </a>
            <p style="margin:32px 0 0;color:#999;font-size:13px;line-height:1.5;">
              This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.
            </p>
            <p style="margin:8px 0 0;color:#bbb;font-size:12px;">Or copy and paste this URL: <a href="${resetUrl}" style="color:#16a34a;">${resetUrl}</a></p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
            <p style="margin:0;color:#bbb;font-size:12px;">&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

export function newHorseFromBarnTemplate(params: {
  toName: string
  toEmail: string
  barnName: string
  barnSlug: string
  horseName: string
  horseId: string
}) {
  const { toName, toEmail, barnName, barnSlug, horseName, horseId } = params
  const horseUrl = `${BASE_URL}/horses/${horseId}`
  const barnUrl = `${BASE_URL}/barn/${barnSlug}`

  return {
    to: toEmail,
    subject: `New horse listed at ${barnName}`,
    text: [
      `Hi ${toName},`,
      "",
      `${barnName}, a barn you follow, just listed a new horse: ${horseName}.`,
      "",
      `View the horse: ${horseUrl}`,
      `View the barn: ${barnUrl}`,
    ].join("\n"),
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f6f6;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background-color:#1a1a1a;padding:28px 40px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">${BRAND_NAME}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1a1a1a;">New horse listed at ${barnName}</h1>
            <p style="margin:0 0 8px;color:#555;font-size:15px;line-height:1.6;">Hi ${toName},</p>
            <p style="margin:0 0 32px;color:#555;font-size:15px;line-height:1.6;">
              <strong>${barnName}</strong>, a barn you follow, just listed a new horse: <strong>${horseName}</strong>.
            </p>
            <a href="${horseUrl}" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
              View Horse
            </a>
            <p style="margin:24px 0 0;color:#555;font-size:14px;">
              <a href="${barnUrl}" style="color:#16a34a;text-decoration:underline;">View ${barnName}'s barn</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
            <p style="margin:0;color:#bbb;font-size:12px;">&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

export function horseUpdatedTemplate(params: {
  toName: string
  toEmail: string
  barnName: string
  barnSlug: string
  horseName: string
  horseId: string
  changedFields: string[]
}) {
  const { toName, toEmail, barnName, barnSlug, horseName, horseId, changedFields } = params
  const horseUrl = `${BASE_URL}/horses/${horseId}`
  const barnUrl = `${BASE_URL}/barn/${barnSlug}`
  const fieldList = changedFields.join(", ")

  return {
    to: toEmail,
    subject: `Update on ${horseName} at ${barnName}`,
    text: [
      `Hi ${toName},`,
      "",
      `${horseName} at ${barnName} has been updated.`,
      `Updated fields: ${fieldList}.`,
      "",
      `View the horse: ${horseUrl}`,
      `View the barn: ${barnUrl}`,
    ].join("\n"),
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f6f6;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background-color:#1a1a1a;padding:28px 40px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">${BRAND_NAME}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1a1a1a;">Update on ${horseName}</h1>
            <p style="margin:0 0 8px;color:#555;font-size:15px;line-height:1.6;">Hi ${toName},</p>
            <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
              <strong>${horseName}</strong> at <strong>${barnName}</strong> has been updated.
            </p>
            <p style="margin:0 0 32px;color:#555;font-size:15px;line-height:1.6;">
              <strong>Updated fields:</strong> ${fieldList}.
            </p>
            <a href="${horseUrl}" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
              View Horse
            </a>
            <p style="margin:24px 0 0;color:#555;font-size:14px;">
              <a href="${barnUrl}" style="color:#16a34a;text-decoration:underline;">View ${barnName}'s barn</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
            <p style="margin:0;color:#bbb;font-size:12px;">&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

export function newMessageTemplate(params: {
  toName: string
  toEmail: string
  horseName: string
  horseId: string
  senderName: string
  conversationId: string
  isSellerRecipient: boolean
}) {
  const { toName, toEmail, horseName, horseId, senderName, conversationId, isSellerRecipient } = params
  const messageUrl = isSellerRecipient
    ? `${BASE_URL}/seller/messages/${conversationId}`
    : `${BASE_URL}/messages/${conversationId}`
  const horseUrl = `${BASE_URL}/horses/${horseId}`

  return {
    to: toEmail,
    subject: `New message about ${horseName}`,
    text: [
      `Hi ${toName},`,
      "",
      `You have a new message from ${senderName} about ${horseName}.`,
      "",
      `View the message: ${messageUrl}`,
      `View the horse: ${horseUrl}`,
    ].join("\n"),
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f6f6;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background-color:#1a1a1a;padding:28px 40px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">${BRAND_NAME}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1a1a1a;">New message about ${horseName}</h1>
            <p style="margin:0 0 8px;color:#555;font-size:15px;line-height:1.6;">Hi ${toName},</p>
            <p style="margin:0 0 32px;color:#555;font-size:15px;line-height:1.6;">
              You have a new message from <strong>${senderName}</strong> about <strong>${horseName}</strong>.
            </p>
            <a href="${messageUrl}" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
              View Message
            </a>
            <p style="margin:24px 0 0;color:#555;font-size:14px;">
              <a href="${horseUrl}" style="color:#16a34a;text-decoration:underline;">View ${horseName}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
            <p style="margin:0;color:#bbb;font-size:12px;">&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

export function directVaultShareTemplate(params: {
  toName: string
  toEmail: string
  horseName: string
  barnName: string
  senderName: string
  accessUrl: string
  setupUrl?: string | null
  message?: string | null
  documentTitles: string[]
}) {
  const {
    toName,
    toEmail,
    horseName,
    barnName,
    senderName,
    accessUrl,
    setupUrl,
    message,
    documentTitles,
  } = params

  const documentSummary =
    documentTitles.length === 1
      ? documentTitles[0]
      : `${documentTitles.length} selected documents`

  return {
    to: toEmail,
    subject: `${horseName} documents shared from ${barnName}`,
    text: [
      `Hi ${toName},`,
      "",
      `${senderName} from ${barnName} shared secure EquiVault access for ${horseName}.`,
      `Shared documents: ${documentSummary}.`,
      message ? `Message: ${message}` : null,
      "",
      setupUrl ? `Set up your access: ${setupUrl}` : null,
      `Open shared documents: ${accessUrl}`,
    ]
      .filter(Boolean)
      .join("\n"),
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f6f6;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background-color:#1a1a1a;padding:28px 40px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">${BRAND_NAME}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1a1a1a;">${horseName} documents shared with you</h1>
            <p style="margin:0 0 8px;color:#555;font-size:15px;line-height:1.6;">Hi ${toName},</p>
            <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
              <strong>${senderName}</strong> from <strong>${barnName}</strong> shared secure EquiVault access for <strong>${horseName}</strong>.
            </p>
            <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
              Shared documents: <strong>${documentSummary}</strong>.
            </p>
            ${
              message
                ? `<p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;"><strong>Message:</strong> ${message}</p>`
                : ""
            }
            ${
              setupUrl
                ? `<a href="${setupUrl}" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;margin-right:12px;">
              Set Up Access
            </a>`
                : ""
            }
            <a href="${accessUrl}" style="display:inline-block;background-color:#1f2937;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
              View Shared Documents
            </a>
            <p style="margin:24px 0 0;color:#999;font-size:13px;line-height:1.5;">
              This link only opens the specific documents selected for ${horseName}.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
            <p style="margin:0;color:#bbb;font-size:12px;">&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}
