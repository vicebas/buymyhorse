import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import GrantAccessView from "@/components/horses/grant-access-view";
import ResolvedAppHeader from "@/components/layout/resolved-app-header";
import { authOptions } from "@/lib/auth/options";
import { getUserAppHeaderVariant } from "@/lib/auth/get-user-app-header-variant";
import { getBuyerHorseAccess } from "@/lib/vault/access";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HorseAccessPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const headerVariant = await getUserAppHeaderVariant(session.user.id);
  const access = await getBuyerHorseAccess(session.user.id, id);

  if (access.status === "ACTIVE" && access.grant?.id) {
    redirect(`/access/grants/${access.grant.id}`);
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <ResolvedAppHeader variant={headerVariant} />
      <GrantAccessView
        horseId={id}
        horseName={access.horse?.name || "Horse"}
        status={access.status}
        grant={access.grant}
        documents={access.documents}
      />
    </main>
  );
}
