"use client";

import type { ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HORSE_GALLERY_MAX_IMAGES, HORSE_IMAGE_MAX_BYTES } from "@/lib/horses/media-limits";
import { resolvePublicAssetUrl } from "@/lib/storage/public-assets";
import { cn } from "@/lib/utils";

export type HorsePhotoPlanItem =
  | {
      id: string;
      source: "existing-primary";
      previewUrl: string;
      isPrimary: boolean;
    }
  | {
      id: string;
      source: "existing-gallery";
      existingMediaId: string;
      previewUrl: string;
      isPrimary: boolean;
    }
  | {
      id: string;
      source: "new";
      file: File;
      previewUrl: string;
      isPrimary: boolean;
    };

export type HorsePhotoPlan = {
  items: HorsePhotoPlanItem[];
};

type ExistingGalleryImage = {
  id: string;
  processedPath: string | null;
  fileName: string;
};

export default function HorsePhotoManager({
  horseName,
  initialPrimaryImage,
  initialGalleryImages,
  onChange,
}: {
  horseName?: string;
  initialPrimaryImage?: string | null;
  initialGalleryImages: ExistingGalleryImage[];
  onChange: (plan: HorsePhotoPlan) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<HorsePhotoPlanItem[]>(() => {
    const nextItems: HorsePhotoPlanItem[] = [];

    if (initialPrimaryImage) {
      nextItems.push({
        id: "existing-primary",
        source: "existing-primary",
        previewUrl: resolvePublicAssetUrl(initialPrimaryImage) || "/img/default-horse.png",
        isPrimary: true,
      });
    }

    nextItems.push(
      ...initialGalleryImages.map((image) => ({
        id: `existing-gallery-${image.id}`,
        source: "existing-gallery" as const,
        existingMediaId: image.id,
        previewUrl: resolvePublicAssetUrl(image.processedPath) || "/img/default-horse.png",
        isPrimary: false,
      }))
    );

    return nextItems;
  });

  const currentCount = items.length;

  useEffect(() => {
    onChange({ items });
  }, [items, onChange]);

  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.source === "new") {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [items]);

  const primaryItemId = useMemo(() => items.find((item) => item.isPrimary)?.id ?? null, [items]);

  function normalizePrimary(nextItems: HorsePhotoPlanItem[]) {
    if (nextItems.length === 0) {
      return [];
    }

    if (nextItems.some((item) => item.isPrimary)) {
      return nextItems;
    }

    return nextItems.map((item, index) => ({
      ...item,
      isPrimary: index === 0,
    }));
  }

  function setAsPrimary(id: string) {
    setItems((current) =>
      current.map((item) => ({
        ...item,
        isPrimary: item.id === id,
      }))
    );
  }

  function moveItem(id: string, direction: -1 | 1) {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === id);

      if (index < 0) {
        return current;
      }

      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const nextItems = current.slice();
      const [item] = nextItems.splice(index, 1);
      nextItems.splice(nextIndex, 0, item);
      return normalizePrimary(nextItems);
    });
  }

  function removeItem(id: string) {
    setItems((current) => {
      const found = current.find((item) => item.id === id);
      if (found?.source === "new") {
        URL.revokeObjectURL(found.previewUrl);
      }

      return normalizePrimary(current.filter((item) => item.id !== id));
    });
  }

  function handleSelectedFiles(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    const imageFiles = Array.from(fileList).filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      setError("Choose image files for the horse photo manager.");
      return;
    }

    if (imageFiles.some((file) => file.size > HORSE_IMAGE_MAX_BYTES)) {
      setError("Horse photos must be 10 MB or smaller.");
      return;
    }

    if (currentCount + imageFiles.length > HORSE_GALLERY_MAX_IMAGES + 1) {
      setError(`You can manage up to ${HORSE_GALLERY_MAX_IMAGES + 1} total listing photos including the primary image.`);
      return;
    }

    const newItems: HorsePhotoPlanItem[] = imageFiles.map((file, index) => ({
      id: `new-${Date.now()}-${index}-${file.name}`,
      source: "new",
      file,
      previewUrl: URL.createObjectURL(file),
      isPrimary: items.length === 0 && index === 0,
    }));

    setItems((current) => normalizePrimary([...current, ...newItems]));
    setError("");
  }

  return (
    <div className="space-y-5">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setDragActive(false);
          handleSelectedFiles(event.dataTransfer.files);
        }}
        className={cn(
          "cursor-pointer rounded-[1.75rem] border border-dashed p-5 transition",
          dragActive
            ? "border-[color:var(--primary)] bg-[rgba(45,84,56,0.08)]"
            : "border-[color:var(--border)] bg-[color:var(--background-elevated)] hover:border-[color:var(--primary)] hover:bg-[color:var(--muted)]/70"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            handleSelectedFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--muted)] text-[color:var(--foreground-strong)]">
              <UploadCloud className="h-5 w-5" />
            </div>

            <div>
              <p className="text-base font-semibold text-[color:var(--foreground-strong)]">
                Add listing photos
              </p>
              <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
                Upload multiple images, choose the primary photo, and set the display order before saving.
              </p>
            </div>
          </div>

          <Button type="button" variant="outline">
            <ImagePlus className="mr-2 h-4 w-4" />
            Add photos
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-card)]"
            >
              <div className="relative h-52 w-full bg-[color:var(--muted)]">
                <Image
                  src={item.previewUrl}
                  alt={horseName ? `${horseName} photo ${index + 1}` : `Horse photo ${index + 1}`}
                  fill
                  unoptimized={item.source === "new"}
                  className="object-cover"
                />
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--foreground-strong)]">
                      {item.isPrimary ? "Primary photo" : `Photo ${index + 1}`}
                    </p>
                    <p className="text-xs text-[color:var(--foreground-soft)]">
                      {item.source === "new" ? "New upload" : "Saved photo"}
                    </p>
                  </div>

                  {item.isPrimary ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(45,84,56,0.12)] px-3 py-1 text-xs font-medium text-[color:var(--foreground-strong)]">
                      <Star className="h-3.5 w-3.5" />
                      Primary
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {!item.isPrimary ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => setAsPrimary(item.id)}>
                      <Star className="mr-2 h-4 w-4" />
                      Make Primary
                    </Button>
                  ) : null}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveItem(item.id, -1)}
                    disabled={index === 0}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Earlier
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveItem(item.id, 1)}
                    disabled={index === items.length - 1}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Later
                  </Button>

                  <Button type="button" variant="outline" size="sm" onClick={() => removeItem(item.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-[color:var(--border)] bg-[color:var(--muted)]/50 p-8 text-center">
          <p className="text-lg font-semibold text-[color:var(--foreground-strong)]">
            No listing photos yet
          </p>
          <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
            Add a primary image and any extra photos you want buyers to see on the completed profile.
          </p>
        </div>
      )}

      <input type="hidden" name="primaryPhotoItemId" value={primaryItemId ?? ""} />
    </div>
  );
}
