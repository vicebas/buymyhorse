import type { ProductEventType } from "@/generated/prisma/client";
import AdminAnalyticsRangeControls from "@/components/admin/admin-analytics-range-controls";
import { getAdminAnalyticsRange } from "@/lib/admin/analytics";
import {
  getAdminProductEventFilters,
  getAdminProductEvents,
} from "@/lib/admin/product-events";
import { requireAdminPageSession } from "@/lib/auth/admin";
import { formatDateTimeMDY } from "@/lib/formatting";

export const dynamic = "force-dynamic";

const EVENT_OPTIONS: ProductEventType[] = [
  "SIGNUP",
  "LOGIN",
  "HORSE_CREATION",
  "HORSE_EDIT",
  "DOCUMENT_UPLOAD",
  "GALLERY_UPLOAD",
];

function formatEventType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function actorLabel(actor: { id: string; name: string | null; email: string | null }) {
  return actor.name || actor.email || actor.id;
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)]">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-extrabold text-[color:var(--foreground-strong)]">{value}</p>
    </div>
  );
}

export default async function AdminProductEventsPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    q?: string;
    horseId?: string;
    eventType?: string;
  }>;
}) {
  await requireAdminPageSession();

  const params = await searchParams;
  const range = getAdminAnalyticsRange(params);
  const filters = getAdminProductEventFilters(params);
  const data = await getAdminProductEvents({
    range,
    q: filters.q,
    horseId: filters.horseId,
    eventType: filters.eventType,
  });

  return (
    <section className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[2.25rem] border border-[color:var(--border)] bg-[color:var(--card)] p-7 shadow-[var(--shadow-card)]">
          <p className="mono text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--foreground-soft)]">
            Product Events
          </p>
          <h2 className="mt-3 text-4xl font-extrabold text-[color:var(--foreground-strong)]">
            Inspect major user actions across authentication and horse management.
          </h2>
          <p className="mt-3 max-w-3xl text-base text-[color:var(--foreground-soft)]">
            This console lists successful signup, login, horse, document, and gallery events captured on the server.
          </p>
        </div>

        <AdminAnalyticsRangeControls
          rangeKey={range.rangeKey}
          fromInput={range.fromInput}
          toInput={range.toInput}
          label={range.label}
          basePath="/admin/product-events"
          persistParams={{
            q: filters.q,
            horseId: filters.horseId,
            eventType: filters.eventType,
          }}
        />
      </div>

      <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
        <form method="get" className="grid gap-3 xl:grid-cols-[1fr_220px_220px_auto]">
          <input type="hidden" name="range" value={range.rangeKey} />
          <input type="hidden" name="from" value={range.fromInput} />
          <input type="hidden" name="to" value={range.toInput} />
          <input
            type="text"
            name="q"
            defaultValue={filters.q}
            placeholder="Search actor by name, email, or user ID"
            className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="horseId"
            defaultValue={filters.horseId}
            placeholder="Filter by horse ID"
            className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
          />
          <select
            name="eventType"
            defaultValue={filters.eventType}
            className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
          >
            <option value="all">All event types</option>
            {EVENT_OPTIONS.map((eventType) => (
              <option key={eventType} value={eventType}>
                {formatEventType(eventType)}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-foreground)]">
            Filter
          </button>
        </form>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Events In Range" value={data.totalCount.toLocaleString()} />
        <SummaryCard label="Signups" value={data.counts.SIGNUP.toLocaleString()} />
        <SummaryCard label="Logins" value={data.counts.LOGIN.toLocaleString()} />
        <SummaryCard
          label="Horse Actions"
          value={(data.counts.HORSE_CREATION + data.counts.HORSE_EDIT).toLocaleString()}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
        <SummaryCard label="Document Uploads" value={data.counts.DOCUMENT_UPLOAD.toLocaleString()} />
        <SummaryCard label="Gallery Uploads" value={data.counts.GALLERY_UPLOAD.toLocaleString()} />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-card)]">
        <div className="border-b border-[color:var(--border)] px-6 py-5">
          <h3 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
            Recent events
          </h3>
          <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
            Showing the newest 100 events that match the current filters.
          </p>
        </div>

        {data.events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[color:var(--border)] text-sm">
              <thead className="bg-[color:var(--background-elevated)]">
                <tr className="text-left text-[color:var(--foreground-soft)]">
                  <th className="px-6 py-3 font-semibold">When</th>
                  <th className="px-6 py-3 font-semibold">Event</th>
                  <th className="px-6 py-3 font-semibold">Actor</th>
                  <th className="px-6 py-3 font-semibold">Horse</th>
                  <th className="px-6 py-3 font-semibold">Document</th>
                  <th className="px-6 py-3 font-semibold">Media</th>
                  <th className="px-6 py-3 font-semibold">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {data.events.map((event) => (
                  <tr key={event.id} className="align-top">
                    <td className="px-6 py-4 text-[color:var(--foreground)]">
                      {formatDateTimeMDY(event.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-[color:var(--foreground-strong)]">
                      {formatEventType(event.eventType)}
                    </td>
                    <td className="px-6 py-4 text-[color:var(--foreground)]">
                      <div>{actorLabel(event.actorUser)}</div>
                      <div className="text-xs text-[color:var(--foreground-soft)]">
                        {event.actorUser.email || event.actorUser.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[color:var(--foreground)]">
                      {event.horseId || "—"}
                    </td>
                    <td className="px-6 py-4 text-[color:var(--foreground)]">
                      {event.horseDocumentId || "—"}
                    </td>
                    <td className="px-6 py-4 text-[color:var(--foreground)]">
                      {event.horseMediaId || "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-[color:var(--foreground-soft)]">
                      {event.metadata ? JSON.stringify(event.metadata) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-sm text-[color:var(--foreground-soft)]">
            No product events matched the current filters.
          </div>
        )}
      </div>
    </section>
  );
}
