"use client";

import { useCallback, useEffect, useRef } from "react";

export function useLivePoll({
  enabled,
  intervalMs = 5000,
  onPoll,
}: {
  enabled: boolean;
  intervalMs?: number;
  onPoll: () => Promise<void> | void;
}) {
  const pollingRef = useRef(false);
  const onPollRef = useRef(onPoll);

  useEffect(() => {
    onPollRef.current = onPoll;
  }, [onPoll]);

  const runPoll = useCallback(async () => {
    if (!enabled) {
      return;
    }

    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return;
    }

    if (pollingRef.current) {
      return;
    }

    pollingRef.current = true;

    try {
      await onPollRef.current();
    } finally {
      pollingRef.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void runPoll();

    const intervalId = window.setInterval(() => {
      void runPoll();
    }, intervalMs);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void runPoll();
      }
    }

    function handleFocus() {
      void runPoll();
    }

    function handleOnline() {
      void runPoll();
    }

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, intervalMs, runPoll]);

  return {
    refreshNow: () => {
      void runPoll();
    },
  };
}
