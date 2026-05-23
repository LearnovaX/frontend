// src/pages/users/components/FancySelect.tsx
import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Scrollbar } from "react-scrollbars-custom";
import { useTheme } from '@/components/common/ThemeContext';

type Option = { value: string; label: string; extra?: string };

function useOutsideCloser<T extends HTMLElement>(open: boolean, onClose: () => void) {
    const ref = useRef<T | null>(null);
    useEffect(() => {
        if (!open) return;
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open, onClose]);
    return ref;
}

interface FancySelectProps {
    label?: string;
    value: string;
    onChange: (v: string) => void;
    options: Option[];
    className?: string;
    placeholder?: string;
    labelAlign?: "left" | "center" | "right";
    compact?: boolean;
    direction?: "down" | "up";
}

export default function FancySelect({
                                        label,
                                        value,
                                        onChange,
                                        options,
                                        className = "",
                                        placeholder = "Выберите...",
                                        labelAlign = "left",
                                        compact = false,
                                        direction = "down",
                                    }: FancySelectProps) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';
    const [open, setOpen] = useState(false);
    const current = options.find((o) => o.value === value);
    const ref = useOutsideCloser<HTMLDivElement>(open, () => setOpen(false));

    const labelCls = labelAlign === "center" ? "text-center" : labelAlign === "right" ? "text-right" : "text-left";
    const menuPosition = direction === "up" ? "mb-2 bottom-full origin-bottom" : "mt-2 top-auto origin-top";

    return (
        <div className={`relative min-w-0 ${className}`} ref={ref}>
            {label && (
                <div className={`text-xs mb-1.5 font-medium ${labelCls} ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                    {label}
                </div>
            )}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`w-full flex items-center justify-between gap-2 px-3 ${compact ? "h-10 py-0" : "py-2.5"} rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
                    isDark
                        ? "bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-200"
                        : "border-gray-200 bg-white hover:border-gray-300 text-gray-800"
                } focus:ring-2 focus:ring-indigo-100 shadow-sm`}
            >
        <span className={`truncate text-sm font-medium ${current ? "" : isDark ? "text-slate-400" : "text-gray-500"}`}>
          {current ? (
              <>
                  <span>{current.label}</span>
                  {current.extra && (
                      <span className={`${isDark ? "text-slate-400" : "text-gray-500"} ml-1`}> · {current.extra}</span>
                  )}
              </>
          ) : (
              placeholder
          )}
        </span>
                <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${isDark ? "text-slate-400" : "text-gray-600"} ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            {open && (
                <div
                    className={`absolute z-50 left-0 right-0 w-full rounded-lg border shadow-xl overflow-hidden transition-all duration-200 ease-out scale-y-100 opacity-100 ${menuPosition} ${
                        isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
                    }`}
                >
                    <Scrollbar
                        style={{ height: Math.min(options.length * 44, 280) }}
                        trackYProps={{
                            renderer: (props) => {
                                const { elementRef, ...restProps } = props;
                                return (
                                    <div
                                        {...restProps}
                                        ref={elementRef}
                                        className={`absolute right-0 top-0 bottom-0 w-2 rounded ${
                                            isDark ? "bg-slate-700/30" : "bg-gray-200/50"
                                        }`}
                                    />
                                );
                            },
                        }}
                        thumbYProps={{
                            renderer: (props) => {
                                const { elementRef, ...restProps } = props;
                                return (
                                    <div
                                        {...restProps}
                                        ref={elementRef}
                                        className={`rounded w-full ${isDark ? "bg-slate-600" : "bg-gray-400"}`}
                                    />
                                );
                            },
                        }}
                    >
                        <div>
                            {options.map((o) => {
                                const selected = o.value === value;
                                return (
                                    <button
                                        key={o.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(o.value);
                                            setOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm font-medium transition duration-150 ${
                                            selected
                                                ? isDark
                                                    ? "bg-blue-900/20 text-blue-300"
                                                    : "bg-indigo-50 text-indigo-800"
                                                : isDark
                                                    ? "text-slate-300 hover:bg-slate-700/50"
                                                    : "text-gray-800 hover:bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0 truncate">
                                            <div>{o.label}</div>
                                            {o.extra && (
                                                <div className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                                                    {o.extra}
                                                </div>
                                            )}
                                        </div>
                                        {selected && (
                                            <Check className={`h-4 w-4 flex-shrink-0 ${isDark ? "text-blue-400" : "text-indigo-600"}`} />
                                        )}
                                    </button>
                                );
                            })}
                            {options.length === 0 && (
                                <div className={`px-3 py-4 text-sm text-center ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                                    Нет вариантов
                                </div>
                            )}
                        </div>
                    </Scrollbar>
                </div>
            )}
        </div>
    );
}