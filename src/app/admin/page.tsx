import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import AdminAnalyticsRangeControls from "@/components/admin/admin-analytics-range-controls";
import AdminTrendChart from "@/components/admin/admin-trend-chart";
import {
  getAdminAnalyticsRange,
  getAdminDashboardAnalytics,
} from "@/lib/admin/analytics";
import { requireAdminPageSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

function MetricCard({
  label,
  value,
  description,
  href,
}: {
  label: string;
  value: string;
  description: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
        {label}
      </p>
      <p className="mt-4 text-4xl font-extrabold text-[color:var(--foreground-strong)]">{value}</p>
      <p className="mt-3 text-sm text-[color:var(--foreground-soft)]">{description}</p>
      {href ? (
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--foreground-strong)]">
          Open section
          <ArrowUpRight size={14} />
        </span>
      ) : null}
    </>
  );

  if (!href) {
    return (
      <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[color:var(--foreground-soft)]"
    >
      {content}
    </Link>
  );
}

function TrendCard({
  title,
  description,
  data,
  gradientId,
  color,
}: {
  title: string;
  description: string;
  data: { date: string; label: string; value: number }[];
  gradientId: string;
  color: string;
}) {
  return (
    <article className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-xl font-extrabold text-[color:var(--foreground-strong)]">{title}</h3>
      <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">{description}</p>
      <div className="mt-5">
        <AdminTrendChart data={data} gradientId={gradientId} color={color} />
      </div>
    </article>
  );
}

