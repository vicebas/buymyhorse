"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface PublishToggleButtonProps {
  horseId: string;
  isPublished: boolean;
}

export default function PublishToggleButton({
  horseId,
  isPublished,
}: PublishToggleButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
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

    setLoading(false);

    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      variant={isPublished ? "outline" : "default"}
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? "Saving..." : isPublished ? "Move to Draft" : "Publish"}
    </Button>
  );
}