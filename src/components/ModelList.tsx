import { BedDouble, Bath, ChevronRight, Video } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import type { Model } from "../data/types";
import { useNavigationStore } from "../stores/navigationStore";

type ModelListProps = {
  models: Model[];
  onModelSelect?: (model: Model) => void;
  contextParams?: { building?: string; floor?: string; angle?: string }; // Context to preserve for back navigation
  backLocation?: string; // Where to go back to when leaving ModelView
};

export const ModelList = ({
  models,
  onModelSelect,
  contextParams,
  backLocation,
}: ModelListProps) => {
  const navigate = useNavigate();
  const { setModelBackLocation } = useNavigationStore();
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleModelClick = (model: Model) => {
    onModelSelect?.(model);

    // Store the back location before navigating
    if (backLocation) {
      console.log("ModelList: Storing back location:", backLocation);
      setModelBackLocation(backLocation);
    }

    // Navigate to the model view for 360 rotation
    if (contextParams) {
      // Preserve building/floor/angle context for back navigation
      const params = new URLSearchParams();

      if (contextParams.building)
        params.set("building", contextParams.building);
      if (contextParams.floor) params.set("floor", contextParams.floor);
      if (contextParams.angle) params.set("angle", contextParams.angle);

      const query = params.toString();
      navigate(query ? `/model/${model.id}?${query}` : `/model/${model.id}`);
    } else {
      navigate(`/model/${model.id}`);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, model: Model) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleModelClick(model);
    }
  };

  const handleImageError = (modelId: string) => {
    setImageErrors((prev) => new Set(prev).add(modelId));
  };

  if (models.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/60 p-8 text-center">
        <p className="text-slate-400">
          No models match your search criteria. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {models.map((model) => (
        <div
          key={model.id}
          role="button"
          tabIndex={0}
          onClick={() => handleModelClick(model)}
          onKeyDown={(e) => handleKeyDown(e, model)}
          className="group cursor-pointer overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/60 transition hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          {/* Model Image - Larger, more prominent */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-800">
            {!imageErrors.has(model.id) ? (
              <img
                src={model.imagePath}
                alt={`Model ${model.id}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                onError={() => handleImageError(model.id)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                <div className="text-center">
                  <div className="mb-2 text-5xl font-bold text-slate-600">
                    {model.id}
                  </div>
                  <div className="text-xs text-slate-500">Model Preview</div>
                </div>
              </div>
            )}
            {model.tourPath && (
              <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-emerald-500/95 px-2.5 py-1.5 text-xs font-semibold text-slate-900 shadow-lg backdrop-blur-sm">
                <Video className="h-3 w-3" />
                <span>360° Tour</span>
              </div>
            )}
          </div>

          {/* Model Details - Compact */}
          <div className="p-4">
            <div className="mb-2 flex items-start justify-between">
              <h3 className="text-lg font-bold text-slate-100 transition group-hover:text-emerald-400">
                Model {model.id}
              </h3>
              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-medium text-emerald-400">
                {model.areaM2} m²
              </span>
            </div>

            {/* Specs - Compact Grid */}
            <div className="mb-3 flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <BedDouble className="h-3.5 w-3.5" />
                <span>
                  {model.bedrooms} {model.bedrooms === 1 ? "Bed" : "Beds"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bath className="h-3.5 w-3.5" />
                <span>
                  {model.bathrooms} {model.bathrooms === 1 ? "Bath" : "Baths"}
                </span>
              </div>
            </div>

            {/* Call to Action - Minimal */}
            <div className="flex items-center justify-between border-t border-slate-700/30 pt-2.5 text-xs">
              <span className="text-slate-500">Click to view details</span>
              <ChevronRight className="h-3.5 w-3.5 text-emerald-400 transition group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
