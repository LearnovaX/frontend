// src/pages/users/components/BulkActionsModal.tsx
import React from "react";
import FancySelect from "./FancySelect";

interface BulkActionsModalProps {
    open: boolean;
    onClose: (b: boolean) => void;
    selectedUserIds: number[];
    bulkAction: string;
    setBulkAction: (a: string) => void;
    bulkExportFormat: "csv" | "xlsx";
    setBulkExportFormat: (f: "csv" | "xlsx") => void;
    handleBulkAction: () => Promise<void>;
    isDark: boolean;
    t: any;
}

export default function BulkActionsModal({
                                             open,
                                             onClose,
                                             selectedUserIds,
                                             bulkAction,
                                             setBulkAction,
                                             bulkExportFormat,
                                             setBulkExportFormat,
                                             handleBulkAction,
                                             isDark,
                                             t,
                                         }: BulkActionsModalProps) {
    if (!open) return null;
    return (
        <div
            className={`fixed inset-0 z-50 p-4 transition-all duration-300 ${isDark ? "bg-black/60" : "bg-black/50"} backdrop-blur-sm flex items-center justify-center`}>
            <div
                className={`rounded-2xl shadow-2xl border max-w-md w-full transform scale-100 opacity-100 transition-all duration-200 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
                <div className="p-6">
                    <h2 className={`text-xl font-bold mb-4 ${isDark ? "text-slate-200" : "text-gray-900"}`}>{t('users.bulkActions')}</h2>
                    <p className={`mb-4 text-base ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                        {t('users.selectedUsers')}: {selectedUserIds.length}
                    </p>
                    <div className="mb-4">
                        <label
                            className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                            {t('common.action')}
                        </label>
                        <FancySelect
                            value={bulkAction}
                            onChange={setBulkAction}
                            options={[
                                {value: "", label: t('users.selectAction')},
                                {value: "activate", label: t('users.activate')},
                                {value: "deactivate", label: t('users.deactivate')},
                                {value: "unauthorize", label: t('users.unauthorize')},
                                {value: "export", label: t('common.export')},
                            ]}
                            className="w-full"
                        />
                        {bulkAction === 'export' && (
                            <div className="mt-4">
                                <label
                                    className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>{t('common.format')}</label>
                                <div className="flex gap-6">
                                    <label
                                        className={`inline-flex items-center gap-2 text-base cursor-pointer ${isDark ? "text-slate-300" : "text-gray-800"}`}>
                                        <input
                                            type="radio"
                                            name="export-format"
                                            value="csv"
                                            checked={bulkExportFormat === 'csv'}
                                            onChange={() => setBulkExportFormat('csv')}
                                            className="form-radio text-indigo-600"
                                        />
                                        <span>CSV</span>
                                    </label>
                                    <label
                                        className={`inline-flex items-center gap-2 text-base cursor-pointer ${isDark ? "text-slate-300" : "text-gray-800"}`}>
                                        <input
                                            type="radio"
                                            name="export-format"
                                            value="xlsx"
                                            checked={bulkExportFormat === 'xlsx'}
                                            onChange={() => setBulkExportFormat('xlsx')}
                                            className="form-radio text-indigo-600"
                                        />
                                        <span>XLSX</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 justify-end">
                        <button
                            onClick={() => onClose(false)}
                            className={`px-5 py-3 rounded-lg transition duration-200 cursor-pointer ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "text-gray-700 border border-gray-200 hover:bg-gray-50"}`}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleBulkAction}
                            disabled={!bulkAction}
                            className={`px-5 py-3 rounded-lg transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? "bg-amber-900/30 text-amber-300 hover:bg-amber-900/50" : "bg-amber-500 text-white hover:bg-amber-600"}`}
                        >
                            {t('common.apply')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}