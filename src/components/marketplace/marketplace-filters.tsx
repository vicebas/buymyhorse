"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SelectOption = {
  id: string;
  label: string;
};

export default function MarketplaceFilters({
  defaultBreed,
  defaultDiscipline,
  defaultPricingVisibility,
  defaultSaleType,
  defaultSex,
  defaultLocation,
  options,
}: {
  defaultBreed: string;
  defaultDiscipline: string;
  defaultPricingVisibility: string;
  defaultSaleType: string;
  defaultSex: string;
  defaultLocation: string;
  options: {
    breeds: SelectOption[];
    disciplines: SelectOption[];
    pricingVisibility: SelectOption[];
    saleTypes: SelectOption[];
    sexes: SelectOption[];
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [breed, setBreed] = useState(defaultBreed);
  const [discipline, setDiscipline] = useState(defaultDiscipline);
  const [pricingVisibility, setPricingVisibility] = useState(defaultPricingVisibility);
  const [saleType, setSaleType] = useState(defaultSaleType);
  const [sex, setSex] = useState(defaultSex);
  const [location, setLocation] = useState(defaultLocation);

  function setOrDelete(params: URLSearchParams, key: string, value: string) {
    if (value.trim()) {
      params.set(key, value.trim());
    } else {
      params.delete(key);
    }
  }

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());

    setOrDelete(params, "breed", breed);
    setOrDelete(params, "discipline", discipline);
    setOrDelete(params, "pricingVisibility", pricingVisibility);
    setOrDelete(params, "saleType", saleType);
    setOrDelete(params, "sex", sex);
    setOrDelete(params, "location", location);

    router.push(`/marketplace?${params.toString()}`);
  }

  function clearFilters() {
    setBreed("");
    setDiscipline("");
    setPricingVisibility("");
    setSaleType("");
    setSex("");
    setLocation("");
    router.push("/marketplace");
  }

  return (
    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)]">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SelectField label="Discipline" value={discipline} onChange={setDiscipline} options={options.disciplines} />
        <SelectField label="Breed" value={breed} onChange={setBreed} options={options.breeds} />
        <SelectField label="Pricing Visibility" value={pricingVisibility} onChange={setPricingVisibility} options={options.pricingVisibility} />
        <SelectField label="Sale Type" value={saleType} onChange={setSaleType} options={options.saleTypes} />
        <SelectField label="Sex" value={sex} onChange={setSex} options={options.sexes} />
        <div>
          <label className="mb-2 block text-sm font-medium text-[color:var(--foreground-soft)]">Location</label>
          <Input placeholder="Wellington, FL" value={location} onChange={(event) => setLocation(event.target.value)} />
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <Button type="button" onClick={applyFilters}>
          Apply Filters
        </Button>

        <Button type="button" variant="outline" onClick={clearFilters}>
          Clear
        </Button>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[color:var(--foreground-soft)]">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-10 w-full rounded-lg border border-input bg-[color:var(--background-elevated)] px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">Any {label}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
