"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UploadHorseDocumentFormProps {
  horseId: string;
}

const documentCategories = [
  { value: "XRAYS", label: "X-Rays" },
  { value: "PPE", label: "PPE" },
  { value: "VET_REPORTS", label: "Vet Reports" },
  { value: "CONTRACTS", label: "Contracts" },
  { value: "PASSPORT", label: "Passport" },
  { value: "COMPETITION_RECORDS", label: "Competition Records" },
  { value: "CARE", label: "Care" },
  { value: "OTHER", label: "Other" },
];

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
          <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
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
          className="flex h-10 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
        >
          {documentCategories.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">File</Label>
        <Input
          id="file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
