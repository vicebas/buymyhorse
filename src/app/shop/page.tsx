import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CreditCard, Package, Sparkles, Tags } from "lucide-react";

import ResolvedAppHeader from "@/components/layout/resolved-app-header";
import ShopEquiTagOrderModal from "@/components/shop/shop-equitag-order-modal";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";
import { getUserAppHeaderVariant } from "@/lib/auth/get-user-app-header-variant";
import { formatMoneyUsd } from "@/lib/formatting";
import { getBillingSettings } from "@/lib/billing/settings";

const products: Array<{
  id: string;
  title: string;
  price: string;
  description: string;
  href: string;
  cta: string;
  icon: typeof Tags;
}> = [
  {
    id: "equitags",
    title: "EquiTags",
    price: formatMoneyUsd(14.99),
    description: "Printed QR access for horse profiles, barn pages, and in-person buyer handoff moments.",
    href: "/mybarn/equitag-orders",
    cta: "Order EquiTags",
    icon: Tags,
  },
  {
    id: "mybarn-upgrades",
    title: "MyBarn Upgrades",
    price: "Included + add-ons",
    description: "Keep your activation current, manage billing, and expand how many public horse profiles your barn can run.",
    href: "/mybarn/billing",
    cta: "Open Billing",
    icon: CreditCard,
  },
  {
    id: "additional-horse-profiles",
    title: "Additional Horse Profiles",
    price: formatMoneyUsd(14.99),
    description: "Add more active public horse profiles as your roster grows, without changing your activation cadence.",
    href: "/mybarn/billing",
    cta: "Buy Profiles",
    icon: Package,
  },
  {
    id: "starter-kits",
    title: "Starter Kits & Bundles",
    price: "Coming soon",
    description: "Placeholder bundle packaging for launch promotions, onboarding kits, and future bundled operational products.",
    href: "/shop",
    cta: "Check Back Soon",
    icon: Sparkles,
  },
];

export default async function ShopPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/shop");
  }

  const [sellerProfile, headerVariant, billingSettings] = await Promise.all([
    prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        horses: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
            attachedEquiTags: {
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
              select: {
                id: true,
                code: true,
                orders: {
                  where: {
                    status: {
                      notIn: ["DELIVERED", "CANCELLED"],
                    },
                  },
                  select: {
                    id: true,
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    }),
    getUserAppHeaderVariant(session.user.id),
    getBillingSettings(),
  ]);

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <ResolvedAppHeader variant={headerVariant} />

      <section className="border-b border-[color:var(--border)]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="mono text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--foreground-soft)]">
            HorseRoster Shop
          </p>
          <h1 className="mt-3 text-5xl font-extrabold text-[color:var(--foreground-strong)]">Shop</h1>
          <p className="mt-3 max-w-3xl text-lg text-[color:var(--foreground-soft)]">
            Access the premium operational products around HorseRoster: EquiTags, featured visibility, MyBarn upgrades, and additional horse profiles.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const Icon = product.icon;

            return (
              <article
                key={product.id}
                id={product.id}
                className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--muted)] text-[color:var(--foreground-strong)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-2xl font-extrabold text-[color:var(--foreground-strong)]">{product.title}</h2>
                <p className="mt-2 text-sm font-semibold text-[color:var(--foreground-soft)]">{product.price}</p>
                <p className="mt-4 text-sm leading-6 text-[color:var(--foreground-soft)]">{product.description}</p>
                <div className="mt-6">
                  {product.id === "equitags" && sellerProfile ? (
                    <ShopEquiTagOrderModal
                      horses={sellerProfile.horses.map((horse) => ({
                        id: horse.id,
                        name: horse.name,
                        equiTagId: horse.attachedEquiTags[0]?.id ?? null,
                        equiTagCode: horse.attachedEquiTags[0]?.code ?? null,
                        hasActiveOrder: Boolean(horse.attachedEquiTags[0]?.orders.length),
                      }))}
                      maxBatchQuantity={billingSettings.equitagMaxBatchQuantity}
                    />
                  ) : (
                    <Link href={product.href}>
                      <Button variant="outline">
                        {product.cta}
                      </Button>
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {sellerProfile ? null : (
          <div className="mt-8 rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
            <p className="text-sm text-[color:var(--foreground-soft)]">
              Some products route into MyBarn tools. Create MyBarn first to unlock seller billing, EquiTag orders, and horse-profile upgrades.
            </p>
            <div className="mt-4">
              <Link href="/mybarn/create">
                <Button className="btn-brand-green border-0">Create MyBarn</Button>
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
