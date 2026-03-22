"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function AdminGrantRevokeButton({
  grantId,
}: {
  grantId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRevoke() {
    setError("");
    setLoading(true);

    const response = await fetch(`/api/admin/grants/${grantId}/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: note,
      }),
    });

    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(data?.error || "Unable to revoke access.");
      return;
    }

    setOpen(false);
    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" onClick={() => setOpen((value) => !value)}>
        {open ? "Cancel Revoke" : "Revoke Grant"}
      </Button>

      {open ? (
        <div className="space-y-3 rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-4">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional admin reason"
          />

          {error ? <p className="text-xs text-[color:var(--destructive)]">{error}</p> : null}

          <Button type="button" variant="destructive" onClick={handleRevoke} disabled={loading}>
            {loading ? "Revoking..." : "Confirm Revoke"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
