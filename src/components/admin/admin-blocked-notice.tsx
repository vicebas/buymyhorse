import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AdminBlockedNotice({
  title,
  message,
  backHref = "/mybarn",
  backLabel = "Back to MyBarn",
}: {
  title: string;
  message: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="rounded-[2rem] border border-[color:var(--destructive)]/20 bg-[color:var(--destructive)]/10 p-8 shadow-[var(--shadow-card)]">
      <h2 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--foreground)]">
        {message}
      </p>
      <div className="mt-6">
        <Link href={backHref}>
          <Button variant="outline">{backLabel}</Button>
        </Link>
      </div>
    </div>
  );
}
