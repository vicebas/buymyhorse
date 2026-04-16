"use client";

import { useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FilterValues = {
  discipline: string;
  ageMin: string;
  ageMax: string;
  heightMin: string;
  heightMax: string;
  location: string;
  sort: string;
};

const sortOptions = [
  { value: "featured-first", label: "Featured first" },
  { value: "newest", label: "Newest" },
];

export default function PublicBarnFilters({
  defaultValues,
  disciplineOptions,
}: {
  defaultValues: FilterValues;
  disciplineOptions: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(hasActiveFilters(defaultValues));
  const [values, setValues] = useState<FilterValues>(defaultValues);

  const activeFilterCount = useMemo(
    () =>
      [
        values.discipline,
        values.ageMin,
        values.ageMax,
        values.heightMin,
        values.heightMax,
        values.location,
      ].filter(Boolean).length,
    [values]
  );

  function updateValue<K extends keyof FilterValues>(key: K, value: FilterValues[K]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());

    setOrDelete(params, "discipline", values.discipline);
    setOrDelete(params, "ageMin", values.ageMin);
    setOrDelete(params, "ageMax", values.ageMax);
    setOrDelete(params, "heightMin", values.heightMin);
    setOrDelete(params, "heightMax", values.heightMax);
    setOrDelete(params, "location", values.location);

    if (!values.sort || values.sort === "featured-first") {
      params.delete("sort");
    } else {
      params.set("sort", values.sort);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function clearFilters() {
    const resetValues = {
      discipline: "",
      ageMin: "",
      ageMax: "",
      heightMin: "",
      heightMax: "",
      location: "",
      sort: "featured-first",
    };

    setValues(resetValues);
    router.push(pathname);
  }

  return (
    <section className="rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <p className="mono text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--foreground-soft)]">
            Roster Controls
          </p>
          <h3 className="mt-2 text-2xl font-extrabold text-[color:var(--foreground-strong)]">
            Filter This Barn
          </h3>
          <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">
            Narrow the public roster by discipline, range, and location.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex items-center gap-2 self-start md:self-auto"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}` : "Show filters"}
          <ChevronDown className={cn("h-4 w-4 transition", isOpen && "rotate-180")} />
        </Button>
      </div>

      {isOpen ? (
        <div className="border-t border-[color:var(--border)] px-5 py-5 md:px-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--foreground-soft)]">
                Discipline
              </span>
              <select
                value={values.discipline}
                onChange={(e) => updateValue("discipline", e.target.value)}
                className="h-10 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-3 text-sm text-[color:var(--foreground)] outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                <option value="">All disciplines</option>
                {disciplineOptions.map((discipline) => (
                  <option key={discipline} value={discipline}>
                    {discipline}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--foreground-soft)]">
                Location
              </span>
              <Input
                placeholder="City, state, region..."
                value={values.location}
                onChange={(e) => updateValue("location", e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--foreground-soft)]">
                Sort
              </span>
              <select
                value={values.sort}
                onChange={(e) => updateValue("sort", e.target.value)}
                className="h-10 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-3 text-sm text-[color:var(--foreground)] outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--foreground-soft)]">
                Min age
              </span>
              <Input
                type="number"
                min="0"
                placeholder="3"
                value={values.ageMin}
                onChange={(e) => updateValue("ageMin", e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--foreground-soft)]">
                Max age
              </span>
              <Input
                type="number"
                min="0"
                placeholder="12"
                value={values.ageMax}
                onChange={(e) => updateValue("ageMax", e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--foreground-soft)]">
                Min height
              </span>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="14.2"
                value={values.heightMin}
                onChange={(e) => updateValue("heightMin", e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--foreground-soft)]">
                Max height
              </span>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="17.0"
                value={values.heightMax}
                onChange={(e) => updateValue("heightMax", e.target.value)}
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" onClick={applyFilters}>
              Apply filters
            </Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  if (value.trim()) {
    params.set(key, value.trim());
  } else {
    params.delete(key);
  }
}

function hasActiveFilters(values: FilterValues) {
  return Boolean(
    values.discipline ||
      values.ageMin ||
      values.ageMax ||
      values.heightMin ||
      values.heightMax ||
      values.location
  );
}
