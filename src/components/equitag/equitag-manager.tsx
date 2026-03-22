"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, Link2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resolvePublicAssetUrl } from "@/lib/storage/public-assets";

type EquiTagItem = {
  id: string;
  code: string;
  svgPath: string;
  createdAt: string;
  attachedEntityType: "BARN" | "HORSE" | null;
  attachedBarnId: string | null;
  attachedHorseId: string | null;
  attachedBarn: { displayName: string } | null;
  attachedHorse: { name: string } | null;
};

type HorseOption = {
  id: string;
  name: string;
};

export default function EquiTagManager({
  barnId,
  barnName,
  equiTags,
  horses,
  ownedEquiTagCount,
  equiTagLimit,
  canCreateEquiTag,
}: {
  barnId: string;
  barnName: string;
  equiTags: EquiTagItem[];
  horses: HorseOption[];
  ownedEquiTagCount: number;
  equiTagLimit: number;
  canCreateEquiTag: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingCreate, setPendingCreate] = useState(false);
  const [error, setError] = useState("");
  const [selectionById, setSelectionById] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      equiTags.map((tag) => [
        tag.id,
        tag.attachedEntityType === "BARN"
          ? `barn:${barnId}`
          : tag.attachedEntityType === "HORSE" && tag.attachedHorseId
            ? `horse:${tag.attachedHorseId}`
            : "",
      ])
    )
  );

  const sortedHorses = useMemo(
    () => [...horses].sort((a, b) => a.name.localeCompare(b.name)),
    [horses]
  );

  async function handleCreate() {
    setError("");
    setPendingCreate(true);

    const res = await fetch("/api/equitag", {
      method: "POST",
    });

    const data = await res.json().catch(() => null);

    setPendingCreate(false);

    if (!res.ok) {
      setError(data?.error || "Unable to create an EquiTag right now.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  async function handleAttach(tagId: string) {
    const value = selectionById[tagId] || "";
    let body: { targetType?: "BARN" | "HORSE"; barnId?: string; horseId?: string } = {};

    if (value.startsWith("barn:")) {
      body = {
        targetType: "BARN",
        barnId,
      };
    } else if (value.startsWith("horse:")) {
      body = {
        targetType: "HORSE",
        horseId: value.replace("horse:", ""),
      };
    }

    const res = await fetch(`/api/equitag/${tagId}/attach`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mono text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
            EquiTag Manager
          </p>
          <h1 className="mt-2 text-4xl font-extrabold text-[color:var(--foreground-strong)]">
            Manage your EquiTags
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--foreground-soft)]">
            Create permanent EquiTags for {barnName}, then attach each one to your barn or any horse in your roster.
          </p>
          <p className="mt-3 text-sm font-medium text-[color:var(--foreground-strong)]">
            Usage: {ownedEquiTagCount}/{equiTagLimit} owned EquiTags
          </p>
        </div>

        <Button
          type="button"
          className="btn-brand-green border-0"
          disabled={pendingCreate || isPending || !canCreateEquiTag}
          onClick={handleCreate}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create EquiTag
        </Button>
      </div>

      {!canCreateEquiTag ? (
        <div className="rounded-[2rem] border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/10 p-5 text-sm text-[color:var(--foreground)] shadow-[var(--shadow-card)]">
          You have reached your current EquiTag limit. Upgrade your plan in{" "}
          <a href="/mybarn/billing" className="font-semibold text-[color:var(--foreground-strong)] underline underline-offset-4">
            billing
          </a>{" "}
          to create more tags.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[2rem] border border-[color:var(--destructive)]/20 bg-[color:var(--destructive)]/10 px-4 py-3 text-sm text-[color:var(--destructive)]">
          {error}
        </div>
      ) : null}

      {equiTags.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[color:var(--border)] bg-[color:var(--card)] p-10 text-center shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
            No EquiTags yet
          </h2>
          <p className="mt-3 text-sm text-[color:var(--foreground-soft)]">
            Create your first EquiTag to start attaching QR links to your barn or horses.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {equiTags.map((tag) => (
            <article
              key={tag.id}
              className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex h-[180px] w-[180px] shrink-0 items-center justify-center rounded-[1.5rem] bg-[color:var(--background-elevated)] p-4">
                  <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white p-3">
                    <Image
                      src={resolvePublicAssetUrl(tag.svgPath) || "/img/default-horse.png"}
                      alt={`${tag.code} QR code`}
                      width={140}
                      height={140}
                      unoptimized
                      className="h-[140px] w-[140px]"
                    />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(45,84,56,0.12)] px-4 py-2 text-sm font-semibold text-[#2d5438]">
                      <Link2 className="h-4 w-4" />
                      {tag.code}
                    </span>
                    <span className="text-xs text-[color:var(--foreground-soft)]">
                      Created {new Date(tag.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="mt-4 text-sm font-medium text-[color:var(--foreground-strong)]">
                    {tag.attachedEntityType === "BARN" && tag.attachedBarn
                      ? `Attached to barn: ${tag.attachedBarn.displayName}`
                      : tag.attachedEntityType === "HORSE" && tag.attachedHorse
                        ? `Attached to horse: ${tag.attachedHorse.name}`
                        : "Unassigned"}
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <select
                      value={selectionById[tag.id] || ""}
                      onChange={(event) =>
                        setSelectionById((current) => ({
                          ...current,
                          [tag.id]: event.target.value,
                        }))
                      }
                      className="min-w-0 flex-1 rounded-full border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-3 text-sm text-[color:var(--foreground)]"
                    >
                      <option value="">Unassigned</option>
                      <option value={`barn:${barnId}`}>Attach to {barnName}</option>
                      {sortedHorses.map((horse) => (
                        <option key={horse.id} value={`horse:${horse.id}`}>
                          Attach to {horse.name}
                        </option>
                      ))}
                    </select>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleAttach(tag.id)}
                      disabled={isPending}
                    >
                      Save attachment
                    </Button>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <a href={`/api/equitag/${tag.id}/download?format=svg`}>
                      <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        SVG
                      </Button>
                    </a>
                    <a href={`/api/equitag/${tag.id}/download?format=png`}>
                      <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        PNG
                      </Button>
                    </a>
                    <a href={`/eq/${tag.code}`}>
                      <Button variant="outline">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open destination
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

            </article>
          ))}
        </div>
      )}
    </section>
  );
}
