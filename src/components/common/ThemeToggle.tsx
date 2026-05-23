// ThemeToggle.tsx
import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useTranslation } from "react-i18next";

type ThemeValue = "light" | "dark" | "system";

export default function ThemeToggle() {
    const { theme, setTheme, actualTheme } = useTheme();
    const { t } = useTranslation();

    const themes: { value: ThemeValue; icon: React.ComponentType<{ size?: number }> }[] = [
        { value: "light", icon: Sun },
        { value: "dark", icon: Moon },
        { value: "system", icon: Monitor },
    ];

    return (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t("themeToggle.title")}
            </p>

            <div className="grid grid-cols-3 gap-1">
                {themes.map(({ value, icon: Icon }) => {
                    const selected = theme === value;

                    // base selected styles for light/dark
                    const lightSelected = "bg-blue-100 text-blue-900";
                    const darkSelected = "bg-blue-900/30 text-blue-300";
                    // systemSelected depends on current actualTheme
                    const systemSelected = actualTheme === "dark" ? darkSelected : lightSelected;

                    // choose appropriate selected classes
                    const selectedClasses =
                        value === "light" ? lightSelected
                            : value === "dark" ? darkSelected
                                : systemSelected;

                    const unselectedClasses =
                        "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700";

                    const label = t(`themeToggle.options.${value}`);

                    return (
                        <button
                            key={value}
                            onClick={() => setTheme(value)}
                            aria-pressed={selected}
                            aria-label={label}
                            title={label}
                            className={`
                flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all duration-200
                ${selected ? selectedClasses : unselectedClasses}
              `}
                        >
                            <Icon size={16} />
                            <span className="font-medium">{label}</span>
                            {selected && (
                                <div
                                    className={`w-1 h-1 rounded-full ${
                                        // darker dot for light-selected, lighter for dark-selected
                                        selectedClasses.includes("text-blue-900") ? "bg-blue-700" : "bg-blue-500"
                                    }`}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
