"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DOCUMENT_CATEGORY_OPTIONS } from "@/lib/vault/document-categories";

interface UploadHorseDocumentFormProps {
  horseId: string;
}

export default function UploadHorseDocumentForm({
  horseId,
}: UploadHorseDocumentFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Document title is required.");
      return;
    }

    if (!file) {
      setError("Please choose a file.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("file", file);

    setSubmitting(true);

    const res = await fetch(`/api/horses/${horseId}/documents`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Failed to upload document.");
      return;
    }

    setTitle("");
    setCategory("OTHER");
    setFile(null);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Document title</Label>
        <div className="relative">
          <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground-soft)]" />
          <Input
            id="title"
            placeholder="Veterinary record"
            className="pl-10"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {DOCUMENT_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">File</Label>
        <label
          htmlFor="file"
          className="flex cursor-pointer flex-col gap-2 rounded-[1.5rem] border border-dashed border-[color:var(--border)] bg-[color:var(--muted)]/55 px-4 py-5 transition hover:border-[color:var(--primary)] hover:bg-[color:var(--muted)]"
        >
          <span className="text-sm font-medium text-[color:var(--foreground-strong)]">
            {file ? file.name : "Choose a file to upload"}
          </span>
          <span className="text-sm text-[color:var(--foreground-soft)]">
            Private files stay in this horse vault until access is approved for a buyer.
          </span>
          <Input
            id="file"
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          "Upload document"
        )}
      </Button>
    </form>
  );
}
