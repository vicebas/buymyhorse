import prisma from "@/lib/db/prisma"

export type NotificationPreferencesData = {
  systemNewHorseFromFollowedBarn: boolean
  systemHorseUpdatedFromFollowedBarn: boolean
  systemNewMessage: boolean
  emailNewHorseFromFollowedBarn: boolean
  emailHorseUpdatedFromFollowedBarn: boolean
  emailNewMessage: boolean
}

export async function getOrCreatePreferences(
  userId: string
): Promise<NotificationPreferencesData & { id: string; userId: string }> {
  const existing = await prisma.notificationPreferences.findUnique({
    where: { userId },
  })

  if (existing) return existing

  return prisma.notificationPreferences.create({
    data: { userId },
  })
}

export async function updatePreferences(
  userId: string,
  data: Partial<NotificationPreferencesData>
): Promise<NotificationPreferencesData & { id: string; userId: string }> {
  return prisma.notificationPreferences.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })
}
