"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SellerProfileFormData {
  id: string;
  displayName: string;
  slug: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  logo: string | null;
  headline: string | null;
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
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    const res = await fetch("/api/seller/settings", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Failed to update seller profile.");
      return;
    }

    router.refresh();
  }

  return (
    <Card className="rounded-3xl border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-2xl">Public Profile</CardTitle>
        <CardDescription>
          This information appears on your public seller page.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
            <div className="space-y-4">
              <Label>Seller logo</Label>

              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                <Image
                  src={seller.logo || "/img/default-horse.png"}
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
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={form.displayName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, displayName: e.target.value }))
                  }
                  required
                />
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

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
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
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}