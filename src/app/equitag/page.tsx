import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/db/prisma";

export default async function EquiTagPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/dashboard");
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  redirect(seller ? "/mybarn" : "/dashboard");
}
