import prisma from "@/lib/db/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { redirect } from "next/navigation"

export default async function HorsesPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    include: { horses: true },
  })

  if (!seller) redirect("/seller/onboard")

  return (
    <main style={{ padding: 40 }}>
      <h1>Your Horses</h1>

      <a href="/seller/horses/new">Add Horse</a>

      <ul>
        {seller.horses.map((horse) => (
          <li key={horse.id}>{horse.name}</li>
        ))}
      </ul>
    </main>
  )
}