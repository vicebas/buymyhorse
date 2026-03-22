"use client";

import { useState } from "react";
import { MessageSquare, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import HorseChat from "@/components/horses/horse-chat";

export default function HorseChatPanel({
  horseId,
  currentUserId,
}: {
  horseId: string;
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-10">
      {!open ? (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 h-10 btn-brand-green"
        >
          <MessageSquare className="h-4 w-4" />
          Contact Barn
        </Button>
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8">
          <div className="w-full max-w-3xl rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl text-stone-900">Contact Barn</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Ask questions about this horse, availability, records, and next steps.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>

            <HorseChat horseId={horseId} currentUserId={currentUserId} />
          </div>
        </div>
      )}
    </section>
  );
}
