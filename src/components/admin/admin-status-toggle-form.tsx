"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminStatusToggleForm({
  endpoint,
  isDisabled,
  reason,
  disableLabel,
  restoreLabel,
}: {
  endpoint: string;
  isDisabled: boolean;
  reason?: string | null;
  disableLabel: string;
  restoreLabel: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(reason || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(nextDisabled: boolean) {
    setError("");
    setLoading(true);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        disabled: nextDisabled,
        reason: value,
      }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error || "Unable to save admin status.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Admin reason"
      />

      <div className="flex flex-wrap gap-2">
        {isDisabled ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            {loading ? "Saving..." : restoreLabel}
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            onClick={() => handleSubmit(true)}
            disabled={loading}
          >
            {loading ? "Saving..." : disableLabel}
          </Button>
        )}
      </div>

      {error ? <p className="text-xs text-[color:var(--destructive)]">{error}</p> : null}
    </div>
  );
}
