// src/pages/users/components/PageSizeSelect.tsx
import React, {useEffect, useMemo, useRef, useState} from "react";
import {ChevronDown, Check} from "lucide-react";
import {useTranslation} from "react-i18next";
import {useTheme} from "@/components/common/ThemeContext.tsx";

type Direction = "up" | "down";
type Align = "left" | "center" | "right";

interface PageSizeSelectProps {
    value: number;
    onChange: (value: number) => void;
    /** i18n label, e.g. t('common.perPage'). Defaults to that if i18n is available */
    label?: string;
    /** Visual alignment of label */
    labelAlign?: Align;
    /** Smaller paddings like your old "compact" FancySelect */
    compact?: boolean;
    /** Force opening direction (old component used "up") */
    direction?: Direction;
    /** Extra classes for the wrapper, e.g. min-w */
    className?: string;
    /** Override options if needed */
    options?: number[];
    showTopLabel?: boolean; // new
}

export default function PageSizeSelect({
                                           value,
                                           onChange,
                                           label,
                                           labelAlign = "center",
                                           compact = false,
                                           direction = "down",
                                           className = "",
                                           options = [10, 25, 50, 100],
                                       }: PageSizeSelectProps) {
    const {t} = useTranslation();
    const resolvedLabel = label ?? t?.("common.perPage") ?? "per page";

    const [isOpen, setIsOpen] = useState(false);
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';
    const [focusedIndex, setFocusedIndex] = useState(
        Math.max(0, options.indexOf(value))
    );

    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const listboxId = useMemo(() => `pss-listbox-${Math.random().toString(36).slice(2)}`, []);
    const labelId = useMemo(() => `pss-label-${Math.random().toString(36).slice(2)}`, []);

    // SSR-safe theme detection (works with localStorage or .dark class on <html>)


    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Keep focused index in sync with current value when opening
    useEffect(() => {
        if (isOpen) {
            const idx = options.indexOf(value);
            setFocusedIndex(idx >= 0 ? idx : 0);
        }
    }, [isOpen, options, value]);

    const baseButtonPad = compact ? "px-3 py-2" : "px-4 py-2.5";
    const ringWhenOpen = isDark ? "ring-blue-500/30" : "ring-indigo-500/30";

    const menuPos =
        direction === "up"
            ? "bottom-full mb-2"
            : "top-full mt-2";

    const fadeAnim =
        direction === "up"
            ? "animate-[dropdownFadeInUp_0.2s_ease-out]"
            : "animate-[dropdownFadeInDown_0.2s_ease-out]";

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        if (e.key === "Escape") {
            e.preventDefault();
            setIsOpen(false);
            buttonRef.current?.focus();
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusedIndex((i) => (i + 1) % options.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedIndex((i) => (i - 1 + options.length) % options.length);
        } else if (e.key === "Home" || e.key === "PageUp") {
            e.preventDefault();
            setFocusedIndex(0);
        } else if (e.key === "End" || e.key === "PageDown") {
            e.preventDefault();
            setFocusedIndex(options.length - 1);
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const chosen = options[focusedIndex] ?? options[0];
            onChange(chosen);
            setIsOpen(false);
            buttonRef.current?.focus();
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef} onKeyDown={handleKeyDown}>
            {/* Label */}
            <div
                id={labelId}
                className={`text-xs font-medium mb-1 select-none ${
                    isDark ? "text-slate-400" : "text-gray-600"
                } ${labelAlign === "center" ? "text-center" : labelAlign === "right" ? "text-right" : "text-left"}`}
            >
                {resolvedLabel}
            </div>

            {/* Button */}
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-labelledby={labelId}
                className={`
          ${baseButtonPad} rounded-xl border font-medium
          transition-all duration-300 ease-out
          w-full flex items-center justify-between gap-2
          ${isDark
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/20"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/20"
                }
          ${isOpen ? `scale-105 ring-2 ${ringWhenOpen}` : "hover:scale-105"}
          active:scale-95
        `}
            >
        <span className="truncate">
          {value} / {resolvedLabel}
        </span>
                <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                />
            </button>

            {/* Menu */}
            {isOpen && (
                <div
                    role="listbox"
                    id={listboxId}
                    aria-labelledby={labelId}
                    tabIndex={-1}
                    className={`
            absolute right-0 ${menuPos} w-44 rounded-2xl border overflow-hidden
            shadow-2xl backdrop-blur-sm z-50
            ${isDark ? "bg-slate-800/95 border-slate-700" : "bg-white/95 border-gray-200"}
            ${fadeAnim}
          `}
                >
                    <div className="py-2">
                        {options.map((option, idx) => {
                            const selected = option === value;
                            const focused = idx === focusedIndex;

                            return (
                                <button
                                    key={option}
                                    role="option"
                                    aria-selected={selected}
                                    onMouseEnter={() => setFocusedIndex(idx)}
                                    onClick={() => {
                                        onChange(option);
                                        setIsOpen(false);
                                        buttonRef.current?.focus();
                                    }}
                                    className={`
                    w-full ${compact ? "px-3 py-2" : "px-4 py-2.5"} text-left font-medium
                    transition-all duration-200
                    flex items-center justify-between
                    outline-none
                    ${selected
                                        ? (isDark ? "bg-blue-500/10 text-blue-400" : "bg-indigo-50 text-indigo-600")
                                        : (isDark ? "text-slate-300 hover:bg-slate-700/50" : "text-gray-700 hover:bg-gray-50")
                                    }
                    ${focused ? (isDark ? "ring-1 ring-blue-500/40" : "ring-1 ring-indigo-300") : ""}
                  `}
                                >
                  <span>
                    {option} / {resolvedLabel}
                  </span>
                                    {selected && (
                                        <Check
                                            className={`${isDark ? "text-blue-400" : "text-indigo-600"} h-4 w-4 animate-[checkMark_0.3s_ease-out]`}
                                            aria-hidden="true"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Animations */}
            {/* Animations */}
            <style>{`
  @keyframes dropdownFadeInDown {
    from { opacity: 0; transform: translateY(-10px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0)      scale(1); }
  }
  @keyframes dropdownFadeInUp {
    from { opacity: 0; transform: translateY(10px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
  }
  @keyframes checkMark {
    from { opacity: 0; transform: scale(0.5) rotate(-90deg); }
    to   { opacity: 1; transform: scale(1)   rotate(0deg);  }
  }
`}</style>

        </div>
    );
}
