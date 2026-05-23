// src/pages/groups/Groups.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";
import { useTheme } from "@/components/common/ThemeContext";
import { useTranslation } from "react-i18next";
import { RoundedCheckbox } from "@/components/ui/RoundedCheckbox";

/* ---------- Types ---------- */
type User = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
};

type Course = { id: number; name: string };

type Group = {
    id: number;
    name: string;
    course: Course;
    teachers: User[];
    students_count?: number;
    members_count?: number;
    students_limit?: number | null;
    self_registration: boolean;
    registration_link?: string | null;
    token_expires_at?: string | null;
    is_token_expired?: boolean;
    token_status?: string;
    is_active?: boolean;
};

/* ---------- Utils ---------- */
function cn(...xs: (string | false | null | undefined)[]) {
    return xs.filter(Boolean).join(" ");
}
function useDebounced<T>(val: T, delay = 400) {
    const [v, setV] = useState(val);
    useEffect(() => {
        const t = setTimeout(() => setV(val), delay);
        return () => clearTimeout(t);
    }, [val, delay]);
    return v;
}

/** Convert a target end datetime to {days, hours} delta from now. */
function endDtToValidityParts(endIso?: string | null): { days?: number; hours?: number } {
    if (!endIso) return {};
    const end = new Date(endIso).getTime();
    const now = Date.now();
    const diffMs = end - now;
    if (Number.isNaN(end) || diffMs <= 0) return {};
    const hourMs = 1000 * 60 * 60;
    const dayMs = hourMs * 24;
    const days = Math.floor(diffMs / dayMs);
    const hours = Math.floor((diffMs - days * dayMs) / hourMs);
    return {
        days: days > 0 ? days : undefined,
        hours: hours > 0 ? hours : (days > 0 ? 0 : undefined),
    };
}

