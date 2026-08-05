"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export default function GrantExpirationButton({
  grantId,
  initialExpiresAt,
  disabled = false,
}: {
  grantId: string;
  initialExpiresAt: string | null;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expiresAt, setExpiresAt] = useState(() => toDateInputValue(initialExpiresAt));
  const buttonLabel = useMemo(
    () => (initialExpiresAt ? "Edit Expiration" : "Set Expiration"),
    [initialExpiresAt]
  );

  async function saveExpiration() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/grants/${grantId}/expires`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expiresAt: expiresAt || null,
      }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error || "Unable to update expiration.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" disabled={disabled} onClick={() => setOpen((value) => !value)}>
        {open ? "Cancel" : buttonLabel}
      </Button>

      {open ? (
        <div className="space-y-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-4">
          <Input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          {error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <Button type="button" onClick={saveExpiration} disabled={loading}>
            {loading ? "Saving..." : "Save Expiration"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
