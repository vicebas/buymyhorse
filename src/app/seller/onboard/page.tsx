"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Globe, Loader2, MapPin, Store, Text, ArrowLeft, BadgeDollarSign } from "lucide-react";
import { useSession } from "next-auth/react";

import AICopyGenerator from "@/components/ai/ai-copy-generator";

import BarnPlanSelector, { type BillingPlanSelection } from "@/components/billing/barn-plan-selector";
import LiveAppHeader from "@/components/layout/live-app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BILLING_PLANS } from "@/lib/billing/catalog";

function getSelectedPlan(searchValue: string | null): BillingPlanSelection {
  switch (searchValue) {
    case "BARN_STARTER":
    case "BARN_GROWTH":
    case "BARN_UNLIMITED":
      return searchValue;
    default:
      return "SINGLE_HORSE";
  }
}

function getStep(searchValue: string | null) {
  return searchValue === "details" ? "details" : "plan";
}

function SellerOnboardPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const emailVerified = !session || session.user.emailVerified !== false;

  const selectedPlan = getSelectedPlan(searchParams.get("plan"));
  const step = getStep(searchParams.get("step"));

  const [form, setForm] = useState({
    displayName: "",
    location: "",
    website: "",
    bio: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const slugPreview = useMemo(() => {
    return form.displayName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }, [form.displayName]);

  function updateQuery(next: Partial<Record<"plan" | "step", string>>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(next).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function getBarnBioContext() {
    return {
      displayName: form.displayName.trim(),
      headline: "",
      location: form.location.trim(),
      website: form.website.trim(),
      bio: form.bio.trim(),
    };
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!form.displayName.trim()) {
      setError("Barn display name is required.");
      return;
    }

    setSubmitting(true);

    const res = await fetch("/api/seller/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        planKey: selectedPlan,
      }),
    });

    const data = await res.json().catch(() => null);
    setSubmitting(false);

    if (!res.ok) {
      setError(data?.error || "Failed to create barn profile.");
      return;
    }

    router.push(data?.redirectTo || "/mybarn");
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <LiveAppHeader variant="buyer" />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="mono text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--foreground-soft)]">
            Barn onboarding
          </p>
          <h1 className="mt-3 text-5xl font-extrabold text-[color:var(--foreground-strong)]">
            Create your barn
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-[color:var(--foreground-soft)]">
            Choose your launch plan first, then complete your barn profile. If a trial is currently enabled by admin, it starts after you submit. Otherwise you continue straight to checkout.
          </p>
        </div>

        {!emailVerified ? (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <span>
              You need to verify your email before creating a barn. Check your inbox or{" "}
              <ResendVerificationButton />
            </span>
          </div>
        ) : null}

        {step === "plan" ? (
          <div className="space-y-6">
            <Card className="rounded-[2rem] border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                  Choose your launch plan
                </CardTitle>
                <CardDescription className="text-[color:var(--foreground-soft)]">
                  Start with the plan that matches your roster now. You can still buy one-time additional horse profiles later.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <BarnPlanSelector
                  selectedPlan={selectedPlan}
                  onPlanChange={(plan) => updateQuery({ plan })}
                  actionLabel="Continue to barn details"
                  onAction={() => updateQuery({ step: "details" })}
                  disabled={!emailVerified}
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="rounded-[2rem] border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                  Barn details
                </CardTitle>
                <CardDescription className="text-[color:var(--foreground-soft)]">
                  Complete the essentials for your public barn profile and marketplace identity.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="displayName">Barn display name</Label>
                      <div className="relative">
                        <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground-soft)]" />
                        <Input
                          id="displayName"
                          placeholder="Stables"
                          className="pl-10"
                          value={form.displayName}
                          onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                          required
                        />
                      </div>
                      <p className="text-xs text-[color:var(--foreground-soft)]">
                        Public URL preview: /barn/{slugPreview || "your-barn-name"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground-soft)]" />
                        <Input
                          id="location"
                          placeholder="Wellington, FL"
                          className="pl-10"
                          value={form.location}
                          onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <div className="relative">
                        <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground-soft)]" />
                        <Input
                          id="website"
                          placeholder="https://yourbarn.com"
                          className="pl-10"
                          value={form.website}
                          onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Label htmlFor="bio">Barn story</Label>
                        <AICopyGenerator
                          entityType="barn"
                          targetField="bio"
                          scope="barn-onboarding"
                          mode="create"
                          title="Generate barn story"
                          description="Review the English draft, then Replace or Add it to the barn story field before creating your barn."
                          getContext={getBarnBioContext}
                          onReplace={(nextValue) =>
                            setForm((prev) => ({ ...prev, bio: nextValue.trim() }))
                          }
                          onAppend={(nextValue) =>
                            setForm((prev) => ({
                              ...prev,
                              bio: prev.bio.trim() ? `${prev.bio.trim()}\n\n${nextValue.trim()}` : nextValue.trim(),
                            }))
                          }
                        />
                      </div>
                      <div className="relative">
                        <Text className="pointer-events-none absolute left-3 top-4 h-4 w-4 text-[color:var(--foreground-soft)]" />
                        <Textarea
                          id="bio"
                          placeholder="Tell buyers about your program, specialties, and how you present horses."
                          className="min-h-40 pl-10"
                          value={form.bio}
                          onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-[color:var(--destructive)]/20 bg-[color:var(--destructive)]/10 px-4 py-3 text-sm text-[color:var(--destructive)]">
                      {error}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 border-t border-[color:var(--border)] pt-6 md:flex-row md:items-center md:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      className="md:w-auto"
                      onClick={() => updateQuery({ step: "plan" })}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to plans
                    </Button>

                    <Button type="submit" className="btn-brand-green border-0" disabled={submitting || !emailVerified}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating barn...
                        </>
                      ) : (
                        "Create barn and continue"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                  <BadgeDollarSign className="h-5 w-5 text-[color:var(--primary)]" />
                  Plan summary
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6 text-sm text-[color:var(--foreground-soft)]">
                <div className="rounded-2xl bg-[color:var(--background-elevated)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]">Selected plan</p>
                  <p className="mt-2 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                    {BILLING_PLANS[selectedPlan].priceLabel} {BILLING_PLANS[selectedPlan].intervalLabel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">
                    {BILLING_PLANS[selectedPlan].name}
                  </p>
                </div>

                <ul className="space-y-3 leading-6">
                  <li>
                    {BILLING_PLANS[selectedPlan].includedHorseSlots === null
                      ? "This plan includes unlimited active horse profiles."
                      : `This plan includes ${BILLING_PLANS[selectedPlan].includedHorseSlots} active horse profile${BILLING_PLANS[selectedPlan].includedHorseSlots === 1 ? "" : "s"}.`}
                  </li>
                  <li>Every horse gets its EquiTag automatically.</li>
                  <li>Additional horse profiles can be purchased later for $14.99 each.</li>
                  <li>Your account only becomes a barn after this form is submitted.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

function ResendVerificationButton() {
  const [sent, setSent] = useState(false);

  async function resend() {
    await fetch("/api/auth/send-verification", { method: "POST" });
    setSent(true);
  }

  return sent ? (
    <span className="font-semibold">verification email sent — check your inbox.</span>
  ) : (
    <button
      type="button"
      onClick={resend}
      className="font-semibold underline underline-offset-2 hover:text-amber-700"
    >
      resend the verification email
    </button>
  );
}

export default function SellerOnboardPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[color:var(--background)]" />}>
      <SellerOnboardPageContent />
    </Suspense>
  );
}
