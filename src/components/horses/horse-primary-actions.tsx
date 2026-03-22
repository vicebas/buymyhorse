"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

import ContactSellerButton from "@/components/horses/contact-seller-button";
import RequestAccessButton from "@/components/horses/request-access-button";
import { Button } from "@/components/ui/button";

type AccessStatus =
  | "NONE"
  | "PENDING"
  | "APPROVED"
  | "DENIED"
  | "EXPIRED"
  | "REVOKED"
  | "ACTIVE";

export default function HorsePrimaryActions({
  horseId,
  horseName,
  sellerName,
  isLoggedIn,
  emailVerified,
  currentAccessStatus,
  accessHref,
  layout = "floating",
}: {
  horseId: string;
  horseName: string;
  sellerName: string;
  isLoggedIn: boolean;
  emailVerified: boolean;
  currentAccessStatus: AccessStatus;
  accessHref?: string;
  layout?: "floating" | "inline";
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || layout !== "floating") {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [layout, open]);

  if (layout === "inline") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <RequestAccessButton
          horseId={horseId}
          isLoggedIn={isLoggedIn}
          emailVerified={emailVerified}
          currentStatus={currentAccessStatus}
          accessHref={accessHref}
        />

        <ContactSellerButton
          horseId={horseId}
          horseName={horseName}
          sellerName={sellerName}
          isLoggedIn={isLoggedIn}
          emailVerified={emailVerified}
        />
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 mx-auto flex w-full max-w-6xl justify-end px-4 sm:bottom-6 sm:px-6 lg:hidden">
      <div ref={menuRef} className="pointer-events-auto flex flex-col items-end gap-3">
        <div
          id="horse-page-action-menu"
          aria-hidden={!open}
          className={`w-[min(calc(100vw-2rem),22rem)] rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--card)] p-3 shadow-[var(--shadow-hover)] backdrop-blur transition-all duration-200 sm:w-80 ${
            open
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          }`}
        >
          <div className="mb-2 px-2 pt-1">
            <p className="mono text-[10px] font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
              Quick Actions
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <RequestAccessButton
              horseId={horseId}
              isLoggedIn={isLoggedIn}
              emailVerified={emailVerified}
              currentStatus={currentAccessStatus}
              accessHref={accessHref}
              compact
              onAction={() => setOpen(false)}
              buttonLabel={getRequestLabel(currentAccessStatus)}
              activeLabel="View Shared Documents"
              buttonClassName="justify-start rounded-2xl px-4 py-3 text-sm font-semibold"
            />

            <ContactSellerButton
              horseId={horseId}
              horseName={horseName}
              sellerName={sellerName}
              isLoggedIn={isLoggedIn}
              emailVerified={emailVerified}
              onAction={() => setOpen(false)}
              className="justify-start rounded-2xl px-4 py-3 text-sm font-semibold"
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="horse-page-action-menu"
          aria-label={open ? "Close horse actions" : "Open horse actions"}
          className="btn-brand-green size-14 rounded-full border-0 shadow-[var(--shadow-hover)]"
        >
          {open ? <X className="size-5" /> : <Plus className="size-5" />}
        </Button>
      </div>
    </div>
  );
}

function getRequestLabel(currentAccessStatus: AccessStatus) {
  if (currentAccessStatus === "ACTIVE") {
    return "View Shared Documents";
  }

  if (currentAccessStatus === "PENDING") {
    return "Request Pending";
  }

  return "Request Document";
}
