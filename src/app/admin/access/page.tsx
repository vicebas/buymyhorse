import Link from "next/link";

import AdminAnalyticsRangeControls from "@/components/admin/admin-analytics-range-controls";
import AdminGrantRevokeButton from "@/components/admin/admin-grant-revoke-button";
import { getAdminAccessConsoleData, getAdminAccessFilters } from "@/lib/admin/access";
import { getAdminAnalyticsRange } from "@/lib/admin/analytics";
import { requireAdminPageSession } from "@/lib/auth/admin";

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)]">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-extrabold text-[color:var(--foreground-strong)]">{value}</p>
      <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">{description}</p>
    </div>
  );
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleString();
}

function formatRequestStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatActivityType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buyerLabel(buyer: { id: string; name: string | null; email: string | null }) {
  return buyer.name || buyer.email || buyer.id;
}

export default async function AdminAccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    q?: string;
    status?: string;
    activity?: string;
  }>;
}) {
  await requireAdminPageSession();

  const params = await searchParams;
  const range = getAdminAnalyticsRange(params);
  const filters = getAdminAccessFilters(params);
  const data = await getAdminAccessConsoleData({
    range,
    ...filters,
  });

  return (
    <section className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[2.25rem] border border-[color:var(--border)] bg-[color:var(--card)] p-7 shadow-[var(--shadow-card)]">
          <p className="mono text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--foreground-soft)]">
            Access Console
          </p>
          <h2 className="mt-3 text-4xl font-extrabold text-[color:var(--foreground-strong)]">
            Inspect live grants, request history, and vault access activity.
          </h2>
          <p className="mt-3 max-w-3xl text-base text-[color:var(--foreground-soft)]">
            This view centralizes access-control operations so admins can inspect history and revoke active grants without manual database work.
          </p>
        </div>

        <AdminAnalyticsRangeControls
          rangeKey={range.rangeKey}
          fromInput={range.fromInput}
          toInput={range.toInput}
          label={range.label}
          basePath="/admin/access"
          persistParams={{
            q: filters.q,
            status: filters.status,
            activity: filters.activity,
          }}
        />
      </div>

      <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
        <form method="get" className="grid gap-3 xl:grid-cols-[1fr_180px_240px_auto]">
          <input type="hidden" name="range" value={range.rangeKey} />
          <input type="hidden" name="from" value={range.fromInput} />
          <input type="hidden" name="to" value={range.toInput} />
          <input
            type="text"
            name="q"
            defaultValue={filters.q}
            placeholder="Search horse, barn, or buyer"
            className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue={filters.status}
            className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
          >
            <option value="all">All request statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="revoked">Revoked</option>
            <option value="expired">Expired</option>
          </select>
          <select
            name="activity"
            defaultValue={filters.activity}
            className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
          >
            <option value="all">All access activity</option>
            <option value="ACCESS_REQUEST_CREATED">Request Created</option>
            <option value="ACCESS_REQUEST_APPROVED">Request Approved</option>
            <option value="ACCESS_REQUEST_DENIED">Request Denied</option>
            <option value="ACCESS_GRANT_REVOKED">Grant Revoked</option>
          </select>
          <button className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-foreground)]">
            Filter
          </button>
        </form>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Active Grants"
          value={data.summary.activeGrantCount.toLocaleString()}
          description="Currently valid grants after revoke and expiration checks."
        />
        <SummaryCard
          label="Pending Requests"
          value={data.summary.pendingRequestCount.toLocaleString()}
          description="Open buyer requests matching the current search."
        />
        <SummaryCard
          label="Requests In Range"
          value={data.summary.requestsCreatedCount.toLocaleString()}
          description="Buyer vault requests created in the selected window."
        />
        <SummaryCard
          label="Approvals In Range"
          value={data.summary.approvalsCount.toLocaleString()}
          description="Vault approvals recorded in the activity log."
        />
        <SummaryCard
          label="Messages In Range"
          value={data.summary.messagesSentCount.toLocaleString()}
          description="Horse conversation messages sent in the selected window."
        />
      </div>

      <section className="space-y-4">
        <div>
          <p className="mono text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--foreground-soft)]">
            Active Grants
          </p>
          <h3 className="mt-2 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
            Revocable access grants
          </h3>
        </div>

        <div className="grid gap-5">
          {data.activeGrants.length > 0 ? (
            data.activeGrants.map((grant) => (
              <article
                key={grant.id}
                className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]"
              >
                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                          {grant.horse.name}
                        </h4>
                        <span className="rounded-full bg-[rgba(45,84,56,0.14)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#2d5438]">
                          Active
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-[color:var(--foreground-soft)]">
                        <span>Barn: {grant.horse.sellerProfile.displayName}</span>
                        <span>Buyer: {buyerLabel(grant.buyer)}</span>
                        <span>Files: {grant._count.grantedFiles}</span>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm text-[color:var(--foreground)] md:grid-cols-2">
                      <p>Granted: {formatDateTime(grant.createdAt)}</p>
                      <p>Expires: {formatDateTime(grant.expiresAt)}</p>
                      <p className="md:col-span-2">Note: {grant.note || "None"}</p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <Link
                        href={`/horses/${grant.horse.id}`}
                        className="text-sm font-semibold text-[color:var(--foreground-strong)] underline underline-offset-4"
                      >
                        Open horse page
                      </Link>
                      <Link
                        href={`/barn/${grant.horse.sellerProfile.slug}`}
                        className="text-sm font-semibold text-[color:var(--foreground-strong)] underline underline-offset-4"
                      >
                        Open barn page
                      </Link>
                    </div>
                  </div>

                  <AdminGrantRevokeButton grantId={grant.id} />
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-[color:var(--border)] bg-[color:var(--card)] p-8 text-center text-sm text-[color:var(--foreground-soft)]">
              No active grants matched the current filters.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="mono text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--foreground-soft)]">
            Request History
          </p>
          <h3 className="mt-2 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
            Requests created in this range
          </h3>
        </div>

        <div className="grid gap-5">
          {data.requestHistory.length > 0 ? (
            data.requestHistory.map((request) => (
              <article
                key={request.id}
                className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                    {request.horse.name}
                  </h4>
                  <span className="rounded-full bg-[color:var(--muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
                    {formatRequestStatus(request.status)}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 text-sm text-[color:var(--foreground)] md:grid-cols-2 xl:grid-cols-4">
                  <p>Buyer: {buyerLabel(request.buyer)}</p>
                  <p>Barn: {request.horse.sellerProfile.displayName}</p>
                  <p>Created: {formatDateTime(request.createdAt)}</p>
                  <p>Updated: {formatDateTime(request.updatedAt)}</p>
                </div>

                <div className="mt-4 space-y-2 text-sm text-[color:var(--foreground)]">
                  <p>Request: {request.message || "No request message provided."}</p>
                  <p>Decision Note: {request.decisionNote || "None"}</p>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-[color:var(--border)] bg-[color:var(--card)] p-8 text-center text-sm text-[color:var(--foreground-soft)]">
              No requests matched the current range and filters.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="mono text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--foreground-soft)]">
            Access Log
          </p>
          <h3 className="mt-2 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
            Vault access activity
          </h3>
        </div>

        <div className="grid gap-5">
          {data.accessLog.length > 0 ? (
            data.accessLog.map((entry) => {
              const buyer =
                entry.accessGrant?.buyer || entry.accessRequest?.buyer || null;

              return (
                <article
                  key={entry.id}
                  className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-xl font-extrabold text-[color:var(--foreground-strong)]">
                      {formatActivityType(entry.activityType)}
                    </h4>
                    <span className="rounded-full bg-[color:var(--muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
                      {entry.horse.name}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 text-sm text-[color:var(--foreground)] md:grid-cols-2 xl:grid-cols-4">
                    <p>Barn: {entry.horse.sellerProfile.displayName}</p>
                    <p>Buyer: {buyer ? buyerLabel(buyer) : "Not linked"}</p>
                    <p>Actor: {entry.actorUser.name || entry.actorUser.email || entry.actorUser.id}</p>
                    <p>At: {formatDateTime(entry.createdAt)}</p>
                  </div>

                  <div className="mt-4 text-sm text-[color:var(--foreground-soft)]">
                    Metadata: {entry.metadata ? JSON.stringify(entry.metadata) : "None"}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[2rem] border border-dashed border-[color:var(--border)] bg-[color:var(--card)] p-8 text-center text-sm text-[color:var(--foreground-soft)]">
              No access activity matched the current range and filters.
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
