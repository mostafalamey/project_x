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
      className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
    >
      <span aria-hidden="true" className="text-base font-semibold">
        {"<"}
      </span>
      {label}
    </button>
  );
};
