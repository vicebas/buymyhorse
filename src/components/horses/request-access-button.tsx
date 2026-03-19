"use client";

import Link from "next/link";
import { useState } from "react";
import { ShieldCheck, X } from "lucide-react";

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

interface RequestAccessButtonProps {
  horseId: string;
  isLoggedIn: boolean;
  currentStatus: AccessStatus;
}

export default function RequestAccessButton({
  horseId,
  isLoggedIn,
  currentStatus,
}: RequestAccessButtonProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(currentStatus === "PENDING");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");

  async function requestAccess() {
    if (!description.trim()) {
      setError("Please describe the records you want to review.");
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
        description,
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
    setDescription("");
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
      {currentStatus === "DENIED" || currentStatus === "EXPIRED" || currentStatus === "REVOKED" ? (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
          Your previous access state was <span className="font-medium">{currentStatus.toLowerCase()}</span>.
          You can send a new request below.
        </div>
      ) : null}

      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2"
      >
        <ShieldCheck className="h-4 w-4" />
        Request Document Access
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8">
          <div className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl text-stone-900">Request Document Access</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Tell the seller what records you want reviewed. Specific files stay private until they choose what to share.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-stone-900">What records are you looking for?</p>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the documents or information you want to review and why."
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <Button type="button" onClick={requestAccess} disabled={loading} className="w-full">
                {loading ? "Sending..." : "Submit Request"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
