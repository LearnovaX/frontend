// src/pages/users/components/UserFilters.tsx
import React from "react";
import { Search, ArrowUp, ArrowDown, Settings, X } from "lucide-react";
import FancySelect from "@/pages/users/components/FancySelect.tsx";
import MultiSelect from "@/pages/users/components/MultiSelect.tsx";

interface UserFiltersProps {
    search: string;
    setSearch: (s: string) => void;
    setCurrentPage: (p: number) => void;
    groupIds: number[];
    setGroupIds: (ids: number[]) => void;
    groupOptions: MultiOption[];
    groupsLoading: boolean;
    statusFilter: StatusOption;
    setStatusFilter: (s: StatusOption) => void;
    statusOptions: Option[];
    roleFilter: string;
    setRoleFilter: (r: string) => void;
    roleOptions: Option[];
    orderField: OrderField;
    setOrderField: (f: OrderField) => void;
    orderFieldOptions: Option[];
    orderDirection: "asc" | "desc";
    setOrderDirection: (d: "asc" | "desc") => void;
    selectedUserIds: number[];
    setShowBulkModal: (b: boolean) => void;
    isDark: boolean;
    t: any;
}

export default function UserFilters({
                                        search,
                                        setSearch,
                                        setCurrentPage,
                                        groupIds,
                                        setGroupIds,
                                        groupOptions,
                                        groupsLoading,
                                        statusFilter,
                                        setStatusFilter,
                                        statusOptions,
                                        roleFilter,
                                        setRoleFilter,
                                        roleOptions,
                                        orderField,
                                        setOrderField,
                                        orderFieldOptions,
                                        orderDirection,
                                        setOrderDirection,
                                        selectedUserIds,
                                        setShowBulkModal,
                                        isDark,
                                        t,
                                    }: UserFiltersProps) {
    return (
        <div
            className={`rounded-2xl border shadow-sm p-4 sm:p-5 mb-6 ${
                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"
            }`}
        >
            <div
                className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
               xl:grid-cols-[minmax(200px,0.85fr)_240px_140px_150px_170px_auto_auto]"
            >
                {/* Search */}
                <div className="min-w-0 sm:col-span-2 lg:col-span-3 xl:col-span-1">
                    <div
                        className={`text-xs text-center mb-1.5 font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}
                    >
                        {t('common.search')}
                    </div>
                    <div className="relative">
                        <Search
                            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${
                                isDark ? "text-slate-400" : "text-gray-500"
                            }`}
                        />
                        <input
                            type="text"
                            placeholder={t('users.searchPlaceholder')}
                            className={`w-full h-10 pl-9 pr-9 text-sm rounded-lg border focus:ring-2 focus:ring-indigo-100 transition duration-200 ${
                                isDark
                                    ? "bg-slate-700 border-slate-600 text-slate-200 placeholder:text-slate-400"
                                    : "border-gray-200 bg-white text-gray-800 placeholder:text-gray-400"
                            }`}
                            value={search}
                            onChange={(e) => {
                                setCurrentPage(1);
                                setSearch(e.target.value);
                            }}
                        />
                        {search && (
                            <button
                                type="button"
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition duration-150 ${
                                    isDark ? "hover:bg-slate-600" : "hover:bg-gray-100"
                                }`}
                                onClick={() => {
                                    setSearch("");
                                    setCurrentPage(1);
                                }}
                            >
                                <X className={`h-4 w-4 ${isDark ? "text-slate-400" : "text-gray-600"}`} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Groups */}
                <div className="min-w-0">
                    <MultiSelect
                        label={t('users.groups')}
                        labelAlign="center"
                        compact
                        value={groupIds}
                        onChange={(ids) => {
                            setGroupIds(ids);
                            setCurrentPage(1);
                        }}
                        options={groupOptions}
                        placeholder={groupsLoading ? t('common.loading') : t('groups.all')}
                        className="w-full"
                    />
                </div>

                {/* Status */}
                <div className="min-w-0">
                    <FancySelect
                        label={t('common.status')}
                        labelAlign="center"
                        compact
                        value={statusFilter}
                        onChange={(v) => {
                            setStatusFilter(v as StatusOption);
                            setCurrentPage(1);
                        }}
                        options={statusOptions}
                        className="w-full"
                        placeholder={t('status.all')}
                    />
                </div>

                {/* Role */}
                <div className="min-w-0">
                    <FancySelect
                        label={t('common.role')}
                        labelAlign="center"
                        compact
                        value={roleFilter}
                        onChange={(v) => {
                            setRoleFilter(v);
                            setCurrentPage(1);
                        }}
                        options={roleOptions}
                        className="w-full"
                        placeholder={t('roles.all')}
                    />
                </div>

                {/* Sorting */}
                <div className="min-w-0">
                    <FancySelect
                        label={t('common.sorting')}
                        labelAlign="center"
                        compact
                        value={orderField}
                        onChange={(v) => {
                            setOrderField(v as OrderField);
                            setCurrentPage(1);
                        }}
                        options={orderFieldOptions}
                        className="w-full"
                    />
                </div>

                {/* Direction */}
                <div className="min-w-0 flex flex-col">
                    <div
                        className={`text-xs text-center mb-1.5 font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}
                    >
                        {t('common.direction')}
                    </div>
                    <button
                        type="button"
                        title={orderDirection === "asc" ? t('common.ascending') : t('common.descending')}
                        onClick={() => setOrderDirection((d) => (d === "asc" ? "desc" : "asc"))}
                        className={`h-10 w-10 mx-auto flex items-center justify-center rounded-lg border transition duration-200 hover:shadow-sm ${
                            isDark
                                ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
                                : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                        }`}
                    >
                        {orderDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    </button>
                </div>

                {/* Actions */}
                <div className="min-w-0 flex flex-col sm:col-span-2 lg:col-span-3 xl:col-span-1">
                    <div
                        className={`text-xs text-center mb-1.5 font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}
                    >
                        {t('users.actions')}
                    </div>
                    <button
                        onClick={() => selectedUserIds.length > 0 && setShowBulkModal(true)}
                        disabled={selectedUserIds.length === 0}
                        className={`h-10 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-200 hover:shadow-md whitespace-nowrap text-sm font-medium ${
                            isDark
                                ? "border border-amber-700 bg-amber-900/30 text-amber-300 hover:bg-amber-900/50 disabled:bg-slate-700 disabled:text-slate-500 disabled:border-slate-600"
                                : "bg-amber-500 text-white hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300"
                        } disabled:cursor-not-allowed`}
                    >
                        <Settings className="h-4 w-4" />
                        <span>{t('users.bulk')}</span>
                        <span
                            className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs min-w-[1.25rem] ${
                                isDark ? "bg-black/20" : "bg-black/15"
                            }`}
                        >
              {selectedUserIds.length}
            </span>
                    </button>
                </div>
            </div>
        </div>
    );
}