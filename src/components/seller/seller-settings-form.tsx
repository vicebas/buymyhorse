"use client";

import AICopyGenerator from "@/components/ai/ai-copy-generator";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2, Star } from "lucide-react";

import { resolvePublicAssetUrl } from "@/lib/storage/public-assets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import NotificationPreferencesForm from "@/components/settings/notification-preferences-form";

interface SellerProfileFormData {
  id: string;
  displayName: string;
  slug: string;
  bio: string | null;
  phone: string | null;
  primaryNotificationEmail: string | null;
  location: string | null;
  website: string | null;
  logo: string | null;
  coverImage: string | null;
  headline: string | null;
  horses: Array<{
    id: string;
    name: string;
    image: string | null;
    isPublished: boolean;
    isBarnFeatured: boolean;
    barnDisplayOrder: number | null;
  }>;
}

export default function SellerSettingsForm({
  seller,
}: {
  seller: SellerProfileFormData;
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    displayName: seller.displayName || "",
    headline: seller.headline || "",
    location: seller.location || "",
    website: seller.website || "",
    bio: seller.bio || "",
    phone: seller.phone || "",
    primaryNotificationEmail: seller.primaryNotificationEmail || "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [featuredHorses, setFeaturedHorses] = useState(
    seller.horses.map((horse, index) => ({
      id: horse.id,
      name: horse.name,
      image: horse.image,
      isPublished: horse.isPublished,
      isBarnFeatured: horse.isBarnFeatured,
      barnDisplayOrder: horse.barnDisplayOrder ?? index,
    }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const publishedHorseCount = useMemo(
    () => featuredHorses.filter((horse) => horse.isPublished).length,
    [featuredHorses]
  );

  function getBarnBioContext() {
    return {
      displayName: form.displayName.trim(),
      headline: form.headline.trim(),
      location: form.location.trim(),
      website: form.website.trim(),
      bio: form.bio.trim(),
    };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData();
    formData.append("displayName", form.displayName);
    formData.append("headline", form.headline);
    formData.append("location", form.location);
    formData.append("website", form.website);
    formData.append("bio", form.bio);
    formData.append(
      "featuredHorses",
      JSON.stringify(
        featuredHorses.map((horse) => ({
          id: horse.id,
          isBarnFeatured: horse.isPublished ? horse.isBarnFeatured : false,
          barnDisplayOrder:
            horse.isPublished && horse.isBarnFeatured
              ? Number.isFinite(horse.barnDisplayOrder)
                ? horse.barnDisplayOrder
                : 0
              : null,
        }))
      )
    );

    formData.append("phone", form.phone);
    formData.append("primaryNotificationEmail", form.primaryNotificationEmail);

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    if (coverImageFile) {
      formData.append("coverImage", coverImageFile);
    }

    const res = await fetch("/api/seller/settings", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Failed to update barn profile.");
      return;
    }

    router.refresh();
  }

  return (
    <>
      <Card className="rounded-3xl border-[color:var(--border)] shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
          Barn Frontpage
        </CardTitle>
        <CardDescription>
          Control the public barn presentation, hero imagery, and which horses appear first on your barn frontpage.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
            <div className="space-y-4">
              <Label>Barn logo</Label>

              <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)]">
                <Image
                  src={resolvePublicAssetUrl(seller.logo) || "/img/default-horse.png"}
                  alt={seller.displayName}
                  width={300}
                  height={300}
                  className="h-52 w-full object-cover"
                />
              </div>

              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />

              <Label>Frontpage cover image</Label>

              <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)]">
                <Image
                  src={resolvePublicAssetUrl(seller.coverImage) || resolvePublicAssetUrl(seller.logo) || "/img/default-horse.png"}
                  alt={`${seller.displayName} cover`}
                  width={600}
                  height={360}
                  className="h-40 w-full object-cover"
                />
              </div>

              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="displayName">Barn name</Label>
                <Input
                  id="displayName"
                  value={form.displayName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, displayName: e.target.value }))
                  }
                  required
                />
                <p className="text-xs text-[color:var(--foreground-soft)]">
                  Public URL: /barn/{seller.slug}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  placeholder="Performance horses with strong sport foundations"
                  value={form.headline}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, headline: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={form.website}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, website: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryNotificationEmail">Primary notification email</Label>
                  <Input
                    id="primaryNotificationEmail"
                    type="email"
                    value={form.primaryNotificationEmail}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, primaryNotificationEmail: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Label htmlFor="bio">Barn story</Label>
                  <AICopyGenerator
                    entityType="barn"
                    targetField="bio"
                    scope="barn-settings"
                    mode="edit"
                    title="Generate barn story"
                    description="Review the English draft, then replace or append it to the barn story field."
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
                <Textarea
                  id="bio"
                  className="min-h-40"
                  value={form.bio}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-[color:var(--foreground-strong)]">
                  Featured Barn Roster
                </h3>
                <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
                  Choose which published horses should appear first on the public barn page and control their order.
                </p>
              </div>
              <div className="rounded-full bg-[color:var(--muted)] px-4 py-2 text-sm font-medium text-[color:var(--foreground-strong)]">
                {publishedHorseCount} published horse{publishedHorseCount === 1 ? "" : "s"}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {featuredHorses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[color:var(--border)] px-5 py-8 text-center text-sm text-[color:var(--foreground-soft)]">
                  Add horses in MyBarn before curating the public roster.
                </div>
              ) : (
                featuredHorses.map((horse, index) => (
                  <div
                    key={horse.id}
                    className="grid gap-4 rounded-2xl border border-[color:var(--border)] bg-card p-4 md:grid-cols-[80px_1fr_auto_auto]"
                  >
                    <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)]">
                      <Image
                        src={resolvePublicAssetUrl(horse.image) || "/img/default-horse.png"}
                        alt={horse.name}
                        width={160}
                        height={160}
                        className="h-20 w-20 object-cover"
                      />
                    </div>

                    <div>
                      <p className="text-base font-semibold text-[color:var(--foreground-strong)]">
                        {horse.name}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
                        {horse.isPublished
                          ? "Published and eligible for the public barn frontpage."
                          : "Draft horses cannot be featured on the public barn page."}
                      </p>
                    </div>

                    <label className="flex items-center gap-3 text-sm font-medium text-[color:var(--foreground-strong)]">
                      <input
                        type="checkbox"
                        checked={horse.isPublished ? horse.isBarnFeatured : false}
                        disabled={!horse.isPublished}
                        onChange={(event) =>
                          setFeaturedHorses((current) =>
                            current.map((entry) =>
                              entry.id === horse.id
                                ? {
                                    ...entry,
                                    isBarnFeatured: event.target.checked,
                                    barnDisplayOrder: event.target.checked
                                      ? entry.barnDisplayOrder ?? index
                                      : 0,
                                  }
                                : entry
                            )
                          )
                        }
                      />
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        Featured
                      </span>
                    </label>

                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-[0.16em] text-[color:var(--foreground-soft)]">
                        Order
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={horse.barnDisplayOrder ?? 0}
                        disabled={!horse.isPublished || !horse.isBarnFeatured}
                        onChange={(event) =>
                          setFeaturedHorses((current) =>
                            current.map((entry) =>
                              entry.id === horse.id
                                ? {
                                    ...entry,
                                    barnDisplayOrder: Number(event.target.value) || 0,
                                  }
                                : entry
                            )
                          )
                        }
                        className="w-24"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Barn Frontpage"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <Card className="rounded-3xl border-[color:var(--border)] shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which events trigger in-app and email notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <NotificationPreferencesForm />
      </CardContent>
    </Card>
    </>
  );
}
