import { useMemo, type ChangeEvent } from "react";

import type { UnitFilters } from "../data/enrichment";

type SearchPanelProps = {
  filters:
    | UnitFilters
    | {
        minArea?: number;
        maxArea?: number;
        bedrooms?: number;
        bathrooms?: number;
      };
  onFiltersChange: (filters: any) => void;
  resultCount?: number;
  showAvailability?: boolean;
};

export const SearchPanel = ({
  filters,
  onFiltersChange,
  resultCount,
  showAvailability = true,
}: SearchPanelProps) => {
  const bedroomOptions = useMemo(() => [1, 2, 3, 4, 5], []);
  const bathroomOptions = useMemo(() => [1, 2, 3, 4], []);
  const availabilityOptions = useMemo(
    () => ["All", "Available", "Reserved", "Sold"] as const,
    []
  );

  const handleMinAreaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : Number(e.target.value);
    onFiltersChange({ ...filters, minArea: value });
  };

  const handleMaxAreaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : Number(e.target.value);
    onFiltersChange({ ...filters, maxArea: value });
  };

  const handleBedroomsChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === "" ? undefined : Number(e.target.value);
    onFiltersChange({ ...filters, bedrooms: value });
  };

  const handleBathroomsChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === "" ? undefined : Number(e.target.value);
    onFiltersChange({ ...filters, bathrooms: value });
  };

  const handleAvailabilityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value =
      e.target.value === "" || e.target.value === "All"
        ? undefined
        : (e.target.value as "Available" | "Reserved" | "Sold");
    onFiltersChange({ ...filters, availability: value });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  return (
    <section className="rounded-2xl bg-slate-900/80 p-6 shadow-lg backdrop-blur-sm">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Unit Search</h2>
        {resultCount !== undefined && (
          <span className="text-xs uppercase tracking-widest text-emerald-400">
            {resultCount} {resultCount === 1 ? "unit" : "units"}
          </span>
        )}
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {/* Area Filter */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="min-area"
            className="text-xs font-medium uppercase tracking-wide text-slate-400"
          >
            Min Area (m²)
          </label>
          <input
            id="min-area"
            type="number"
            min="0"
            placeholder="e.g., 80"
            value={filters.minArea ?? ""}
            onChange={handleMinAreaChange}
            className="h-10 rounded-md border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="max-area"
            className="text-xs font-medium uppercase tracking-wide text-slate-400"
          >
            Max Area (m²)
          </label>
          <input
            id="max-area"
            type="number"
            min="0"
            placeholder="e.g., 150"
            value={filters.maxArea ?? ""}
            onChange={handleMaxAreaChange}
            className="h-10 rounded-md border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Bedrooms Filter */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="bedrooms"
            className="text-xs font-medium uppercase tracking-wide text-slate-400"
          >
            Bedrooms
          </label>
          <select
            id="bedrooms"
            value={filters.bedrooms ?? ""}
            onChange={handleBedroomsChange}
            className="h-10 rounded-md border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Any</option>
            {bedroomOptions.map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "Bedroom" : "Bedrooms"}
              </option>
            ))}
          </select>
        </div>

        {/* Bathrooms Filter */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="bathrooms"
            className="text-xs font-medium uppercase tracking-wide text-slate-400"
          >
            Bathrooms
          </label>
          <select
            id="bathrooms"
            value={filters.bathrooms ?? ""}
            onChange={handleBathroomsChange}
            className="h-10 rounded-md border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Any</option>
            {bathroomOptions.map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "Bathroom" : "Bathrooms"}
              </option>
            ))}
          </select>
        </div>

        {/* Availability Filter - Only shown for units */}
        {showAvailability && (
          <div className="col-span-full flex flex-col gap-2">
            <label
              htmlFor="availability"
              className="text-xs font-medium uppercase tracking-wide text-slate-400"
            >
              Availability
            </label>
            <select
              id="availability"
              value={
                "availability" in filters
                  ? filters.availability ?? "All"
                  : "All"
              }
              onChange={handleAvailabilityChange}
              className="h-10 rounded-md border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {availabilityOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <button
        onClick={handleClearFilters}
        className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        Clear All Filters
      </button>
    </section>
  );
};
