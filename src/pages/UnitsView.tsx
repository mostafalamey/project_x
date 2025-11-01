import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { BackNav } from "../components/BackNav";
import { I18nDebug } from "../components/I18nDebug";
import { PageHeader } from "../components/PageHeader";
import { SearchPanel } from "../components/SearchPanel";
import { UnitList } from "../components/UnitList";
import {
  enrichUnits,
  filterUnits,
  type EnrichedUnit,
  type UnitFilters,
} from "../data/enrichment";
import { loadModels, loadUnits } from "../data/loaders";
import type { Model, Unit } from "../data/types";

type FetchState<T> = {
  status: "idle" | "loading" | "error" | "success";
  data: T | null;
  error: string | null;
};

const initialState = <T,>(): FetchState<T> => ({
  status: "idle",
  data: null,
  error: null,
});

export const UnitsView = () => {
  const { t } = useTranslation(["pages", "navigation", "common"]);
  const [unitsState, setUnitsState] =
    useState<FetchState<Unit[]>>(initialState);
  const [modelsState, setModelsState] =
    useState<FetchState<Model[]>>(initialState);
  const [filters, setFilters] = useState<UnitFilters>({});
  const [enrichedUnits, setEnrichedUnits] = useState<EnrichedUnit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<EnrichedUnit[]>([]);

  // Load units
  useEffect(() => {
    let cancelled = false;

    const fetchUnits = async () => {
      setUnitsState((prev) => ({ ...prev, status: "loading", error: null }));

      try {
        const data = await loadUnits();

        if (!cancelled) {
          setUnitsState({ status: "success", data, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setUnitsState({
            status: "error",
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load units data",
          });
        }
      }
    };

    fetchUnits();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load models
  useEffect(() => {
    let cancelled = false;

    const fetchModels = async () => {
      setModelsState((prev) => ({ ...prev, status: "loading", error: null }));

      try {
        const data = await loadModels();

        if (!cancelled) {
          setModelsState({ status: "success", data, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setModelsState({
            status: "error",
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load models data",
          });
        }
      }
    };

    fetchModels();

    return () => {
      cancelled = true;
    };
  }, []);

  // Enrich units when both units and models are loaded
  useEffect(() => {
    if (
      unitsState.status === "success" &&
      unitsState.data &&
      modelsState.status === "success" &&
      modelsState.data
    ) {
      const enriched = enrichUnits(unitsState.data, modelsState.data);
      setEnrichedUnits(enriched);
      setFilteredUnits(enriched);
    }
  }, [unitsState, modelsState]);

  // Apply filters when filters or enriched units change
  useEffect(() => {
    const filtered = filterUnits(enrichedUnits, filters);
    setFilteredUnits(filtered);
  }, [enrichedUnits, filters]);

  const isLoading =
    unitsState.status === "loading" || modelsState.status === "loading";
  const hasError =
    unitsState.status === "error" || modelsState.status === "error";
  const errorMessage =
    unitsState.error || modelsState.error || t("common:messages.errorLoading");

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between p-md">
          <BackNav to="/" label={t("navigation:backToMap")} />
          <PageHeader />
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">
              {t("pages:unitsView.title")}
            </h1>
            <p className="text-lg text-slate-400">
              {t("pages:unitsView.subtitle")}
            </p>
          </header>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-2xl">
              <div className="text-center">
                <div className="mb-md inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />
                <p className="text-slate-400">
                  {t("pages:unitsView.loadingUnits")}
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="rounded-card border border-red-500/20 bg-red-900/10 p-lg text-center">
              <p className="text-red-400">{errorMessage}</p>
            </div>
          )}

          {/* Content */}
          {!isLoading && !hasError && (
            <div className="grid gap-lg lg:grid-cols-[350px_1fr]">
              {/* Search Panel */}
              <aside>
                <SearchPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  resultCount={filteredUnits.length}
                />
              </aside>

              {/* Units List */}
              <main>
                <UnitList units={filteredUnits} />
              </main>
            </div>
          )}
        </div>
      </div>

      {/* Debug Component */}
      {import.meta.env.DEV && <I18nDebug />}
    </div>
  );
};
