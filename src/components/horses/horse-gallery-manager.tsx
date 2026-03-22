"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Film, Loader2, Trash2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";

import { resolvePublicAssetUrl } from "@/lib/storage/public-assets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExistingMedia = {
  id: string;
  type: "IMAGE" | "VIDEO";
  processedPath: string;
  posterPath: string | null;
  fileName: string;
};

export default function HorseGalleryManager({
  horseId,
  horseName,
  existingMedia,
}: {
  horseId: string;
  horseName: string;
  existingMedia: ExistingMedia[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const previews = useMemo(
    () =>
      queuedFiles.map((file) => ({
        name: file.name,
        type: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
        preview: URL.createObjectURL(file),
      })),
    [queuedFiles]
  );

  function handleSelectedFiles(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    const files = Array.from(fileList).filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    setQueuedFiles((current) => [...current, ...files]);
    setError("");
  }

  async function uploadFiles() {
    if (queuedFiles.length === 0) {
      setError("Choose at least one photo or video to upload.");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    queuedFiles.forEach((file) => formData.append("media", file));

    const res = await fetch(`/api/horses/${horseId}/media`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => null);
    setUploading(false);

    if (!res.ok) {
      setError(data?.error || "Upload failed.");
      return;
    }

    setQueuedFiles([]);
    router.refresh();
  }

  async function deleteMedia(mediaId: string) {
    setDeletingId(mediaId);
    setError("");

    const res = await fetch(`/api/horses/${horseId}/media/${mediaId}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => null);
    setDeletingId(null);

    if (!res.ok) {
      setError(data?.error || "Could not remove media.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section
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
          "cursor-pointer rounded-[2rem] border border-dashed p-6 transition",
          dragActive
            ? "border-[color:var(--primary)] bg-[rgba(45,84,56,0.08)]"
            : "border-[color:var(--border)] bg-[color:var(--card)] hover:border-[color:var(--primary)] hover:bg-[color:var(--background-elevated)]"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            handleSelectedFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--muted)] text-[color:var(--foreground-strong)]">
              <UploadCloud className="h-6 w-6" />
            </div>

            <div>
              <p className="text-lg font-semibold text-[color:var(--foreground-strong)]">
                Upload gallery photos and videos
              </p>
              <p className="mt-2 max-w-2xl text-sm text-[color:var(--foreground-soft)]">
                Files are uploaded into HorseRoster, compressed automatically, and prepared for fast public playback.
              </p>
              <p className="mono mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
                Images and videos only • Social-style processing • Public gallery assets
              </p>
            </div>
          </div>

          <Button type="button" variant="outline">
            Choose files
          </Button>
        </div>
      </section>

      {queuedFiles.length > 0 ? (
        <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mono text-xs uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
                Upload Queue
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                Ready to process
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => setQueuedFiles([])}>
                Clear queue
              </Button>
              <Button type="button" onClick={uploadFiles} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Upload media"
                )}
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {previews.map((file) => (
              <div
                key={`${file.name}-${file.preview}`}
                className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)]"
              >
                {file.type === "IMAGE" ? (
                  <div className="relative h-48 w-full">
                    <Image src={file.preview} alt={file.name} fill unoptimized className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-[linear-gradient(160deg,#0f2a44_0%,#1a3b5a_100%)] text-[color:var(--color-sand)]">
                    <div className="flex flex-col items-center gap-3">
                      <Film className="h-8 w-8" />
                      <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                        Video
                      </span>
                    </div>
                  </div>
                )}
                <div className="px-4 py-3">
                  <p className="truncate text-sm font-medium text-[color:var(--foreground-strong)]">
                    {file.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mono text-xs uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
              Current Gallery
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
              {horseName}
            </h2>
          </div>
          <div className="rounded-full bg-[color:var(--muted)] px-4 py-2 text-sm font-medium text-[color:var(--foreground-strong)]">
            {existingMedia.length} item{existingMedia.length === 1 ? "" : "s"}
          </div>
        </div>

        {existingMedia.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[color:var(--border)] px-5 py-10 text-center text-sm text-[color:var(--foreground-soft)]">
            No gallery files yet. Upload photos or videos to build the public media gallery.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {existingMedia.map((media) => (
              <div
                key={media.id}
                className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)]"
              >
                {media.type === "IMAGE" ? (
                  <div className="relative h-48 w-full">
                    <Image
                      src={resolvePublicAssetUrl(media.processedPath) || "/img/default-horse.png"}
                      alt={media.fileName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative h-48 w-full">
                    {media.posterPath ? (
                      <Image
                        src={resolvePublicAssetUrl(media.posterPath) || "/img/default-horse.png"}
                        alt={media.fileName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(160deg,#0f2a44_0%,#1a3b5a_100%)] text-[color:var(--color-sand)]">
                        <Film className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[color:var(--foreground-strong)]">
                      {media.fileName}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
                      {media.type === "IMAGE" ? "Image" : "Video"}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => deleteMedia(media.id)}
                    disabled={deletingId === media.id}
                    aria-label={`Delete ${media.fileName}`}
                  >
                    {deletingId === media.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
