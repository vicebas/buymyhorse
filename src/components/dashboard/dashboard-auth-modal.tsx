"use client";

import Link from "next/link";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardAuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to continue"
        className="w-full max-w-lg rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-6 shadow-[0_32px_80px_rgba(9,28,46,0.36)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--foreground-soft)]">
              HorseRoster Access
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-strong)]">
              Create an account to unlock the dashboard.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[color:var(--foreground-soft)]">
              Sign in to open horse profiles, reach sellers, and move from browsing to inquiry without losing your place.
            </p>
          </div>

          <Button type="button" variant="outline" size="icon" onClick={onClose} aria-label="Close prompt">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/login?callbackUrl=%2Fdashboard" className="block">
            <Button className="w-full">Sign In</Button>
          </Link>

          <Link href="/register?callbackUrl=%2Fdashboard" className="block">
            <Button variant="outline" className="w-full">
              Create Account
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-center text-sm font-medium text-[color:var(--foreground-soft)] transition hover:text-[color:var(--foreground-strong)]"
        >
          Continue browsing
        </button>
      </div>
    </div>
  );
}
