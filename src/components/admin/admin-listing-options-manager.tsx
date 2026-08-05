"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { getListingOptionsForAdmin } from "@/lib/horses/listing-options";

type ListingOptionsData = Awaited<ReturnType<typeof getListingOptionsForAdmin>>;

export default function AdminListingOptionsManager({
  data,
}: {
  data: ListingOptionsData;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState("");

  async function submit(body: Record<string, unknown>, savingKeyValue: string) {
    setSavingKey(savingKeyValue);
    setError("");

    const res = await fetch("/api/admin/listing-options", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const response = await res.json().catch(() => null);
    setSavingKey("");

    if (!res.ok) {
      setError(response?.error || "Could not save listing option changes.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
        <p className="mono text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--foreground-soft)]">
          Listing Options
        </p>
        <h2 className="mt-2 text-3xl font-extrabold text-[color:var(--foreground-strong)]">
          Admin-managed marketplace dropdowns
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--foreground-soft)]">
          Control the option labels shown in seller horse creation and marketplace filters. Hidden options stay linked to
          older horses but disappear from new selections.
        </p>
        {error ? <p className="mt-4 text-sm text-[color:var(--destructive)]">{error}</p> : null}
      </div>

      <ListingOptionSection
        title="Primary Disciplines"
        resource="discipline"
        options={data.disciplines}
        savingKey={savingKey}
        onSubmit={submit}
      >
        {data.disciplines.map((discipline) => (
          <div key={discipline.id} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-4">
            <OptionRow
              resource="discipline"
              option={discipline}
              savingKey={savingKey}
              onSubmit={submit}
            />
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[color:var(--foreground-strong)]">Division Options</p>
                <NewOptionForm
                  resource="division"
                  disciplineId={discipline.id}
                  savingKey={savingKey}
                  onSubmit={submit}
                  compact
                />
              </div>
              <div className="space-y-2">
                {discipline.divisionOptions.map((division) => (
                  <OptionRow
                    key={division.id}
                    resource="division"
                    option={division}
                    disciplineId={discipline.id}
                    savingKey={savingKey}
                    onSubmit={submit}
                    compact
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </ListingOptionSection>

      <ListingOptionSection title="Ideal Rider" resource="idealRider" options={data.idealRiders} savingKey={savingKey} onSubmit={submit} />
      <ListingOptionSection title="Horse Type / Intended Use" resource="horseType" options={data.horseTypes} savingKey={savingKey} onSubmit={submit} />
      <ListingOptionSection title="Pricing Visibility" resource="pricingVisibility" options={data.pricingVisibility} savingKey={savingKey} onSubmit={submit} />
      <ListingOptionSection title="Sale Type" resource="saleType" options={data.saleTypes} savingKey={savingKey} onSubmit={submit} />
      <ListingOptionSection title="Breed" resource="breed" options={data.breeds} savingKey={savingKey} onSubmit={submit} />
      <ListingOptionSection title="Sire" resource="sire" options={data.sires} savingKey={savingKey} onSubmit={submit} />
      <ListingOptionSection title="Dam" resource="dam" options={data.dams} savingKey={savingKey} onSubmit={submit} />
      <ListingOptionSection title="Dam Sire" resource="damSire" options={data.damSires} savingKey={savingKey} onSubmit={submit} />
      <ListingOptionSection title="Sex" resource="sex" options={data.sexes} savingKey={savingKey} onSubmit={submit} />
      <ListingOptionSection title="Color" resource="color" options={data.colors} savingKey={savingKey} onSubmit={submit} />
      <ListingOptionSection title="Import Status" resource="importStatus" options={data.importStatuses} savingKey={savingKey} onSubmit={submit} />
    </div>
  );
}

function ListingOptionSection({
  title,
  resource,
  options,
  savingKey,
  onSubmit,
  children,
}: {
  title: string;
  resource: string;
  options: Array<{ id: string; label: string; sortOrder: number; isActive: boolean }>;
  savingKey: string;
  onSubmit: (body: Record<string, unknown>, savingKey: string) => Promise<void>;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">{title}</h3>
          <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">{options.length} options configured.</p>
        </div>
        <NewOptionForm resource={resource} savingKey={savingKey} onSubmit={onSubmit} />
      </div>

      <div className="mt-6 space-y-3">{children || options.map((option) => <OptionRow key={option.id} resource={resource} option={option} savingKey={savingKey} onSubmit={onSubmit} />)}</div>
    </section>
  );
}

function OptionRow({
  resource,
  option,
  disciplineId,
  savingKey,
  onSubmit,
  compact = false,
}: {
  resource: string;
  option: { id: string; label: string; sortOrder: number; isActive: boolean };
  disciplineId?: string;
  savingKey: string;
  onSubmit: (body: Record<string, unknown>, savingKey: string) => Promise<void>;
  compact?: boolean;
}) {
  const [label, setLabel] = useState(option.label);
  const [sortOrder, setSortOrder] = useState(String(option.sortOrder));
  const [isActive, setIsActive] = useState(option.isActive);
  const rowKey = `${resource}-${option.id}`;

  return (
    <div className={`rounded-2xl border border-[color:var(--border)] ${compact ? "bg-[color:var(--card)] p-3" : "bg-[color:var(--background-elevated)] p-4"}`}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_auto_auto] md:items-center">
        <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Option label" />
        <Input
          type="number"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          placeholder="Sort"
        />
        <label className="flex items-center gap-2 text-sm text-[color:var(--foreground)]">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4 rounded border-[color:var(--border)]"
          />
          Active
        </label>
        <Button
          type="button"
          onClick={() =>
            onSubmit(
              {
                action: "update",
                resource,
                id: option.id,
                label,
                sortOrder: Number(sortOrder) || 0,
                isActive,
                disciplineId,
              },
              rowKey
            )
          }
          disabled={savingKey === rowKey}
        >
          {savingKey === rowKey ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

function NewOptionForm({
  resource,
  disciplineId,
  savingKey,
  onSubmit,
  compact = false,
}: {
  resource: string;
  disciplineId?: string;
  savingKey: string;
  onSubmit: (body: Record<string, unknown>, savingKey: string) => Promise<void>;
  compact?: boolean;
}) {
  const [label, setLabel] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const formKey = `${resource}-new-${disciplineId || "root"}`;

  return (
    <div className={`flex flex-col gap-2 ${compact ? "md:flex-row md:items-center" : "max-w-xl"}`}>
      <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="New option label" />
      <Input
        type="number"
        value={sortOrder}
        onChange={(event) => setSortOrder(event.target.value)}
        placeholder="Sort"
        className={compact ? "md:w-28" : ""}
      />
      <Button
        type="button"
        disabled={savingKey === formKey || !label.trim()}
        onClick={async () => {
          await onSubmit(
            {
              action: "create",
              resource,
              label,
              sortOrder: Number(sortOrder) || 0,
              disciplineId,
            },
            formKey
          );
          setLabel("");
          setSortOrder("");
        }}
      >
        {savingKey === formKey ? "Adding..." : "Add"}
      </Button>
    </div>
  );
}
