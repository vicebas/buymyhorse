"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MarketplaceFilters({
  defaultOrg,
  defaultBreed,
  defaultMaxPrice,
}: {
  defaultOrg: string;
  defaultBreed: string;
  defaultMaxPrice: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [org, setOrg] = useState(defaultOrg);
  const [breed, setBreed] = useState(defaultBreed);
  const [maxPrice, setMaxPrice] = useState(defaultMaxPrice);

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());

    if (org.trim()) {
      params.set("org", org.trim());
    } else {
      params.delete("org");
    }

    if (breed.trim()) {
      params.set("breed", breed.trim());
    } else {
      params.delete("breed");
    }

    if (maxPrice.trim()) {
      params.set("maxPrice", maxPrice.trim());
    } else {
      params.delete("maxPrice");
    }

    router.push(`/marketplace?${params.toString()}`);
  }

  function clearFilters() {
    setOrg("");
    setBreed("");
    setMaxPrice("");
    router.push("/marketplace");
  }

  return (
    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-card)]">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-[color:var(--foreground-soft)]">
            Organization
          </label>
          <Input
            placeholder="Barn name"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[color:var(--foreground-soft)]">
            Breed
          </label>
          <Input
            placeholder="Arabian, Quarter Horse..."
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[color:var(--foreground-soft)]">
            Max price
          </label>
          <Input
            type="number"
            placeholder="50000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
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
