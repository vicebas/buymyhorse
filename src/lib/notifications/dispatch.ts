import { NotificationType } from "@/generated/prisma/client"
import { getBarnFollowers } from "@/server/follows"
import { createNotification, getRecentNotificationOfType } from "@/server/notifications"
import { getOrCreatePreferences } from "@/server/notification-preferences"
import {
  sendNewHorseNotification,
  sendHorseUpdatedNotification,
  sendNewMessageNotification,
} from "@/lib/email/mailer"
import { getBillingSettings } from "@/lib/billing/settings"
import prisma from "@/lib/db/prisma"

export async function dispatchHorseNotification({
  type,
  sellerProfileId,
  horseId,
  horseName,
  barnName,
  barnSlug,
  changedFields,
}: {
  type: NotificationType
  sellerProfileId: string
  horseId: string
  horseName: string
  barnName: string
  barnSlug: string
  changedFields?: string[]
}): Promise<void> {
  let followers: Array<{ userId: string; email: string | null; name: string | null }>
  try {
    followers = await getBarnFollowers(sellerProfileId)
  } catch {
    return
  }

  const isNewHorse = type === NotificationType.NEW_HORSE_FROM_FOLLOWED_BARN

  const title = isNewHorse
    ? `New horse at ${barnName}: ${horseName}`
    : `${barnName} updated ${horseName}`

  const body = isNewHorse
    ? `${barnName} just listed a new horse for sale.`
    : `Updated fields: ${changedFields?.join(", ")}`

  const metadata: Record<string, unknown> = { horseId, barnSlug, type: type as string }

  await Promise.allSettled(
    followers.map(async (follower) => {
      try {
        const prefs = await getOrCreatePreferences(follower.userId)

        const systemPrefEnabled = isNewHorse
          ? prefs.systemNewHorseFromFollowedBarn
          : prefs.systemHorseUpdatedFromFollowedBarn

        if (systemPrefEnabled) {
          await createNotification({
            userId: follower.userId,
            type,
            title,
            body,
            metadata,
          })
        }

        const emailPrefEnabled = isNewHorse
          ? prefs.emailNewHorseFromFollowedBarn
          : prefs.emailHorseUpdatedFromFollowedBarn

        if (emailPrefEnabled && follower.email) {
          const toName = follower.name ?? follower.email
          if (isNewHorse) {
            await sendNewHorseNotification({
              toName,
              toEmail: follower.email,
              barnName,
              barnSlug,
              horseName,
              horseId,
            })
          } else {
            await sendHorseUpdatedNotification({
              toName,
              toEmail: follower.email,
              barnName,
              barnSlug,
              horseName,
              horseId,
              changedFields: changedFields ?? [],
            })
          }
        }
      } catch {
        // swallow per-follower errors — never break the main request
      }
    })
  )
}

export async function dispatchMessageNotification({
  conversationId,
  recipientUserId,
  recipientEmail,
  recipientName,
  senderName,
  horseName,
  horseId,
  isSellerRecipient,
}: {
  conversationId: string
  recipientUserId: string
  recipientEmail: string | null
  recipientName: string | null
  senderName: string
  horseName: string
  horseId: string
  isSellerRecipient: boolean
}): Promise<void> {
  try {
    const prefs = await getOrCreatePreferences(recipientUserId)

    const recent = await getRecentNotificationOfType(
      recipientUserId,
      NotificationType.NEW_MESSAGE,
      30 * 60 * 1000,
      "conversationId",
      conversationId
    )

    if (prefs.systemNewMessage) {
      await createNotification({
        userId: recipientUserId,
        type: NotificationType.NEW_MESSAGE,
        title: `New message about ${horseName}`,
        body: `${senderName} sent you a message.`,
        metadata: { conversationId, horseId },
      })
    }

    if (prefs.emailNewMessage && !recent && recipientEmail) {
      await sendNewMessageNotification({
        toName: recipientName ?? recipientEmail,
        toEmail: recipientEmail,
        horseName,
        horseId,
        senderName,
        conversationId,
        isSellerRecipient,
      })
    }
  } catch {
    // swallow all errors — never break the main request
  }
}

export async function dispatchEquiTagFulfillmentNotification({
  orderId,
  sellerProfileId,
  sellerDisplayName,
  horseId,
  horseName,
  equiTagCode,
  quantity,
}: {
  orderId: string
  sellerProfileId: string
  sellerDisplayName: string
  horseId: string | null
  horseName: string | null
  equiTagCode: string
  quantity: number
}) {
  try {
    const settings = await getBillingSettings()

    if (settings.equitagFulfillmentEmails.length === 0) {
      return
    }

    const configuredEmails = new Set(settings.equitagFulfillmentEmails.map((email) => email.toLowerCase()))
    const recipients = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "SUPER_ADMIN"],
        },
      },
      select: {
        id: true,
        email: true,
      },
    })
    const matchedRecipients = recipients.filter(
      (recipient) => recipient.email && configuredEmails.has(recipient.email.toLowerCase())
    )

    if (matchedRecipients.length === 0) {
      return
    }

    const title = `EquiTag fulfillment needed: ${equiTagCode}`
    const body = `${sellerDisplayName}${horseName ? ` · ${horseName}` : ""} · Qty ${quantity}`
    const metadata = {
      orderId,
      sellerProfileId,
      horseId,
      equiTagCode,
      quantity,
      href: "/admin/equitags",
    }

    await Promise.allSettled(
      matchedRecipients.map(async (recipient) => {
        const recent = await getRecentNotificationOfType(
          recipient.id,
          NotificationType.EQUITAG_FULFILLMENT_NEEDED,
          7 * 24 * 60 * 60 * 1000,
          "orderId",
          orderId
        )

        if (recent) {
          return
        }

        await createNotification({
          userId: recipient.id,
          type: NotificationType.EQUITAG_FULFILLMENT_NEEDED,
          title,
          body,
          metadata,
        })
      })
    )
  } catch {
    // swallow all errors — never break the main request
  }
}
