"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Share2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDocumentCategory } from "@/lib/vault/document-categories";

type ShareableDocument = {
  id: string;
  title: string;
  fileName: string;
  category: string;
};

export default function ShareDocumentsButton({
  horseId,
  horseName,
  documents,
}: {
  horseId: string;
  horseName: string;
  documents: ShareableDocument[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  function toggleSelection(fileId: string) {
    setSelectedFileIds((currentIds) =>
      currentIds.includes(fileId)
        ? currentIds.filter((currentId) => currentId !== fileId)
        : [...currentIds, fileId]
    );
  }

  function closeModal() {
    if (loading) {
      return;
    }

    setOpen(false);
    setError("");
  }

  async function handleShare() {
    if (selectedFileIds.length === 0) {
      setError("Select at least one document to share.");
      return;
    }

    if (!recipientEmail.trim()) {
      setError("Enter the recipient email.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setWarning("");

    const res = await fetch(`/api/horses/${horseId}/share-documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileIds: selectedFileIds,
        recipientEmail,
        message,
      }),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Unable to share documents right now.");
      return;
    }

    setOpen(false);
    setSelectedFileIds([]);
    setRecipientEmail("");
    setMessage("");
    setSuccess(`Secure access sent for ${horseName}.`);
    setWarning(data.warning || "");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2">
        <Share2 className="h-4 w-4" />
        Share Documents
      </Button>

      {success ? (
        <p className="max-w-64 text-right text-xs text-emerald-700">{success}</p>
      ) : null}

      {warning ? (
        <p className="max-w-64 text-right text-xs text-amber-700">{warning}</p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-4 sm:py-8">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-hover)] sm:max-h-[calc(100dvh-4rem)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">Share documents</h2>
                <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
                  Choose the files to share for {horseName}, then send secure access to the recipient.
                </p>
              </div>

              <Button type="button" variant="outline" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium text-[color:var(--foreground-strong)]">
                  Select documents to share
                </p>
                <div className="space-y-2">
                  {documents.map((document) => (
                    <label
                      key={document.id}
                      className="flex items-start gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-3 text-sm text-[color:var(--foreground)]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFileIds.includes(document.id)}
                        onChange={() => toggleSelection(document.id)}
                        className="mt-1 accent-[color:var(--accent)]"
                      />
                      <span>
                        <span className="block font-medium text-[color:var(--foreground-strong)]">
                          {document.title}
                        </span>
                        <span className="block text-xs text-[color:var(--foreground-soft)]">
                          {formatDocumentCategory(document.category)} · {document.fileName}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-[color:var(--foreground-strong)]">Recipient email</p>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="buyer@example.com"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-[color:var(--foreground-strong)]">Message (optional)</p>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Here are ${horseName}'s records.`}
                />
              </div>

              <div className="rounded-2xl border border-[rgba(45,84,56,0.18)] bg-[rgba(45,84,56,0.08)] px-4 py-3 text-sm text-[#2d5438]">
                The recipient will receive secure access only to the documents you select for this horse.
              </div>

              {error ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button type="button" onClick={handleShare} disabled={loading} className="w-full">
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Sending access..." : "Send Access"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
