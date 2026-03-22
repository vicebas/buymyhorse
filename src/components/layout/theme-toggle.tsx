"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "horseroster-theme";

type ThemeMode = "light" | "dark";

export function ThemeToggle({
  surface = "dark",
}: {
  surface?: "light" | "dark";
}) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  function toggleTheme() {
    const nextMode = mode === "light" ? "dark" : "light";
    setMode(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
  }

  const label = mode === "light" ? "Theme: Light" : "Theme: Dark";
  const Icon = mode === "light" ? Sun : Moon;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
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
