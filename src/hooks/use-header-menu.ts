"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function useHeaderMenu() {
  const pathname = usePathname();
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isOpen = openPathname === pathname;

  const close = useCallback(() => {
    setOpenPathname(null);
  }, []);

  const toggle = useCallback(() => {
    setOpenPathname((current) => (current === pathname ? null : pathname));
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isOpen]);

  return {
    close,
    containerRef,
    isOpen,
    toggle,
  };
}
