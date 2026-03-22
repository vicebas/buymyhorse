import Link from "next/link";

import type { AdminAnalyticsRangeKey } from "@/lib/admin/analytics";

interface AdminAnalyticsRangeControlsProps {
  rangeKey: AdminAnalyticsRangeKey;
  fromInput: string;
  toInput: string;
  label: string;
}

function buildHref(range: Exclude<AdminAnalyticsRangeKey, "custom">) {
  return `/admin?range=${range}`;
}

export default function AdminAnalyticsRangeControls({
  rangeKey,
  fromInput,
  toInput,
  label,
}: AdminAnalyticsRangeControlsProps) {
  return (
    <aside className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
      <p className="mono text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--foreground-soft)]">
        Time Range
      </p>
      <h2 className="mt-3 text-2xl font-extrabold text-[color:var(--foreground-strong)]">{label}</h2>
      <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
        Apply a preset or a custom date window. The same range drives KPIs, charts, and leaderboard rankings.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {([
          ["7d", "7D"],
          ["30d", "30D"],
          ["90d", "90D"],
        ] as const).map(([value, labelText]) => {
          const isActive = rangeKey === value;

          return (
            <Link
              key={value}
              href={buildHref(value)}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-[color:var(--accent)] text-[color:var(--accent-foreground)]"
                  : "bg-[color:var(--muted)] text-[color:var(--foreground-soft)] hover:text-[color:var(--foreground-strong)]"
              }`}
            >
              {labelText}
            </Link>
          );
        })}
      </div>

      <form method="get" className="mt-5 space-y-3 rounded-2xl bg-[color:var(--background-elevated)] p-4">
        <input type="hidden" name="range" value="custom" />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-[color:var(--foreground)]">
            <span>From</span>
            <input
              type="date"
              name="from"
              defaultValue={fromInput}
              className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--card)] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-[color:var(--foreground)]">
            <span>To</span>
            <input
              type="date"
              name="to"
              defaultValue={toInput}
              className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--card)] px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button className="w-full rounded-lg bg-[color:var(--foreground-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--background)]">
          Apply Custom Range
        </button>
      </form>
    </aside>
  );
}
