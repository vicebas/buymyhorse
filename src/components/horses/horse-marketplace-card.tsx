"use client";

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { KeyboardEvent } from "react"
import { resolvePublicAssetUrl } from "@/lib/storage/public-assets"
import SaveHorseButton from "@/components/horses/save-horse-button"

export type HorseMarketplaceCardData = {
  id: string
  name: string
  breed?: string | null
  age?: number | null
  height?: string | null
  gender?: string | null
  discipline?: string | null
  level?: string | null
  pricingVisibility?: string | null
  image?: string | null
  location?: string | null
  saleStatus?: string | null
  isPlatformFeatured?: boolean
  sellerProfile: {
    displayName: string
    slug: string
  }
}

export default function HorseMarketplaceCard({
  horse,
  isInteractive = true,
  onRequireAuth,
  variant = "dashboard",
  isSaved = false,
  isLoggedIn = false,
}: {
  horse: HorseMarketplaceCardData
  isInteractive?: boolean
  onRequireAuth?: () => void
  variant?: "dashboard" | "marketplace"
  isSaved?: boolean
  isLoggedIn?: boolean
}) {
  const router = useRouter()

  function trackClickthrough() {
    const url = `/api/horses/${horse.id}/clickthrough`;

    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon(url, new Blob([], { type: "application/json" }));
      return;
    }

    void fetch(url, {
      method: "POST",
      keepalive: true,
    });
  }

  const saleLabel = formatSaleStatus(horse.saleStatus)

  const meta = [
    horse.breed,
    horse.age ? `${horse.age}` : null,
    horse.height ? `${horse.height}hh` : null,
    horse.gender,
    horse.location,
  ]
    .filter(Boolean)
    .join(" · ")

  const tags = [
    horse.discipline,
    horse.level,
    horse.breed,
    horse.gender,
  ].filter(Boolean).slice(0, 4) as string[]

  const pricingLabel = horse.pricingVisibility || "Contact for Price"
  const horseHref = `/horses/${horse.id}`
  const barnHref = `/barn/${horse.sellerProfile.slug}`

  function handleCardClick() {
    trackClickthrough()
    router.push(horseHref)
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    handleCardClick()
  }

  const marketplaceCardContent = (
    <>
      <div className="relative h-[220px] overflow-hidden bg-[linear-gradient(150deg,#d4d0c9_0%,#bdb8af_100%)]">
        <Image
          src={resolvePublicAssetUrl(horse.image) || "/img/default-horse.png"}
          alt={horse.name}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
        />

        <span className={`absolute left-3 top-3 rounded-[3px] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] ${getMarketplaceStatusClasses(horse.saleStatus)}`}>
          {saleLabel}
        </span>
        {horse.isPlatformFeatured ? (
          <span className="absolute right-3 top-3 rounded-[3px] bg-[rgba(15,42,68,0.9)] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#f8f6f2]">
            Admin Pick
          </span>
        ) : null}

        <div
          className="absolute bottom-3 right-3"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <SaveHorseButton horseId={horse.id} initialSaved={isSaved} isLoggedIn={isLoggedIn} size="card" />
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-[15px] font-extrabold tracking-[-0.02em] text-[color:var(--foreground-strong)]">
          {horse.name}
        </h3>

        <p className="mt-1 text-[10px] text-[color:var(--foreground-soft)]">
          {meta || "Professional sport horse listing"}
        </p>

        <div className="mt-3 flex flex-wrap gap-1">
          {tags.length > 0 ? (
            tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className={
                  index === 0
                    ? "rounded-[3px] bg-[color:var(--muted)] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[color:var(--foreground-strong)]"
                    : index % 2 === 1
                      ? "rounded-[3px] bg-[rgba(45,84,56,0.1)] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#2d5438]"
                      : "rounded-[3px] bg-[rgba(15,42,68,0.08)] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[color:var(--foreground-strong)]"
                }
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="rounded-[3px] bg-[color:var(--muted)] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[color:var(--foreground-strong)]">
              Sport Horse
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[color:var(--border)] pt-3">
          <div>
            <div className="text-[13px] font-bold tracking-[-0.02em] text-[color:var(--foreground-strong)]">
              <Link
                href={barnHref}
                className="hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {horse.sellerProfile.displayName}
              </Link>
            </div>
            <div className="text-[10px] text-[color:var(--foreground-soft)]">
              {pricingLabel}
            </div>
          </div>

          <span className="rounded-[4px] bg-[color:var(--accent)] px-3 py-1.5 text-[10px] font-bold tracking-[-0.01em] text-[color:var(--accent-foreground)]">
            View profile
          </span>
        </div>
      </div>
    </>
  )

  const dashboardCardContent = (
    <>
      <div className="relative h-[180px] overflow-hidden bg-[linear-gradient(160deg,#d8d4cc_0%,#c4bfb5_100%)]">
        <Image
          src={resolvePublicAssetUrl(horse.image) || "/img/default-horse.png"}
          alt={horse.name}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
        />

        <span className="absolute left-2.5 top-2.5 rounded-[3px] bg-[#2d5438] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white">
          {saleLabel}
        </span>
        {horse.isPlatformFeatured ? (
          <span className="absolute right-2.5 top-2.5 rounded-[3px] bg-[rgba(15,42,68,0.9)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#f8f6f2]">
            Admin Pick
          </span>
        ) : null}

        <div
          className="absolute bottom-2.5 right-2.5"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <SaveHorseButton horseId={horse.id} initialSaved={isSaved} isLoggedIn={isLoggedIn} size="card" />
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-base font-bold tracking-[-0.025em] text-[color:var(--foreground-strong)]">
          {horse.name}
        </h3>

        <p className="mt-1 text-[11px] text-[color:var(--foreground-soft)]">
          {meta || "Professional sport horse listing"}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.length > 0 ? (
            tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className={
                  index === 0
                    ? "rounded-[3px] bg-[color:var(--muted)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[color:var(--foreground-strong)]"
                    : index % 2 === 1
                      ? "rounded-[3px] bg-[rgba(45,84,56,0.1)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#2d5438]"
                      : "rounded-[3px] bg-[color:var(--secondary)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[color:var(--foreground-strong)]"
                }
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="rounded-[3px] bg-[color:var(--muted)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[color:var(--foreground-strong)]">
              Sport Horse
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[color:var(--border)] pt-3">
          <div>
            <div className="text-[13px] font-bold tracking-[-0.02em] text-[color:var(--foreground-strong)]">
              <Link
                href={barnHref}
                className="hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {horse.sellerProfile.displayName}
              </Link>
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--foreground-soft)]">
              Stable
            </div>
          </div>

          <span className="rounded-[4px] bg-[color:var(--accent)] px-3.5 py-1.5 text-[11px] font-semibold tracking-[-0.01em] text-[color:var(--accent-foreground)]">
            View profile
          </span>
        </div>
      </div>
    </>
  )

  const cardContent = variant === "marketplace"
    ? marketplaceCardContent
    : dashboardCardContent

  const cardClasses = variant === "marketplace"
    ? "group block overflow-hidden rounded-[7px] border border-[color:var(--border)] bg-[color:var(--background-elevated)] shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]"
    : "group block overflow-hidden rounded-[0.625rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]"

  if (!isInteractive) {
    return (
      <button
        type="button"
        onClick={onRequireAuth}
        className={`${cardClasses} w-full cursor-pointer text-left`}
      >
        {cardContent}
      </button>
    )
  }

  return (
    <div
      role="link"
      tabIndex={0}
      className={`${cardClasses} cursor-pointer`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      {cardContent}
    </div>
  )
}

function formatSaleStatus(status?: string | null) {
  if (!status) return "For Sale"

  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getMarketplaceStatusClasses(status?: string | null) {
  switch (status) {
    case "CONSIDERING_OFFERS":
      return "bg-[#1a3b5a] text-[#e9e3d8]"
    case "LEASE":
      return "bg-[#0f2a44] text-[#e9e3d8]"
    case "SOLD":
    case "NOT_AVAILABLE":
      return "bg-[color:var(--muted)] text-[color:var(--foreground-strong)]"
    case "FOR_SALE":
    default:
      return "bg-[#2d5438] text-[#f8f6f2]"
  }
}
