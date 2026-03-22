"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href: string;
  className?: string;
  priority?: boolean;
  variant?: "compact" | "primary" | "adaptive";
};

export function BrandLogo({
  href,
  className,
  priority = false,
  variant = "adaptive",
}: BrandLogoProps) {
  if (variant === "adaptive") {
    return (
      <Link
        href={href}
        className={cn("inline-flex items-center", className)}
        aria-label="HorseRoster home"
      >
        <Image
          src="/branding/horseroster-logo-primary.svg"
          alt="HorseRoster"
          width={335}
          height={52}
          priority={priority}
          className="brand-logo-light h-8 w-auto md:h-10"
        />
        <Image
          src="/branding/horseroster-logo-primary-dark.svg"
          alt="HorseRoster"
          width={335}
          height={52}
          priority={priority}
          className="brand-logo-dark h-8 w-auto md:h-10"
        />
      </Link>
    );
  }

  if (variant === "primary") {
    return (
      <Link
        href={href}
        className={cn("inline-flex items-center", className)}
        aria-label="HorseRoster home"
      >
        <Image
          src="/branding/horseroster-logo-primary.svg"
          alt="HorseRoster"
          width={335}
          height={52}
          priority={priority}
          className="h-8 w-auto md:h-10"
        />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2 md:gap-3", className)}
      aria-label="HorseRoster home"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-[#173754] ring-1 ring-white/10 md:h-10 md:w-10 md:rounded-xl">
        <Image
          src="/branding/horseroster-icon-light.svg"
          alt="HorseRoster"
          width={512}
          height={512}
          priority={priority}
          className="h-8 w-8 md:h-10 md:w-10"
        />
      </span>
      <span className="flex items-baseline text-[1.6rem] leading-none tracking-[-0.04em] text-[#e9e3d8] md:text-[1.95rem]">
        <span className="font-light">Horse</span>
        <span className="font-extrabold">Roster</span>
      </span>
    </Link>
  );
}
