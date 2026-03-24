"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SaveHorseButton({
  horseId,
  initialSaved,
  isLoggedIn,
  size = "card",
}: {
  horseId: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
  size?: "card" | "detail";
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    startTransition(async () => {
      const optimistic = !saved;
      setSaved(optimistic);

      try {
        const res = await fetch(`/api/horses/${horseId}/save`, { method: "POST" });
        if (!res.ok) {
          setSaved(!optimistic);
        } else {
          const data = (await res.json()) as { saved: boolean };
          setSaved(data.saved);
        }
      } catch {
        setSaved(!optimistic);
      }
    });
  }

  const isDetail = size === "detail";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={saved ? "Remove from favorites" : "Favorite horse"}
      className={
        isDetail
          ? `inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              saved
                ? "border-[color:var(--border)] bg-[rgba(220,38,38,0.08)] text-red-600 hover:bg-[rgba(220,38,38,0.14)]"
                : "border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--foreground)] hover:bg-[color:var(--muted)]"
            } disabled:opacity-50`
          : `inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--border)] transition-colors ${
              saved
                ? "bg-[rgba(220,38,38,0.1)] text-red-600 hover:bg-[rgba(220,38,38,0.18)]"
                : "bg-[color:var(--background-elevated)] text-[color:var(--foreground-soft)] hover:text-red-500"
            } disabled:opacity-50`
      }
    >
      <Heart
        size={isDetail ? 16 : 13}
        className={saved ? "fill-current" : ""}
      />
      {isDetail && (saved ? "Favorited" : "Favorite")}
    </button>
  );
}
