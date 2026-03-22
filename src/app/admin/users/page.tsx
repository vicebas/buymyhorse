import AdminUserRoleForm from "@/components/admin/admin-user-role-form";
import { requireAdminPageSession } from "@/lib/auth/admin";
import { isSuperAdminRole } from "@/lib/admin/roles";
import prisma from "@/lib/db/prisma";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireAdminPageSession();
  const q = (await searchParams).q?.trim() || "";
  const canManageRoles = isSuperAdminRole(session.user.role);

  const users = await prisma.user.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      sellerProfile: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
    take: 75,
  });

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
        <form className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search users"
            className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-foreground)]">
            Filter
          </button>
        </form>
      </div>

      <div className="grid gap-5">
        {users.map((user) => {
          const hasBarnProfile = Boolean(user.sellerProfile?.id);
          const roleFormDisabled = !canManageRoles || (hasBarnProfile && user.role === "SELLER");

          return (
            <article
              key={user.id}
              className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]"
            >
              <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
                      {user.name || user.email || user.id}
                    </h2>
                    <span className="rounded-full bg-[color:var(--muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-soft)]">
                      {user.role}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-[color:var(--foreground-soft)]">
                    <p>Email: {user.email || "No email"}</p>
                    <p>
                      Barn profile:{" "}
                      {user.sellerProfile?.displayName || "None"}
                    </p>
                    {!canManageRoles ? (
                      <p className="text-[color:var(--foreground)]">
                        Only SuperAdmin can promote or demote privileged users.
                      </p>
                    ) : null}
                    {hasBarnProfile ? (
                      <p className="text-[color:var(--foreground)]">
                        Barn accounts are not promotable to admin roles in this version.
                      </p>
                    ) : null}
                  </div>
                </div>

                <AdminUserRoleForm
                  userId={user.id}
                  currentRole={user.role}
                  disabled={roleFormDisabled}
                />
              </div>
            </article>
          );
        })}

        {users.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[color:var(--border)] bg-[color:var(--card)] p-8 text-center text-sm text-[color:var(--foreground-soft)]">
            No users matched the current filters.
          </div>
        ) : null}
      </div>
    </section>
  );
}
