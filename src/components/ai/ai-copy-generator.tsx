"use client";

import { Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  CopyGenerationEntityType,
  CopyGenerationMode,
  CopyGenerationScope,
  CopyGenerationTargetField,
} from "@/lib/ai/copy";

type AIContextBuilder = () => Record<string, string>;

export default function AICopyGenerator({
  entityType,
  targetField,
  scope,
  mode,
  horseId,
  title,
  description,
  getContext,
  onReplace,
  onAppend,
}: {
  entityType: CopyGenerationEntityType;
  targetField: CopyGenerationTargetField;
  scope: CopyGenerationScope;
  mode: CopyGenerationMode;
  horseId?: string | null;
  title: string;
  description: string;
  getContext: AIContextBuilder;
  onReplace: (nextValue: string) => void;
  onAppend: (nextValue: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");

  async function generateDraft() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/copy/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType,
          targetField,
          scope,
          mode,
          horseId: horseId || null,
          context: getContext(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Unable to generate copy right now.");
        return;
      }

      setDraft(data?.draft || "");
    } catch {
      setError("Unable to generate copy right now.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen() {
    setOpen(true);
    if (!draft && !loading) {
      await generateDraft();
    }
  }

  function handleReplace() {
    onReplace(draft);
    setOpen(false);
  }

  function handleAppend() {
    onAppend(draft);
    setOpen(false);
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={handleOpen} className="gap-2">
        <Sparkles className="h-4 w-4" />
        Generate with AI
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 px-4 py-4 sm:items-center sm:py-8">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-5 shadow-[0_32px_80px_rgba(9,28,46,0.36)] sm:max-h-[calc(100dvh-4rem)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--foreground-soft)]">
                  AI Copy
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[color:var(--foreground-strong)]">
                  {title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--foreground-soft)]">
                  {description}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close AI copy modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {error ? (
                <div className="rounded-2xl border border-[color:var(--destructive)]/20 bg-[color:var(--destructive)]/10 px-4 py-3 text-sm text-[color:var(--destructive)]">
                  {error}
                </div>
              ) : null}

              <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--card)] p-4">
                {loading ? (
                  <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-[color:var(--foreground-soft)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating English copy from the current form values...
                  </div>
                ) : (
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className="min-h-56 bg-transparent"
                    placeholder="Your AI draft will appear here."
                  />
                )}
              </div>

              <div className="flex flex-wrap justify-between gap-3">
                <Button type="button" variant="outline" onClick={generateDraft} disabled={loading}>
                  {loading ? "Working..." : draft ? "Try again" : "Generate draft"}
                </Button>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={handleAppend} disabled={loading || !draft.trim()}>
                    Append to field
                  </Button>
                  <Button type="button" onClick={handleReplace} disabled={loading || !draft.trim()}>
                    Replace field
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
