// src/components/common/LanguageContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import i18n from "@/i18n";
import api from "@/api/api";
import { useAuth } from "@/auth/AuthContext";

type Language = "ru" | "en" | "uz";

type LanguageContextValue = {
    currentLanguage: Language;
    changeLanguage: (lng: Language, persistToBackend?: boolean) => Promise<void>;
    supportedLanguages: Language[];
    loadingServerLanguage: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const normalize = (lng?: string): Language => {
    const base = (lng || "").split("-")[0].toLowerCase();
    return (["ru", "en", "uz"].includes(base) ? base : "ru") as Language;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const supportedLanguages: Language[] = ["ru", "en", "uz"];
    const [currentLanguage, setCurrentLanguage] = useState<Language>(() => normalize(i18n.language));
    const [loadingServerLanguage, setLoadingServerLanguage] = useState(false);
    const { accessToken } = useAuth();

    // keep html lang in sync
    useEffect(() => {
        document.documentElement.lang = currentLanguage;
    }, [currentLanguage]);

    // reflect external i18n changes
    useEffect(() => {
        const onChanged = (lng: string) => setCurrentLanguage(normalize(lng));
        i18n.on("languageChanged", onChanged);
        return () => i18n.off("languageChanged", onChanged);
    }, []);

    // hydrate from backend if authenticated
    useEffect(() => {
        let active = true;
        (async () => {
            if (!accessToken) return;
            try {
                setLoadingServerLanguage(true);
                const { data } = await api.get("accounts/user/profile/");
                const serverLng = normalize(data?.interface_language);
                if (serverLng && serverLng !== normalize(i18n.language)) {
                    await i18n.changeLanguage(serverLng);
                    setCurrentLanguage(serverLng);
                    localStorage.setItem("i18nextLng", serverLng);
                }
            } catch {
                // ignore silently; detectors/localStorage handle guests
            } finally {
                if (active) setLoadingServerLanguage(false);
            }
        })();
        return () => { active = false; };
    }, [accessToken]);

    const changeLanguage = async (lng: Language, persistToBackend = false) => {
        if (!supportedLanguages.includes(lng)) return;
        await i18n.changeLanguage(lng);
        setCurrentLanguage(lng);
        try { localStorage.setItem("i18nextLng", lng); } catch {}

        // optionally persist to backend
        if (persistToBackend && accessToken) {
            try {
                await api.patch("accounts/user/update_profile/", { interface_language: lng });
            } catch (e) {
                // still keep UI language; backend persistence is best-effort
                console.warn("Failed to persist language to backend:", e);
            }
        }
    };

    const value = useMemo(
        () => ({ currentLanguage, changeLanguage, supportedLanguages, loadingServerLanguage }),
        [currentLanguage, supportedLanguages, loadingServerLanguage]
    );

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
    return ctx;
}
