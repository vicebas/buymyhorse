"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  BarChart3,
  Building2,
  ChevronDown,
  CreditCard,
  Heart,
  Home,
  KeyRound,
  LayoutGrid,
  Menu,
  MessageSquare,
  Plus,
  ShoppingBag,
  User,
  Users,
  VenetianMask,
  Warehouse,
  X,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { BrandLogo } from "@/components/layout/brand-logo";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { useHeaderMenu } from "@/hooks/use-header-menu";

export type AppHeaderVariant = "buyer" | "seller" | "admin";

export interface AppHeaderUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface AppHeaderCTA {
  label: string;
  action: string;
}

interface AppHeaderProps {
  variant: AppHeaderVariant;
  notifications?: {
    unreadMessageCount: number;
    pendingRequestCount: number;
  };
  user?: AppHeaderUser;
  primaryCta?: AppHeaderCTA | null;
  secondaryCta?: AppHeaderCTA | null;
}

type HeaderNavItem = {
  href: string;
  label: string;
  key: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  badgeCount?: number;
};

type HeaderActionItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  badgeCount?: number;
  buttonClassName?: string;
  variant?: "default" | "outline" | "ghost";
};

function formatBadgeCount(count: number) {
  return count > 99 ? "99+" : `${count}`;
}

function HeaderNotificationBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[color:var(--destructive)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
      {formatBadgeCount(count)}
    </span>
  );
}

function HeaderIconNotificationBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[color:var(--destructive)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
      {formatBadgeCount(count)}
    </span>
  );
}

function HeaderAvatar({ user }: { user?: AppHeaderUser }) {
  if (user?.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.image}
        alt={user.name || user.email || "User avatar"}
        className="size-8 rounded-full object-cover"
      />
    );
  }

  const initials = getUserInitials(user);

  if (initials) {
    return (
      <span className="flex size-8 items-center justify-center rounded-full bg-[color:var(--muted)] text-xs font-semibold uppercase text-[color:var(--foreground-strong)]">
        {initials}
      </span>
    );
  }

  return (
    <span className="flex size-8 items-center justify-center rounded-full bg-[color:var(--muted)] text-[color:var(--foreground-soft)]">
      <User className="size-4" />
    </span>
  );
}

