import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const I18nDebug = () => {
  const { t, i18n, ready } = useTranslation();

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }
  }, [i18n.language, ready, i18n, t]);

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded text-xs font-mono max-w-md z-[9999]">
      <div className="font-bold mb-2">i18n Debug</div>
      <div>Language: {i18n.language}</div>
      <div>Ready: {ready ? "✅" : "❌"}</div>
      <div>Test: {t("common:buttons.save")}</div>
      <div>Navigation Back: {t("navigation:back")}</div>
      <div>Pages Title: {t("pages:unitsView.title")}</div>
    </div>
  );
};
