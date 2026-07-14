"use client";

import { useState } from "react";
import { FolderLock, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function EquiVaultGuardModal({
  onboardingHref,
  triggerLabel = "Open HorseVault",
  triggerClassName,
  defaultOpen = false,
  showStandaloneCard = false,
}: {
  onboardingHref: string;
  triggerLabel?: string;
  triggerClassName?: string;
  defaultOpen?: boolean;
  showStandaloneCard?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);

  function handleCreateBarn() {
    router.push(onboardingHref);
  }

  return (
    <>
      {!defaultOpen ? (
        <Button type="button" variant="outline" className={triggerClassName} onClick={() => setOpen(true)}>
          <FolderLock className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      ) : null}

      {showStandaloneCard ? (
        <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-8 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--background-elevated)] text-[color:var(--primary)]">
            <FolderLock className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-[color:var(--foreground-strong)]">
            Create Your Barn First
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--foreground-soft)] mx-auto">
            HorseVault is organized inside your Barn so every horse&apos;s documents stay connected.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button type="button" className="btn-brand-green border-0" onClick={handleCreateBarn}>
              Create My Barn
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
              Learn More
            </Button>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Create Your Barn First"
            className="w-full max-w-xl rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-6 shadow-[0_32px_80px_rgba(9,28,46,0.36)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--foreground-soft)]">
                  HorseVault
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-strong)]">
                  Create Your Barn First
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-[color:var(--foreground-soft)]">
                  HorseVault is organized inside your Barn so every horse&apos;s documents stay connected.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close HorseVault guard modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button type="button" className="btn-brand-green border-0" onClick={handleCreateBarn}>
                Create My Barn
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
