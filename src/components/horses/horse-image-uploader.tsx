"use client";

import type { ChangeEvent, DragEvent } from "react";
import NextImage from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, ImagePlus, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HORSE_IMAGE_MAX_BYTES } from "@/lib/horses/media-limits";
import { cn } from "@/lib/utils";

interface HorseImageUploaderProps {
  initialImage?: string | null;
  horseName?: string;
  onImageChange: (file: File | null) => void;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image."));
    image.src = src;
  });
}

async function createCroppedImageFile(
  imageSrc: string,
  pixelCrop: Area,
  originalName: string
) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create image editor.");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.92);
  });

  if (!blob) {
    throw new Error("Could not prepare cropped image.");
  }

  const safeName = originalName.replace(/\.[^/.]+$/, "") || "horse-photo";
  return new File([blob], `${safeName}-cropped.jpg`, { type: "image/jpeg" });
}

export default function HorseImageUploader({
  initialImage,
  horseName,
  onImageChange,
}: HorseImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [draftPreview, setDraftPreview] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [sourceFileName, setSourceFileName] = useState("horse-photo");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const storedImage = initialImage ?? null;
  const previewImage = draftPreview ?? storedImage;

  useEffect(() => {
    return () => {
      if (draftPreview) {
        URL.revokeObjectURL(draftPreview);
      }

      if (cropSource) {
        URL.revokeObjectURL(cropSource);
      }
    };
  }, [cropSource, draftPreview]);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const resetCropper = useCallback(() => {
    if (cropSource) {
      URL.revokeObjectURL(cropSource);
    }

    setCropSource(null);
    setSourceFileName("horse-photo");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setProcessing(false);
  }, [cropSource]);

  const startEditing = useCallback(
    (file: File | null) => {
      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        setImageError("Please choose an image file.");
        return;
      }

      if (file.size > HORSE_IMAGE_MAX_BYTES) {
        setImageError("Primary horse photos must be 10 MB or smaller.");
        return;
      }

      setImageError(null);

      if (cropSource) {
        URL.revokeObjectURL(cropSource);
      }

      setCropSource(URL.createObjectURL(file));
      setSourceFileName(file.name);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    },
    [cropSource]
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.target.files?.[0] ?? null;
      startEditing(nextFile);
      event.target.value = "";
    },
    [startEditing]
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      startEditing(event.dataTransfer.files?.[0] ?? null);
    },
    [startEditing]
  );

  const removeDraft = useCallback(() => {
    if (draftPreview) {
      URL.revokeObjectURL(draftPreview);
    }

    setDraftPreview(null);
    setImageError(null);
    onImageChange(null);
  }, [draftPreview, onImageChange]);

  const applyCrop = useCallback(async () => {
    if (!cropSource || !croppedAreaPixels) {
      setImageError("Choose an image area before saving.");
      return;
    }

    setProcessing(true);

    try {
      const croppedFile = await createCroppedImageFile(
        cropSource,
        croppedAreaPixels,
        sourceFileName
      );
      const nextPreview = URL.createObjectURL(croppedFile);

      if (draftPreview) {
        URL.revokeObjectURL(draftPreview);
      }

      setDraftPreview(nextPreview);
      setImageError(null);
      onImageChange(croppedFile);
      resetCropper();
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Could not prepare image."
      );
      setProcessing(false);
    }
  }, [
    cropSource,
    croppedAreaPixels,
    draftPreview,
    onImageChange,
    resetCropper,
    sourceFileName,
  ]);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
        <div
          role="button"
          tabIndex={0}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFilePicker();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            "cursor-pointer rounded-[1.75rem] border border-dashed px-5 py-6 transition lg:min-h-[22rem]",
            dragActive
              ? "border-[color:var(--primary)] bg-[rgba(45,84,56,0.08)]"
              : "border-[color:var(--border)] bg-[color:var(--background-elevated)] hover:border-[color:var(--primary)] hover:bg-[color:var(--muted)]/70"
          )}
        >
          <div className="flex h-full flex-col gap-5 md:flex-row md:items-center lg:flex-col lg:items-start lg:justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--muted)] text-[color:var(--foreground-strong)]">
              <UploadCloud className="h-6 w-6" />
            </div>

            <div className="flex-1">
              <p className="text-base font-semibold text-[color:var(--foreground-strong)]">
                Drop a horse photo here or click to browse
              </p>
              <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
                Use a wide, well-lit photo with the horse centered from shoulder to head whenever possible.
              </p>
              <p className="mono mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
                JPG, PNG, or WEBP • 10 MB max • Crop before upload
              </p>
            </div>

            <Button type="button" variant="outline" className="shrink-0">
              <ImagePlus className="mr-2 h-4 w-4" />
              {previewImage ? "Replace photo" : "Choose photo"}
            </Button>
          </div>
        </div>

        {previewImage ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] shadow-[var(--shadow-card)]">
            <div
              className={cn(
                "grid gap-4 p-4",
                draftPreview && storedImage ? "md:grid-cols-2" : "grid-cols-1"
              )}
            >
              {storedImage ? (
                <div className="overflow-hidden rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--muted)]/45">
                  <div className="relative h-[14rem] w-full overflow-hidden bg-[color:var(--muted)] md:h-[16rem] lg:h-[18rem]">
                    <NextImage
                      src={storedImage}
                      alt={horseName ? `${horseName} saved image` : "Saved horse image"}
                      fill
                      unoptimized
                      sizes="(max-width: 1024px) 100vw, 300px"
                      className="object-cover"
                    />
                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--background-elevated)]/90 px-3 py-1 text-xs font-semibold text-[color:var(--foreground-strong)] shadow-[var(--shadow-card)] backdrop-blur">
                      <Camera className="h-3.5 w-3.5" />
                      Current saved image
                    </div>
                  </div>
                </div>
              ) : null}

              {(draftPreview || !storedImage) && previewImage ? (
                <div className="overflow-hidden rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--muted)]/45">
                  <div className="relative h-[14rem] w-full overflow-hidden bg-[color:var(--muted)] md:h-[16rem] lg:h-[18rem]">
                    <NextImage
                      src={previewImage}
                      alt={horseName ? `${horseName} preview` : "Horse image preview"}
                      fill
                      unoptimized
                      sizes="(max-width: 1024px) 100vw, 300px"
                      className="object-cover"
                    />
                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--background-elevated)]/90 px-3 py-1 text-xs font-semibold text-[color:var(--foreground-strong)] shadow-[var(--shadow-card)] backdrop-blur">
                      <Camera className="h-3.5 w-3.5" />
                      {draftPreview ? "New cropped preview" : "Current image"}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--border)] px-4 py-4">
              <p className="text-sm text-[color:var(--foreground-soft)]">
                {draftPreview
                  ? "Compare the saved image with the new cropped draft before you save the form."
                  : "This is the image currently stored for the listing and shown across public surfaces."}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={openFilePicker}>
                  Replace image
                </Button>
                {draftPreview ? (
                  <Button type="button" variant="ghost" onClick={removeDraft}>
                    Remove draft
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {imageError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive lg:col-span-2">
            {imageError}
          </div>
        ) : null}
      </div>

      {cropSource ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(9,28,46,0.7)] px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] shadow-[0_32px_80px_rgba(9,28,46,0.36)]">
            <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] px-6 py-5">
              <div>
                <p className="mono text-xs uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
                  Horse image editor
                </p>
                <h3 className="mt-2 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                  Frame the main listing photo
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-[color:var(--foreground-soft)]">
                  Keep the horse centered with enough room around the face, neck, and shoulder so the crop still reads well on cards.
                </p>
              </div>

              <Button type="button" variant="ghost" size="icon" onClick={resetCropper}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.4fr_0.8fr]">
              <div className="relative min-h-[360px] overflow-hidden rounded-[1.5rem] bg-[color:var(--muted)]">
                <Cropper
                  image={cropSource}
                  crop={crop}
                  zoom={zoom}
                  aspect={5 / 4}
                  objectFit="cover"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) =>
                    setCroppedAreaPixels(croppedPixels)
                  }
                />
              </div>

              <div className="space-y-5 rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--muted)]/55 p-5">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--foreground-strong)]">
                    Crop zoom
                  </p>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="mt-3 w-full accent-[color:var(--primary)]"
                  />
                </div>

                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-4 text-sm text-[color:var(--foreground-soft)]">
                  This crop is saved client-side first, then uploaded as the final file when you save the horse record.
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={resetCropper}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={applyCrop} disabled={processing}>
                    {processing ? "Preparing image..." : "Use cropped image"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
