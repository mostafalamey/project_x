import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { DEFAULT_LANGUAGE, isRTL, type LanguageCode } from "./i18n";
import { AppRouter } from "./routes";

const App = () => {
  const { i18n } = useTranslation();

  // Apply dark theme (always on)
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

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
