import type { ReactNode } from "react";

import AdminSectionNav from "@/components/admin/admin-section-nav";
import { requireAdminPageSession } from "@/lib/auth/admin";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminPageSession();

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)] lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
      <AdminSectionNav />

      <section className="min-w-0 px-6 py-8 lg:px-10 lg:py-10">
        <div className="mb-8 border-b border-[color:var(--border)] pb-6">
          <p className="mono text-xs font-medium uppercase tracking-[0.24em] text-[color:var(--foreground-soft)]">
            Internal Admin
          </p>
          <h1 className="mt-3 text-5xl font-extrabold text-[color:var(--foreground-strong)]">
            Admin Console
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-[color:var(--foreground-soft)]">
            Track platform growth, monitor EquiTag usage, moderate barns and horses, and manage privileged staff access.
          </p>
        </div>

        <div className="min-w-0">{children}</div>
      </section>
    </main>
  );
}
