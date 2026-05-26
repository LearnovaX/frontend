// src/pages/users/components/ChartModalWrapper.tsx
import React from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from '@/components/common/ThemeContext';

interface ChartModalWrapperProps {
    isOpen: boolean;
    onClose: () => void;
    chartsLoading: boolean;
    isDark: boolean;
    t: any;
    children: React.ReactNode;
}

export default function ChartModalWrapper({
                                              isOpen,
                                              onClose,
                                              chartsLoading,
                                              isDark,
                                              t,
                                              children,
                                          }: ChartModalWrapperProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className={`absolute inset-0 transition-opacity ${isDark ? "bg-black/40" : "bg-white/20"} backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-lg`}
                onClick={onClose}
            />

            <div
                className={`relative rounded-2xl shadow-2xl w-[70%] max-w-6xl max-h-[90%] overflow-y-auto ${isDark ? "bg-slate-800" : "bg-white"}`}>
                <div
                    className={`sticky top-0 border-b px-6 py-4 flex justify-between items-center rounded-t-2xl ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-slate-700" : "hover:bg-gray-100"}`}
                    >
                        <X className={`h-5 w-5 ${isDark ? "text-slate-400" : "text-gray-500"}`}/>
                    </button>
                </div>

                <div className="p-6">
                    {chartsLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div
                                className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            <span
                                className={`ml-3 text-lg ${isDark ? "text-slate-400" : "text-gray-600"}`}>{t('common.loadingData')}</span>
                        </div>
                    ) : (
                        children
                    )}
                </div>
            </div>
        </div>
    );
}