import { useMemo, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { EnrichedUnit } from "../data/enrichment";

type UnitListProps = {
  units: EnrichedUnit[];
  onUnitSelect?: (unit: EnrichedUnit) => void;
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
  const { t, i18n } = useTranslation("pages");

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language),
    [i18n.language]
  );

  const priceFormatter = useMemo(() => {
    return new Intl.NumberFormat(i18n.language, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }, [i18n.language]);

  const formatPrice = (price: number | undefined) => {
    if (price === undefined) {
      return t("unitsView.list.priceOnRequest");
    }

    return priceFormatter.format(price);
  };

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
        <p className="text-text-secondary">{t("unitsView.list.noResults")}</p>
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
              {t(
                `unitsView.search.availability.${unit.availability.toLowerCase()}`
              )}
            </span>
          </div>

          {/* Unit Details */}
          <div className="mb-sm space-y-xs text-sm text-text-primary">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">
                {t("unitsView.list.area")}
              </span>
              <span className="font-medium">
                {t("unitsView.list.areaValue", {
                  value: numberFormatter.format(unit.areaM2),
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">
                {t("unitsView.list.bedrooms")}
              </span>
              <span className="font-medium">{unit.bedrooms}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">
                {t("unitsView.list.bathrooms")}
              </span>
              <span className="font-medium">{unit.bathrooms}</span>
            </div>
          </div>

          {/* Price */}
          <div className="border-t border-border-muted pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-text-secondary">
                {t("unitsView.list.price")}
              </span>
              <span className="text-sm font-semibold text-text-accent">
                {formatPrice(unit.price)}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="mt-2 text-xs text-text-tertiary">
            {t("unitsView.list.location", {
              building: unit.buildingId.toUpperCase(),
              floor: unit.floorId.toUpperCase(),
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
