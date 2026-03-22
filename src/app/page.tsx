import prisma from "@/lib/db/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { redirect } from "next/navigation"
export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/dashboard")
  }


  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  })

  if (sellerProfile) {
    redirect("/mybarn")
  }

  redirect("/dashboard")
}
