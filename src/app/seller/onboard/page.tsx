"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Globe, Loader2, MapPin, Store, Text } from "lucide-react";

import AppHeader from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SellerOnboardPage() {
  const router = useRouter();

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.displayName.trim()) {
      setError("Display name is required.");
      return;
    }

    setSubmitting(true);

    const res = await fetch("/api/seller/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Failed to create seller profile.");
      return;
    }

    router.push("/seller");
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <AppHeader variant="seller" />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
            Seller onboarding
          </p>
          <h1 className="mt-2 font-serif text-4xl">Create your seller profile</h1>
          <p className="mt-3 max-w-2xl text-stone-600">
            Set up your public marketplace identity. This information will represent your stable, program, or business to buyers.
          </p>
        </div>

        <Card className="rounded-3xl border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Profile details</CardTitle>
            <CardDescription>
              Complete the essential details for your seller presence.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="displayName">Seller display name</Label>
                  <div className="relative">
                    <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      id="displayName"
                      placeholder="Blue Ridge Stables"
                      className="pl-10"
                      value={form.displayName}
                      onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                      required
                    />
                  </div>
                  <p className="text-xs text-stone-500">
                    Public URL preview: /sellers/{slugPreview || "your-seller-name"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      id="location"
                      placeholder="Lexington, Kentucky"
                      className="pl-10"
                      value={form.location}
                      onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      id="website"
                      placeholder="https://yourstable.com"
                      className="pl-10"
                      value={form.website}
                      onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <div className="relative">
                    <Text className="pointer-events-none absolute left-3 top-4 h-4 w-4 text-stone-400" />
                    <Textarea
                      id="bio"
                      placeholder="Tell buyers about your stable, specialties, disciplines, and what makes your program stand out."
                      className="min-h-36 pl-10"
                      value={form.bio}
                      onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-stone-200 pt-6 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-stone-500">
                  You can refine your public profile and branding later in seller settings.
                </p>

                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating profile...
                    </>
                  ) : (
                    "Create seller profile"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}