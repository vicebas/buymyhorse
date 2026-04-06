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

  async function handleToggle() {
    setLoading(true);

    await fetch(`/api/admin/errors/${errorId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: !isResolved }),
    });

    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant={isResolved ? "outline" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? "Saving..." : isResolved ? "Reopen" : "Resolve"}
    </Button>
  );
}
