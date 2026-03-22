"use client";

import Link from "next/link";
import { DollarSign, Home, LayoutGrid, Menu, X } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { useHeaderMenu } from "@/hooks/use-header-menu";

export type MainHeaderActiveItem = "dashboard" | "marketplace" | "pricing";

const navItems: Array<{
  href: string;
  label: string;
  icon: typeof Home;
  key: MainHeaderActiveItem;
}> = [
  { href: "/dashboard", label: "Dashboard", icon: Home, key: "dashboard" },
  { href: "/marketplace", label: "Marketplace", icon: LayoutGrid, key: "marketplace" },
  { href: "/pricing", label: "Pricing", icon: DollarSign, key: "pricing" },
];

export default function MainHeaderClient({
  activeItem = "dashboard",
  hasSession,
}: {
  activeItem?: MainHeaderActiveItem;
  hasSession: boolean;
}) {
  const {
    close: closeMobileMenu,
    containerRef: mobileMenuRef,
    isOpen: isMobileMenuOpen,
    toggle: toggleMobileMenu,
  } = useHeaderMenu();
  const linkClasses =
    "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors";
  const activeClasses = "bg-[#0f2a44] text-[#f8f6f2]";
  const inactiveClasses =
    "text-[#4e6172] hover:bg-[#f0ebe2] hover:text-[#0f2a44]";

  return (
    <header className="w-full border-b border-[rgba(15,42,68,0.1)] bg-[color:var(--background-elevated)] shadow-[0_1px_0_rgba(15,42,68,0.04)]">
      <div className="mx-auto max-w-7xl px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo href="/dashboard" priority variant="adaptive" />

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${linkClasses} ${
                    activeItem === item.key ? activeClasses : inactiveClasses
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle surface="light" />

            <div className="hidden items-center gap-3 md:flex">
              {hasSession ? (
                <LogoutButton
                  className="border-[color:var(--border)] bg-[color:var(--background-elevated)] text-[#0f2a44] hover:bg-[#f0ebe2] hover:text-[#0f2a44]"
                />
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="border-[color:var(--border)] bg-[color:var(--background-elevated)] text-[color:var(--foreground-strong)] hover:bg-[#f0ebe2] hover:text-[#0f2a44]"
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

            <div className="relative md:hidden" ref={mobileMenuRef}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-controls="main-header-mobile-menu"
                aria-expanded={isMobileMenuOpen}
                onClick={toggleMobileMenu}
                className="border-[color:var(--border)] bg-[color:var(--background-elevated)] text-[color:var(--foreground-strong)]"
              >
                {isMobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </Button>

              {isMobileMenuOpen ? (
                <div
                  id="main-header-mobile-menu"
                  className="absolute right-0 top-full z-40 mt-3 w-[min(22rem,calc(100vw-3rem))] rounded-3xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-3 shadow-[var(--shadow-card)]"
                >
                  <nav className="flex flex-col gap-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeMobileMenu}
                          className={`${linkClasses} ${
                            activeItem === item.key ? activeClasses : inactiveClasses
                          }`}
                        >
                          <Icon size={16} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="mt-3 border-t border-[color:var(--border)] pt-3">
                    {hasSession ? (
                      <LogoutButton
                        className="w-full justify-start border-[color:var(--border)] bg-[color:var(--background-elevated)] text-[#0f2a44] hover:bg-[#f0ebe2] hover:text-[#0f2a44]"
                        onClick={closeMobileMenu}
                      />
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button asChild variant="outline" className="w-full justify-start">
                          <Link href="/login" onClick={closeMobileMenu}>
                            Sign In
                          </Link>
                        </Button>
                        <Button asChild className="btn-brand-green w-full justify-start border-0">
                          <Link href="/register" onClick={closeMobileMenu}>
                            Get Started
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
