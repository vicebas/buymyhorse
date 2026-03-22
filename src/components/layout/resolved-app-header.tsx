import { getServerSession } from "next-auth";

import AppHeader, { type AppHeaderVariant } from "@/components/layout/app-header";
import LiveAppHeader from "@/components/layout/live-app-header";
import SellerAppHeader from "@/components/layout/seller-app-header";
import { authOptions } from "@/lib/auth/options";
import { getMessageNotificationSummary } from "@/lib/messages/inbox";

interface ResolvedAppHeaderProps {
  variant: AppHeaderVariant;
}

export default async function ResolvedAppHeader({ variant }: ResolvedAppHeaderProps) {
  if (variant === "seller") {
    return <SellerAppHeader />;
  }

  if (variant === "buyer") {
    const session = await getServerSession(authOptions);
    const notifications = session?.user?.id
      ? await getMessageNotificationSummary(session.user.id, "buyer")
      : undefined;

    return (
      <LiveAppHeader variant="buyer" initialNotifications={notifications} />
    );
  }

  return <AppHeader variant="admin" />;
}
