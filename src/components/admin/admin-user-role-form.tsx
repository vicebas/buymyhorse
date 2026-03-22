"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export default function AdminUserRoleForm({
  userId,
  currentRole,
  disabled,
}: {
  userId: string;
  currentRole: "BUYER" | "SELLER" | "ADMIN" | "SUPER_ADMIN";
  disabled?: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState<"BUYER" | "ADMIN" | "SUPER_ADMIN">(
    currentRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : currentRole === "ADMIN" ? "ADMIN" : "BUYER"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    setLoading(true);

    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error || "Unable to update user role.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-3">
      <select
        value={role}
        onChange={(event) => setRole(event.target.value as typeof role)}
        disabled={disabled || loading}
        className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm"
      >
        <option value="BUYER">Buyer</option>
        <option value="ADMIN">Admin</option>
        <option value="SUPER_ADMIN">Super Admin</option>
      </select>

      <Button type="button" onClick={handleSubmit} disabled={disabled || loading}>
        {loading ? "Saving..." : "Update Role"}
      </Button>

      {error ? <p className="text-xs text-[color:var(--destructive)]">{error}</p> : null}
    </div>
  );
}
