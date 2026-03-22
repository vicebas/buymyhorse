import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";
import { isAdminRole, isSuperAdminRole } from "@/lib/admin/roles";

export async function requireAdminPageSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    redirect("/dashboard");
  }

  return session;
}

export async function requireSuperAdminPageSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !isSuperAdminRole(session.user.role)) {
    redirect("/admin");
  }

  return session;
}
