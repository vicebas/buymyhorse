import Image from "next/image";
import Link from "next/link";
import { resolvePublicAssetUrl } from "@/lib/storage/public-assets";

interface EquiTagDisplayGridProps {
  title: string;
  description: string;
  equiTags: Array<{
    id: string;
    code: string;
    svgPath: string;
  }>;
}

export default function EquiTagDisplayGrid({
  title,
  description,
  equiTags,
}: EquiTagDisplayGridProps) {
  if (equiTags.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-8 shadow-[var(--shadow-card)]">
      <p className="mono text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
        EquiTag
      </p>
      <h2 className="mt-2 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--foreground-soft)]">
        {description}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {equiTags.map((tag) => (
          <div
            key={tag.id}
            className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-4"
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
    </section>
  );
}
