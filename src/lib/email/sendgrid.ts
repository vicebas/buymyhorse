import sgMail from "@sendgrid/mail"

let initialized = false

export function getSendGridClient(): typeof sgMail {
  if (!initialized) {
    const apiKey = process.env.SENDGRID_API_KEY
    if (!apiKey) {
      throw new Error("SENDGRID_API_KEY is not set")
    }
    sgMail.setApiKey(apiKey)
    initialized = true
  }
  return sgMail
}

export function getSendGridFrom(): { email: string; name: string } {
  const email = process.env.SENDGRID_FROM_EMAIL
  if (!email) {
    throw new Error("SENDGRID_FROM_EMAIL is not set")
  }
  return {
    email,
    name: "HorseRoster",
  }
}
