"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Home,
  LayoutGrid,
  MessageSquare,
  Warehouse,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

type AppHeaderVariant = "buyer" | "seller" | "admin";

interface AppHeaderProps {
  variant: AppHeaderVariant;
}

export default function AppHeader({ variant }: AppHeaderProps) {
  const pathname = usePathname();
  const isBuyer = variant === "buyer";
  const isSeller = variant === "seller";
  const activeItem = getActiveItem(variant, pathname);
  const linkClasses =
    "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors";
  const activeClasses = "bg-[color:var(--accent)] text-[color:var(--accent-foreground)]";
  const inactiveClasses =
    "text-[color:var(--foreground-soft)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground-strong)]";
  const headerClasses =
    "w-full border-b border-[color:var(--border)] bg-[color:var(--background-elevated)] shadow-[0_1px_0_rgba(15,42,68,0.04)]";
  const brandHref = variant === "admin" ? "/admin" : isSeller ? "/mybarn" : "/dashboard";

  return (
    <header className={headerClasses}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
        <BrandLogo href={brandHref} variant="adaptive" priority />

        <nav className="hidden items-center gap-2 md:flex">
          {isBuyer && (
            <>
              <Link
                href="/dashboard"
                className={`${linkClasses} ${
                  activeItem === "dashboard" ? activeClasses : inactiveClasses
                }`}
              >
                <Home size={16} />
                Dashboard
              </Link>

              <Link
                href="/marketplace"
                className={`${linkClasses} ${
                  activeItem === "marketplace" ? activeClasses : inactiveClasses
                }`}
              >
                <LayoutGrid size={16} />
                Marketplace
              </Link>

            </>
          )}

          {isSeller && (
            <>
              <Link
                href="/dashboard"
                className={`${linkClasses} ${
                  activeItem === "dashboard" ? activeClasses : inactiveClasses
                }`}
              >
                <Home size={16} />
                Dashboard
              </Link>

              <Link
                href="/mybarn"
                className={`${linkClasses} ${
                  activeItem === "mybarn" ? activeClasses : inactiveClasses
                }`}
              >
                <Warehouse size={16} />
                MyBarn
              </Link>

              <Link
                href="/marketplace"
                className={`${linkClasses} ${
                  activeItem === "marketplace" ? activeClasses : inactiveClasses
                }`}
              >
                <LayoutGrid size={16} />
                Marketplace
              </Link>

              <Link
                href="/mybarn/messages"
                className={`${linkClasses} ${
                  activeItem === "messages" ? activeClasses : inactiveClasses
                }`}
              >
                <MessageSquare size={16} />
                Messages
              </Link>

              <Link
                href="/mybarn/billing"
                className={`${linkClasses} ${
                  activeItem === "billing" ? activeClasses : inactiveClasses
                }`}
              >
                <CreditCard size={16} />
                Billing
              </Link>

              

            </>
          )}

        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle surface="light" />
          {isBuyer && (
            <>
              <Link href="/messages">
                <Button variant="outline" size="icon" aria-label="Messages">
                  <MessageSquare size={16} />
                </Button>
              </Link>

              <Link href="/mybarn/onboard">
                <Button className="btn-brand-green border-0">
                  Create Your Barn
                </Button>
              </Link>
            </>
          )}

          {isSeller && (
            <>
              <Link href="/mybarn/horses/new">
                <Button className="btn-brand-green border-0">
                  List Horse
                </Button>
              </Link>
              <Link href="/mybarn">
                <Button variant="outline">
                  My Barn
                </Button>
              </Link>
              <LogoutButton />
            </>
          )}

          {variant === "admin" && <LogoutButton />}

          {isBuyer && <LogoutButton />}
        </div>
      </div>
    </header>
  );
}

function getActiveItem(variant: AppHeaderVariant, pathname: string) {
  if (variant === "admin") {
    if (pathname === "/admin") return "admin-overview";
    if (pathname.startsWith("/admin/barns")) return "admin-barns";
    if (pathname.startsWith("/admin/horses")) return "admin-horses";
    if (pathname.startsWith("/admin/billing")) return "admin-billing";
    if (pathname.startsWith("/admin/users")) return "admin-users";
    return "admin-overview";
  }

  if (variant === "seller") {
    if (pathname === "/dashboard") return "dashboard";
    if (pathname.startsWith("/marketplace")) return "marketplace";
    if (pathname.startsWith("/mybarn/messages") || pathname.startsWith("/seller/messages")) return "messages";
    if (pathname.startsWith("/mybarn/requests") || pathname.startsWith("/seller/requests")) return "requests";
    if (pathname.startsWith("/mybarn/billing") || pathname.startsWith("/seller/billing")) return "billing";
    return "mybarn";
  }

  if (pathname.startsWith("/marketplace")) return "marketplace";
  return "dashboard";
}
