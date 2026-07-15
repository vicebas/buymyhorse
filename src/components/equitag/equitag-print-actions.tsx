"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function EquiTagPrintActions() {
  return (
    <div className="print:hidden">
      <Button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2">
        <Printer className="h-4 w-4" />
        Print
      </Button>
    </div>
  );
}
