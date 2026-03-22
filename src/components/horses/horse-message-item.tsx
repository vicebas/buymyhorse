"use client";

import Link from "next/link";

type GrantMetadataFile = {
  id: string;
  title: string;
  fileName: string;
  category: string;
};

type Message = {
  id: string;
  body: string | null;
  messageType: "TEXT" | "GRANT";
  accessGrantId?: string | null;
  metadata?: unknown;
  createdAt: string | Date;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

function readGrantMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {
      note: null,
      expiresAt: null,
      accessGrantId: null,
      files: [] as GrantMetadataFile[],
    };
  }

  const value = metadata as {
    note?: unknown;
    expiresAt?: unknown;
    accessGrantId?: unknown;
    files?: unknown;
  };

  const files = Array.isArray(value.files)
    ? value.files.filter((file): file is GrantMetadataFile => {
        if (!file || typeof file !== "object" || Array.isArray(file)) {
          return false;
        }

        const item = file as Record<string, unknown>;

        return (
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          typeof item.fileName === "string" &&
          typeof item.category === "string"
        );
      })
    : [];

  return {
    note: typeof value.note === "string" ? value.note : null,
    expiresAt: typeof value.expiresAt === "string" ? value.expiresAt : null,
    accessGrantId:
      typeof value.accessGrantId === "string" ? value.accessGrantId : null,
    files,
  };
}

export default function HorseMessageItem({
  message,
  mine,
}: {
  message: Message;
  mine: boolean;
}) {
  if (message.messageType === "GRANT") {
    const grantMetadata = readGrantMetadata(message.metadata);
    const files = grantMetadata.files;
    const accessGrantId = message.accessGrantId || grantMetadata.accessGrantId;

    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[85%] rounded-2xl border border-[rgba(45,84,56,0.18)] bg-[rgba(45,84,56,0.08)] px-4 py-3 text-sm text-[#1f3b28]">
          <p className="font-medium">Document access granted</p>
          <p className="mt-1 text-[#1f3b28]">
            {files.length === 1 ? "1 file was shared." : `${files.length} files were shared.`}
          </p>

          {grantMetadata.expiresAt ? (
            <p className="mt-2 text-xs text-[#325340]">
              Access expires on {new Date(grantMetadata.expiresAt).toLocaleString()}.
            </p>
          ) : null}

          {grantMetadata.note ? (
            <p className="mt-2 text-sm text-[#1f3b28]">Note: {grantMetadata.note}</p>
          ) : null}

          {files.length > 0 ? (
            <div className="mt-3 space-y-1">
              {files.map((file) => (
                <div key={file.id} className="rounded-lg bg-[color:var(--background-elevated)]/80 px-3 py-2 text-xs text-[#1f3b28]">
                  {file.title}
                  <span className="ml-2 uppercase tracking-[0.12em] text-[#325340]">
                    {file.category.replaceAll("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {accessGrantId ? (
            <Link
              href={`/access/grants/${accessGrantId}`}
              className="mt-3 inline-flex text-xs font-medium underline underline-offset-4"
            >
              Open shared documents
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
          mine
            ? "bg-[color:var(--accent)] text-[color:var(--accent-foreground)]"
            : "bg-[color:var(--muted)] text-[color:var(--foreground-strong)]"
        }`}
      >
        <p>{message.body}</p>
      </div>
    </div>
  );
}