/* ---------- Custom Dropdown Component ---------- */
function CustomDropdown({
                            options,
                            value,
                            onChange,
                            isDark = false
                        }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    isDark?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = () => setIsOpen(false);
        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative inline-block text-left w-full sm:w-auto">
            <div>
                <button
                    type="button"
                    className={`inline-flex justify-between items-center w-full rounded-md border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isDark
                            ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 focus:ring-blue-500 focus:ring-offset-slate-900"
                            : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 focus:ring-blue-500 focus:ring-offset-zinc-100"
                    }`}
                    id="sort-options-menu"
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                >
                    {selectedOption?.label}
                    <svg
                        className={`-mr-1 ml-2 h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>

            {isOpen && (
                <div
                    className={`origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg ring-1 ring-opacity-5 z-10 ${
                        isDark
                            ? "bg-slate-800 ring-slate-600"
                            : "bg-white ring-zinc-200"
                    }`}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="sort-options-menu"
                >
                    <div className="py-1" role="none">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                className={`block w-full text-left px-4 py-2 text-sm ${
                                    value === option.value
                                        ? isDark
                                            ? "bg-blue-600 text-white"
                                            : "bg-blue-100 text-blue-900"
                                        : isDark
                                            ? "text-slate-200 hover:bg-slate-700"
                                            : "text-zinc-700 hover:bg-zinc-100"
                                }`}
                                role="menuitem"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---------- Pretty small switch (used in modal) ---------- */
function Switch({
                    checked,
                    onChange,
                    label,
                    id,
                    isDark = false,
                }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    id: string;
    isDark?: boolean;
}) {
    return (
        <label htmlFor={id} className="inline-flex items-center gap-3 cursor-pointer select-none">
      <span
          className={cn(
              "relative inline-flex h-7 w-12 rounded-full transition-all duration-200",
              checked ? (isDark ? "bg-blue-600" : "bg-zinc-900") : (isDark ? "bg-slate-600" : "bg-zinc-300")
          )}
      >
        <input
            id={id}
            type="checkbox"
            className="peer sr-only"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
        />
        <span
            className={cn(
                "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-all duration-200",
                checked ? "translate-x-5" : "translate-x-0"
            )}
        />
      </span>
            <span className={`text-sm ${isDark ? "text-slate-300" : "text-zinc-700"}`}>{label}</span>
        </label>
    );
}

export default function Groups() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    /* ---------- Controls ---------- */
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounced(search, 400);

    const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");

    // New sorting: dropdown + direction toggle
    const [sortField, setSortField] = useState<"name" | "students">("name");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    /* ---------- Data ---------- */
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* ---------- Selection ---------- */
    const [selected, setSelected] = useState<Set<number>>(new Set());

    /* ---------- Create modal ---------- */
    const [openCreate, setOpenCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);
    const [courseQuery, setCourseQuery] = useState("");
    const debouncedCourseQuery = useDebounced(courseQuery, 400);
    const [newGroup, setNewGroup] = useState<{
        name: string;
        course?: number;
        students_limit?: number | "";
        self_registration: boolean;
        token_end_at?: string | "";
        is_active: boolean;
    }>({
        name: "",
        course: undefined,
        students_limit: "",
        self_registration: false,
        token_end_at: "",
        is_active: true,
    });

    /* ---------- Load groups ---------- */
    useEffect(() => {
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const params: any = {};
                if (debouncedSearch) params.search = debouncedSearch;
                params.is_active =
                    statusFilter === "all" ? "all" : statusFilter === "active" ? "true" : "false";

                const { data } = await api.get<Group[]>("course/groups/", { params });
                const normalized = data.map((g) => ({ ...g, is_active: statusFilter !== "inactive" }));
                setGroups(normalized);
            } catch (e: any) {
                setError(e?.message || t('groups.loadError'));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [debouncedSearch, statusFilter, t]);

    /* ---------- Client sort ---------- */
    const visibleGroups = useMemo(() => {
        const arr = [...groups];
        if (sortField === "name") {
            arr.sort((a, b) => {
                const res = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
                return sortDir === "asc" ? res : -res;
            });
        } else {
            arr.sort((a, b) => {
                const av = a.students_count ?? a.members_count ?? 0;
                const bv = b.students_count ?? b.members_count ?? 0;
                const diff = av - bv;
                return sortDir === "asc" ? diff : -diff;
            });
        }
        return arr;
    }, [groups, sortField, sortDir]);

    const bulkHas = selected.size > 0;
    const toggleAll = (on: boolean) =>
        setSelected(on ? new Set(visibleGroups.map((g) => g.id)) : new Set());
    const toggleOne = (id: number, on: boolean) =>
        setSelected((prev) => {
            const next = new Set(prev);
            on ? next.add(id) : next.delete(id);
            return next;
        });

    async function refetchQuick() {
        const t = search;
        setSearch(t + " ");
        setTimeout(() => setSearch(t), 0);
    }

    async function bulkDeactivate() {
        if (!bulkHas) return;
        const ids = Array.from(selected);
        await Promise.all(ids.map((id) => api.post(`course/groups/${id}/deactivate/`)));
        setSelected(new Set());
        refetchQuick();
    }
    async function bulkActivate() {
        if (!bulkHas) return;
        const ids = Array.from(selected);
        await Promise.all(ids.map((id) => api.patch(`course/groups/${id}/`, { is_active: true })));
        setSelected(new Set());
        refetchQuick();
    }
    async function bulkDelete() {
        if (!bulkHas) return;
        if (!confirm(t('groups.confirmBulkDelete', { count: selected.size }))) return;
        const ids = Array.from(selected);
        await Promise.all(ids.map((id) => api.delete(`course/groups/${id}/`)));
        setSelected(new Set());
        refetchQuick();
    }

    /* ---------- Load courses for modal ---------- */
    useEffect(() => {
        if (!openCreate) return;
        async function loadCourses() {
            try {
                const params: any = {};
                if (debouncedCourseQuery) params.search = debouncedCourseQuery;
                const { data } = await api.get<Course[]>("course/courses/", { params });
                setCourses(data);
            } catch {
                // noop
            }
        }
        loadCourses();
    }, [openCreate, debouncedCourseQuery]);

    async function createGroup(e: React.FormEvent) {
        e.preventDefault();
        if (!newGroup.name || !newGroup.course) return;
        setCreating(true);
        try {
            const payload: any = {
                name: newGroup.name,
                course: newGroup.course,
                self_registration: newGroup.self_registration,
                is_active: newGroup.is_active,
            };
            if (newGroup.students_limit !== "" && newGroup.students_limit !== undefined) {
                payload.students_limit = Number(newGroup.students_limit);
            }
            if (newGroup.self_registration && newGroup.token_end_at) {
                const { days, hours } = endDtToValidityParts(newGroup.token_end_at as string);
                if (days !== undefined) payload.token_validity_days = days;
                if (hours !== undefined) payload.token_validity_hours = hours;
            }

            await api.post("course/groups/", payload);
            setOpenCreate(false);
            setNewGroup({
                name: "",
                course: undefined,
                students_limit: "",
                self_registration: false,
                token_end_at: "",
                is_active: true,
            });
            refetchQuick();
        } catch (e: any) {
            alert(e?.response?.data?.detail || e?.message || t('groups.createError'));
        } finally {
            setCreating(false);
        }
    }

    function TeacherCell({ g }: { g: Group }) {
        const list = g.teachers || [];
        if (!list.length) return <span className={isDark ? "text-slate-400" : "text-zinc-400"}>{t('groups.noTeachers')}</span>;
        const first = list[0];
        const more = list.length - 1;
        const label = `${first.first_name ?? ""} ${first.last_name ?? ""}`.trim() || first.email;
        return (
            <div className="relative group inline-block">
                <span className={isDark ? "text-slate-200" : "text-zinc-900"}>{label}{more > 0 ? ` +${more}` : ""}</span>
                {more > 0 && (
                    <div className={`invisible opacity-0 group-hover:visible group-hover:opacity-100 transition
                          absolute z-20 mt-2 w-72 rounded-xl border p-3 shadow-lg ${
                        isDark
                            ? "border-slate-600 bg-slate-800"
                            : "border-zinc-200 bg-white/70 backdrop-blur-lg"
                    }`}>
                        <div className={`text-xs font-medium mb-2 ${isDark ? "text-slate-400" : "text-zinc-500"}`}>{t('groups.allTeachers')}</div>
                        <ul className="space-y-1">
                            {list.map((t) => (
                                <li key={t.id} className="flex items-center justify-between text-sm">
                                    <span className={`truncate ${isDark ? "text-slate-200" : "text-zinc-900"}`}>{t.first_name} {t.last_name}</span>
                                    <span className={`truncate ${isDark ? "text-slate-400" : "text-zinc-500"}`}>{t.email}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    function TokenChip({ g }: { g: Group }) {
        const active = g.self_registration && g.registration_link && !g.is_token_expired;
        const color = !g.self_registration
            ? isDark ? "bg-slate-700 text-slate-300" : "bg-zinc-100 text-zinc-600"
            : active
                ? isDark ? "bg-emerald-900/30 text-emerald-300" : "bg-emerald-100 text-emerald-700"
                : isDark ? "bg-amber-900/30 text-amber-300" : "bg-amber-100 text-amber-700";
        const text = !g.self_registration ? t('groups.tokenDisabled') :
            active ? t('groups.tokenActive') : t('groups.tokenExpired');
        return (
            <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium", color)}>
        {text}
      </span>
        );
    }

    async function copyLink(link?: string | null) {
        if (!link || link === "Registration link is expired") return;
        try {
            await navigator.clipboard.writeText(link);
            const el = document.createElement("div");
            el.className = `fixed right-4 top-4 z-[9999] rounded-lg px-4 py-2 text-sm ${
                isDark ? "bg-slate-700 text-slate-200" : "bg-black/80 text-white"
            }`;
            el.textContent = t('groups.linkCopied');
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 1200);
        } catch {}
    }

    return (
        <div className={`w-full min-h-screen py-8 px-6 text-[15px] ${isDark ? "bg-slate-900 text-slate-200" : "bg-white text-zinc-900"}`}>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className={`text-3xl font-semibold tracking-tight ${isDark ? "text-slate-200" : "text-zinc-900"}`}>{t('groups.title')}</h1>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-zinc-500"}`}>{t('groups.subtitle')}</p>
                </div>
                <button
                    onClick={() => setOpenCreate(true)}
                    className={`rounded-xl px-4 py-2 text-sm transition-all duration-200 shadow-sm cursor-pointer active:scale-[0.99] ${
                        isDark
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-zinc-900 text-white hover:bg-black"
                    }`}
                >
                    {t('groups.addButton')}
                </button>
            </div>

            {/* Toolbar */}
            <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full sm:w-80">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('groups.searchPlaceholder')}
                            className={`w-full rounded-xl border backdrop-blur px-10 py-2 text-sm outline-none focus:ring-2 ${
                                isDark
                                    ? "border-slate-700 bg-slate-800/60 text-slate-200 focus:ring-slate-500/30"
                                    : "border-zinc-200 bg-white/60 text-zinc-900 focus:ring-zinc-900/10"
                            }`}
                        />
                        <svg className={`absolute left-3 top-2.5 h-5 w-5 ${isDark ? "text-slate-400" : "text-zinc-400"}`} viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    </div>

                    {/* Status */}
                    <div className={`ml-0 sm:ml-2 inline-flex rounded-lg border p-1 backdrop-blur ${
                        isDark ? "border-slate-700 bg-slate-800/60" : "border-zinc-200 bg-white/60"
                    }`}>
                        {(["active","inactive","all"] as const).map(opt => (
                            <button
                                key={opt}
                                className={cn(
                                    "px-3 py-1.5 text-sm rounded-md transition-all duration-200 cursor-pointer",
                                    statusFilter === opt
                                        ? isDark
                                            ? "bg-blue-600 text-white"
                                            : "bg-zinc-900 text-white"
                                        : isDark
                                            ? "text-slate-300 hover:bg-slate-700"
                                            : "text-zinc-700 hover:bg-zinc-100"
                                )}
                                onClick={() => setStatusFilter(opt)}
                                title={opt === "active" ? t('groups.activeTitle') : opt === "inactive" ? t('groups.inactiveTitle') : t('groups.allTitle')}
                            >
                                {opt === "active" ? t('groups.active') : opt === "inactive" ? t('groups.inactive') : t('groups.all')}
                            </button>
                        ))}
                    </div>

                    {/* Sorting dropdown + direction */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <CustomDropdown
                            options={[
                                { value: "name", label: t('groups.sortName') },
                                { value: "students", label: t('groups.sortStudents') }
                            ]}
                            value={sortField}
                            onChange={(value) => setSortField(value as "name" | "students")}
                            isDark={isDark}
                        />

                        <button
                            onClick={() => setSortDir(d => (d === "asc" ? "desc" : "asc"))}
                            className={`p-2 rounded-md border transition-colors cursor-pointer ${
                                isDark
                                    ? "border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200"
                                    : "border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700"
                            }`}
                            title={sortDir === "asc" ? t('groups.sortAsc') : t('groups.sortDesc')}
                        >
                            {sortDir === "asc" ? (
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path d="M7 7h10M7 12h6M7 17h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                                    <path d="M17 20V4m0 0l-3 3m3-3l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path d="M7 7h10M7 12h6M7 17h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                                    <path d="M17 4v16m0 0l-3-3m3 3l3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Bulk actions */}
                <div className="flex items-center gap-2">
                    <button
                        className={cn(
                            "rounded-lg px-3 py-2 text-sm border transition-all duration-200 cursor-pointer",
                            bulkHas
                                ? isDark
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-zinc-900 text-white border-zinc-900"
                                : isDark
                                    ? "bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed"
                                    : "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                        )}
                        disabled={!bulkHas}
                        onClick={bulkDeactivate}
                    >
                        {t('groups.bulkDeactivate')}
                    </button>
                    <button
                        className={cn(
                            "rounded-lg px-3 py-2 text-sm border transition-all duration-200 cursor-pointer",
                            bulkHas
                                ? isDark
                                    ? "bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600"
                                    : "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-50"
                                : isDark
                                    ? "bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed"
                                    : "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                        )}
                        disabled={!bulkHas}
                        onClick={bulkActivate}
                    >
                        {t('groups.bulkActivate')}
                    </button>
                    <button
                        className={cn(
                            "rounded-lg px-3 py-2 text-sm border transition-all duration-200 cursor-pointer",
                            bulkHas
                                ? isDark
                                    ? "bg-slate-700 text-red-400 border-red-500/30 hover:bg-slate-600"
                                    : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                                : isDark
                                    ? "bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed"
                                    : "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                        )}
                        disabled={!bulkHas}
                        onClick={bulkDelete}
                    >
                        {t('groups.bulkDelete')}
                    </button>
                </div>
            </div>

            {/* Desktop Table */}
            <div className={`mt-6 rounded-2xl border backdrop-blur hidden sm:block ${
                isDark ? "border-slate-700 bg-slate-800/50" : "border-zinc-200 bg-white/50"
            }`}>
                <div className={`flex items-center justify-between px-4 py-3 border-b ${
                    isDark ? "border-slate-700" : "border-zinc-200"
                }`}>
                    <div className="flex items-center gap-3">
                        <RoundedCheckbox
                            isDark={isDark}
                            size={18}
                            checked={selected.size > 0 && selected.size === visibleGroups.length && visibleGroups.length > 0}
                            indeterminate={selected.size > 0 && selected.size < visibleGroups.length}
                            onChange={(v) => toggleAll(v)}
                            aria-label={t('groups.selectAll')}
                        />
                        <span className={`text-sm ${isDark ? "text-slate-400" : "text-zinc-500"}`}>{t('groups.selectedCount', { count: selected.size })}</span>
                    </div>
                    {loading && <span className={`text-sm ${isDark ? "text-slate-400" : "text-zinc-500"}`}>{t('common.loading')}</span>}
                    {error && <span className="text-sm text-red-500">{error}</span>}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                        <tr className={`text-left border-b ${
                            isDark ? "border-slate-700 text-slate-400" : "border-zinc-200 text-zinc-500"
                        }`}>
                            <th className="px-4 py-3"></th>
                            <th className="px-4 py-3">{t('groups.groupHeader')}</th>
                            <th className="px-4 py-3">{t('groups.courseHeader')}</th>
                            <th className="px-4 py-3">{t('groups.teachersHeader')}</th>
                            <th className="px-4 py-3">{t('groups.studentsHeader')}</th>
                            <th className="px-4 py-3">{t('groups.linkHeader')}</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                        </thead>
                        <tbody>
                        {visibleGroups.map((g) => {
                            const count = g.students_count ?? g.members_count ?? 0;
                            const countLabel = g.students_limit ? `${count} / ${g.students_limit}` : count;
                            return (
                                <tr key={g.id} className={`border-b transition-colors ${
                                    isDark
                                        ? "border-slate-700 hover:bg-slate-700/30"
                                        : "border-zinc-100 hover:bg-zinc-50/60"
                                }`}>
                                    <td className="px-4 py-3">
                                        <RoundedCheckbox
                                            isDark={isDark}
                                            size={18}
                                            checked={selected.has(g.id)}
                                            onChange={(v) => toggleOne(g.id, v)}
                                            aria-label="Select row"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            className={`font-medium hover:underline cursor-pointer ${
                                                isDark ? "text-slate-200" : "text-zinc-900"
                                            }`}
                                            onClick={() => navigate(`/groups/${g.id}`)}
                                            title={t('groups.editGroup')}
                                        >
                                            {g.name}
                                        </button>
                                    </td>
                                    <td className={`px-4 py-3 ${isDark ? "text-slate-300" : "text-zinc-700"}`}>{g.course?.name}</td>
                                    <td className="px-4 py-3"><TeacherCell g={g} /></td>
                                    <td className={`px-4 py-3 tabular-nums ${isDark ? "text-slate-300" : "text-zinc-700"}`}>{countLabel}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <TokenChip g={g} />
                                            {g.self_registration && g.registration_link && !g.is_token_expired && (
                                                <button
                                                    onClick={() => copyLink(g.registration_link)}
                                                    className={`text-xs underline cursor-pointer ${
                                                        isDark ? "text-slate-400 hover:text-slate-200" : "text-zinc-600 hover:text-zinc-900"
                                                    }`}
                                                >
                                                    {t('groups.copy')}
                                                </button>
                                            )}
                                        </div>
                                        <div className={`text-[11px] mt-1 ${isDark ? "text-slate-500" : "text-zinc-500"}`}>{g.token_status}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                                                isDark
                                                    ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                                                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                                            }`}
                                            onClick={() => navigate(`/groups/${g.id}`)}
                                        >
                                            {t('groups.edit')}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {!loading && visibleGroups.length === 0 && (
                            <tr>
                                <td colSpan={7} className={`px-4 py-10 text-center ${isDark ? "text-slate-400" : "text-zinc-500"}`}>
                                    {t('groups.nothingFound')}
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="mt-6 block sm:hidden space-y-4">
                <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
                    isDark ? "border-slate-700 bg-slate-800/50" : "border-zinc-200 bg-white/50"
                }`}>
                    <div className="flex items-center gap-3">
                        <RoundedCheckbox
                            isDark={isDark}
                            size={18}
                            checked={selected.size > 0 && selected.size === visibleGroups.length && visibleGroups.length > 0}
                            indeterminate={selected.size > 0 && selected.size < visibleGroups.length}
                            onChange={(v) => toggleAll(v)}
                            aria-label={t('groups.selectAll')}
                        />
                        <span className={`text-sm ${isDark ? "text-slate-400" : "text-zinc-500"}`}>{t('groups.selectedCount', { count: selected.size })}</span>
                    </div>
                    {loading && <span className={`text-sm ${isDark ? "text-slate-400" : "text-zinc-500"}`}>{t('common.loading')}</span>}
                    {error && <span className="text-sm text-red-500">{error}</span>}
                </div>
                {visibleGroups.map((g) => {
                    const count = g.students_count ?? g.members_count ?? 0;
                    const countLabel = g.students_limit ? `${count} / ${g.students_limit}` : count;
                    return (
                        <div key={g.id} className={`rounded-2xl border p-4 space-y-2 ${
                            isDark ? "border-slate-700 bg-slate-800/50" : "border-zinc-200 bg-white/50"
                        }`}>
                            <div className="flex items-center gap-3">
                                <RoundedCheckbox
                                    isDark={isDark}
                                    size={18}
                                    checked={selected.has(g.id)}
                                    onChange={(v) => toggleOne(g.id, v)}
                                    aria-label="Select row"
                                />
                                <button
                                    className={`font-medium hover:underline cursor-pointer ${
                                        isDark ? "text-slate-200" : "text-zinc-900"
                                    }`}
                                    onClick={() => navigate(`/groups/${g.id}`)}
                                    title={t('groups.editGroup')}
                                >
                                    {g.name}
                                </button>
                            </div>
                            <div className={`text-sm ${isDark ? "text-slate-300" : "text-zinc-700"}`}>
                                {t('groups.courseHeader')}: {g.course?.name}
                            </div>
                            <div className="text-sm">
                                {t('groups.teachersHeader')}: <TeacherCell g={g} />
                            </div>
                            <div className={`text-sm tabular-nums ${isDark ? "text-slate-300" : "text-zinc-700"}`}>
                                {t('groups.studentsHeader')}: {countLabel}
                            </div>
                            <div className="text-sm">
                                {t('groups.linkHeader')}:
                                <div className="flex items-center gap-2 mt-1">
                                    <TokenChip g={g} />
                                    {g.self_registration && g.registration_link && !g.is_token_expired && (
                                        <button
                                            onClick={() => copyLink(g.registration_link)}
                                            className={`text-xs underline cursor-pointer ${
                                                isDark ? "text-slate-400 hover:text-slate-200" : "text-zinc-600 hover:text-zinc-900"
                                            }`}
                                        >
                                            {t('groups.copy')}
                                        </button>
                                    )}
                                </div>
                                <div className={`text-[11px] mt-1 ${isDark ? "text-slate-500" : "text-zinc-500"}`}>{g.token_status}</div>
                            </div>
                            <button
                                className={`w-full rounded-lg border px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                                    isDark
                                        ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                                        : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                                }`}
                                onClick={() => navigate(`/groups/${g.id}`)}
                            >
                                {t('groups.edit')}
                            </button>
                        </div>
                    );
                })}
                {!loading && visibleGroups.length === 0 && (
                    <div className={`p-4 text-center ${isDark ? "text-slate-400" : "text-zinc-500"}`}>
                        {t('groups.nothingFound')}
                    </div>
                )}
            </div>

            {/* Create modal */}
            {openCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className={`absolute inset-0 backdrop-blur-sm ${
                            isDark ? "bg-black/40" : "bg-black/20"
                        }`}
                        onClick={() => setOpenCreate(false)}
                    />
                    <div className={`relative w-full max-w-2xl rounded-2xl border p-6 shadow-2xl ${
                        isDark
                            ? "border-slate-700 bg-slate-800"
                            : "border-zinc-200 bg-white/80 backdrop-blur-xl"
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-lg font-semibold ${isDark ? "text-slate-200" : "text-zinc-900"}`}>{t('groups.newGroup')}</h2>
                            <button
                                onClick={() => setOpenCreate(false)}
                                className={`cursor-pointer ${isDark ? "text-slate-400 hover:text-slate-200" : "text-zinc-500 hover:text-zinc-900"}`}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={createGroup} className="space-y-5">
                            <div>
                                <label className={`block text-sm mb-1 ${isDark ? "text-slate-300" : "text-zinc-700"}`}>{t('groups.nameLabel')}</label>
                                <input
                                    className={`w-full rounded-xl border px-3 py-2 backdrop-blur outline-none focus:ring-2 ${
                                        isDark
                                            ? "border-slate-600 bg-slate-700/60 text-slate-200 focus:ring-slate-500/30"
                                            : "border-zinc-200 bg-white/60 text-zinc-900 focus:ring-zinc-900/10"
                                    }`}
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup((s) => ({ ...s, name: e.target.value }))}
                                    required
                                />
                            </div>

                            <div>
                                <label className={`block text-sm mb-1 ${isDark ? "text-slate-300" : "text-zinc-700"}`}>{t('groups.courseLabel')}</label>
                                <div className="relative">
                                    <input
                                        placeholder={t('groups.courseSearchPlaceholder')}
                                        className={`mb-2 w-full rounded-xl border px-3 py-2 backdrop-blur outline-none focus:ring-2 ${
                                            isDark
                                                ? "border-slate-600 bg-slate-700/60 text-slate-200 focus:ring-slate-500/30"
                                                : "border-zinc-200 bg-white/60 text-zinc-900 focus:ring-zinc-900/10"
                                        }`}
                                        value={courseQuery}
                                        onChange={(e) => setCourseQuery(e.target.value)}
                                    />
                                    <div className={`max-h-48 overflow-auto rounded-xl border ${
                                        isDark
                                            ? "border-slate-600 bg-slate-800"
                                            : "border-zinc-200 bg-white/70 backdrop-blur"
                                    }`}>
                                        {courses.map((c) => (
                                            <button
                                                type="button"
                                                key={c.id}
                                                onClick={() => setNewGroup((s) => ({ ...s, course: c.id }))}
                                                className={cn(
                                                    "w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer",
                                                    newGroup.course === c.id
                                                        ? isDark
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-zinc-900 text-white"
                                                        : isDark
                                                            ? "text-slate-300 hover:bg-slate-700"
                                                            : "text-zinc-900 hover:bg-zinc-100"
                                                )}
                                            >
                                                {c.name}
                                            </button>
                                        ))}
                                        {courses.length === 0 && (
                                            <div className={`px-3 py-2 text-sm ${isDark ? "text-slate-400" : "text-zinc-500"}`}>{t('groups.noCoursesFound')}</div>
                                        )}
                                    </div>
                                    {newGroup.course && (
                                        <div className={`mt-1 text-xs ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>{t('groups.selectedCourseId', { id: newGroup.course })}</div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm mb-1 ${isDark ? "text-slate-300" : "text-zinc-700"}`}>{t('groups.studentsLimitLabel')}</label>
                                    <input
                                        type="number" min={0}
                                        value={newGroup.students_limit}
                                        onChange={(e) =>
                                            setNewGroup((s) => ({
                                                ...s,
                                                students_limit: e.target.value === "" ? "" : Number(e.target.value),
                                            }))
                                        }
                                        className={`w-full rounded-xl border px-3 py-2 backdrop-blur outline-none focus:ring-2 ${
                                            isDark
                                                ? "border-slate-600 bg-slate-700/60 text-slate-200 focus:ring-slate-500/30"
                                                : "border-zinc-200 bg-white/60 text-zinc-900 focus:ring-zinc-900/10"
                                        }`}
                                    />
                                </div>

                                {newGroup.self_registration && (
                                    <div>
                                        <label className={`block text-sm mb-1 ${isDark ? "text-slate-300" : "text-zinc-700"}`}>{t('groups.tokenEndLabel')}</label>
                                        <input
                                            type="datetime-local"
                                            value={(newGroup.token_end_at as string) || ""}
                                            onChange={(e) => setNewGroup((s) => ({ ...s, token_end_at: e.target.value }))}
                                            className={`w-full rounded-xl border px-3 py-2 backdrop-blur outline-none focus:ring-2 ${
                                                isDark
                                                    ? "border-slate-600 bg-slate-700/60 text-slate-200 focus:ring-slate-500/30"
                                                    : "border-zinc-200 bg-white/60 text-zinc-900 focus:ring-zinc-900/10"
                                            }`}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-6">
                                <Switch
                                    id="selfRegCreate"
                                    checked={newGroup.self_registration}
                                    onChange={(v) => setNewGroup((s) => ({ ...s, self_registration: v }))}
                                    label={t('groups.selfRegistrationLabel')}
                                    isDark={isDark}
                                />
                                <Switch
                                    id="activeCreate"
                                    checked={newGroup.is_active}
                                    onChange={(v) => setNewGroup((s) => ({ ...s, is_active: v }))}
                                    label={t('groups.activeLabel')}
                                    isDark={isDark}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setOpenCreate(false)}
                                    className={`px-4 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                                        isDark
                                            ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                                            : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                                    }`}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !newGroup.name || !newGroup.course}
                                    className={cn(
                                        "px-4 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer active:scale-[0.99]",
                                        creating || !newGroup.name || !newGroup.course
                                            ? isDark
                                                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                                : "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                                            : isDark
                                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                                : "bg-zinc-900 text-white hover:bg-black"
                                    )}
                                >
                                    {creating ? t('groups.creating') : t('groups.createButton')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
