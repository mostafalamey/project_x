import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LANGUAGE } from "./languages";

const isDevelopment = import.meta.env.DEV;

// In development, BASE_URL is '/', in production it might be './'
const basePath = isDevelopment ? "/" : import.meta.env.BASE_URL;

i18n
  // Load translations using http backend
  .use(HttpBackend)
  // Detect user language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Fallback language
    fallbackLng: DEFAULT_LANGUAGE,

    // Supported languages
    supportedLngs: ["en", "ar"],

    // Default namespace
    defaultNS: "common",

    // Available namespaces
    ns: ["common", "navigation", "pages", "admin"],

    // Debug mode in development
    debug: isDevelopment,

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Backend options for loading translation files
    backend: {
      loadPath: `${basePath}locales/{{lng}}/{{ns}}.json`,
    },

    // Language detection options
    detection: {
      // Order of detection methods
      order: ["localStorage", "navigator"],

      // Cache user language preference
      caches: ["localStorage"],

      // LocalStorage key
      lookupLocalStorage: "i18nextLng",
    },

    // React options
    react: {
      // Wait for translations to load before rendering
      useSuspense: false,
    },

    // Load namespaces on init
    load: "languageOnly",

    // Preload these namespaces
    preload: ["en", "ar"],
  });

export default i18n;
