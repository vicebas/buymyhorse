"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface PublishToggleButtonProps {
  horseId: string;
  isPublished: boolean;
  disabled?: boolean;
}

export default function PublishToggleButton({
  horseId,
  isPublished,
  disabled = false,
}: PublishToggleButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle() {
    if (disabled) {
      return;
    }

    setError("");
    setLoading(true);

    const res = await fetch("/api/horses/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: horseId,
        isPublished: !isPublished,
      }),
    });

    const data = await res.json().catch(() => null);

    setLoading(false);

    if (res.ok) {
      router.refresh();
      return;
    }

    setError(data?.error || "Unable to update horse status.");
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={isPublished ? "outline" : "default"}
        onClick={handleToggle}
        disabled={loading || disabled}
      >
        {loading ? "Saving..." : isPublished ? "Set Inactive" : "Publish"}
      </Button>

      {error ? (
        <p className="max-w-xs text-xs text-[color:var(--destructive)]">{error}</p>
      ) : null}
    </div>
  );
}
