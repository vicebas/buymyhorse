import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";
import ResolvedAppHeader from "@/components/layout/resolved-app-header";
import NotificationPreferencesForm from "@/components/settings/notification-preferences-form";

export default async function BuyerSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <ResolvedAppHeader variant="buyer" />

      <section className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8">
          <p className="mono text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
            My Account
          </p>
          <h1 className="mt-2 text-5xl font-extrabold">Notification Settings</h1>
          <p className="mt-3 max-w-2xl text-[color:var(--foreground-soft)]">
            Control which events notify you in-app and by email.
          </p>
        </div>

        <NotificationPreferencesForm />
      </section>
    </main>
  );
}