export default function AppHeader({
  variant,
  notifications,
  user,
  primaryCta,
  secondaryCta,
}: AppHeaderProps) {
  const pathname = usePathname();
  const isBuyer = variant === "buyer";
  const isSeller = variant === "seller";
  const isAdmin = variant === "admin";
  const activeItem = getActiveItem(variant, pathname);
  const {
    close: closeMobileMenu,
    containerRef: mobileMenuRef,
    isOpen: isMobileMenuOpen,
    toggle: toggleMobileMenu,
  } = useHeaderMenu();
  const {
    close: closeSellerMenu,
    containerRef: sellerMenuRef,
    isOpen: isSellerMenuOpen,
    toggle: toggleSellerMenu,
  } = useHeaderMenu();
  const linkClasses =
    "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors";
  const activeClasses = "bg-[color:var(--accent)] text-[color:var(--accent-foreground)]";
  const inactiveClasses =
    "text-[color:var(--foreground-soft)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground-strong)]";
  const headerClasses =
    "w-full border-b border-[color:var(--border)] bg-[color:var(--background-elevated)] shadow-[0_1px_0_rgba(15,42,68,0.04)]";
  const brandHref = isAdmin ? "/admin" : isSeller ? "/mybarn" : "/dashboard";

  const navItems = getNavItems(variant, notifications);
  const mobileActionItems = getMobileActionItems({
    variant,
    notifications,
    primaryCta,
    secondaryCta,
  });

  function handleMobileMenuToggle() {
    closeSellerMenu();
    toggleMobileMenu();
  }

  function handleSellerMenuToggle() {
    closeMobileMenu();
    toggleSellerMenu();
  }

  return (
    <header className={headerClasses}>
      <div className="mx-auto max-w-7xl px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo href={brandHref} variant="adaptive" priority />

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
                  {item.badgeCount ? (
                    <HeaderNotificationBadge count={item.badgeCount} />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle surface="light" />

            {isBuyer ? (
              <div className="hidden items-center gap-3 md:flex">
                <NotificationBell userRole="buyer" />

                <Link href="/messages" className="relative">
                  <Button variant="outline" size="icon" aria-label="Messages">
                    <MessageSquare size={16} />
                  </Button>
                  <HeaderIconNotificationBadge
                    count={notifications?.unreadMessageCount || 0}
                  />
                </Link>

                {secondaryCta ? (
                  <Link href={secondaryCta.action}>
                    <Button variant="outline">{secondaryCta.label}</Button>
                  </Link>
                ) : null}

                {primaryCta ? (
                  <Link href={primaryCta.action}>
                    <Button className="btn-brand-green border-0">
                      {primaryCta.label}
                    </Button>
                  </Link>
                ) : null}

                <LogoutButton />
              </div>
            ) : null}

            {isSeller ? (
              <div className="hidden items-center gap-2 md:flex">
                <NotificationBell userRole="seller" />

                {secondaryCta ? (
                  <Link href={secondaryCta.action}>
                    <Button variant="outline">{secondaryCta.label}</Button>
                  </Link>
                ) : null}

                {primaryCta ? (
                  <Link href={primaryCta.action}>
                    <Button className="btn-brand-green border-0">{primaryCta.label}</Button>
                  </Link>
                ) : null}

                <div className="relative" ref={sellerMenuRef}>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 gap-2 rounded-full pl-1.5 pr-2"
                  aria-label="Open seller account menu"
                  aria-controls="seller-account-menu"
                  aria-expanded={isSellerMenuOpen}
                  onClick={handleSellerMenuToggle}
                >
                  <HeaderAvatar user={user} />
                  <span className="hidden text-sm font-medium text-[color:var(--foreground-strong)] sm:inline">
                    Account
                  </span>
                  <ChevronDown className="size-4 text-[color:var(--foreground-soft)]" />
                </Button>

                {isSellerMenuOpen ? (
                  <div
                    id="seller-account-menu"
                    className="absolute right-0 top-full z-50 mt-3 w-64 rounded-3xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-3 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-center gap-3 rounded-2xl bg-[color:var(--muted)] px-3 py-3">
                      <HeaderAvatar user={user} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[color:var(--foreground-strong)]">
                          {user?.name || "Barn account"}
                        </p>
                        <p className="truncate text-xs text-[color:var(--foreground-soft)]">
                          {user?.email || "Seller"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-1">
                      <Button asChild variant="ghost" className="w-full justify-start">
                        <Link href="/mybarn/horses/new" onClick={closeSellerMenu}>
                          <Plus size={16} />
                          List Horse
                        </Link>
                      </Button>

                      <Button asChild variant="ghost" className="w-full justify-start">
                        <Link href="/mybarn" onClick={closeSellerMenu}>
                          <Warehouse size={16} />
                          MyBarn
                        </Link>
                      </Button>

                      <LogoutButton
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={closeSellerMenu}
                      />
                    </div>
                  </div>
                ) : null}
                </div>
              </div>
            ) : null}

            {isAdmin ? (
              <div className="hidden md:block">
                <LogoutButton />
              </div>
            ) : null}

            <div className="relative md:hidden" ref={mobileMenuRef}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-controls="app-header-mobile-menu"
                aria-expanded={isMobileMenuOpen}
                onClick={handleMobileMenuToggle}
              >
                {isMobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </Button>

              {isMobileMenuOpen ? (
                <div
                  id="app-header-mobile-menu"
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
                          {item.badgeCount ? (
                            <HeaderNotificationBadge count={item.badgeCount} />
                          ) : null}
                        </Link>
                      );
                    })}
                  </nav>

                  {mobileActionItems.length > 0 ? (
                    <div className="mt-3 border-t border-[color:var(--border)] pt-3">
                      <div className="flex flex-col gap-2">
                        {mobileActionItems.map((item) => {
                          const Icon = item.icon;

                          return (
                            <Button
                              key={item.href}
                              asChild
                              variant={item.variant ?? "outline"}
                              className={item.buttonClassName ?? "w-full justify-start"}
                            >
                              <Link href={item.href} onClick={closeMobileMenu}>
                                <Icon size={16} />
                                {item.label}
                                {item.badgeCount ? (
                                  <HeaderNotificationBadge count={item.badgeCount} />
                                ) : null}
                              </Link>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {(isBuyer || isAdmin) ? (
                    <div className="mt-3 border-t border-[color:var(--border)] pt-3">
                      <LogoutButton
                        className="w-full justify-start"
                        onClick={closeMobileMenu}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function getNavItems(
  variant: AppHeaderVariant,
  notifications?: AppHeaderProps["notifications"]
): HeaderNavItem[] {
  if (variant === "seller") {
    return [
      { href: "/dashboard", label: "Dashboard", key: "dashboard", icon: Home },
      {
        href: "/mybarn",
        label: "MyBarn",
        key: "mybarn",
        icon: Warehouse,
        badgeCount: notifications?.pendingRequestCount || 0,
      },
      { href: "/marketplace", label: "Marketplace", key: "marketplace", icon: LayoutGrid },
      { href: "/shop", label: "Shop", key: "shop", icon: ShoppingBag },
      {
        href: "/mybarn/messages",
        label: "Messages",
        key: "messages",
        icon: MessageSquare,
        badgeCount: notifications?.unreadMessageCount || 0,
      },
      { href: "/mybarn/billing", label: "Billing", key: "billing", icon: CreditCard },
    ];
  }

  if (variant === "admin") {
    return [
      { href: "/admin", label: "Overview", key: "admin-overview", icon: BarChart3 },
      { href: "/admin/access", label: "Access", key: "admin-access", icon: KeyRound },
      { href: "/admin/barns", label: "Barns", key: "admin-barns", icon: Building2 },
      { href: "/admin/horses", label: "Horses", key: "admin-horses", icon: VenetianMask },
      { href: "/admin/billing", label: "Billing", key: "admin-billing", icon: CreditCard },
      { href: "/admin/users", label: "Users", key: "admin-users", icon: Users },
    ];
  }

  return [
    { href: "/dashboard", label: "Dashboard", key: "dashboard", icon: Home },
    { href: "/marketplace", label: "Marketplace", key: "marketplace", icon: LayoutGrid },
    { href: "/shop", label: "Shop", key: "shop", icon: ShoppingBag },
    { href: "/buyer/saved", label: "Favorites", key: "saved", icon: Heart },
  ];
}

function getMobileActionItems({
  variant,
  notifications,
  primaryCta,
  secondaryCta,
}: {
  variant: AppHeaderVariant;
  notifications?: AppHeaderProps["notifications"];
  primaryCta?: AppHeaderCTA | null;
  secondaryCta?: AppHeaderCTA | null;
}): HeaderActionItem[] {
  const items: HeaderActionItem[] = [];

  if (variant === "buyer" || variant === "seller") {
    items.push({
      href: variant === "seller" ? "/mybarn/messages" : "/messages",
      label: "Messages",
      icon: MessageSquare,
      badgeCount: notifications?.unreadMessageCount || 0,
    });
  }

  if (secondaryCta) {
    items.push({
      href: secondaryCta.action,
      label: secondaryCta.label,
      icon: Plus,
      variant: "outline",
    });
  }

  if (primaryCta) {
    items.push({
      href: primaryCta.action,
      label: primaryCta.label,
      icon: primaryCta.label === "Buy EquiTags" ? ShoppingBag : Plus,
      buttonClassName: "btn-brand-green w-full justify-start border-0",
      variant: "default",
    });
  }

  return items;
}

function getUserInitials(user?: AppHeaderUser) {
  const source = user?.name?.trim() || user?.email?.split("@")[0]?.trim() || "";

  if (!source) {
    return "";
  }

  const segments = source.split(/[\s._-]+/).filter(Boolean);

  if (segments.length === 0) {
    return "";
  }

  return segments
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() || "")
    .join("");
}

function getActiveItem(variant: AppHeaderVariant, pathname: string) {
  if (variant === "admin") {
    if (pathname === "/admin") return "admin-overview";
    if (pathname.startsWith("/admin/access")) return "admin-access";
    if (pathname.startsWith("/admin/barns")) return "admin-barns";
    if (pathname.startsWith("/admin/horses")) return "admin-horses";
    if (pathname.startsWith("/admin/billing")) return "admin-billing";
    if (pathname.startsWith("/admin/users")) return "admin-users";
    return "admin-overview";
  }

  if (variant === "seller") {
    if (pathname === "/dashboard") return "dashboard";
    if (pathname.startsWith("/marketplace")) return "marketplace";
    if (pathname.startsWith("/shop")) return "shop";
    if (pathname.startsWith("/mybarn/messages") || pathname.startsWith("/seller/messages")) return "messages";
    if (pathname.startsWith("/mybarn/requests") || pathname.startsWith("/seller/requests")) return "requests";
    if (pathname.startsWith("/mybarn/billing") || pathname.startsWith("/seller/billing")) return "billing";
    return "mybarn";
  }

  if (pathname.startsWith("/shop")) return "shop";
  if (pathname.startsWith("/marketplace")) return "marketplace";
  return "dashboard";
}
