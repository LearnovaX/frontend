// src/components/common/LanguageSwitcher.tsx
import { Globe, Check, ChevronDown } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "./LanguageContext";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

type Lang = "ru" | "en" | "uz";

type Props = {
    size?: "sm" | "md";
    persistToBackend?: boolean;
    className?: string;
    value?: Lang;  // NEW: for controlled mode
    onChange?: (lng: Lang) => void;  // NEW: for controlled mode
};

const labels: Record<Lang, string> = {
    ru: "Русский",
    en: "English",
    uz: "O'zbekcha",
};

// Proper country flag SVGs for better visual quality
const FlagIcon = ({ country, className }: { country: Lang; className?: string }) => {
    const flags = {
        en: (
            <svg className={className} viewBox="0 0 24 16" fill="none">
                <rect width="24" height="16" rx="2" fill="#B22234"/>
                <rect width="24" height="1.23" fill="#B22234"/>
                <rect y="2.46" width="24" height="1.23" fill="#FFFFFF"/>
                <rect y="4.92" width="24" height="1.23" fill="#B22234"/>
                <rect y="7.38" width="24" height="1.23" fill="#FFFFFF"/>
                <rect y="9.84" width="24" height="1.23" fill="#B22234"/>
                <rect y="12.3" width="24" height="1.23" fill="#FFFFFF"/>
                <rect y="14.76" width="24" height="1.23" fill="#B22234"/>
                <rect width="9.6" height="8.6" fill="#3C3B6E"/>
            </svg>
        ),
        ru: (
            <svg className={className} viewBox="0 0 24 16" fill="none">
                <rect width="24" height="16" rx="2" fill="#0039A6"/>
                <rect width="24" height="5.33" fill="#FFFFFF"/>
                <rect y="10.67" width="24" height="5.33" fill="#D52B1E"/>
            </svg>
        ),
        uz: (
            <svg className={className} viewBox="0 0 24 16" fill="none">
                <rect width="24" height="16" rx="2" fill="#1EB53A"/>
                <rect width="24" height="5.33" fill="#0099B5"/>
                <rect y="5.33" width="24" height="5.34" fill="#FFFFFF"/>
                <rect y="5.33" width="24" height="0.8" fill="#CE1126"/>
                <rect y="10.87" width="24" height="0.8" fill="#CE1126"/>
                <circle cx="4" cy="4" r="1.5" fill="#FFFFFF"/>
                <g fill="#FFFFFF">
                    {[...Array(12)].map((_, i) => (
                        <circle key={i} cx={8 + (i * 1.2)} cy={4} r="0.3"/>
                    ))}
                </g>
            </svg>
        )
    };

    return flags[country] || null;
};

export default function LanguageSwitcher({
                                             size = "md",
                                             persistToBackend = false,
                                             className,
                                             value,
                                             onChange,
                                         }: Props) {
    const { t } = useTranslation();
    const { currentLanguage: ctxLang, changeLanguage: ctxChange, supportedLanguages } = useLanguage();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const effectiveValue = value ?? ctxLang;
    const effectiveLang = supportedLanguages.includes(effectiveValue) ? effectiveValue : "ru" as Lang;
    const current = labels[effectiveLang];

    // Close on outside click & ESC
    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onEsc);
        };
    }, []);

    const handlePick = async (lng: Lang) => {
        if (saving || lng === effectiveLang) {
            setOpen(false);
            return;
        }
        setSaving(true);
        if (onChange) {
            onChange(lng);
        } else {
            await ctxChange(lng, persistToBackend);
        }
        setSaving(false);
        setOpen(false);
    };

    const buttonSizes = size === "sm"
        ? "h-9 px-3 text-xs min-w-[120px]"
        : "h-10 px-4 text-sm min-w-[140px]";

    return (
        <div ref={ref} className={clsx("relative", className)}>
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen(v => !v)}
                className={clsx(
                    "group inline-flex items-center justify-between gap-2 rounded-xl border",
                    "bg-[var(--color-surface-1)] border-[var(--color-border)] text-[var(--color-foreground)]",
                    "shadow-sm hover:shadow-md transition-all duration-200",
                    "hover:bg-[var(--color-surface-2)] hover:border-[var(--color-border-hover)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                    "backdrop-blur-sm",
                    buttonSizes
                )}
            >
                <div className="flex items-center gap-2">
                    <FlagIcon
                        country={effectiveLang}
                        className={size === "sm" ? "w-4 h-3" : "w-5 h-4"}
                    />
                    <span className="font-medium">{current}</span>
                </div>
                <ChevronDown
                    className={clsx(
                        "opacity-60 group-hover:opacity-100 transition-all duration-200",
                        "text-[var(--color-muted)]",
                        size === "sm" ? "w-3 h-3" : "w-4 h-4",
                        open && "rotate-180"
                    )}
                />
            </button>

            {open && (
                <div
                    className={clsx(
                        "absolute right-0 mt-2 rounded-xl border",
                        "bg-[var(--color-elevated)] border-[var(--color-border)]",
                        "backdrop-blur-xl shadow-xl animate-in slide-in-from-top-2",
                        "duration-200 z-50 min-w-full overflow-hidden"
                    )}
                    role="listbox"
                >
                    <div className="py-1">
                        {supportedLanguages.map((lng) => {
                            const active = lng === effectiveLang;
                            return (
                                <button
                                    key={lng}
                                    onClick={() => handlePick(lng as Lang)}
                                    role="option"
                                    aria-selected={active}
                                    disabled={saving}
                                    className={clsx(
                                        "w-full flex items-center justify-between gap-3 px-3 py-2.5",
                                        "text-sm transition-colors",
                                        "hover:bg-[var(--color-surface-2)] focus-visible:outline-none",
                                        "focus-visible:bg-[var(--color-surface-2)]",
                                        "disabled:opacity-50 disabled:cursor-not-allowed",
                                        active && "bg-[var(--color-surface-2)] text-[var(--color-primary)]"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <FlagIcon
                                            country={lng as Lang}
                                            className="w-5 h-4 flex-shrink-0"
                                        />
                                        <span className="font-medium">{labels[lng as Lang]}</span>
                                    </div>
                                    {active && (
                                        <Check className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {saving && (
                        <div className="px-3 py-2 border-t border-[var(--color-border)] bg-[var(--color-surface-1)]">
                            <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                                <div className="w-3 h-3 border border-[var(--color-muted)] border-t-transparent rounded-full animate-spin"></div>
                                <span>{t("language.saving")}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}