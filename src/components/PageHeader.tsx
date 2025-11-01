import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

interface PageHeaderProps {
  className?: string;
}

export const PageHeader = ({ className = "" }: PageHeaderProps) => {
  return (
    <div
      className={`flex items-center justify-end gap-sm ${className}`}
      role="banner"
    >
      <ThemeToggle />
      <LanguageSwitcher />
    </div>
  );
};
