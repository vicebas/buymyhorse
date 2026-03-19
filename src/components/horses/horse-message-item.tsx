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
        <div className="max-w-[85%] rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <p className="font-medium">Document access granted</p>
          <p className="mt-1 text-emerald-900">
            {files.length === 1 ? "1 file was shared." : `${files.length} files were shared.`}
          </p>

          {message.metadata?.expiresAt ? (
            <p className="mt-2 text-xs text-emerald-800">
              Access expires on {new Date(message.metadata.expiresAt).toLocaleString()}.
            </p>
          ) : null}

          {message.metadata?.note ? (
            <p className="mt-2 text-sm text-emerald-900">Note: {message.metadata.note}</p>
          ) : null}

          {files.length > 0 ? (
            <div className="mt-3 space-y-1">
              {files.map((file) => (
                <div key={file.id} className="rounded-lg bg-white/70 px-3 py-2 text-xs text-emerald-950">
                  {file.title}
                  <span className="ml-2 uppercase tracking-[0.12em] text-emerald-700">
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
          mine ? "bg-stone-900 text-white" : "bg-stone-300 text-stone-900"
        }`}
      >
        <p>{message.body}</p>
      </div>
    </div>
  );
}
