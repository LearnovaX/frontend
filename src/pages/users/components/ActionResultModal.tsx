// src/pages/users/components/ActionResultModal.tsx
import React from "react";
import { AlertCircle, Check, X } from "lucide-react";
import { useTheme } from '@/components/common/ThemeContext';

interface ActionResultModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    message: string;
    warning?: string;
    isError: boolean;
    isDark: boolean;
}

export default function ActionResultModal({
                                              open,
                                              onClose,
                                              title,
                                              message,
                                              warning = '',
                                              isError,
                                              isDark,
                                          }: ActionResultModalProps) {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-300">
            <div
                className={`rounded-2xl shadow-2xl border p-6 w-full max-w-md transform scale-100 opacity-100 transition-all duration-200 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${isDark ? "text-slate-200" : "text-gray-800"}`}>{title}</h3>
                    <button onClick={onClose}
                            className={`p-1.5 rounded-lg transition duration-150 cursor-pointer ${isDark ? "hover:bg-slate-700" : "hover:bg-gray-100"}`}>
                        <X className={`h-5 w-5 ${isDark ? "text-slate-400" : "text-gray-600"}`}/>
                    </button>
                </div>
                <div className="mb-4 flex items-start gap-3">
                    {isError ? (
                        <AlertCircle
                            className={`h-6 w-6 ${isDark ? "text-rose-300" : "text-rose-600"}`}/>
                    ) : (
                        <Check
                            className={`h-6 w-6 ${isDark ? "text-emerald-300" : "text-emerald-600"}`}/>
                    )}
                    <p className={`text-base ${isDark ? "text-slate-300" : "text-gray-700"}`}>{message}</p>
                </div>
                {warning && (
                    <div
                        className={`mb-4 p-3 rounded-lg text-sm ${isDark ? "bg-amber-900/30 text-amber-300" : "bg-amber-50 text-amber-700"}`}>
                        {warning}
                    </div>
                )}
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className={`px-5 py-2.5 rounded-lg text-sm transition duration-200 cursor-pointer ${isDark ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-800 text-white hover:bg-gray-900"}`}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}