"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export default function AdminHorseFeatureToggleForm({
  horseId,
  isFeatured,
}: {
  horseId: string;
  isFeatured: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle(featured: boolean) {
    setError("");
    setLoading(true);

    const response = await fetch(`/api/admin/horses/${horseId}/featured`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ featured }),
    });

    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(data?.error || "Unable to update featured status.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant={isFeatured ? "outline" : "default"}
        onClick={() => handleToggle(!isFeatured)}
        disabled={loading}
      >
        {loading ? "Saving..." : isFeatured ? "Remove Featured Pick" : "Mark Featured Pick"}
      </Button>

      {error ? <p className="text-xs text-[color:var(--destructive)]">{error}</p> : null}
    </div>
  );
}
