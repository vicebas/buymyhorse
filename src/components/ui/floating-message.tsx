"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type FloatingMessage = { id: string; text: string; level?: "info" | "error" };

type FloatingMessageContext = {
  showMessage: (text: string, level?: FloatingMessage["level"]) => void;
};

const FloatingMessageCtx = createContext<FloatingMessageContext | null>(null);

export function useFloatingMessage() {
  const ctx = useContext(FloatingMessageCtx);
  if (!ctx) throw new Error("useFloatingMessage must be used within FloatingMessageProvider");
  return ctx;
}

export function FloatingMessageProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<FloatingMessage[]>([]);

  function showMessage(text: string, level: FloatingMessage["level"] = "info") {
    const id = Math.random().toString(36).slice(2);
    const msg: FloatingMessage = { id, text, level };
    setMessages((m) => [msg, ...m]);
    setTimeout(() => {
      setMessages((m) => m.filter((x) => x.id !== id));
    }, 5000);
  }

  const value = useMemo(() => ({ showMessage }), []);

  return (
    <FloatingMessageCtx.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-6 top-6 z-50 flex flex-col items-end gap-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`pointer-events-auto max-w-sm rounded-lg border p-3 shadow-lg transition-all duration-150 ${{
              info: "bg-[color:var(--card)] border-[color:var(--border)] text-[color:var(--foreground)]",
              error: "bg-[color:var(--destructive)] text-white border-[color:var(--destructive)]",
            }[m.level || "info"]}`}
          >
            <div className="text-sm">{m.text}</div>
          </div>
        ))}
      </div>
    </FloatingMessageCtx.Provider>
  );
}
