"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";

interface NotificationPref {
  systemNewHorseFromFollowedBarn: boolean;
  systemHorseUpdatedFromFollowedBarn: boolean;
  systemNewMessage: boolean;
  emailNewHorseFromFollowedBarn: boolean;
  emailHorseUpdatedFromFollowedBarn: boolean;
  emailNewMessage: boolean;
}

type PrefKey = keyof NotificationPref;

const DEFAULT_PREFS: NotificationPref = {
  systemNewHorseFromFollowedBarn: true,
  systemHorseUpdatedFromFollowedBarn: true,
  systemNewMessage: true,
  emailNewHorseFromFollowedBarn: false,
  emailHorseUpdatedFromFollowedBarn: false,
  emailNewMessage: false,
};

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
        "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]",
        checked ? "bg-[color:var(--primary)]" : "bg-[color:var(--border)]",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

function PrefRow({
  label,
  prefKey,
  prefs,
  onToggle,
}: {
  label: string;
  prefKey: PrefKey;
  prefs: NotificationPref;
  onToggle: (key: PrefKey) => void;
}) {
  const id = `notif-${prefKey}`;
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <Label htmlFor={id} className="cursor-pointer text-sm font-medium text-[color:var(--foreground-strong)]">
        {label}
      </Label>
      <Toggle
        id={id}
        checked={prefs[prefKey]}
        onChange={() => onToggle(prefKey)}
      />
    </div>
  );
}

export default function NotificationPreferencesForm() {
  const [prefs, setPrefs] = useState<NotificationPref>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [savedKey, setSavedKey] = useState<PrefKey | null>(null);

  useEffect(() => {
    fetch("/api/settings/notifications")
      .then((r) => r.json())
      .then((data: NotificationPref) => {
        setPrefs((prev) => ({ ...prev, ...data }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleToggle(key: PrefKey) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);

    await fetch("/api/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next[key] }),
    });

    setSavedKey(key);
    setTimeout(() => setSavedKey(null), 1800);
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3"
          >
            <div className="h-4 w-48 rounded-full bg-[color:var(--muted)]" />
            <div className="h-6 w-11 rounded-full bg-[color:var(--muted)]" />
          </div>
        ))}
      </div>
    );
  }

  const rows: { label: string; key: PrefKey }[] = [
    { label: "New horse from a followed barn", key: "systemNewHorseFromFollowedBarn" },
    { label: "Horse updates from followed barns", key: "systemHorseUpdatedFromFollowedBarn" },
    { label: "New messages", key: "systemNewMessage" },
  ];

  const emailRows: { label: string; key: PrefKey }[] = [
    { label: "New horse from a followed barn", key: "emailNewHorseFromFollowedBarn" },
    { label: "Horse updates from followed barns", key: "emailHorseUpdatedFromFollowedBarn" },
    { label: "New messages", key: "emailNewMessage" },
  ];

  return (
    <div className="space-y-5">
      {/* In-App Notifications */}
      <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-6">
        <h3 className="text-base font-extrabold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
          In-App Notifications
        </h3>
        <div className="mt-3 divide-y divide-[color:var(--border)]">
          {rows.map(({ label, key }) => (
            <div key={key} className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor={`notif-${key}`}
                  className="cursor-pointer text-sm font-medium text-[color:var(--foreground-strong)]"
                >
                  {label}
                </Label>
                {savedKey === key && (
                  <Check className="h-3.5 w-3.5 text-[color:var(--primary)] transition-opacity" />
                )}
              </div>
              <Toggle
                id={`notif-${key}`}
                checked={prefs[key]}
                onChange={() => handleToggle(key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Email Notifications */}
      <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-6">
        <h3 className="text-base font-extrabold uppercase tracking-[0.14em] text-[color:var(--foreground-soft)]">
          Email Notifications
        </h3>
        <div className="mt-3 divide-y divide-[color:var(--border)]">
          {emailRows.map(({ label, key }) => (
            <div key={key} className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor={`notif-${key}`}
                  className="cursor-pointer text-sm font-medium text-[color:var(--foreground-strong)]"
                >
                  {label}
                </Label>
                {savedKey === key && (
                  <Check className="h-3.5 w-3.5 text-[color:var(--primary)] transition-opacity" />
                )}
              </div>
              <Toggle
                id={`notif-${key}`}
                checked={prefs[key]}
                onChange={() => handleToggle(key)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
