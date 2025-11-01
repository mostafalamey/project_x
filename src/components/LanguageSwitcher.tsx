import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  DEFAULT_LANGUAGE,
  getLanguageByCode,
  isRTL,
  SUPPORTED_LANGUAGES,
  type Language,
  type LanguageCode,
} from "../i18n";

export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const resolvedCode =
    (i18n.resolvedLanguage as LanguageCode | undefined) ??
    (i18n.language as LanguageCode | undefined) ??
    DEFAULT_LANGUAGE;

  const currentLanguage =
    getLanguageByCode(resolvedCode) ?? SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = (language: Language) => {
    i18n.changeLanguage(language.code);
    setIsOpen(false);

    // Update document direction and lang attribute
    document.documentElement.setAttribute("dir", language.direction);
    document.documentElement.setAttribute("lang", language.code);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-sm rounded-badge bg-surface-elevated px-md py-sm text-sm font-medium text-text-primary shadow-sm transition-hover hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        aria-label={t("languageSwitcher.ariaLabel")}
        aria-expanded={isOpen ? "true" : "false"}
        aria-haspopup="true"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span>{currentLanguage.nativeName}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full z-50 mt-xs min-w-[160px] overflow-hidden rounded-card border border-border-default bg-surface-elevated shadow-lg ${
              isRTL(currentLanguage.code) ? "left-0" : "right-0"
            }`}
          >
            <div role="menu" aria-orientation="vertical">
              {SUPPORTED_LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => handleLanguageChange(language)}
                  className={`flex w-full items-center gap-sm px-md py-sm text-left text-sm transition-colors hover:bg-surface-hover ${
                    language.code === currentLanguage.code
                      ? "bg-surface-hover font-semibold text-text-primary"
                      : "text-text-secondary"
                  }`}
                  role="menuitem"
                >
                  <span className="flex-1">{language.nativeName}</span>
                  {language.code === currentLanguage.code && (
                    <span
                      className="text-xs text-accent-primary"
                      aria-label={t("languageSwitcher.currentLanguage")}
                    >
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
