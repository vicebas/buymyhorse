import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, LayoutGrid, Tag, DollarSign } from "lucide-react"

export default function MainHeader({
  activeItem = "listings",
}: {
  activeItem?: "listings" | "marketplace" | "equitag" | "pricing"
}) {
  return (
    <header className="w-full border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center bg-black text-white font-serif text-lg">
            B
          </div>
          <span className="text-lg font-medium">BuyMyHorse</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${
              activeItem === "listings"
                ? "bg-black text-white"
                : "text-stone-600 hover:text-black"
            }`}
          >
            <Home size={16} />
            Listings
          </Link>

          <Link
            href="/marketplace"
            className={`flex items-center gap-2 text-sm ${
              activeItem === "marketplace"
                ? "rounded-md bg-black px-3 py-1.5 text-white"
                : "text-stone-600 hover:text-black"
            }`}
          >
            <LayoutGrid size={16} />
            Marketplace
          </Link>

          <Link
            href="/equitag"
            className={`flex items-center gap-2 text-sm ${
              activeItem === "equitag"
                ? "rounded-md bg-black px-3 py-1.5 text-white"
                : "text-stone-600 hover:text-black"
            }`}
          >
            <Tag size={16} />
            EquiTag
          </Link>

          <Link
            href="/pricing"
            className={`flex items-center gap-2 text-sm ${
              activeItem === "pricing"
                ? "rounded-md bg-black px-3 py-1.5 text-white"
                : "text-stone-600 hover:text-black"
            }`}
          >
            <DollarSign size={16} />
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>

          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
