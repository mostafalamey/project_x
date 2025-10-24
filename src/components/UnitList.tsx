import { type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import type { EnrichedUnit } from "../data/enrichment";

type UnitListProps = {
  units: EnrichedUnit[];
  onUnitSelect?: (unit: EnrichedUnit) => void;
};

const formatPrice = (price: number | undefined) => {
  if (price === undefined) {
    return "Price on request";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const availabilityStyles = {
  Available:
    "bg-status-available-bg text-status-available-text border-status-available-border",
  Reserved:
    "bg-status-reserved-bg text-status-reserved-text border-status-reserved-border",
  Sold: "bg-status-sold-bg text-status-sold-text border-status-sold-border",
};

export const UnitList = ({ units, onUnitSelect }: UnitListProps) => {
  const navigate = useNavigate();

  const handleUnitClick = (unit: EnrichedUnit) => {
    onUnitSelect?.(unit);
    // Navigate to the floor where this unit is located
    navigate(
      `/building/${unit.buildingId}/floor/${unit.floorId}?unit=${unit.id}`
    );
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLDivElement>,
    unit: EnrichedUnit
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleUnitClick(unit);
    }
  };

  if (units.length === 0) {
    return (
      <div className="rounded-card bg-surface-base p-lg text-center">
        <p className="text-text-secondary">
          No units match your search criteria. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
      {units.map((unit) => (
        <div
          key={unit.id}
          role="button"
          tabIndex={0}
          onClick={() => handleUnitClick(unit)}
          onKeyDown={(e) => handleKeyDown(e, unit)}
          className="group cursor-pointer rounded-card border border-border-muted bg-surface-base p-md transition-hover hover:border-border-hover hover:bg-surface-hover hover:shadow-card-hover focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          {/* Unit ID */}
          <div className="mb-sm flex items-start justify-between">
            <h3 className="font-mono text-sm font-semibold text-text-primary transition-color group-hover:text-text-accent">
              {unit.id}
            </h3>
            <span
              className={`rounded-badge border px-sm py-xs text-xs font-medium ${
                availabilityStyles[unit.availability]
              }`}
            >
              {unit.availability}
            </span>
          </div>

          {/* Unit Details */}
          <div className="mb-sm space-y-xs text-sm text-text-primary">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Area:</span>
              <span className="font-medium">{unit.areaM2} m²</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Bedrooms:</span>
              <span className="font-medium">{unit.bedrooms}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Bathrooms:</span>
              <span className="font-medium">{unit.bathrooms}</span>
            </div>
          </div>

          {/* Price */}
          <div className="border-t border-border-muted pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-text-secondary">
                Price
              </span>
              <span className="text-sm font-semibold text-text-accent">
                {formatPrice(unit.price)}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="mt-2 text-xs text-text-tertiary">
            Building {unit.buildingId.toUpperCase()} • Floor{" "}
            {unit.floorId.toUpperCase()}
          </div>
        </div>
      ))}
    </div>
  );
};
