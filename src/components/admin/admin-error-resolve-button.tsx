"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export default function AdminErrorResolveButton({
  errorId,
  isResolved,
}: {
  errorId: string;
  isResolved: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/errors/${errorId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: !isResolved }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error || "Unable to update error status.");
        return;
      }

      router.refresh();
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant={isResolved ? "outline" : "default"}
        size="sm"
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? "Saving..." : isResolved ? "Reopen" : "Resolve"}
      </Button>
      {error ? (
        <p className="text-xs text-[color:var(--destructive)]">{error}</p>
      ) : null}
    </div>
  );
}
