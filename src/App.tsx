import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useTheme } from "./hooks/useTheme";
import { DEFAULT_LANGUAGE, isRTL, type LanguageCode } from "./i18n";
import { AppRouter } from "./routes";

const App = () => {
  const { resolvedTheme } = useTheme();
  const { i18n } = useTranslation();

  // Apply theme class to html element
  useEffect(() => {
    const root = document.documentElement;

    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [resolvedTheme]);

  // Apply language direction and lang attribute
  useEffect(() => {
    const root = document.documentElement;
    const resolvedLanguage =
      (i18n.resolvedLanguage as LanguageCode | undefined) ??
      (i18n.language as LanguageCode | undefined) ??
      DEFAULT_LANGUAGE;
    const currentLang = resolvedLanguage;
    const direction = isRTL(currentLang) ? "rtl" : "ltr";

    root.setAttribute("dir", direction);
    root.setAttribute("lang", currentLang);
  }, [i18n.language, i18n.resolvedLanguage]);

  return <AppRouter />;
};

export default App;
