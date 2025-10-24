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
      <div className="rounded-card bg-surface-base p-lg text-center">
        <p className="text-text-secondary">
          No models match your search criteria. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
      {models.map((model) => (
        <div
          key={model.id}
          role="button"
          tabIndex={0}
          onClick={() => handleModelClick(model)}
          onKeyDown={(e) => handleKeyDown(e, model)}
          className="group cursor-pointer overflow-hidden rounded-card border border-border-muted bg-surface-base transition-hover hover:border-border-hover hover:shadow-card-hover focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          {/* Model Image - Larger, more prominent */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-elevated">
            {!imageErrors.has(model.id) ? (
              <img
                src={model.imagePath}
                alt={`Model ${model.id}`}
                className="h-full w-full object-cover transition-transform duration-base ease-out group-hover:scale-105"
                onError={() => handleImageError(model.id)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-bg-elevated to-bg-base">
                <div className="text-center">
                  <div className="mb-2 text-5xl font-bold text-text-disabled">
                    {model.id}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    Model Preview
                  </div>
                </div>
              </div>
            )}
            {model.tourPath && (
              <div className="absolute right-sm top-sm flex items-center gap-xs rounded-badge bg-primary px-sm py-xs text-xs font-semibold text-text-inverse shadow-elevated backdrop-blur-sm">
                <Video className="h-3 w-3" />
                <span>360° Tour</span>
              </div>
            )}
          </div>

          {/* Model Details - Compact */}
          <div className="p-md">
            <div className="mb-sm flex items-start justify-between">
              <h3 className="text-lg font-bold text-text-primary transition-color group-hover:text-text-accent">
                Model {model.id}
              </h3>
              <span className="rounded-badge bg-bg-elevated px-sm py-xs text-xs font-medium text-text-accent">
                {model.areaM2} m²
              </span>
            </div>

            {/* Specs - Compact Grid */}
            <div className="mb-sm flex items-center gap-md text-xs text-text-secondary">
              <div className="flex items-center gap-xs">
                <BedDouble className="h-3.5 w-3.5" />
                <span>
                  {model.bedrooms} {model.bedrooms === 1 ? "Bed" : "Beds"}
                </span>
              </div>
              <div className="flex items-center gap-xs">
                <Bath className="h-3.5 w-3.5" />
                <span>
                  {model.bathrooms} {model.bathrooms === 1 ? "Bath" : "Baths"}
                </span>
              </div>
            </div>

            {/* Call to Action - Minimal */}
            <div className="flex items-center justify-between border-t border-border-muted pt-2.5 text-xs">
              <span className="text-text-tertiary">Click to view details</span>
              <ChevronRight className="h-3.5 w-3.5 text-text-accent transition group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
