"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AccessStatus =
  | "NONE"
  | "PENDING"
  | "APPROVED"
  | "DENIED"
  | "EXPIRED"
  | "REVOKED"
  | "ACTIVE";

type AvailableDocument = {
  id: string;
  title: string;
  category: string;
};

interface RequestAccessButtonProps {
  horseId: string;
  isLoggedIn: boolean;
  currentStatus: AccessStatus;
  availableDocuments: AvailableDocument[];
}

export default function RequestAccessButton({
  horseId,
  isLoggedIn,
  currentStatus,
  availableDocuments,
}: RequestAccessButtonProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(currentStatus === "PENDING");
  const [open, setOpen] = useState(currentStatus === "NONE");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [intendedUse, setIntendedUse] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const categories = useMemo(
    () => [...new Set(availableDocuments.map((document) => document.category))],
    [availableDocuments]
  );

  function toggleSelection(value: string, selected: string[], setter: (values: string[]) => void) {
    if (selected.includes(value)) {
      setter(selected.filter((item) => item !== value));
      return;
    }

    setter([...selected, value]);
  }

  async function requestAccess() {
    if (selectedCategories.length === 0 && selectedFiles.length === 0) {
      setError("Select at least one category or file.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`/api/horses/${horseId}/request-access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        categories: selectedCategories,
        fileIds: selectedFiles,
        message,
        intendedUse,
      }),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Unable to submit request.");
      return;
    }

    setSubmitted(true);
    setOpen(false);
  }

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="inline-flex w-full items-center justify-center rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
      >
        Log in to request documents
      </Link>
    );
  }

  if (currentStatus === "ACTIVE") {
    return (
      <Link
        href={`/horses/${horseId}/access`}
        className="inline-flex w-full items-center justify-center rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
      >
        View Shared Documents
      </Link>
    );
  }

  if (submitted || currentStatus === "PENDING") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Your document request is pending seller review.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(currentStatus === "DENIED" || currentStatus === "EXPIRED" || currentStatus === "REVOKED") ? (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
          Your previous access state was <span className="font-medium">{currentStatus.toLowerCase()}</span>.
          You can submit a new request below.
        </div>
      ) : null}

      <Button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex w-full items-center justify-center gap-2"
      >
        <ShieldCheck className="h-4 w-4" />
        {open ? "Hide Request Form" : "Request Document Access"}
      </Button>

      {open ? (
        <div className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <div>
            <p className="text-sm font-medium text-stone-900">Request by category</p>
            <div className="mt-3 space-y-2">
              {categories.length === 0 ? (
                <p className="text-sm text-stone-500">No document categories available yet.</p>
              ) : (
                categories.map((category) => (
                  <label key={category} className="flex items-center gap-3 text-sm text-stone-700">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() =>
                        toggleSelection(category, selectedCategories, setSelectedCategories)
                      }
                    />
                    <span>{category.replaceAll("_", " ")}</span>
                  </label>
                ))
              )}
            </div>
          </div>


          <div>
            <p className="mb-2 text-sm font-medium text-stone-900">Intended use</p>
            <Textarea
              value={intendedUse}
              onChange={(e) => setIntendedUse(e.target.value)}
              placeholder="Tell the seller what you need the documents for."
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-stone-900">Message</p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add any context for your request."
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button
            type="button"
            onClick={requestAccess}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Sending..." : "Submit Request"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
