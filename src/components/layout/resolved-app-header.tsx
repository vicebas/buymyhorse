import { getServerSession } from "next-auth";

import AppHeader, { type AppHeaderVariant } from "@/components/layout/app-header";
import LiveAppHeader from "@/components/layout/live-app-header";
import SellerAppHeader from "@/components/layout/seller-app-header";
import { authOptions } from "@/lib/auth/options";
import { getMessageNotificationSummary } from "@/lib/messages/inbox";
import { getHeaderCTAs } from "@/lib/mybarn/primary-cta";

interface ResolvedAppHeaderProps {
  variant: AppHeaderVariant;
}

export default async function ResolvedAppHeader({ variant }: ResolvedAppHeaderProps) {
  if (variant === "seller") {
    return <SellerAppHeader />;
  }

  if (variant === "buyer") {
    const session = await getServerSession(authOptions);
    const [notifications, ctas] = session?.user?.id
      ? await Promise.all([
          getMessageNotificationSummary(session.user.id, "buyer"),
          getHeaderCTAs(session.user.id),
        ])
      : [undefined, await getHeaderCTAs(null)];

    return (
      <LiveAppHeader
        variant="buyer"
        initialNotifications={notifications}
        primaryCta={ctas.primary}
        secondaryCta={ctas.secondary}
      />
    );
  }

  return <AppHeader variant="admin" />;
}
