"use client";

import { useState } from "react";

import AppHeader, {
  type AppHeaderCTA,
  type AppHeaderUser,
  type AppHeaderVariant,
} from "@/components/layout/app-header";
import { useLivePoll } from "@/hooks/use-live-poll";

type HeaderNotifications = {
  unreadMessageCount: number;
  pendingRequestCount: number;
};

export default function LiveAppHeader({
  variant,
  initialNotifications,
  user,
  primaryCta,
  secondaryCta,
}: {
  variant: AppHeaderVariant;
  initialNotifications?: HeaderNotifications;
  user?: AppHeaderUser;
  primaryCta?: AppHeaderCTA | null;
  secondaryCta?: AppHeaderCTA | null;
}) {
  const [notifications, setNotifications] = useState<HeaderNotifications>(
    initialNotifications ?? {
      unreadMessageCount: 0,
      pendingRequestCount: 0,
    }
  );

  const shouldPoll = variant === "buyer" || variant === "seller";
  const scope = variant === "seller" ? "seller" : "buyer";

  useLivePoll({
    enabled: shouldPoll,
    intervalMs: 5000,
    onPoll: async () => {
      const response = await fetch(`/api/messages/summary?scope=${scope}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const nextNotifications = (await response.json()) as HeaderNotifications;

      setNotifications((current) =>
        current.unreadMessageCount === nextNotifications.unreadMessageCount &&
        current.pendingRequestCount === nextNotifications.pendingRequestCount
          ? current
          : nextNotifications
      );
    },
  });

  return (
    <AppHeader
      variant={variant}
      notifications={notifications}
      user={user}
      primaryCta={primaryCta}
      secondaryCta={secondaryCta}
    />
  );
}
