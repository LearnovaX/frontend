import React, {useMemo, useRef, useState} from "react";
import {ChevronDown, Check} from "lucide-react";
import clsx from "clsx";
import {useLanguage} from "@/components/common/LanguageContext";
import {useTranslation} from "react-i18next";

/** Keep in sync with LanguageContext supported list */
type Lang = "ru" | "en" | "uz";

const normalize = (lng?: string | null, supported: string[] = []): Lang | "" => {
    const base = (lng || "").split("-")[0].toLowerCase();
    return supported.includes(base) ? (base as Lang) : "";
};

const FlagIcon = ({ country, className }: { country: Lang; className?: string }) => {
    const flags: Record<Lang, JSX.Element> = {
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
                <g fill="#FFFFFF">{[...Array(12)].map((_, i) => (
                    <circle key={i} cx={8 + (i * 1.2)} cy={4} r="0.3"/>
                ))}</g>
            </svg>
        ),
    };
    return flags[country];
};

type Props = {
    value: string | null | undefined;               // e.g. "en" or "en-US"
    onChange: (lng: Lang) => void;                   // controlled
    size?: "sm" | "md";
    className?: string;
    disabled?: boolean;
};

/**
 * Controlled language picker for editing OTHER users.
 * - Reads available languages from LanguageContext
 * - Does NOT call i18n.changeLanguage()
 * - Normalizes "en-US" -> "en"
 */
export default function UserLanguageSelect({
                                               value,
                                               onChange,
                                               size = "md",
                                               className,
                                               disabled
                                           }: Props) {
    const { supportedLanguages } = useLanguage();
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const current = normalize(value, supportedLanguages);

    const options = useMemo(
        () =>
            supportedLanguages.map((lng) => ({
                value: lng as Lang,
                label: t(`language.${lng}`) || lng.toUpperCase(),
            })),
        [supportedLanguages, t]
    );

    // close on outside click
    React.useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const buttonSizes = size === "sm"
        ? "h-9 px-3 text-xs min-w-[140px]"
        : "h-10 px-4 text-sm min-w-[160px]";

    return (
        <div ref={ref} className={clsx("relative", className)}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className={clsx(
                    "group inline-flex items-center justify-between gap-2 rounded-xl border",
                    "bg-[var(--color-surface-1)] border-[var(--color-border)] text-[var(--color-foreground)]",
                    "shadow-sm hover:shadow-md transition-all duration-200",
                    "hover:bg-[var(--color-surface-2)] hover:border-[var(--color-border-hover)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                    "backdrop-blur-sm w-full",
                    buttonSizes,
                    disabled && "opacity-60 cursor-not-allowed"
                )}
            >
                <div className="flex items-center gap-2">
                    {current ? (
                        <>
                            <FlagIcon country={current} className={size === "sm" ? "w-4 h-3" : "w-5 h-4"} />
                            <span className="font-medium">
                {t(`language.${current}`) || current.toUpperCase()}
              </span>
                        </>
                    ) : (
                        <span className="font-medium opacity-70">{t("language.label")}</span>
                    )}
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
                        {options.map((opt) => {
                            const active = opt.value === current;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setOpen(false);
                                    }}
                                    role="option"
                                    aria-selected={active}
                                    className={clsx(
                                        "w-full flex items-center justify-between gap-3 px-3 py-2.5",
                                        "text-sm transition-colors",
                                        "hover:bg-[var(--color-surface-2)] focus-visible:outline-none",
                                        "focus-visible:bg-[var(--color-surface-2)]",
                                        active && "bg-[var(--color-surface-2)] text-[var(--color-primary)]"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <FlagIcon country={opt.value} className="w-5 h-4 flex-shrink-0" />
                                        <span className="font-medium">{opt.label}</span>
                                    </div>
                                    {active && <Check className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
