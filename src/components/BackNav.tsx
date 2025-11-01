import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

type BackNavProps = {
  label?: string;
  to?: string;
};

export const BackNav = ({ label, to }: BackNavProps) => {
  const navigate = useNavigate();
  const { t, ready } = useTranslation("navigation");

  const displayLabel = label || t("back");

  const handleNavigation = () => {
    if (to) {
      navigate(to);
      return;
    }

    navigate(-1);
  };

  // Show fallback if translations aren't ready
  if (!ready) {
    return (
      <button
        type="button"
        onClick={handleNavigation}
        className="inline-flex items-center gap-sm rounded-badge bg-surface-elevated px-md py-sm text-sm font-medium text-text-primary shadow-sm transition-hover hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <span aria-hidden="true" className="text-base font-semibold">
          {"<"}
        </span>
        {label || "Back"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleNavigation}
      className="inline-flex items-center gap-sm rounded-badge bg-surface-elevated px-md py-sm text-sm font-medium text-text-primary shadow-sm transition-hover hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
    >
      <span aria-hidden="true" className="text-base font-semibold">
        {"<"}
      </span>
      {displayLabel}
    </button>
  );
};
