"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Upload } from "lucide-react";

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
};

export default function HorseForm({
  mode,
  initialValues,
  horseId,
}: HorseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const values: HorseFormValues = {
    ...defaultValues,
    ...initialValues,
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = new FormData(e.currentTarget);

    setLoading(true);

    const url =
      mode === "create"
        ? "/api/horses/create"
        : `/api/horses/${horseId}/update`;

    const res = await fetch(url, {
      method: "POST",
      body: form,
    });

    setLoading(false);

    if (res.ok) {
      router.push("/seller/horses");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-white p-2 shadow-sm">
              <Upload className="h-4 w-4 text-stone-700" />
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-semibold text-stone-900">Horse Photo</h2>
              <p className="mt-1 text-sm text-stone-500">
                Upload the main image for this listing.
              </p>

              {mode === "edit" && values.image ? (
                <div className="mt-4">
                  <img
                    src={values.image}
                    alt={values.name || "Horse image"}
                    className="h-40 w-full max-w-xs rounded-2xl object-cover border border-stone-200"
                  />
                </div>
              ) : null}

              <div className="mt-4">
                <Input type="file" name="image" accept="image/*" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-2xl text-stone-900">Basic Details</h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
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
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-2xl text-stone-900">Description</h2>

        <div className="mt-6">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            className="min-h-40"
            placeholder="Describe your horse's temperament, training, achievements..."
            defaultValue={values.description}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="isPublished"
            className="mt-1"
            defaultChecked={values.isPublished}
          />
          <div>
            <p className="font-medium text-stone-900">Add to Marketplace</p>
            <p className="text-sm text-stone-500">
              Make this horse searchable in the marketplace.
            </p>
          </div>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/seller/horses")}
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
            "Add & List in Marketplace"
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}