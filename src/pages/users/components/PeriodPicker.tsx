// src/pages/users/components/PeriodPicker.tsx
import React, {useState} from "react";
import {useTranslation} from "react-i18next";
import {useTheme} from '@/components/common/ThemeContext';

interface PeriodPickerProps {
    value: number;
    onChange: (days: number) => void;
}

export default function PeriodPicker({
                                         value,
                                         onChange,
                                     }: PeriodPickerProps) {
    const {t} = useTranslation();
    const {actualTheme} = useTheme();
    const isDark = actualTheme === 'dark';
    const [showCustom, setShowCustom] = useState(false);
    const [start, setStart] = useState<string>("");
    const [end, setEnd] = useState<string>("");

    function applyCustom() {
        const today = new Date();
        const endDate = end ? new Date(end) : today;
        const startDate = start ? new Date(start) : new Date(today.getTime() - 29 * 86400000);

        const clampedEnd = today;
        const ms = Math.max(0, clampedEnd.getTime() - startDate.getTime());
        const days = Math.max(1, Math.ceil(ms / 86400000));
        onChange(days);
        setShowCustom(false);
    }

    const ALL_TIME_DAYS = 36500;

    const PERIOD_PRESETS = [
        {label: t('users.7d'), days: 7},
        {label: t('users.30d'), days: 30},
        {label: t('users.90d'), days: 90},
        {label: t('users.180d'), days: 180},
        {label: t('users.365d'), days: 365},
        {label: t('users.allTime'), days: ALL_TIME_DAYS},
    ];

    return (
        <div className="flex items-center flex-wrap gap-2">
            {PERIOD_PRESETS.map((p) => (
                <button
                    key={p.days}
                    onClick={() => onChange(p.days)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition cursor-pointer ${value === p.days ? (isDark ? "bg-blue-600 text-white border-blue-600" : "bg-gray-900 text-white border-gray-900") : (isDark ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700" : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50")}`}
                >
                    {p.label}
                </button>
            ))}

            <div className="relative">
                <button
                    onClick={() => setShowCustom((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition cursor-pointer ${showCustom ? (isDark ? "bg-blue-600 text-white border-blue-600" : "bg-gray-900 text-white border-gray-900") : (isDark ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700" : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50")}`}
                >
                    {t('users.customPeriod')}
                </button>

                {showCustom && (
                    <div
                        className={`absolute z-50 mt-2 w-[320px] p-3 rounded-xl border shadow-lg ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
                        <div
                            className={`text-sm mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>{t('users.intervalToToday')}:
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label
                                    className={`block text-xs mb-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>{t('common.start')}</label>
                                <input
                                    type="date"
                                    className={`w-full h-9 px-2 rounded-lg border focus:ring-2 focus:ring-indigo-100 ${isDark ? "bg-slate-700 border-slate-600 text-slate-200" : "bg-white border-gray-200 text-black"}`}
                                    value={start}
                                    onChange={(e) => setStart(e.target.value)}
                                />
                            </div>
                            <div>
                                <label
                                    className={`block text-xs mb-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>{t('common.end')}</label>
                                <input
                                    type="date"
                                    className={`w-full h-9 px-2 rounded-lg border focus:ring-2 focus:ring-indigo-100 ${isDark ? "bg-slate-700 border-slate-600 text-slate-200" : "bg-white border-gray-200 text-black"}`}
                                    value={end}
                                    onChange={(e) => setEnd(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                            <button
                                onClick={() => setShowCustom(false)}
                                className={`px-3 py-1.5 rounded-lg text-sm transition cursor-pointer ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border border-gray-200 hover:bg-gray-50 text-gray-800"}`}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={applyCustom}
                                className={`px-3 py-1.5 rounded-lg text-sm transition cursor-pointer ${isDark ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-900 text-white hover:bg-gray-800"}`}
                            >
                                {t('common.apply')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}