import prisma from "@/lib/db/prisma"
import { NotificationType, Prisma } from "@/generated/prisma/client"

export type CreateNotificationData = {
  userId: string
  type: NotificationType
  title: string
  body?: string
  metadata?: Record<string, unknown>
}

export async function createNotification(data: CreateNotificationData) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      metadata: data.metadata as Prisma.InputJsonValue ?? undefined,
    },
  })
}

export async function listUserNotifications(
  userId: string,
  limit = 30
) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ])
  return { notifications, unreadCount }
}

export async function markNotificationsRead(
  userId: string,
  notificationIds: string[]
) {
  return prisma.notification.updateMany({
    where: { userId, id: { in: notificationIds } },
    data: { isRead: true },
  })
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } })
}

export async function getRecentNotificationOfType(
  userId: string,
  type: NotificationType,
  withinMs: number,
  metadataKey: string,
  metadataValue: string
) {
  const since = new Date(Date.now() - withinMs)
  const recent = await prisma.notification.findFirst({
    where: {
      userId,
      type,
      createdAt: { gte: since },
      metadata: {
        path: [metadataKey],
        equals: metadataValue,
      },
    },
    orderBy: { createdAt: "desc" },
  })
  return recent
}
