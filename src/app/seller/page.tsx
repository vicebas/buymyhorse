import prisma from "@/lib/db/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function SellerPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: {
      userId: session.user.id,
    },
  })

  if (!seller) {
    redirect("/seller/onboard")
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Seller Dashboard</h1>

      <p>Welcome {seller.displayName}</p>

      <div style={{ marginTop: 20 }}>
        <Link href="/seller/horses">
          <button>Manage Horses</button>
        </Link>
      </div>

      <div style={{ marginTop: 10 }}>
        <Link href="/seller/horses/new">
          <button>Add New Horse</button>
        </Link>
      </div>
    </main>
  )
}