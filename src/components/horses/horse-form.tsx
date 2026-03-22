"use client";

import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Loader2, Megaphone, NotebookPen } from "lucide-react";

import AICopyGenerator from "@/components/ai/ai-copy-generator";
import HorseImageUploader from "@/components/horses/horse-image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type HorseFormValues = {
  name: string;
  breed: string;
  age: string;
  price: string;
  description: string;
  discipline: string;
  level: string;
  height: string;
  gender: string;
  location: string;
  saleStatus:
    | "FOR_SALE"
    | "CONSIDERING_OFFERS"
    | "LEASE"
    | "SOLD"
    | "NOT_AVAILABLE";
  isPublished: boolean;
  image?: string | null;
  keyDetails: string;
};

interface HorseFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<HorseFormValues>;
  horseId?: string;
}

const defaultValues: HorseFormValues = {
  name: "",
  breed: "",
  age: "",
  price: "",
  description: "",
  discipline: "",
  level: "",
  height: "",
  gender: "",
  location: "",
  saleStatus: "FOR_SALE",
  isPublished: true,
  image: null,
  keyDetails: "",
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
          <h2 className="text-2xl font-extrabold text-[color:var(--foreground-strong)]">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--foreground-soft)]">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function HorseForm({
  mode,
  initialValues,
  horseId,
}: HorseFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const values: HorseFormValues = {
    ...defaultValues,
    ...initialValues,
  };
  const [description, setDescription] = useState(values.description);

  function getDescriptionContext() {
    const formData = formRef.current ? new FormData(formRef.current) : new FormData();

    return {
      name: String(formData.get("name") || "").trim(),
      breed: String(formData.get("breed") || "").trim(),
      age: String(formData.get("age") || "").trim(),
      discipline: String(formData.get("discipline") || "").trim(),
      level: String(formData.get("level") || "").trim(),
      height: String(formData.get("height") || "").trim(),
      gender: String(formData.get("gender") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      price: String(formData.get("price") || "").trim(),
      saleStatus: String(formData.get("saleStatus") || "").trim(),
      keyDetails: String(formData.get("keyDetails") || "").trim(),
      description: String(formData.get("description") || description || "").trim(),
    };
  }

  function replaceDescription(nextValue: string) {
    setDescription(nextValue.trim());
  }

  function appendDescription(nextValue: string) {
    setDescription((current) => {
      const currentValue = current.trim();
      const nextDraft = nextValue.trim();

      if (!currentValue) {
        return nextDraft;
      }

      return `${currentValue}\n\n${nextDraft}`;
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = new FormData(e.currentTarget);

    if (imageFile) {
      form.set("image", imageFile);
    }

    setSubmitError("");
    setLoading(true);

    const url =
      mode === "create"
        ? "/api/horses/create"
        : `/api/horses/${horseId}/update`;

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
        title="Horse Photo"
        description="Lead with a strong primary image. You can drag in a photo, crop it before upload, and replace the draft before saving."
      >
        <HorseImageUploader
          initialImage={values.image}
          horseName={values.name}
          onImageChange={setImageFile}
        />
      </FormSection>

      <FormSection
        icon={<NotebookPen className="h-5 w-5" />}
        title="Basic Details"
        description="Set the listing identity, sale position, and the facts buyers will scan first across MyBarn and the marketplace."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="name">Horse Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Sterling Knight"
              defaultValue={values.name}
              required
            />
          </div>

          <div>
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              placeholder="e.g. 150000"
              defaultValue={values.price}
            />
          </div>

          <div>
            <Label htmlFor="saleStatus">Sale Status</Label>
            <select
              id="saleStatus"
              name="saleStatus"
              className={selectClasses}
              defaultValue={values.saleStatus}
            >
              <option value="FOR_SALE">For Sale</option>
              <option value="CONSIDERING_OFFERS">Considering Offers</option>
              <option value="LEASE">Lease</option>
              <option value="SOLD">Sold</option>
              <option value="NOT_AVAILABLE">Not Available</option>
            </select>
          </div>

          <div>
            <Label htmlFor="breed">Breed</Label>
            <Input
              id="breed"
              name="breed"
              placeholder="Warmblood, Arabian..."
              defaultValue={values.breed}
            />
          </div>

          <div>
            <Label htmlFor="discipline">Discipline</Label>
            <Input
              id="discipline"
              name="discipline"
              placeholder="Hunter, Jumper, Dressage..."
              defaultValue={values.discipline}
            />
          </div>

          <div>
            <Label htmlFor="level">Level</Label>
            <Input
              id="level"
              name="level"
              placeholder={`e.g. 3'6" - 3'9"`}
              defaultValue={values.level}
            />
          </div>

          <div>
            <Label htmlFor="age">Age (years)</Label>
            <Input
              id="age"
              name="age"
              type="number"
              placeholder="e.g. 8"
              defaultValue={values.age}
            />
          </div>

          <div>
            <Label htmlFor="height">Height (hands)</Label>
            <Input
              id="height"
              name="height"
              placeholder="e.g. 16.2"
              defaultValue={values.height}
            />
          </div>

          <div>
            <Label htmlFor="gender">Sex</Label>
            <select
              id="gender"
              name="gender"
              className={selectClasses}
              defaultValue={values.gender}
            >
              <option value="">Select sex</option>
              <option value="Gelding">Gelding</option>
              <option value="Mare">Mare</option>
              <option value="Stallion">Stallion</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g. Wellington, FL"
              defaultValue={values.location}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Key Info"
        description="Add quick facts buyers can scan fast on the public profile. Use one line per highlight."
      >
        <div>
          <Label htmlFor="keyDetails">Key details</Label>
          <Textarea
            id="keyDetails"
            name="keyDetails"
            className="mt-2 min-h-32"
            placeholder={"One detail per line\nSmooth, comfortable gait\nSuitable for amateur and junior riders\nRecent show mileage"}
            defaultValue={values.keyDetails}
          />
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
              description="Review the English draft, then replace or append it to the horse description field."
              getContext={getDescriptionContext}
              onReplace={replaceDescription}
              onAppend={appendDescription}
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
          <input
            type="checkbox"
            name="isPublished"
            className="mt-1 h-4 w-4 accent-[color:var(--primary)]"
            defaultChecked={values.isPublished}
          />
          <div>
            <p className="text-base font-semibold text-[color:var(--foreground-strong)]">
              Add to Marketplace
            </p>
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
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/mybarn")}
        >
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
