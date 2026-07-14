import { getSendGridClient, getSendGridFrom } from "./sendgrid"
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
  newHorseFromBarnTemplate,
  horseUpdatedTemplate,
  newMessageTemplate,
  directVaultShareTemplate,
} from "./templates"

export async function sendVerificationEmail(params: {
  toName: string
  toEmail: string
  token: string
}): Promise<void> {
  const sg = getSendGridClient()
  const from = getSendGridFrom()
  const template = verificationEmailTemplate(params)

  await sg.send({
    from,
    to: template.to,
    subject: template.subject,
    text: template.text,
    html: template.html,
  })
}

export async function sendPasswordResetEmail(params: {
  toName: string
  toEmail: string
  token: string
}): Promise<void> {
  const sg = getSendGridClient()
  const from = getSendGridFrom()
  const template = passwordResetEmailTemplate(params)

  await sg.send({
    from,
    to: template.to,
    subject: template.subject,
    text: template.text,
    html: template.html,
  })
}

export async function sendNewHorseNotification(params: {
  toName: string
  toEmail: string
  barnName: string
  barnSlug: string
  horseName: string
  horseId: string
}): Promise<void> {
  const sg = getSendGridClient()
  const from = getSendGridFrom()
  const template = newHorseFromBarnTemplate(params)
  await sg.send({ from, to: template.to, subject: template.subject, text: template.text, html: template.html })
}

export async function sendHorseUpdatedNotification(params: {
  toName: string
  toEmail: string
  barnName: string
  barnSlug: string
  horseName: string
  horseId: string
  changedFields: string[]
}): Promise<void> {
  const sg = getSendGridClient()
  const from = getSendGridFrom()
  const template = horseUpdatedTemplate(params)
  await sg.send({ from, to: template.to, subject: template.subject, text: template.text, html: template.html })
}

export async function sendNewMessageNotification(params: {
  toName: string
  toEmail: string
  horseName: string
  horseId: string
  senderName: string
  conversationId: string
  isSellerRecipient: boolean
}): Promise<void> {
  const sg = getSendGridClient()
  const from = getSendGridFrom()
  const template = newMessageTemplate(params)
  await sg.send({ from, to: template.to, subject: template.subject, text: template.text, html: template.html })
}

export async function sendDirectVaultShareEmail(params: {
  toName: string
  toEmail: string
  horseName: string
  barnName: string
  senderName: string
  accessUrl: string
  setupUrl?: string | null
  message?: string | null
  documentTitles: string[]
}): Promise<void> {
  const sg = getSendGridClient()
  const from = getSendGridFrom()
  const template = directVaultShareTemplate(params)

  await sg.send({ from, to: template.to, subject: template.subject, text: template.text, html: template.html })
}
