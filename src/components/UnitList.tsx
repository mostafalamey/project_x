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
  Available: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Reserved: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Sold: "bg-slate-600/20 text-slate-400 border-slate-600/30",
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
      <div className="rounded-2xl bg-slate-900/60 p-8 text-center">
        <p className="text-slate-400">
          No units match your search criteria. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {units.map((unit) => (
        <div
          key={unit.id}
          role="button"
          tabIndex={0}
          onClick={() => handleUnitClick(unit)}
          onKeyDown={(e) => handleKeyDown(e, unit)}
          className="group cursor-pointer rounded-xl border border-slate-700/50 bg-slate-900/60 p-5 transition hover:border-emerald-500/50 hover:bg-slate-900/80 hover:shadow-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          {/* Unit ID */}
          <div className="mb-3 flex items-start justify-between">
            <h3 className="text-sm font-mono font-semibold text-slate-100 group-hover:text-emerald-400 transition">
              {unit.id}
            </h3>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                availabilityStyles[unit.availability]
              }`}
            >
              {unit.availability}
            </span>
          </div>

          {/* Unit Details */}
          <div className="mb-3 space-y-1.5 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Area:</span>
              <span className="font-medium">{unit.areaM2} m²</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Bedrooms:</span>
              <span className="font-medium">{unit.bedrooms}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Bathrooms:</span>
              <span className="font-medium">{unit.bathrooms}</span>
            </div>
          </div>

          {/* Price */}
          <div className="border-t border-slate-700/50 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                Price
              </span>
              <span className="text-sm font-semibold text-emerald-400">
                {formatPrice(unit.price)}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="mt-2 text-xs text-slate-500">
            Building {unit.buildingId.toUpperCase()} • Floor{" "}
            {unit.floorId.toUpperCase()}
          </div>
        </div>
      ))}
    </div>
  );
};
