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
    <section className="rounded-card bg-surface-elevated p-lg shadow-elevated backdrop-blur-sm">
      <header className="mb-md flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Unit Search</h2>
        {resultCount !== undefined && (
          <span className="text-xs uppercase tracking-widest text-text-accent">
            {resultCount} {resultCount === 1 ? "unit" : "units"}
          </span>
        )}
      </header>

      <div className="mb-lg grid gap-md sm:grid-cols-2">
        {/* Area Filter */}
        <div className="flex flex-col gap-sm">
          <label
            htmlFor="min-area"
            className="text-xs font-medium uppercase tracking-wide text-text-secondary"
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
            className="h-10 rounded-input border border-border bg-bg-input px-sm text-sm text-text-primary placeholder-text-tertiary transition-focus focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-focus-ring"
          />
        </div>

        <div className="flex flex-col gap-sm">
          <label
            htmlFor="max-area"
            className="text-xs font-medium uppercase tracking-wide text-text-secondary"
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
            className="h-10 rounded-input border border-border bg-bg-input px-sm text-sm text-text-primary placeholder-text-tertiary transition-focus focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-focus-ring"
          />
        </div>

        {/* Bedrooms Filter */}
        <div className="flex flex-col gap-sm">
          <label
            htmlFor="bedrooms"
            className="text-xs font-medium uppercase tracking-wide text-text-secondary"
          >
            Bedrooms
          </label>
          <select
            id="bedrooms"
            value={filters.bedrooms ?? ""}
            onChange={handleBedroomsChange}
            className="h-10 rounded-input border border-border bg-bg-input px-sm text-sm text-text-primary transition-focus focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-focus-ring"
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
        <div className="flex flex-col gap-sm">
          <label
            htmlFor="bathrooms"
            className="text-xs font-medium uppercase tracking-wide text-text-secondary"
          >
            Bathrooms
          </label>
          <select
            id="bathrooms"
            value={filters.bathrooms ?? ""}
            onChange={handleBathroomsChange}
            className="h-10 rounded-input border border-border bg-bg-input px-sm text-sm text-text-primary transition-focus focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-focus-ring"
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
          <div className="col-span-full flex flex-col gap-sm">
            <label
              htmlFor="availability"
              className="text-xs font-medium uppercase tracking-wide text-text-secondary"
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
              className="h-10 rounded-input border border-border bg-bg-input px-sm text-sm text-text-primary transition-focus focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-focus-ring"
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
        className="w-full rounded-button border border-border bg-surface-base px-md py-sm text-sm font-medium text-text-primary transition-hover hover:bg-surface-hover hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        Clear All Filters
      </button>
    </section>
  );
};
