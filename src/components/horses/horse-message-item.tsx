"use client";

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
  metadata?: {
    note?: string | null;
    expiresAt?: string | null;
    files?: GrantMetadataFile[];
  } | null;
  createdAt: string | Date;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

export default function HorseMessageItem({
  message,
  mine,
}: {
  message: Message;
  mine: boolean;
}) {
  if (message.messageType === "GRANT") {
    const files = message.metadata?.files || [];

    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[85%] rounded-2xl border border-[rgba(45,84,56,0.18)] bg-[rgba(45,84,56,0.08)] px-4 py-3 text-sm text-[#1f3b28]">
          <p className="font-medium">Document access granted</p>
          <p className="mt-1 text-[#1f3b28]">
            {files.length === 1 ? "1 file was shared." : `${files.length} files were shared.`}
          </p>

          {message.metadata?.expiresAt ? (
            <p className="mt-2 text-xs text-[#325340]">
              Access expires on {new Date(message.metadata.expiresAt).toLocaleString()}.
            </p>
          ) : null}

          {message.metadata?.note ? (
            <p className="mt-2 text-sm text-[#1f3b28]">Note: {message.metadata.note}</p>
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
