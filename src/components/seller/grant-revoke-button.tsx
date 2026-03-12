"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function GrantRevokeButton({ grantId }: { grantId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function revokeGrant() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/grants/${grantId}/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        note,
      }),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Unable to revoke grant.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Cancel Revoke" : "Revoke Access"}
      </Button>

      {open ? (
        <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note for the buyer."
          />

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button type="button" onClick={revokeGrant} disabled={loading}>
            {loading ? "Revoking..." : "Confirm Revoke"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
