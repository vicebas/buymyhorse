import { Check, Crown, ShieldCheck, Sparkles, Star } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import prisma from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/options";
import MainHeader from "@/components/layout/main-header";
import { Button } from "@/components/ui/button";

type Plan = {
  name: string;
  subtitle: string;
  price: string;
  cadence: string;
  features: string[];
  badge?: string;
  highlighted?: boolean;
};

const ownerPlans: Plan[] = [
  {
    name: "Single Horse",
    subtitle: "Present one quality sport horse professionally",
    price: "$19.99",
    cadence: "/month",
    features: [
      "1 active listing",
      "Full horse profile with media",
      "EquiVault document storage",
      "Direct buyer messaging",
      "Shareable QR code",
    ],
  },
  {
    name: "Single Horse Pro",
    subtitle: "Best value for individual sport horse sales",
    price: "$49.99",
    cadence: "/6 months",
    features: [
      "1 active listing",
      "Full horse profile with media",
      "EquiVault document storage",
      "Direct buyer messaging",
      "Shareable QR code",
      "Save $70 vs monthly",
    ],
    badge: "Most Popular",
    highlighted: true,
  },
];

const programPlans: Plan[] = [
  {
    name: "Trainer Program",
    subtitle: "For trainers with an active sales list",
    price: "$149",
    cadence: "/year",
    features: [
      "Up to 5 active listings",
      "Team member access",
      "Priority support",
      "Featured placement credits",
      "Buyer analytics dashboard",
    ],
  },
  {
    name: "Professional Program",
    subtitle: "For established hunter/jumper programs",
    price: "$349",
    cadence: "/year",
    features: [
      "Up to 15 active listings",
      "Unlimited team members",
      "Priority support",
      "Monthly featured placements",
      "Advanced analytics",
      "Custom barn branding",
    ],
    badge: "Best Value",
    highlighted: true,
  },
  {
    name: "Elite Program",
    subtitle: "For top-tier sport horse operations",
    price: "$599",
    cadence: "/year",
    features: [
      "Up to 30 active listings",
      "Unlimited team members",
      "Dedicated account manager",
      "Weekly featured placements",
      "White-label options",
      "API access",
    ],
  },
];

const addOns: Plan[] = [
  {
    name: "Featured Placement",
    subtitle: "Boost your horse to the top of search results",
    price: "$29.99",
    cadence: "per horse / week",
    features: [],
  },
  {
    name: "Premium EquiVault",
    subtitle: "Extended document storage with video support",
    price: "$9.99",
    cadence: "per month",
    features: [],
  },
  {
    name: "Verified Seller Badge",
    subtitle: "Stand out with identity verification",
    price: "$49.99",
    cadence: "one-time",
    features: [],
  },
];

function PricingCard({ plan, compact = false }: { plan: Plan; compact?: boolean }) {
  return (
    <article
      className={`relative rounded-none border p-6 ${
        plan.highlighted
          ? "border-black bg-white shadow-[0_0_0_1px_#111]"
          : "border-stone-300 bg-white"
      }`}
    >
      {plan.badge ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-black px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-white">
          {plan.badge}
        </div>
      ) : null}

      <h3 className="font-serif text-3xl text-stone-900">{plan.name}</h3>
      <p className="mt-2 text-sm text-stone-500">{plan.subtitle}</p>

      <div className="mt-8 flex items-end gap-1">
        <span className="font-serif text-5xl text-stone-950">{plan.price}</span>
        <span className="pb-1 text-stone-500">{plan.cadence}</span>
      </div>

      {plan.features.length > 0 ? (
        <ul className="mt-8 space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-stone-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-stone-900" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <Button
        type="button"
        disabled
        className={`mt-8 w-full ${compact ? "h-11" : "h-12"} ${
          plan.highlighted ? "" : "border border-stone-300 bg-white text-stone-900 hover:bg-white"
        }`}
      >
        Get Started
      </Button>
    </article>
  );
}

export default async function PricingPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    if (session.user.role === "ADMIN") {
      redirect("/admin");
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (sellerProfile) {
      redirect("/seller");
    }

    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-stone-900">
      <MainHeader activeItem="pricing" />

      <section className="border-b border-stone-300">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center md:py-28">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-stone-700">
            <Sparkles className="h-3.5 w-3.5" />
            Built for Trainer-Led Programs
          </div>

          <h1 className="mx-auto mt-8 max-w-4xl font-serif text-5xl leading-tight md:text-7xl">
            The Cleanest Way to Run a Sale
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-stone-600 md:text-xl">
            Professional infrastructure for American sport horse sales. No PDFs in
            group chats. No scattered WhatsApp threads. Just a polished, organized
            sales program.
          </p>
        </div>
      </section>

      <section className="border-b border-stone-300">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <h2 className="font-serif text-4xl text-stone-900">Owner &amp; Individual Seller</h2>
            <p className="mt-3 text-lg text-stone-500">
              Selling one quality sport horse? Present it professionally.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
            {ownerPlans.map((plan) => (
              <PricingCard key={plan.name} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-stone-300">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center">
            <h2 className="font-serif text-4xl text-stone-900">Trainer &amp; Program Plans</h2>
            <p className="mt-3 text-lg text-stone-500">
              Run your sales list like the professionals do. One link. One QR. Zero chaos.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {programPlans.map((plan) => (
              <PricingCard key={plan.name} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-stone-300">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <h2 className="font-serif text-4xl text-stone-900">Boost Your Listings</h2>
            <p className="mt-3 text-lg text-stone-500">
              Optional add-ons to maximize visibility
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {addOns.map((plan, index) => (
              <article key={plan.name} className="rounded-none border border-stone-300 bg-white p-6">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center bg-stone-300">
                  {index === 0 ? (
                    <Star className="h-5 w-5 text-stone-900" />
                  ) : index === 1 ? (
                    <Crown className="h-5 w-5 text-stone-900" />
                  ) : (
                    <ShieldCheck className="h-5 w-5 text-stone-900" />
                  )}
                </div>
                <h3 className="font-serif text-2xl text-stone-900">{plan.name}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">{plan.subtitle}</p>
                <div className="mt-8 flex items-end gap-1">
                  <span className="font-serif text-4xl text-amber-600">{plan.price}</span>
                  <span className="pb-1 text-stone-500">{plan.cadence}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="font-serif text-5xl text-stone-900 md:text-6xl">
            Ready to Run Sales the Right Way?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            Stop managing sales through group chats and email threads. Present your
            program like a professional and let buyers come to you with serious inquiries.
          </p>
          <div className="mt-10 flex justify-center">
            <Button type="button" disabled className="h-12 px-8">
              Start Your Program
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
