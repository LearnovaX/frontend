// src/pages/users/components/Pagination.tsx
import React from "react";
import PageSizeSelect from "./PageSizeSelect";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    setCurrentPage: (p: number) => void;
    pageSize: number;
    setPageSize: (s: number) => void;
    totalCount: number;
    totalPages: number;
    isDark: boolean;
    t: any;
}

export default function Pagination({
                                       currentPage,
                                       setCurrentPage,
                                       pageSize,
                                       setPageSize,
                                       totalCount,
                                       totalPages,
                                       isDark,
                                       t,
                                   }: PaginationProps) {
    return (
        <div className={`
            px-6 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between
            border-t backdrop-blur-sm
            ${isDark
            ? "bg-gradient-to-r from-slate-800 to-slate-800/80 border-slate-700/50"
            : "bg-gradient-to-r from-gray-50 to-gray-100/50 border-gray-200"
        }
        `}>
            {/* Info Section */}
            <div className={`
                text-sm font-medium
                ${isDark ? "text-slate-300" : "text-gray-700"}
            `}>
                {totalCount > 0 ? (
                    <span className="flex items-center gap-2">
                        <span className={`
                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                            ${isDark
                            ? "bg-slate-700/50 text-blue-400 ring-1 ring-slate-600/50"
                            : "bg-white text-indigo-600 ring-1 ring-gray-300/50 shadow-sm"
                        }
                        `}>
                            <span className="font-bold">
                                {Math.min((currentPage - 1) * pageSize + 1, totalCount)}-{Math.min(currentPage * pageSize, totalCount)}
                            </span>
                            <span className={isDark ? "text-slate-400" : "text-gray-600"}>{t('users.outOf')}</span>
                            <span className="font-bold">{totalCount}</span>
                        </span>
                    </span>
                ) : (
                    <span className="px-3 py-1.5">{t('common.noData')}</span>
                )}
            </div>

            {/* Controls Section */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                {/* Page Size Selector */}
                <PageSizeSelect
                    value={pageSize}
                    onChange={(n) => {
                        setPageSize(n);
                        setCurrentPage(1);
                    }}
                    label={t('common.perPage')}
                    labelAlign="center"
                    compact
                    className="min-w-[160px] sm:self-end"
                    direction="up" // <- same behavior as before
                />

                {/* Pagination Buttons */}
                <div className="flex items-center gap-2">
                    {/* First Page */}
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className={`
                            p-2.5 rounded-xl border
                            transition-all duration-300 ease-out
                            disabled:opacity-40 disabled:cursor-not-allowed
                            ${currentPage === 1
                            ? (isDark
                                    ? "bg-slate-800/50 border-slate-700 text-slate-500"
                                    : "bg-gray-100/50 border-gray-300 text-gray-400"
                            )
                            : (isDark
                                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-blue-500/30 hover:text-blue-400 hover:shadow-lg hover:shadow-blue-500/20"
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20"
                            )
                        }
                            hover:scale-105 active:scale-95
                            disabled:hover:scale-100
                        `}
                        title="First page"
                    >
                        <ChevronsLeft className="h-4.5 w-4.5" />
                    </button>
                    {/* Previous Page */}
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`
                            px-4 py-2.5 rounded-xl border font-medium
                            transition-all duration-300 ease-out
                            disabled:opacity-40 disabled:cursor-not-allowed
                            ${currentPage === 1
                            ? (isDark
                                    ? "bg-slate-800/50 border-slate-700 text-slate-500"
                                    : "bg-gray-100/50 border-gray-300 text-gray-400"
                            )
                            : (isDark
                                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-blue-500/30 hover:text-blue-400 hover:shadow-lg hover:shadow-blue-500/20"
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20"
                            )
                        }
                            hover:scale-105 active:scale-95
                            disabled:hover:scale-100
                            flex items-center gap-2
                        `}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('common.back')}</span>
                    </button>

                    {/* Page Indicator */}
                    <div className={`
                        px-5 py-2.5 rounded-xl font-semibold
                        ${isDark
                        ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-slate-200 ring-1 ring-blue-500/20"
                        : "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-gray-900 ring-1 ring-indigo-500/20"
                    }
                        backdrop-blur-sm
                    `}>
                        <span className={isDark ? "text-blue-400" : "text-indigo-600"}>{currentPage}</span>
                        <span className={`mx-1.5 ${isDark ? "text-slate-500" : "text-gray-400"}`}>/</span>
                        <span>{totalPages}</span>
                    </div>

                    {/* Next Page */}
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalCount === 0}
                        className={`
                            px-4 py-2.5 rounded-xl border font-medium
                            transition-all duration-300 ease-out
                            disabled:opacity-40 disabled:cursor-not-allowed
                            ${currentPage === totalPages || totalCount === 0
                            ? (isDark
                                    ? "bg-slate-800/50 border-slate-700 text-slate-500"
                                    : "bg-gray-100/50 border-gray-300 text-gray-400"
                            )
                            : (isDark
                                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-blue-500/30 hover:text-blue-400 hover:shadow-lg hover:shadow-blue-500/20"
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20"
                            )
                        }
                            hover:scale-105 active:scale-95
                            disabled:hover:scale-100
                            flex items-center gap-2
                        `}
                    >
                        <span className="hidden sm:inline">{t('common.next')}</span>
                        <ChevronRight className="h-4 w-4" />
                    </button>

                    {/* Last Page */}
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages || totalCount === 0}
                        className={`
                            p-2.5 rounded-xl border
                            transition-all duration-300 ease-out
                            disabled:opacity-40 disabled:cursor-not-allowed
                            ${currentPage === totalPages || totalCount === 0
                            ? (isDark
                                    ? "bg-slate-800/50 border-slate-700 text-slate-500"
                                    : "bg-gray-100/50 border-gray-300 text-gray-400"
                            )
                            : (isDark
                                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-blue-500/30 hover:text-blue-400 hover:shadow-lg hover:shadow-blue-500/20"
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20"
                            )
                        }
                            hover:scale-105 active:scale-95
                            disabled:hover:scale-100
                        `}
                        title="Last page"
                    >
                        <ChevronsRight className="h-4.5 w-4.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}