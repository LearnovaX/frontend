// src/pages/users/components/ExportModal.tsx
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from '@/components/common/ThemeContext';

interface ExportModalProps {
    open: boolean;
    onClose: () => void;
    onExport: (format: "csv" | "xlsx") => Promise<void>;
    defaultFormat?: "csv" | "xlsx";
}

export default function ExportModal({
                                        open,
                                        onClose,
                                        onExport,
                                        defaultFormat = "csv",
                                    }: ExportModalProps) {
    const { t } = useTranslation();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';
    const [format, setFormat] = useState<"csv" | "xlsx">(defaultFormat);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) setFormat(defaultFormat);
    }, [open, defaultFormat]);

    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-300">
            <div
                className={`rounded-2xl shadow-2xl border p-6 w-full max-w-sm transform scale-100 opacity-100 transition-all duration-200 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${isDark ? "text-slate-200" : "text-gray-800"}`}>{t('users.exportUsers')}</h3>
                    <button onClick={onClose}
                            className={`p-1.5 rounded-lg transition duration-150 cursor-pointer ${isDark ? "hover:bg-slate-700" : "hover:bg-gray-100"}`}>
                        <X className={`h-5 w-5 ${isDark ? "text-slate-400" : "text-gray-600"}`}/>
                    </button>
                </div>

                <div className="mb-4 flex gap-6">
                    <label
                        className={`inline-flex items-center gap-2 text-base cursor-pointer ${isDark ? "text-slate-300" : "text-gray-800"}`}>
                        <input type="radio" name="export-format" value="csv"
                               checked={format === "csv"} onChange={() => setFormat("csv")}
                               className="form-radio text-indigo-600"/>
                        <span>CSV</span>
                    </label>
                    <label
                        className={`inline-flex items-center gap-2 text-base cursor-pointer ${isDark ? "text-slate-300" : "text-gray-800"}`}>
                        <input type="radio" name="export-format" value="xlsx"
                               checked={format === "xlsx"} onChange={() => setFormat("xlsx")}
                               className="form-radio text-indigo-600"/>
                        <span>XLSX</span>
                    </label>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-lg text-sm transition duration-200 cursor-pointer disabled:opacity-50 ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border border-gray-200 text-gray-800 hover:bg-gray-50"}`}
                        disabled={loading}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={async () => {
                            setLoading(true);
                            try {
                                await onExport(format);
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className={`px-4 py-2 rounded-lg text-white transition duration-200 cursor-pointer disabled:opacity-50 ${isDark ? "bg-blue-600 hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
                    >
                        {loading ? t('common.exporting') : t('common.export')}
                    </button>
                </div>
            </div>
        </div>
    );
}