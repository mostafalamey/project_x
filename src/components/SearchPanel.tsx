import { useMemo, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

import type { UnitFilters } from "../data/enrichment";

type BaseFilters = {
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  availability?: UnitFilters["availability"];
};

type SearchPanelProps<T extends BaseFilters = BaseFilters> = {
  filters: T;
  onFiltersChange: (filters: T) => void;
  resultCount?: number;
  showAvailability?: boolean;
};

export const SearchPanel = <T extends BaseFilters = BaseFilters>({
  filters,
  onFiltersChange,
  resultCount,
  showAvailability = true,
}: SearchPanelProps<T>) => {
  const { t } = useTranslation("pages");
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
    onFiltersChange({} as T);
  };

  return (
    <section className="rounded-card bg-surface-elevated p-lg shadow-elevated backdrop-blur-sm">
      <header className="mb-md flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("unitsView.search.title")}
        </h2>
        {resultCount !== undefined && (
          <span className="text-xs uppercase tracking-widest text-text-accent">
            {t("unitsView.search.resultCount", { count: resultCount })}
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
            {t("unitsView.search.minAreaLabel")}
          </label>
          <input
            id="min-area"
            type="number"
            min="0"
            placeholder={t("unitsView.search.minAreaPlaceholder")}
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
            {t("unitsView.search.maxAreaLabel")}
          </label>
          <input
            id="max-area"
            type="number"
            min="0"
            placeholder={t("unitsView.search.maxAreaPlaceholder")}
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
            {t("unitsView.search.bedroomsLabel")}
          </label>
          <select
            id="bedrooms"
            value={filters.bedrooms ?? ""}
            onChange={handleBedroomsChange}
            className="h-10 rounded-input border border-border bg-bg-input px-sm text-sm text-text-primary transition-focus focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-focus-ring"
          >
            <option value="">{t("unitsView.search.anyOption")}</option>
            {bedroomOptions.map((count) => (
              <option key={count} value={count}>
                {t("unitsView.search.bedroomOption", { count })}
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
            {t("unitsView.search.bathroomsLabel")}
          </label>
          <select
            id="bathrooms"
            value={filters.bathrooms ?? ""}
            onChange={handleBathroomsChange}
            className="h-10 rounded-input border border-border bg-bg-input px-sm text-sm text-text-primary transition-focus focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-focus-ring"
          >
            <option value="">{t("unitsView.search.anyOption")}</option>
            {bathroomOptions.map((count) => (
              <option key={count} value={count}>
                {t("unitsView.search.bathroomOption", { count })}
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
              {t("unitsView.search.availabilityLabel")}
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
                  {t(`unitsView.search.availability.${status.toLowerCase()}`)}
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
        {t("unitsView.search.clear")}
      </button>
    </section>
  );
};
