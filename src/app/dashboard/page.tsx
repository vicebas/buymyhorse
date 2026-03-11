import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth/session"

export default async function Dashboard() {
  const session = await getAuthSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {session.user?.email}</p>
    </div>
  )
}