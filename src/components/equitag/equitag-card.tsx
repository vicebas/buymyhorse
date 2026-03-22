import Image from "next/image";
import Link from "next/link";
import { Download, ExternalLink, QrCode } from "lucide-react";

import { resolvePublicAssetUrl } from "@/lib/storage/public-assets";
import { Button } from "@/components/ui/button";

interface EquiTagCardProps {
  title: string;
  description: string;
  code: string;
  svgPath: string;
  previewHref: string;
  downloadSvgHref: string;
  downloadPngHref: string;
}

export default function EquiTagCard({
  title,
  description,
  code,
  svgPath,
  previewHref,
  downloadSvgHref,
  downloadPngHref,
}: EquiTagCardProps) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="mono text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
            EquiTag
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--foreground-soft)]">
            {description}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[rgba(45,84,56,0.12)] px-4 py-2 text-sm font-semibold text-[#2d5438]">
            <QrCode className="h-4 w-4" />
            {code}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex h-[180px] w-[180px] items-center justify-center rounded-[1.5rem] bg-[color:var(--background-elevated)] p-4">
            <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white p-3">
              <Image
                src={resolvePublicAssetUrl(svgPath) || "/img/default-horse.png"}
                alt={`${title} QR code`}
                width={140}
                height={140}
                unoptimized
                className="h-[140px] w-[140px]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Link href={previewHref}>
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open public preview
              </Button>
            </Link>

            <a href={downloadSvgHref}>
              <Button variant="outline" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                Download SVG
              </Button>
            </a>

            <a href={downloadPngHref}>
              <Button className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                Download PNG
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
