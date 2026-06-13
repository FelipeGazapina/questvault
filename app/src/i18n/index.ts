import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { en } from "./en";
import { pt } from "./pt";

const LANG_KEY = "questvault.lang";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "EN · US" },
  { code: "pt", label: "PT · BR" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

// Guarded: this module is also evaluated by Expo Router's Node-side web renderer,
// where device locale and storage are unavailable.
const deviceLang: LanguageCode = (() => {
  try {
    return getLocales()[0]?.languageCode === "pt" ? "pt" : "en";
  } catch {
    return "en";
  }
})();

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: deviceLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

/** Apply a previously chosen language. Call from a client-side effect — never at module load (SSR has no storage). */
export function initStoredLanguage() {
  void AsyncStorage.getItem(LANG_KEY)
    .then((stored) => {
      if (stored && stored !== i18n.language && (stored === "en" || stored === "pt")) {
        void i18n.changeLanguage(stored);
      }
    })
    .catch(() => {});
}

export async function setLanguage(code: LanguageCode) {
  await i18n.changeLanguage(code);
  await AsyncStorage.setItem(LANG_KEY, code);
}

export default i18n;
