"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DOCUMENT_CATEGORY_OPTIONS, formatDocumentCategory } from "@/lib/vault/document-categories";

export default function VaultDocumentActions({
  horseId,
  document,
}: {
  horseId: string;
  document: {
    id: string;
    title: string;
    category: string;
  };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(document.title);
  const [category, setCategory] = useState(document.category);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");

    const res = await fetch(`/api/horses/${horseId}/documents/${document.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        category,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Unable to update document.");
      return;
    }

    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    const confirmed = window.confirm("Soft-delete this vault document?");

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    const res = await fetch(`/api/horses/${horseId}/documents/${document.id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    setDeleting(false);

    if (!res.ok) {
      setError(data.error || "Unable to delete document.");
      return;
    }

    router.refresh();
  }

  function handleCancel() {
    setEditing(false);
    setTitle(document.title);
    setCategory(document.category);
    setError("");
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="rounded-full bg-[color:var(--background-elevated)] px-3 py-1 text-xs font-medium text-[color:var(--foreground-soft)]">
          Category: {formatDocumentCategory(document.category)}
        </span>
        <Button type="button" variant="outline" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button type="button" variant="outline" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-4">
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
          Title
        </label>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
          Category
        </label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background)] px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {DOCUMENT_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving || deleting}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
