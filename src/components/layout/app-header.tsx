import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Home,
  LayoutGrid,
  Tag,
  Inbox,
  MessageSquare,
  Warehouse,
} from "lucide-react";

type AppHeaderVariant = "buyer" | "seller" | "admin";

interface AppHeaderProps {
  variant: AppHeaderVariant;
}

export default function AppHeader({ variant }: AppHeaderProps) {
  const isBuyer = variant === "buyer";
  const isSeller = variant === "seller";

  return (
    <header className="w-full border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href={isSeller ? "/seller" : "/dashboard"} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center bg-black font-serif text-lg text-white">
            B
          </div>
          <span className="text-lg font-medium text-stone-900">BuyMyHorse</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {isBuyer && (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-md bg-black px-3 py-1.5 text-sm text-white"
              >
                <Home size={16} />
                Listings
              </Link>

              <Link
                href="/marketplace"
                className="flex items-center gap-2 text-sm text-stone-600 hover:text-black"
              >
                <LayoutGrid size={16} />
                Marketplace
              </Link>

              <Link
                href="/equitag"
                className="flex items-center gap-2 text-sm text-stone-600 hover:text-black"
              >
                <Tag size={16} />
                EquiTag
              </Link>
            </>
          )}

          {isSeller && (
            <>
              <Link
                href="/seller"
                className="flex items-center gap-2 rounded-md bg-black px-3 py-1.5 text-sm text-white"
              >
                <Warehouse size={16} />
                MyBarn
              </Link>

              <Link
                href="/marketplace"
                className="flex items-center gap-2 text-sm text-stone-600 hover:text-black"
              >
                <LayoutGrid size={16} />
                Marketplace
              </Link>

              <Link
                href="/seller/messages"
                className="flex items-center gap-2 text-sm text-stone-600 hover:text-black"
              >
                <MessageSquare size={16} />
                Messages
              </Link>

              <Link
                href="/seller/requests"
                className="flex items-center gap-2 text-sm text-stone-600 hover:text-black"
              >
                <Inbox size={16} />
                Doc Requests
              </Link>

              <Link
                href="/equitag"
                className="flex items-center gap-2 text-sm text-stone-600 hover:text-black"
              >
                <Tag size={16} />
                EquiTag
              </Link>
            </>
          )}

          {variant === "admin" && (
            <Link
              href="/admin"
              className="rounded-md bg-black px-3 py-1.5 text-sm text-white"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isBuyer && (
            <>
              <Link href="/messages">
                <Button variant="outline" size="icon" aria-label="Messages">
                  <MessageSquare size={16} />
                </Button>
              </Link>

              <Link href="/seller">
                <Button variant="outline">Become a Seller</Button>
              </Link>
            </>
          )}

          {isSeller && (
            <>
              <Link href="/seller/horses/new">
                <Button>List Horse</Button>
              </Link>
              <Link href="/seller">
                <Button variant="outline">My Barn</Button>
              </Link>
            </>
          )}

          {variant === "admin" && (
            <Link href="/admin">
              <Button>Admin Panel</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
