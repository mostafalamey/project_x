import { useTranslation } from "react-i18next";

import { DEFAULT_LANGUAGE, isRTL, type LanguageCode } from "../i18n/languages";

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const resolvedLanguage =
    (i18n.resolvedLanguage as LanguageCode | undefined) ??
    (i18n.language as LanguageCode | undefined) ??
    DEFAULT_LANGUAGE;

  const currentLanguage = resolvedLanguage;
  const direction = isRTL(currentLanguage) ? "rtl" : "ltr";
  const isRtl = direction === "rtl";

  const changeLanguage = async (lang: LanguageCode) => {
    await i18n.changeLanguage(lang);
  };

  return {
    language: currentLanguage,
    direction,
    isRtl,
    changeLanguage,
  };
};
