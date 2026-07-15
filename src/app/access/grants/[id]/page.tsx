import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import GrantAccessView from "@/components/horses/grant-access-view";
import { LogoutButton } from "@/components/auth/logout-button";
import ResolvedAppHeader from "@/components/layout/resolved-app-header";
import { authOptions } from "@/lib/auth/options";
import { getUserAppHeaderVariant } from "@/lib/auth/get-user-app-header-variant";
import { getBuyerGrantAccess } from "@/lib/vault/access";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GrantAccessPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const accessPath = `/access/grants/${id}`;

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(accessPath)}`);
  }

  const access = await getBuyerGrantAccess(id, session.user.id);

  const headerVariant = await getUserAppHeaderVariant(session.user.id);

  if (!access) {
    return (
      <main className="min-h-screen bg-stone-50 text-stone-900">
        <ResolvedAppHeader variant={headerVariant} />
        <section className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
              Shared Document Access
            </p>
            <h1 className="mt-3 font-serif text-3xl text-stone-900">
              This shared link is tied to a different account
            </h1>
            <p className="mt-4 text-stone-600">
              Sign in with the email address that received the document share, or sign out and open the link again from that inbox.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`/login?callbackUrl=${encodeURIComponent(accessPath)}`}
                className="inline-flex rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
              >
                Sign in with another account
              </a>
              <LogoutButton callbackUrl={accessPath} label="Sign out" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <ResolvedAppHeader variant={headerVariant} />
      <GrantAccessView
        horseId={access.horse.id}
        horseName={access.horse.name}
        status={access.status}
        grant={access.grant}
        documents={access.documents}
      />
    </main>
  );
}
