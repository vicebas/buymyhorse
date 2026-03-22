import { getServerSession } from "next-auth";

import MainHeaderClient, {
  type MainHeaderActiveItem,
} from "@/components/layout/main-header-client";
import { authOptions } from "@/lib/auth/options";

export default async function MainHeader({
  activeItem = "dashboard",
}: {
  activeItem?: MainHeaderActiveItem;
}) {
  const session = await getServerSession(authOptions);

  return <MainHeaderClient activeItem={activeItem} hasSession={Boolean(session?.user)} />;
}
