"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DOCUMENT_CATEGORY_OPTIONS, type DocumentCategoryValue } from "@/lib/vault/document-categories";

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
  emailVerified?: boolean;
  currentStatus: AccessStatus;
  accessHref?: string;
  buttonClassName?: string;
  buttonLabel?: string;
  activeLabel?: string;
  compact?: boolean;
  onAction?: () => void;
}

export default function RequestAccessButton({
  horseId,
  isLoggedIn,
  emailVerified,
  currentStatus,
  accessHref,
  buttonClassName,
  buttonLabel = "Request Document",
  activeLabel = "View Shared Documents",
  compact = false,
  onAction,
}: RequestAccessButtonProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(currentStatus === "PENDING");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<DocumentCategoryValue[]>([]);
  const [intendedUse, setIntendedUse] = useState("");
  const [message, setMessage] = useState("");

  function toggleCategory(category: DocumentCategoryValue) {
    setSelectedCategories((currentCategories) =>
      currentCategories.includes(category)
        ? currentCategories.filter((currentCategory) => currentCategory !== category)
        : [...currentCategories, category]
    );
  }

  async function requestAccess() {
    if (selectedCategories.length === 0) {
      setError("Select at least one document category.");
      return;
    }

    if (!intendedUse.trim()) {
      setError("Tell the seller how you plan to use these records.");
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
        intendedUse,
        message,
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
    setSelectedCategories([]);
    setIntendedUse("");
    setMessage("");
  }

  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(`/horses/${horseId}`)}`}
        onClick={onAction}
        className={`inline-flex w-full items-center justify-center rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-[color:var(--accent-foreground)] ${
          buttonClassName ?? ""
        }`}
      >
        Log in to interact
      </Link>
    );
  }

  if (!emailVerified) {
    return (
      <div
        className={`inline-flex w-full items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300 ${
          buttonClassName ?? ""
        }`}
      >
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
        Verify your email to request documents.
      </div>
    );
  }

  if (currentStatus === "ACTIVE") {
    return (
      <Link
        href={accessHref || `/horses/${horseId}/access`}
        onClick={onAction}
        className={`inline-flex w-full items-center justify-center rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-[color:var(--accent-foreground)] ${
          buttonClassName ?? ""
        }`}
      >
        {activeLabel}
      </Link>
    );
  }

  if (submitted || currentStatus === "PENDING") {
    if (compact) {
      return (
        <Button
          type="button"
          disabled
          variant="outline"
          className={`inline-flex w-full items-center justify-center gap-2 ${buttonClassName ?? ""}`}
        >
          <ShieldCheck className="h-4 w-4" />
          Request Pending
        </Button>
      );
    }

    return (
      <div className="rounded-2xl border border-[rgba(45,84,56,0.18)] bg-[rgba(45,84,56,0.08)] px-4 py-3 text-sm text-[#2d5438]">
        Your document request is pending seller review.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!compact && (currentStatus === "DENIED" || currentStatus === "EXPIRED" || currentStatus === "REVOKED") ? (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--muted)] px-4 py-3 text-sm text-[color:var(--foreground)]">
          Your previous access state was <span className="font-medium">{currentStatus.toLowerCase()}</span>.
          You can send a new request below.
        </div>
      ) : null}

      <Button
        type="button"
        onClick={() => {
          onAction?.();
          setOpen(true);
        }}
        className={`inline-flex h-10 w-full items-center justify-center gap-2 btn-brand-green ${buttonClassName ?? ""}`}
      >
        <ShieldCheck className="h-4 w-4" />
        {buttonLabel}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-4 sm:py-8">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-hover)] sm:max-h-[calc(100dvh-4rem)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">Request Document Access</h2>
                <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
                  Select the record categories you want to review. Specific files stay private until the barn chooses what to share.
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
                <p className="mb-2 text-sm font-medium text-[color:var(--foreground-strong)]">Which categories do you want access to?</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {DOCUMENT_CATEGORY_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-start gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-3 text-sm text-[color:var(--foreground)]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(option.value)}
                        onChange={() => toggleCategory(option.value)}
                        className="mt-1"
                      />
                      <span className="font-medium text-[color:var(--foreground-strong)]">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-[color:var(--foreground-strong)]">Intended use</p>
                <Textarea
                  value={intendedUse}
                  onChange={(e) => setIntendedUse(e.target.value)}
                  placeholder="Explain why you need these records and how they will support your review."
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-[color:var(--foreground-strong)]">Message to the barn</p>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Optional note with any extra context for the seller."
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-[color:var(--destructive)]/30 bg-[color:var(--destructive)]/10 px-4 py-3 text-sm text-[color:var(--destructive)]">
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
