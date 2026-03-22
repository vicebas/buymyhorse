"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { PlayCircle } from "lucide-react";

import { resolvePublicAssetUrl } from "@/lib/storage/public-assets";
import { cn } from "@/lib/utils";

type HorseMediaItem = {
  id: string;
  type: "IMAGE" | "VIDEO";
  processedPath: string | null;
  posterPath: string | null;
  fileName: string;
};

type GalleryItem =
  | {
      id: string;
      type: "image";
      src: string;
      alt: string;
    }
  | {
      id: string;
      type: "video";
      src: string;
      posterPath: string | null;
      title: string;
    };

export default function HorseMediaGallery({
  horseName,
  primaryImage,
  media,
}: {
  horseName: string;
  primaryImage?: string | null;
  media: HorseMediaItem[];
}) {
  const items = useMemo<GalleryItem[]>(() => {
    const output: GalleryItem[] = [];

    if (primaryImage) {
      output.push({
        id: "primary-image",
        type: "image",
        src: resolvePublicAssetUrl(primaryImage) || "/img/default-horse.png",
        alt: horseName,
      });
    }

    media.forEach((item, index) => {
      if (item.type === "IMAGE") {
        output.push({
          id: item.id,
          type: "image",
          src: resolvePublicAssetUrl(item.processedPath) || "/img/default-horse.png",
          alt: `${horseName} gallery image ${index + 1}`,
        });
      } else {
        output.push({
          id: item.id,
          type: "video",
          src: resolvePublicAssetUrl(item.processedPath) || "",
          posterPath: resolvePublicAssetUrl(item.posterPath),
          title: item.fileName || `${horseName} video ${index + 1}`,
        });
      }
    });

    return output;
  }, [horseName, media, primaryImage]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex];

  if (!activeItem) {
    return (
      <div className="overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-card)]">
        <Image
          src="/img/default-horse.png"
          alt={horseName}
          width={1400}
          height={950}
          className="h-[320px] w-full object-cover md:h-[480px]"
          priority
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-card)]">
        {activeItem.type === "image" ? (
          <Image
            src={activeItem.src}
            alt={activeItem.alt}
            width={1400}
            height={950}
            className="h-[320px] w-full object-cover md:h-[480px]"
            priority
          />
        ) : (
          <video
            src={activeItem.src}
            controls
            poster={activeItem.posterPath || undefined}
            className="h-[320px] w-full bg-black object-cover md:h-[480px]"
          />
        )}
      </div>

      {items.length > 1 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]",
                activeIndex === index && "ring-2 ring-[color:var(--accent)]"
              )}
            >
              {item.type === "image" ? (
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={400}
                  height={260}
                  className="h-24 w-full object-cover"
                />
              ) : item.posterPath ? (
                <div className="relative h-24 w-full">
                  <Image
                    src={item.posterPath}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-full items-center justify-center bg-[linear-gradient(160deg,#0f2a44_0%,#1a3b5a_100%)] text-[color:var(--color-sand)]">
                  <PlayCircle className="h-6 w-6" />
                </div>
              )}

              <div className="px-3 py-2">
                <p className="truncate text-xs font-medium text-[color:var(--foreground-strong)]">
                  {item.type === "image" ? `Photo ${index + 1}` : item.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
