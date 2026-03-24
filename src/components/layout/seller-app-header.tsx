import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import LiveAppHeader from "@/components/layout/live-app-header";
import { getMessageNotificationSummary } from "@/lib/messages/inbox";
import { getHeaderCTAs } from "@/lib/mybarn/primary-cta";

export default async function SellerAppHeader() {
  const session = await getServerSession(authOptions);
  const notifications = session?.user?.id
    ? await getMessageNotificationSummary(session.user.id, "seller")
    : {
        unreadMessageCount: 0,
        pendingRequestCount: 0,
      };
  const ctas = await getHeaderCTAs(session?.user?.id);

  return (
    <LiveAppHeader
      variant="seller"
      initialNotifications={notifications}
      user={{
        name: session?.user?.name,
        email: session?.user?.email,
        image: session?.user?.image,
      }}
      primaryCta={ctas.primary}
      secondaryCta={ctas.secondary}
    />
  );
}
