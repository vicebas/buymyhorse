"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type DocumentOption = {
  id: string;
  title: string;
  category: string;
};

interface RequestActionButtonsProps {
  requestId: string;
  availableDocuments: DocumentOption[];
}

export default function RequestActionButtons({
  requestId,
  availableDocuments,
}: RequestActionButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

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
    <div className="space-y-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <div>
        <p className="text-sm font-medium text-stone-900">Share files</p>
        <div className="mt-3 space-y-2">
          {availableDocuments.length === 0 ? (
            <p className="text-sm text-stone-500">This horse has no vault files yet.</p>
          ) : (
            availableDocuments.map((document) => {
              return (
                <label key={document.id} className="flex items-start gap-3 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(document.id)}
                    onChange={() => toggleSelection(document.id, selectedFiles, setSelectedFiles)}
                    className="mt-1"
                  />
                  <span>
                    {document.title}
                    <span className="ml-2 text-stone-400">
                      {document.category.replaceAll("_", " ")}
                    </span>
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-stone-900">Expiration</p>
        <input
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-stone-900">Barn note</p>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note for the buyer."
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
