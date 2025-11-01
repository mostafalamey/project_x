export type LanguageCode = "en" | "ar";

export type LanguageDirection = "ltr" | "rtl";

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  direction: LanguageDirection;
}

export const LANGUAGES: Record<LanguageCode, Language> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    direction: "ltr",
  },
  ar: {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    direction: "rtl",
  },
};

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export const SUPPORTED_LANGUAGES = Object.values(LANGUAGES);

export const getLanguageByCode = (code: string): Language | undefined => {
  return LANGUAGES[code as LanguageCode];
};

export const isRTL = (code: string): boolean => {
  const language = getLanguageByCode(code);
  return language?.direction === "rtl";
};
