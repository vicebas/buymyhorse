"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone, NotebookPen } from "lucide-react";

import AICopyGenerator from "@/components/ai/ai-copy-generator";
import HorseMultiSelect from "@/components/horses/horse-multi-select";
import HorsePhotoManager, {
  type HorsePhotoPlan,
} from "@/components/horses/horse-photo-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HORSE_DIVISION_CONTEXTS } from "@/lib/horses/listing-option-definitions";

type SelectOption = {
  id: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

type DisciplineOption = SelectOption & {
  divisionOptions: SelectOption[];
};

type HorseFormValues = {
  name: string;
  age: string;
  description: string;
  height: string;
  location: string;
  isPublished: boolean;
  image?: string | null;
  keyDetails: string;
  breedOptionId: string;
  sexOptionId: string;
  primaryDisciplineId: string;
  pricingVisibilityOptionId: string;
  saleTypeIds: string[];
  colorOptionId: string;
  importStatusOptionId: string;
  secondaryDisciplineIds: string[];
  bestSuitedForIds: string[];
  currentlyCompetingInIds: string[];
  experiencedThroughIds: string[];
  horseTypeIds: string[];
  feiPassport: boolean;
  equiVaultAvailable: boolean;
  sire: string;
  dam: string;
  damSire: string;
  showHighlights: string;
};

type ExistingGalleryImage = {
  id: string;
  processedPath: string | null;
  fileName: string;
};

interface HorseFormProps {
  mode: "create" | "edit";
  options: {
    disciplines: DisciplineOption[];
    idealRiders: SelectOption[];
    horseTypes: SelectOption[];
    pricingVisibility: SelectOption[];
    saleTypes: SelectOption[];
    breeds: SelectOption[];
    sires: SelectOption[];
    dams: SelectOption[];
    damSires: SelectOption[];
    sexes: SelectOption[];
    colors: SelectOption[];
    importStatuses: SelectOption[];
  };
  initialValues?: Partial<HorseFormValues>;
  horseId?: string;
  existingGalleryImages?: ExistingGalleryImage[];
}

const defaultValues: HorseFormValues = {
  name: "",
  age: "",
  description: "",
  height: "",
  location: "",
  isPublished: true,
  image: null,
  keyDetails: "",
  breedOptionId: "",
  sexOptionId: "",
  primaryDisciplineId: "",
  pricingVisibilityOptionId: "",
  saleTypeIds: [],
  colorOptionId: "",
  importStatusOptionId: "",
  secondaryDisciplineIds: [],
  bestSuitedForIds: [],
  currentlyCompetingInIds: [],
  experiencedThroughIds: [],
  horseTypeIds: [],
  feiPassport: false,
  equiVaultAvailable: false,
  sire: "",
  dam: "",
  damSire: "",
  showHighlights: "",
};

const selectClasses =
  "flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[color:var(--border)] bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="flex flex-col gap-4 border-b border-[color:var(--border)] pb-5 md:flex-row md:items-start">
        {icon ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--muted)] text-[color:var(--foreground-strong)]">
            {icon}
          </div>
        ) : null}

        <div>
          <h2 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--foreground-soft)]">{description}</p>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function HorseForm({
  mode,
  options,
  initialValues,
  horseId,
  existingGalleryImages = [],
}: HorseFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const values: HorseFormValues = {
    ...defaultValues,
    ...initialValues,
  };

  const [description, setDescription] = useState(values.description);
  const [primaryDisciplineId, setPrimaryDisciplineId] = useState(values.primaryDisciplineId);
  const [secondaryDisciplineIds, setSecondaryDisciplineIds] = useState(values.secondaryDisciplineIds);
  const [bestSuitedForIds, setBestSuitedForIds] = useState(values.bestSuitedForIds);
  const [currentlyCompetingInIds, setCurrentlyCompetingInIds] = useState(values.currentlyCompetingInIds);
  const [experiencedThroughIds, setExperiencedThroughIds] = useState(values.experiencedThroughIds);
  const [saleTypeIds, setSaleTypeIds] = useState(values.saleTypeIds);
  const [horseTypeIds, setHorseTypeIds] = useState(values.horseTypeIds);
  const [photoPlan, setPhotoPlan] = useState<HorsePhotoPlan>({ items: [] });

  const visibleDivisionOptions = useMemo(() => {
    const activeDisciplineIds = new Set([primaryDisciplineId, ...secondaryDisciplineIds].filter(Boolean));
    return options.disciplines.flatMap((discipline) =>
      activeDisciplineIds.has(discipline.id)
        ? discipline.divisionOptions.map((division) => ({
            ...division,
            disciplineLabel: discipline.label,
          }))
        : []
    );
  }, [options.disciplines, primaryDisciplineId, secondaryDisciplineIds]);

  function getContextLabels(ids: string[]) {
    return ids
      .map((id) => visibleDivisionOptions.find((option) => option.id === id)?.label || "")
      .filter(Boolean)
      .join(", ");
  }

  function getDescriptionContext() {
    const formData = formRef.current ? new FormData(formRef.current) : new FormData();
    const selectedBestSuitedFor = formData.getAll("bestSuitedForIds").map(String);
    const selectedCurrentlyShowing = formData.getAll("currentlyCompetingInIds").map(String);
    const selectedExperiencedThrough = formData.getAll("experiencedThroughIds").map(String);

    return {
      name: String(formData.get("name") || "").trim(),
      breed: String(options.breeds.find((option) => option.id === String(formData.get("breedOptionId") || ""))?.label || ""),
      age: String(formData.get("age") || "").trim(),
      discipline: String(
        options.disciplines.find((option) => option.id === String(formData.get("primaryDisciplineId") || ""))?.label || ""
      ),
      currentlyShowing: getContextLabels(selectedCurrentlyShowing),
      experiencedThrough: getContextLabels(selectedExperiencedThrough),
      bestSuitedFor: getContextLabels(selectedBestSuitedFor),
      height: String(formData.get("height") || "").trim(),
      gender: String(options.sexes.find((option) => option.id === String(formData.get("sexOptionId") || ""))?.label || ""),
      location: String(formData.get("location") || "").trim(),
      price: String(
        options.pricingVisibility.find((option) => option.id === String(formData.get("pricingVisibilityOptionId") || ""))?.label || ""
      ),
      keyDetails: String(formData.get("keyDetails") || "").trim(),
      description: String(formData.get("description") || description || "").trim(),
    };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const serializablePhotoPlan = photoPlan.items.map((item) => {
      if (item.source === "new") {
        form.append("newPhotoFiles", item.file);
        return {
          id: item.id,
          source: item.source,
          isPrimary: item.isPrimary,
        };
      }

      if (item.source === "existing-gallery") {
        return {
          id: item.id,
          source: item.source,
          existingMediaId: item.existingMediaId,
          isPrimary: item.isPrimary,
        };
      }

      return {
        id: item.id,
        source: item.source,
        isPrimary: item.isPrimary,
      };
    });

    form.set("photoPlan", JSON.stringify(serializablePhotoPlan));

    setSubmitError("");
    setLoading(true);

    const url = mode === "create" ? "/api/horses/create" : `/api/horses/${horseId}/update`;
    const res = await fetch(url, {
      method: "POST",
      body: form,
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setSubmitError(data?.error || "Could not save this horse right now.");
      return;
    }

    router.push("/mybarn");
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      <FormSection
        icon={<Megaphone className="h-5 w-5" />}
        title="Horse Photos"
        description="Build the photo order here, choose the primary image buyers will see first, and save the whole listing in one pass."
      >
        <HorsePhotoManager
          initialPrimaryImage={values.image}
          initialGalleryImages={existingGalleryImages}
          horseName={values.name}
          onChange={setPhotoPlan}
        />
      </FormSection>

      <FormSection
        icon={<NotebookPen className="h-5 w-5" />}
        title="Basic Details"
        description="Set the horse identity, structured listing fields, and the metadata buyers will filter by first."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="name">Horse Name</Label>
            <Input id="name" name="name" placeholder="e.g. Sterling Knight" defaultValue={values.name} required />
          </div>

          <div className="md:col-span-2">
            <HorseMultiSelect
              label="Sale Type"
              name="saleTypeIds"
              options={options.saleTypes}
              selected={saleTypeIds}
              onChange={setSaleTypeIds}
              placeholder="Select sale type"
            />
          </div>

          <SelectField id="pricingVisibilityOptionId" label="Pricing Visibility" defaultValue={values.pricingVisibilityOptionId} options={options.pricingVisibility} placeholder="Select pricing visibility" />
          <SelectField id="breedOptionId" label="Breed" defaultValue={values.breedOptionId} options={options.breeds} placeholder="Select breed" />
          <SelectField id="sexOptionId" label="Sex" defaultValue={values.sexOptionId} options={options.sexes} placeholder="Select sex" />
          <SelectField id="colorOptionId" label="Color" defaultValue={values.colorOptionId} options={options.colors} placeholder="Select color" />
          <SelectField id="importStatusOptionId" label="Import Status" defaultValue={values.importStatusOptionId} options={options.importStatuses} placeholder="Select import status" />

          <div>
            <Label htmlFor="age">Age (years)</Label>
            <Input id="age" name="age" type="number" placeholder="e.g. 8" defaultValue={values.age} />
          </div>

          <div>
            <Label htmlFor="height">Height (hands)</Label>
            <Input id="height" name="height" placeholder="e.g. 16.2" defaultValue={values.height} />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="e.g. Wellington, FL" defaultValue={values.location} />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Bloodlines"
        description="Optional bloodline details for the completed horse profile."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <Label htmlFor="sire">Sire</Label>
            <Input id="sire" name="sire" placeholder="Enter sire" defaultValue={values.sire} />
          </div>
          <div>
            <Label htmlFor="dam">Dam</Label>
            <Input id="dam" name="dam" placeholder="Enter dam" defaultValue={values.dam} />
          </div>
          <div>
            <Label htmlFor="damSire">Dam Sire</Label>
            <Input id="damSire" name="damSire" placeholder="Enter dam sire" defaultValue={values.damSire} />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Discipline Setup"
        description="Choose the primary discipline, crossover disciplines, and the divisions buyers should discover this horse through."
      >
        <div className="space-y-6">
          <SelectField
            id="primaryDisciplineId"
            label="Primary Discipline"
            defaultValue={values.primaryDisciplineId}
            options={options.disciplines}
            placeholder="Select primary discipline"
            onChange={setPrimaryDisciplineId}
          />

          <HorseMultiSelect
            label="Secondary Disciplines"
            name="secondaryDisciplineIds"
            options={options.disciplines.filter((discipline) => discipline.id !== primaryDisciplineId)}
            selected={secondaryDisciplineIds}
            onChange={setSecondaryDisciplineIds}
            placeholder="Select secondary disciplines"
          />

          {HORSE_DIVISION_CONTEXTS.map((context) => (
            <HorseMultiSelect
              key={context.key}
              label={context.label}
              name={context.formKey}
              options={visibleDivisionOptions}
              selected={getSelectedValues(context.formKey, {
                bestSuitedForIds,
                currentlyCompetingInIds,
                experiencedThroughIds,
              })}
              onChange={getDivisionSetter(context.formKey, {
                setBestSuitedForIds,
                setCurrentlyCompetingInIds,
                setExperiencedThroughIds,
              })}
              helperText={
                context.required
                  ? "At least one selection is required before publishing."
                  : "Optional. Use these to show current record or highest experience level."
              }
              placeholder={`Select ${context.label.toLowerCase()}`}
            />
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Horse Type"
        description="Use Horse Type / Intended Use to describe where this horse fits in the market."
      >
        <HorseMultiSelect
          label="Horse Type / Intended Use"
          name="horseTypeIds"
          options={options.horseTypes}
          selected={horseTypeIds}
          onChange={setHorseTypeIds}
          placeholder="Select horse type and intended use"
        />
      </FormSection>

      <FormSection title="Key Info" description="Add quick facts buyers can scan fast on the public profile. Use one line per highlight.">
        <div className="space-y-5">
          <div>
            <Label htmlFor="keyDetails">Key details</Label>
            <Textarea
              id="keyDetails"
              name="keyDetails"
              className="mt-2 min-h-32"
              placeholder={"One detail per line\nSmooth, comfortable gait\nRecent show mileage\nAmateur friendly"}
              defaultValue={values.keyDetails}
            />
          </div>

          <div>
            <Label htmlFor="showHighlights">Show Highlights</Label>
            <Textarea
              id="showHighlights"
              name="showHighlights"
              className="mt-2 min-h-28"
              placeholder="Optional competition highlights or notable results"
              defaultValue={values.showHighlights}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-4 text-sm text-[color:var(--foreground)]">
              <input type="checkbox" name="feiPassport" defaultChecked={values.feiPassport} className="h-4 w-4 rounded border-[color:var(--border)]" />
              FEI Passport Available
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] p-4 text-sm text-[color:var(--foreground)]">
              <input type="checkbox" name="equiVaultAvailable" defaultChecked={values.equiVaultAvailable} className="h-4 w-4 rounded border-[color:var(--border)]" />
              HorseVault Available
            </label>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Description"
        description="Use this space for temperament, training, competition history, suitability, and the details buyers need before they reach out."
      >
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="description">Horse Description</Label>
            <AICopyGenerator
              entityType="horse"
              targetField="description"
              scope={mode === "create" ? "horse-create" : "horse-edit"}
              mode={mode}
              horseId={horseId}
              title="Generate horse description"
              description="Review the English draft, then Replace or Add it to the horse description field."
              getContext={getDescriptionContext}
              onReplace={(nextValue) => setDescription(nextValue.trim())}
              onAppend={(nextValue) =>
                setDescription((current) => {
                  const currentValue = current.trim();
                  const nextDraft = nextValue.trim();
                  return currentValue ? `${currentValue}\n\n${nextDraft}` : nextDraft;
                })
              }
            />
          </div>
          <Textarea
            id="description"
            name="description"
            className="mt-2 min-h-40"
            placeholder="Describe your horse's temperament, training, achievements, and what kind of rider or barn would be the best fit."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
      </FormSection>

      <section className="rounded-[2rem] border border-[color:var(--border)] bg-card p-6 shadow-[var(--shadow-card)]">
        <label className="flex items-start gap-4">
          <input type="checkbox" name="isPublished" className="mt-1 h-4 w-4 accent-[color:var(--primary)]" defaultChecked={values.isPublished} />
          <div>
            <p className="text-base font-semibold text-[color:var(--foreground-strong)]">Add to Marketplace</p>
            <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">
              Publish this horse to public browsing surfaces so buyers can discover it outside MyBarn.
            </p>
          </div>
        </label>
      </section>

      {submitError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {submitError}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/mybarn")}>
          Cancel
        </Button>

        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "create" ? "Creating..." : "Saving..."}
            </>
          ) : mode === "create" ? (
            "Add to MyBarn"
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}

function SelectField({
  id,
  label,
  defaultValue,
  options,
  placeholder = "Select an option",
  onChange,
}: {
  id: string;
  label: string;
  defaultValue: string;
  options: Array<{ id: string; label: string }>;
  placeholder?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} name={id} className={selectClasses} defaultValue={defaultValue} onChange={(event) => onChange?.(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function getSelectedValues(
  formKey: string,
  values: {
    bestSuitedForIds: string[];
    currentlyCompetingInIds: string[];
    experiencedThroughIds: string[];
  }
) {
  switch (formKey) {
    case "bestSuitedForIds":
      return values.bestSuitedForIds;
    case "currentlyCompetingInIds":
      return values.currentlyCompetingInIds;
    case "experiencedThroughIds":
      return values.experiencedThroughIds;
    default:
      return [];
  }
}

function getDivisionSetter(
  formKey: string,
  setters: {
    setBestSuitedForIds: (values: string[]) => void;
    setCurrentlyCompetingInIds: (values: string[]) => void;
    setExperiencedThroughIds: (values: string[]) => void;
  }
) {
  switch (formKey) {
    case "bestSuitedForIds":
      return setters.setBestSuitedForIds;
    case "currentlyCompetingInIds":
      return setters.setCurrentlyCompetingInIds;
    case "experiencedThroughIds":
      return setters.setExperiencedThroughIds;
    default:
      return () => undefined;
  }
}
