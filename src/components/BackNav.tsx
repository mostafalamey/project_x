import { useNavigate } from "react-router-dom";

type BackNavProps = {
  label?: string;
  to?: string;
};

export const BackNav = ({ label = "Back", to }: BackNavProps) => {
  const navigate = useNavigate();

  const handleNavigation = () => {
    if (to) {
      navigate(to);
      return;
    }

    navigate(-1);
  };

  return (
    <button
      type="button"
      onClick={handleNavigation}
      className="inline-flex items-center gap-sm rounded-badge bg-surface-elevated px-md py-sm text-sm font-medium text-text-primary shadow-sm transition-hover hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
    >
      <span aria-hidden="true" className="text-base font-semibold">
        {"<"}
      </span>
      {label}
    </button>
  );
};
