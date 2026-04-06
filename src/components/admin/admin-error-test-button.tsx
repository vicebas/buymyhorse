"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export default function AdminErrorTestButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleCreate() {
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/errors/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() || undefined }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setResult({ ok: false, text: data?.error || "Failed to create test error." });
        return;
      }

      setResult({ ok: true, text: "Test error created. Refresh the list to see it." });
      setMessage("");
      router.refresh();
    } catch {
      setResult({ ok: false, text: "Request failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Optional custom error message"
        className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm sm:max-w-xs"
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleCreate}
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Test Error"}
      </Button>
      {result ? (
        <p
          className={`text-sm ${
            result.ok
              ? "text-[color:var(--foreground-soft)]"
              : "text-[color:var(--destructive)]"
          }`}
        >
          {result.text}
        </p>
      ) : null}
    </div>
  );
}