export default async function AdminIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  await requireAdminPageSession();

  const range = getAdminAnalyticsRange(await searchParams);
  const analytics = await getAdminDashboardAnalytics(range);

  return (
    <section className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[2.25rem] border border-[color:var(--border)] bg-[color:var(--card)] p-7 shadow-[var(--shadow-card)]">
          <p className="mono text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--foreground-soft)]">
            Overview
          </p>
          <h2 className="mt-3 text-4xl font-extrabold text-[color:var(--foreground-strong)]">
            Platform health, growth, and EquiTag engagement.
          </h2>
          <p className="mt-3 max-w-3xl text-base text-[color:var(--foreground-soft)]">
            Monitor platform creation velocity, scan activity, and the most active barns and tags without leaving the admin console.
          </p>
        </div>

        <AdminAnalyticsRangeControls
          rangeKey={range.rangeKey}
          fromInput={range.fromInput}
          toInput={range.toInput}
          label={range.label}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total Users"
          value={analytics.totals.users.toLocaleString()}
          description="All user accounts across buyers, barns, and staff."
          href="/admin/users"
        />
        <MetricCard
          label="Total Barns"
          value={analytics.totals.barns.toLocaleString()}
          description="Barn accounts currently present in the platform."
          href="/admin/barns"
        />
        <MetricCard
          label="Total Horses"
          value={analytics.totals.horses.toLocaleString()}
          description="Non-deleted horse records across every barn."
          href="/admin/horses"
        />
        <MetricCard
          label="Total EquiTags"
          value={analytics.totals.equiTags.toLocaleString()}
          description="All generated EquiTags owned by barn accounts."
          href="/admin/barns"
        />
        <MetricCard
          label="EquiTag Uses"
          value={analytics.totals.equiTagUsesInRange.toLocaleString()}
          description="Successful EquiTag redirects within the selected range."
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="New Users"
          value={analytics.newInRange.users.toLocaleString()}
          description="Accounts created in the active range."
        />
        <MetricCard
          label="New Barns"
          value={analytics.newInRange.barns.toLocaleString()}
          description="Barn profiles created in the active range."
        />
        <MetricCard
          label="New Horses"
          value={analytics.newInRange.horses.toLocaleString()}
          description="Horse records created in the active range."
        />
        <MetricCard
          label="New EquiTags"
          value={analytics.newInRange.equiTags.toLocaleString()}
          description="EquiTags created in the active range."
        />
      </div>

      <div className="rounded-[2.25rem] border border-[color:var(--border)] bg-[color:var(--card)] p-7 shadow-[var(--shadow-card)]">
        <p className="mono text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--foreground-soft)]">
          Access & Messaging
        </p>
        <h2 className="mt-3 text-4xl font-extrabold text-[color:var(--foreground-strong)]">
          Request flow, approvals, and conversation volume.
        </h2>
        <p className="mt-3 max-w-3xl text-base text-[color:var(--foreground-soft)]">
          Track vault demand, approval decisions, and downstream messaging activity without leaving the overview.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active Grants"
          value={analytics.accessMessaging.snapshot.activeGrants.toLocaleString()}
          description="Currently valid grants across the platform."
          href="/admin/access"
        />
        <MetricCard
          label="Pending Requests"
          value={analytics.accessMessaging.snapshot.pendingRequests.toLocaleString()}
          description="Open buyer requests awaiting action."
          href="/admin/access"
        />
        <MetricCard
          label="Requests Created"
          value={analytics.accessMessaging.range.requestsCreated.toLocaleString()}
          description="Buyer vault requests created in the active range."
          href="/admin/access"
        />
        <MetricCard
          label="Approvals"
          value={analytics.accessMessaging.range.approvals.toLocaleString()}
          description="Approvals recorded in the vault activity log."
          href="/admin/access"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Denials"
          value={analytics.accessMessaging.range.denials.toLocaleString()}
          description="Requests denied in the active range."
          href="/admin/access"
        />
        <MetricCard
          label="Revokes"
          value={analytics.accessMessaging.range.revokes.toLocaleString()}
          description="Grant revocations recorded in the active range."
          href="/admin/access"
        />
        <MetricCard
          label="Conversations"
          value={analytics.accessMessaging.range.conversationsCreated.toLocaleString()}
          description="Horse conversations started in the active range."
        />
        <MetricCard
          label="Messages Sent"
          value={analytics.accessMessaging.range.messagesSent.toLocaleString()}
          description="All conversation messages sent in the active range."
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <MetricCard
          label="Text Messages"
          value={analytics.accessMessaging.range.textMessagesSent.toLocaleString()}
          description="Regular chat messages sent in the active range."
        />
        <MetricCard
          label="Grant Messages"
          value={analytics.accessMessaging.range.grantMessagesSent.toLocaleString()}
          description="Grant-share messages emitted during approvals."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TrendCard
          title="Accounts Created"
          description="Daily user-account creation volume over the selected date range."
          data={analytics.series.users}
          gradientId="admin-users-chart"
          color="#1A3B5A"
        />
        <TrendCard
          title="Barns Created"
          description="Daily barn onboarding and barn-profile creation volume."
          data={analytics.series.barns}
          gradientId="admin-barns-chart"
          color="#2D5438"
        />
        <TrendCard
          title="Horses Created"
          description="Daily horse-listing creation across all barns."
          data={analytics.series.horses}
          gradientId="admin-horses-chart"
          color="#8E6C3A"
        />
        <TrendCard
          title="EquiTags Created"
          description="Daily EquiTag inventory growth across the platform."
          data={analytics.series.equiTags}
          gradientId="admin-tags-chart"
          color="#6B7280"
        />
        <div className="xl:col-span-2">
          <TrendCard
            title="EquiTag Uses"
            description="Successful EquiTag entry hits recorded before redirect to horse or barn destinations."
            data={analytics.series.equiTagUses}
            gradientId="admin-tag-uses-chart"
            color="#0F766E"
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TrendCard
          title="Requests Created"
          description="Daily buyer vault requests created over the selected date range."
          data={analytics.accessMessaging.series.requestsCreated}
          gradientId="admin-access-requests-chart"
          color="#1A3B5A"
        />
        <TrendCard
          title="Approvals"
          description="Daily request approvals recorded in the activity log."
          data={analytics.accessMessaging.series.approvals}
          gradientId="admin-access-approvals-chart"
          color="#2D5438"
        />
        <TrendCard
          title="Conversations Created"
          description="Daily horse conversation starts across buyers and barns."
          data={analytics.accessMessaging.series.conversationsCreated}
          gradientId="admin-access-conversations-chart"
          color="#8E6C3A"
        />
        <TrendCard
          title="Messages Sent"
          description="Daily message volume across horse conversations."
          data={analytics.accessMessaging.series.messagesSent}
          gradientId="admin-access-messages-chart"
          color="#0F766E"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-xl font-extrabold text-[color:var(--foreground-strong)]">
            Top Barns by EquiTag Usage
          </h3>
          <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
            Barns ranked by successful EquiTag destination traffic in the selected range.
          </p>

          <div className="mt-5 space-y-3">
            {analytics.topBarns.length > 0 ? (
              analytics.topBarns.map((barn, index) => (
                <div
                  key={barn.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-[color:var(--background-elevated)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--foreground-strong)]">
                      {index + 1}. {barn.displayName}
                    </p>
                    {barn.slug ? (
                      <Link
                        href={`/barn/${barn.slug}`}
                        className="mt-1 inline-flex text-xs font-medium text-[color:var(--foreground-soft)] underline underline-offset-4"
                      >
                        Open public barn page
                      </Link>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-[color:var(--muted)] px-3 py-1 text-sm font-semibold text-[color:var(--foreground-strong)]">
                    {barn.hits} hits
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-8 text-center text-sm text-[color:var(--foreground-soft)]">
                No EquiTag visits were recorded in this range.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-xl font-extrabold text-[color:var(--foreground-strong)]">
            Top EquiTags
          </h3>
          <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
            The most-used EquiTags in the selected range, with their current attachment state.
          </p>

          <div className="mt-5 space-y-3">
            {analytics.topEquiTags.length > 0 ? (
              analytics.topEquiTags.map((tag, index) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-[color:var(--background-elevated)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--foreground-strong)]">
                      {index + 1}. {tag.code}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--foreground-soft)]">{tag.targetLabel}</p>
                    {tag.href ? (
                      <Link
                        href={tag.href}
                        className="mt-1 inline-flex text-xs font-medium text-[color:var(--foreground-soft)] underline underline-offset-4"
                      >
                        Open EquiTag destination
                      </Link>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-[color:var(--muted)] px-3 py-1 text-sm font-semibold text-[color:var(--foreground-strong)]">
                    {tag.hits} hits
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-8 text-center text-sm text-[color:var(--foreground-soft)]">
                No EquiTag visits were recorded in this range.
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
