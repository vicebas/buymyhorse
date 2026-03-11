"use client";

import { useState } from "react";
import { MessageSquare, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import HorseChat from "@/components/horses/horse-chat";

export default function HorseChatPanel({ horseId }: { horseId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-10">
      {!open ? (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Contact Seller
        </Button>
      ) : (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl text-stone-900">Contact Seller</h2>
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

          <HorseChat horseId={horseId} />
        </div>
      )}
    </section>
  );
}