"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "horseroster-theme";

type ThemeMode = "light" | "dark" | "system";

function resolveTheme(mode: ThemeMode) {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return mode;
}

export function ThemeToggle({
  surface = "dark",
}: {
  surface?: "light" | "dark";
}) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "system";
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const theme = resolveTheme(mode);
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    };

    applyTheme();

    const onChange = () => {
      if (mode === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", onChange);

    return () => mediaQuery.removeEventListener("change", onChange);
  }, [mode]);

  function cycleTheme() {
    const nextMode = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    setMode(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
  }

  const label = mode === "system" ? "Theme: System" : mode === "light" ? "Theme: Light" : "Theme: Dark";
  const Icon = mode === "system" ? Monitor : mode === "light" ? Sun : Moon;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={cycleTheme}
      className={
        surface === "light"
          ? "border-[color:var(--border)] bg-[color:var(--background-elevated)] text-[color:var(--foreground-strong)] hover:bg-[color:var(--muted)]"
          : "border-white/14 bg-[#173754] text-[#f8f6f2] hover:bg-[#214867] hover:text-white"
      }
    >
      <Icon className="size-4" />
    </Button>
  );
}
