// src/pages/users/components/MultiSelect.tsx
import React, { useRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Scrollbar } from "react-scrollbars-custom";
import { RoundedCheckbox } from "@/components/ui/RoundedCheckbox";
import { useTheme } from '@/components/common/ThemeContext';

type MultiOption = { value: number; label: string; extra?: string };

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

// Shows a native tooltip only when the label is actually truncated
function OverflowAwareLabel({ text }: { text: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [overflow, setOverflow] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const check = () => setOverflow(el.scrollWidth > el.clientWidth);
        check();
        // Re-check on resize (fonts/width can change)
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, [text]);

    return (
        <div ref={ref} className="truncate" title={overflow ? text : undefined}>
            {text}
        </div>
    );
}

interface MultiSelectProps {
    label?: string;
    value: number[];
    onChange: (ids: number[]) => void;
    options: MultiOption[];
    placeholder?: string;
    className?: string;
    labelAlign?: "left" | "center" | "right";
    compact?: boolean;
}

export default function MultiSelect({
                                        label,
                                        value,
                                        onChange,
                                        options,
                                        placeholder = "Выберите...",
                                        className = "",
                                        labelAlign = "left",
                                        compact = false,
                                    }: MultiSelectProps) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';
    const [open, setOpen] = useState(false);
    const ref = useOutsideCloser<HTMLDivElement>(open, () => setOpen(false));

    const selectedCount = value.length;

    function toggle(id: number) {
        if (value.includes(id)) onChange(value.filter((v) => v !== id));
        else onChange([...value, id]);
    }

    const labelCls = labelAlign === "center" ? "text-center" : labelAlign === "right" ? "text-right" : "text-left";

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
        <span className={`text-sm font-medium truncate ${selectedCount > 0 ? "" : isDark ? "text-slate-400" : "text-gray-500"}`}>
          {selectedCount > 0 ? `${selectedCount} выбрано` : placeholder}
        </span>
                <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${isDark ? "text-slate-400" : "text-gray-600"} ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            {open && (
                <div
                    className={`absolute z-50 left-0 right-0 mt-2 w-full rounded-lg border shadow-xl overflow-hidden ${
                        isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
                    }`}
                >
                    <div
                        className={`px-3 py-2 border-b text-xs flex items-center justify-between font-medium ${
                            isDark ? "bg-slate-750 border-slate-700 text-slate-400" : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                    >
                        <span>Доступные группы</span>
                        {value.length > 0 && (
                            <button
                                type="button"
                                className={`${isDark ? "text-blue-400 hover:text-blue-300" : "text-indigo-600 hover:text-indigo-700"} text-xs font-medium`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange([]);
                                }}
                            >
                                Сбросить
                            </button>
                        )}
                    </div>

                    <Scrollbar
                        style={{ height: Math.min(options.length * 44, 280) }}
                        trackYProps={{
                            renderer: (props) => {
                                const { elementRef, ...restProps } = props;
                                return (
                                    <div
                                        {...restProps}
                                        ref={elementRef}
                                        className={`absolute right-0 top-0 bottom-0 w-2 rounded ${isDark ? "bg-slate-700/30" : "bg-gray-200/50"}`}
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
                                const isSelected = value.includes(o.value);
                                return (
                                    <div
                                        key={o.value}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => toggle(o.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                toggle(o.value);
                                            }
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium transition duration-150 ${
                                            isSelected
                                                ? isDark
                                                    ? "bg-blue-900/20 text-blue-300"
                                                    : "bg-indigo-50 text-indigo-800"
                                                : isDark
                                                    ? "text-slate-300 hover:bg-slate-700/50"
                                                    : "text-gray-800 hover:bg-gray-50"
                                        }`}
                                    >
                                        {/* Stop bubbling so clicking the checkbox doesn’t trigger the row’s onClick twice */}
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggle(o.value);
                                            }}
                                        >
                      <RoundedCheckbox
                          checked={isSelected}
                          onChange={() => {}}
                          isDark={isDark}
                          size={18}
                      />
                    </span>

                                        <div className="flex-1 min-w-0">
                                            <OverflowAwareLabel text={o.label} />
                                            {o.extra && (
                                                <div className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                                                    {o.extra}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {options.length === 0 && (
                                <div className={`px-3 py-6 text-sm text-center ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                                    Группы не найдены
                                </div>
                            )}
                        </div>
                    </Scrollbar>
                </div>
            )}
        </div>
    );
}
