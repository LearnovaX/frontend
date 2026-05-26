// src/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
    .use(HttpBackend) // load translation files
    .use(LanguageDetector) // detect user language
    .use(initReactI18next) // pass to react-i18next
    .init({
        supportedLngs: ["ru", "en", "uz"],
        fallbackLng: "ru",            // PRIMARY language (Russian)
        ns: ["translation"],
        defaultNS: "translation",
        debug: false,                 // set to true during dev if needed
        interpolation: {
            escapeValue: false // react already safe from XSS
        },

        backend: {
            // Path to load translations from public folder
            loadPath: "/locales/{{lng}}/{{ns}}.json"
        },

        detection: {
            // Where to look for language preference (order matters)
            order: ["localStorage", "querystring", "navigator", "htmlTag"],
            caches: ["localStorage"],
            lookupLocalStorage: "i18nextLng",
            lookupQuerystring: "lng",
            // optional: exclude cache for dev if you want fresh loads
        },

        react: {
            useSuspense: true // recommended, we will show fallback in Suspense
        }
    });

export default i18n;
