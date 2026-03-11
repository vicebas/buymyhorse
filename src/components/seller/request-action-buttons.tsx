"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function RequestActionButtons({
  requestId,
}: {
  requestId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null);

  async function handleAction(action: "approve" | "deny") {
    setLoading(action);

    const res = await fetch(`/api/requests/${requestId}/${action}`, {
      method: "POST",
    });

    setLoading(null);

    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
      >
        {loading === "approve" ? "Approving..." : "Approve"}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => handleAction("deny")}
        disabled={loading !== null}
      >
        {loading === "deny" ? "Denying..." : "Deny"}
      </Button>
    </div>
  );
}