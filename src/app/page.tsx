import prisma from "@/lib/db/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session?.user?.id) {
    if (session.user.role === "ADMIN") {
      redirect("/admin")
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
      redirect("/seller")
    }

    redirect("/dashboard")
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 md:px-8">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
            BuyMyHorse
          </p>

          <h1 className="font-serif text-5xl leading-tight md:text-7xl">
            A premium marketplace for exceptional horses
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            Connect trusted sellers and serious buyers through elegant listings,
            secure document access, and a streamlined experience built for the
            equestrian world.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              Create account
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}