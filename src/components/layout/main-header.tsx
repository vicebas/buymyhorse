import { getServerSession } from "next-auth";
import Link from "next/link";
import { DollarSign, Home, LayoutGrid } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { authOptions } from "@/lib/auth/options";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

export default async function MainHeader({
  activeItem = "dashboard",
}: {
  activeItem?: "dashboard" | "marketplace" | "pricing";
}) {
  const session = await getServerSession(authOptions);
  const linkClasses =
    "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors";
  const activeClasses = "bg-[#0f2a44] text-[#f8f6f2]";
  const inactiveClasses =
    "text-[#4e6172] hover:bg-[#f0ebe2] hover:text-[#0f2a44]";

  return (
    <header className="w-full border-b border-[rgba(15,42,68,0.1)] bg-[color:var(--background-elevated)] shadow-[0_1px_0_rgba(15,42,68,0.04)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
        <BrandLogo href="/dashboard" priority variant="primary" />

        <nav className="hidden items-center gap-2 md:flex">
          <Link
            href="/dashboard"
            className={`${linkClasses} ${
              activeItem === "dashboard"
                ? activeClasses
                : inactiveClasses
            }`}
          >
            <Home size={16} />
            Dashboard
          </Link>

          <Link
            href="/marketplace"
            className={`${linkClasses} ${
              activeItem === "marketplace"
                ? activeClasses
                : inactiveClasses
            }`}
          >
            <LayoutGrid size={16} />
            Marketplace
          </Link>

          <Link
            href="/pricing"
            className={`${linkClasses} ${
              activeItem === "pricing"
                ? activeClasses
                : inactiveClasses
            }`}
          >
            <DollarSign size={16} />
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle surface="light" />
          {session ? (
            <LogoutButton
              className="border-[color:var(--border)] bg-[color:var(--background-elevated)] text-[#0f2a44] hover:bg-[#f0ebe2] hover:text-[#0f2a44]"
            />
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="border-[color:var(--border)] bg-[color:var(--background-elevated)] text-[#0f2a44] hover:bg-[#f0ebe2] hover:text-[#0f2a44]"
                >
                  Sign In
                </Button>
              </Link>

              <Link href="/register">
                <Button className="btn-brand-green border-0">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
