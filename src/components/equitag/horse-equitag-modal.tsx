"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { QrCode, X } from "lucide-react";

import { resolvePublicAssetUrl } from "@/lib/storage/public-assets";
import { Button } from "@/components/ui/button";

type HorseEquiTag = {
  id: string;
  code: string;
  svgPath: string;
};

export default function HorseEquiTagModal({
  equiTags,
}: {
  equiTags: HorseEquiTag[];
}) {
  const [open, setOpen] = useState(false);

  if (equiTags.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open EquiTag codes"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--background-elevated)] text-[color:var(--foreground-strong)] transition hover:bg-[color:var(--muted)]"
      >
        <QrCode className="h-4 w-4" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="EquiTag codes"
            className="w-full max-w-3xl rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-6 shadow-[0_32px_80px_rgba(9,28,46,0.36)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--foreground-soft)]">
                  EquiTag
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-strong)]">
                  Attached EquiTags
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--foreground-soft)]">
                  Scan any attached EquiTag to open this horse profile directly.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close EquiTag modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {equiTags.map((tag) => (
                <div
                  key={tag.id}
                  className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--card)] p-4"
                >
                  <div className="flex items-center justify-center rounded-[1.25rem] bg-white p-4">
                    <Image
                      src={resolvePublicAssetUrl(tag.svgPath) || "/img/default-horse.png"}
                      alt={`${tag.code} QR code`}
                      width={164}
                      height={164}
                      unoptimized
                      className="h-[164px] w-[164px]"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="mono text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground-strong)]">
                      {tag.code}
                    </span>

                    <Link
                      href={`/eq/${tag.code}`}
                      className="rounded-full border border-[color:var(--border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground-strong)]"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
