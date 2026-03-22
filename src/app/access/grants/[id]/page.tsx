import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import GrantAccessView from "@/components/horses/grant-access-view";
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

  if (!session?.user?.id) {
    redirect("/login");
  }

  const access = await getBuyerGrantAccess(id, session.user.id);

  if (!access) {
    notFound();
  }

  const headerVariant = await getUserAppHeaderVariant(session.user.id);

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
