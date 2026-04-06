import AdminAnalyticsRangeControls from "@/components/admin/admin-analytics-range-controls";
import AdminErrorResolveButton from "@/components/admin/admin-error-resolve-button";
import AdminErrorTestButton from "@/components/admin/admin-error-test-button";
import { getAdminAnalyticsRange } from "@/lib/admin/analytics";
import {
  getAdminBackendErrorFilters,
  getAdminBackendErrors,
} from "@/lib/admin/errors";
import { requireAdminPageSession } from "@/lib/auth/admin";
import { formatDateTimeMDY } from "@/lib/formatting";

export const dynamic = "force-dynamic";

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)]">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-extrabold text-[color:var(--foreground-strong)]">{value}</p>
    </div>
  );
}

export default async function AdminErrorsPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    q?: string;
    route?: string;
    status?: string;
  }>;
}) {
  await requireAdminPageSession();

  const params = await searchParams;
  const range = getAdminAnalyticsRange(params);
  const filters = getAdminBackendErrorFilters(params);
  const data = await getAdminBackendErrors({
    range,
    q: filters.q,
    route: filters.route,
    status: filters.status,
  });

  return (
    <section className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[2.25rem] border border-[color:var(--border)] bg-[color:var(--card)] p-7 shadow-[var(--shadow-card)]">
          <p className="mono text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--foreground-soft)]">
            Backend Errors
          </p>
          <h2 className="mt-3 text-4xl font-extrabold text-[color:var(--foreground-strong)]">
            Inspect unhandled server-side errors across API routes.
          </h2>
          <p className="mt-3 max-w-3xl text-base text-[color:var(--foreground-soft)]">
            Errors are captured automatically from instrumented routes. Mark them as resolved once addressed.
          </p>
          <div className="mt-5 border-t border-[color:var(--border)] pt-5">
            <p className="mb-3 text-sm font-semibold text-[color:var(--foreground-soft)]">
              Test error tracking
            </p>
            <AdminErrorTestButton />
          </div>
        </div>

        <AdminAnalyticsRangeControls
          rangeKey={range.rangeKey}
          fromInput={range.fromInput}
          toInput={range.toInput}
          label={range.label}
          basePath="/admin/errors"
          persistParams={{
            q: filters.q,
            route: filters.route,
            status: filters.status,
          }}
        />
      </div>

      <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
        <form method="get" className="grid gap-3 xl:grid-cols-[1fr_220px_200px_auto]">
          <input type="hidden" name="range" value={range.rangeKey} />
          <input type="hidden" name="from" value={range.fromInput} />
          <input type="hidden" name="to" value={range.toInput} />
          <input
            type="text"
            name="q"
            defaultValue={filters.q}
            placeholder="Search by message, route, or user ID"
            className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="route"
            defaultValue={filters.route}
            placeholder="Filter by route"
            className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue={filters.status}
            className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
          <button className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-foreground)]">
            Filter
          </button>
        </form>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <SummaryCard label="Total in Range" value={data.totalCount.toLocaleString()} />
        <SummaryCard label="Open" value={data.openCount.toLocaleString()} />
        <SummaryCard label="Resolved" value={data.resolvedCount.toLocaleString()} />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-card)]">
        <div className="border-b border-[color:var(--border)] px-6 py-5">
          <h3 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
            Recent errors
          </h3>
          <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
            Showing the newest 100 errors that match the current filters.
          </p>
        </div>

        {data.errors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[color:var(--border)] text-sm">
              <thead className="bg-[color:var(--background-elevated)]">
                <tr className="text-left text-[color:var(--foreground-soft)]">
                  <th className="px-6 py-3 font-semibold">When</th>
                  <th className="px-6 py-3 font-semibold">Route</th>
                  <th className="px-6 py-3 font-semibold">Message</th>
                  <th className="px-6 py-3 font-semibold">User</th>
                  <th className="px-6 py-3 font-semibold">Stack / Metadata</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {data.errors.map((err) => (
                  <tr key={err.id} className="align-top">
                    <td className="px-6 py-4 text-[color:var(--foreground)]">
                      {formatDateTimeMDY(err.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[color:var(--foreground)]">
                      <div>{err.method ? `${err.method} ` : ""}{err.route || "—"}</div>
                    </td>
                    <td className="max-w-xs px-6 py-4 font-semibold text-[color:var(--destructive)]">
                      <div className="line-clamp-3 break-words">{err.message}</div>
                    </td>
                    <td className="px-6 py-4 text-[color:var(--foreground-soft)]">
                      {err.userId || "—"}
                    </td>
                    <td className="max-w-xs px-6 py-4 text-xs text-[color:var(--foreground-soft)]">
                      {err.stack ? (
                        <details>
                          <summary className="cursor-pointer select-none font-semibold">
                            Stack trace
                          </summary>
                          <pre className="mt-2 whitespace-pre-wrap break-words">{err.stack}</pre>
                        </details>
                      ) : null}
                      {err.metadata ? (
                        <div className="mt-1">{JSON.stringify(err.metadata)}</div>
                      ) : null}
                      {!err.stack && !err.metadata ? "—" : null}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            err.resolvedAt
                              ? "bg-[color:var(--muted)] text-[color:var(--foreground-soft)]"
                              : "bg-[color:var(--destructive)]/10 text-[color:var(--destructive)]"
                          }`}
                        >
                          {err.resolvedAt ? "Resolved" : "Open"}
                        </span>
                        <AdminErrorResolveButton
                          errorId={err.id}
                          isResolved={err.resolvedAt !== null}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-sm text-[color:var(--foreground-soft)]">
            No backend errors matched the current filters.
          </div>
        )}
      </div>
    </section>
  );
}
