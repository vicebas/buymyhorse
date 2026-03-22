"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDocumentCategory } from "@/lib/vault/document-categories";

type DocumentOption = {
  id: string;
  title: string;
  category: string;
};

interface RequestActionButtonsProps {
  requestId: string;
  availableDocuments: DocumentOption[];
  requestedCategories: string[];
}

export default function RequestActionButtons({
  requestId,
  availableDocuments,
  requestedCategories,
}: RequestActionButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const eligibleDocuments =
    requestedCategories.length === 0
      ? availableDocuments
      : availableDocuments.filter((document) => requestedCategories.includes(document.category));

  function toggleSelection(
    value: string,
    selected: string[],
    setter: (values: string[]) => void
  ) {
    if (selected.includes(value)) {
      setter(selected.filter((item) => item !== value));
      return;
    }

    setter([...selected, value]);
  }

  async function handleApprove() {
    if (selectedFiles.length === 0) {
      setError("Select at least one file to share.");
      return;
    }

    setLoading("approve");
    setError("");

    const res = await fetch(`/api/requests/${requestId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileIds: selectedFiles,
        note,
        expiresAt: expiresAt || null,
      }),
    });

    const data = await res.json();

    setLoading(null);

    if (!res.ok) {
      setError(data.error || "Unable to approve request.");
      return;
    }

    router.refresh();
  }

  async function handleDeny() {
    setLoading("deny");
    setError("");

    const res = await fetch(`/api/requests/${requestId}/deny`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        note,
      }),
    });

    const data = await res.json();

    setLoading(null);

    if (!res.ok) {
      setError(data.error || "Unable to deny request.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-5 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-4">
      <div>
        <p className="text-sm font-medium text-[color:var(--foreground-strong)]">
          Share files from the requested categories
        </p>
        <div className="mt-3 space-y-2">
          {eligibleDocuments.length === 0 ? (
            <p className="text-sm text-[color:var(--foreground-soft)]">
              No vault files match the requested categories yet.
            </p>
          ) : (
            eligibleDocuments.map((document) => {
              return (
                <label
                  key={document.id}
                  className="flex items-start gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)]"
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(document.id)}
                    onChange={() => toggleSelection(document.id, selectedFiles, setSelectedFiles)}
                    className="mt-1 accent-[color:var(--accent)]"
                  />
                  <span>
                    {document.title}
                    <span className="ml-2 text-[color:var(--foreground-soft)]">
                      {formatDocumentCategory(document.category)}
                    </span>
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-[color:var(--foreground-strong)]">Expiration</p>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--foreground)] outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-[color:var(--foreground-strong)]">Barn note</p>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note for the buyer."
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleApprove}
          disabled={loading !== null}
        >
          {loading === "approve" ? "Approving..." : "Approve Access"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleDeny}
          disabled={loading !== null}
        >
          {loading === "deny" ? "Denying..." : "Deny Request"}
        </Button>
      </div>
    </div>
  );
}
