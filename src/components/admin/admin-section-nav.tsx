"use client";

import Link from "next/link";
import { BarChart3, Building2, CreditCard, KeyRound, QrCode, Users, VenetianMask } from "lucide-react";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const links = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/access", label: "Access", icon: KeyRound },
  { href: "/admin/barns", label: "Barns", icon: Building2 },
  { href: "/admin/horses", label: "Horses", icon: VenetianMask },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/equitags", label: "EquiTags", icon: QrCode },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminSectionNav() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen flex-col border-r border-[color:var(--border)] bg-[color:var(--background-elevated)]">
      <div className="border-b border-[color:var(--border)] px-6 py-6">
        <BrandLogo href="/admin" variant="adaptive" className="max-w-full" />
        <p className="mt-4 mono text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--foreground-soft)]">
          Internal Admin
        </p>
        <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
          Platform operations, moderation, billing controls, and analytics.
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-5">
        {links.map((link) => {
          const isActive = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 border border-transparent px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "border-[color:var(--border)] bg-[color:var(--accent)] text-[color:var(--accent-foreground)]"
                  : "text-[color:var(--foreground-soft)] hover:border-[color:var(--border)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground-strong)]"
              }`}
            >
              <Icon size={17} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[color:var(--border)] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <ThemeToggle surface="light" />
          <LogoutButton className="flex-1 justify-center" callbackUrl="/dashboard" />
        </div>
      </div>
    </aside>
  );
}
