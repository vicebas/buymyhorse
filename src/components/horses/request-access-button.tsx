"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function RequestAccessButton({ horseId }: { horseId: string }) {
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  async function requestAccess() {
    setLoading(true);

    const res = await fetch(`/api/horses/${horseId}/request-access`, {
      method: "POST",
    });

    setLoading(false);

    if (res.ok) {
      setRequested(true);
    }
  }

  return (
    <Button
      type="button"
      onClick={requestAccess}
      disabled={loading || requested}
      className="inline-flex w-full items-center justify-center gap-2"
    >
      <ShieldCheck className="h-4 w-4" />
      {requested ? "Access Requested" : loading ? "Sending..." : "Request Access"}
    </Button>
  );
}