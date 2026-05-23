import { useEffect, useMemo, useRef, useState, useLayoutEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Scrollbars from 'react-scrollbars-custom';
import api from "@/api/api";
import { useTheme } from "@/components/common/ThemeContext";
import { useTranslation } from "react-i18next";

/* =========================
   Types
========================= */
type User = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role?: string | null;
    status?: string | null;
    profile_photo?: string | null;
};

type Course = { id: number; name: string };
type SimpleGroup = { id: number; name: string };

type Group = {
    id: number;
    name: string;
    course: Course | number;
    students_limit?: number | null;
    self_registration: boolean;
    is_active: boolean;
    registration_link?: string | null;
    token_expires_at?: string | null;
    is_token_expired?: boolean;
    token_status?: string;
};

type Enrollment = { id: number; user: User; role: "student" | "assistant" | "teacher" };

type PaginatedResponse = {
    count: number;
    next: string | null;
    previous: string | null;
    results: User[];
};

/* =========================
   Utils / Hooks
========================= */
function cn(...xs: (string | null | false | undefined)[]) {
    return xs.filter(Boolean).join(" ");
}

function useDebounced<T>(v: T, delay = 350) {
    const [s, setS] = useState(v);
    useEffect(() => {
        const t = setTimeout(() => setS(v), delay);
        return () => clearTimeout(t);
    }, [v, delay]);
    return s;
}

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

function useListHeight(offsetPx = 180) {
    const [h, setH] = useState<number>(() => Math.max(320, window.innerHeight - offsetPx));
    useEffect(() => {
        const onR = () => setH(Math.max(320, window.innerHeight - offsetPx));
        window.addEventListener("resize", onR);
        return () => window.removeEventListener("resize", onR);
    }, [offsetPx]);
    return h;
}

/* =========================
   UI Components
========================= */
function Switch({
                    checked,
                    onChange,
                    id,
                    label,
                    isDark = false,
                }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    id: string;
    label: string;
    isDark?: boolean;
}) {
    return (
        <label htmlFor={id} className="inline-flex items-center gap-3 cursor-pointer select-none group">
            <span className={cn(
                "relative inline-flex h-6 w-11 rounded-full transition-all duration-200",
                checked
                    ? (isDark ? "bg-blue-500" : "bg-gray-900")
                    : (isDark ? "bg-slate-700" : "bg-gray-300")
            )}>
                <input id={id} type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                <span className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200",
                    checked ? "translate-x-5" : "translate-x-0"
                )} />
            </span>
            <span className={`text-sm font-medium transition-colors ${isDark ? "text-slate-300" : "text-gray-700"}`}>{label}</span>
        </label>
    );
}

function Tick({ checked, onChange, isDark = false }: { checked: boolean; onChange: (v: boolean) => void; isDark?: boolean }) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange(!checked)}
            onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    onChange(!checked);
                }
            }}
            className="inline-flex items-center cursor-pointer bg-transparent border-0 p-0 group flex-shrink-0"
            aria-label={checked ? "Unselect" : "Select"}
        >
            <span
                className={cn(
                    "relative h-5 w-5 rounded border-2 transition-all duration-150",
                    isDark
                        ? checked
                            ? "border-blue-500 bg-blue-500"
                            : "border-slate-600 bg-slate-800/50"
                        : checked
                            ? "border-gray-900 bg-gray-900"
                            : "border-gray-300 bg-white",
                    "group-hover:scale-105"
                )}
                aria-hidden
            >
                <svg
                    viewBox="0 0 20 20"
                    className={cn(
                        "absolute inset-0 m-auto h-3.5 w-3.5 text-white transition-all duration-150",
                        checked ? "opacity-100 scale-100" : "opacity-0 scale-50"
                    )}
                >
                    <path d="M5 10.5 8.2 14 15 6.5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
        </button>
    );
}

function Avatar({ src, alt, isDark = false }: { src?: string | null; alt: string; isDark?: boolean }) {
    const [err, setErr] = useState(false);
    if (src && !err) {
        return <img src={src} onError={() => setErr(true)} alt={alt} className="h-9 w-9 rounded-full object-cover ring-1 ring-black/5" />;
    }
    return (
        <div className={`h-9 w-9 rounded-full flex items-center justify-center ring-1 ${isDark ? "bg-slate-800 ring-slate-700/50" : "bg-gray-100 ring-gray-200/50"}`}>
            <svg viewBox="0 0 24 24" className={`h-5 w-5 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" fill="currentColor" />
            </svg>
        </div>
    );
}

function StatusBadge({ status, isDark = false, t }: { status?: string | null; isDark?: boolean; t: any }) {
    const s = (status || "").toLowerCase();
    const isAuth = s === "authorized";
    const isUnauth = s === "unauthorized" || s === "not authorized" || s.includes("not") || s.includes("неавтор");
    const isYellow = s.includes("awaiting");
    const isRed = s.includes("deactivated");

    const displayText = isAuth
        ? t('status.authorized')
        : isUnauth
            ? t('status.notAuthorized')
            : isYellow
                ? t('status.awaiting')
                : isRed
                    ? t('status.deactivated')
                    : status || "—";

    const cls = isAuth
        ? isDark ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200/50"
        : isUnauth
            ? isDark ? "bg-sky-500/15 text-sky-400 border-sky-500/20" : "bg-sky-50 text-sky-700 border-sky-200/50"
            : isYellow
                ? isDark ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-200/50"
                : isRed
                    ? isDark ? "bg-rose-500/15 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-700 border-rose-200/50"
                    : isDark ? "bg-slate-800/50 text-slate-400 border-slate-700/50" : "bg-gray-50 text-gray-600 border-gray-200/50";

    return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border", cls)}>{displayText}</span>;
}

function RoleBadge({ role, isDark = false, t }: { role?: string | null; isDark?: boolean; t: any }) {
    const r = (role || "").toLowerCase();

    const displayText = r === "teacher"
        ? t('role.teacher')
        : r === "admin"
            ? t('role.admin')
            : r === "assistant"
                ? t('role.assistant')
                : r === "student"
                    ? t('role.student')
                    : role || "—";

    const cls =
        r === "teacher"
            ? isDark ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/20" : "bg-indigo-50 text-indigo-700 border-indigo-200/50"
            : r === "admin"
                ? isDark ? "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20" : "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/50"
                : r === "assistant"
                    ? isDark ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-200/50"
                    : isDark ? "bg-slate-800/50 text-slate-400 border-slate-700/50" : "bg-gray-50 text-gray-600 border-gray-200/50";

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${cls}`}>
            {displayText}
        </span>
    );
}

function Select({
                    value,
                    onChange,
                    options,
                    placeholder,
                    searchable = true,
                    className,
                    isDark = false,
                }: {
    value?: string | number;
    onChange: (v: string | number) => void;
    options: { label: string; value: string | number }[];
    placeholder?: string;
    searchable?: boolean;
    className?: string;
    isDark?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const vv = options.find((o) => o.value === value)?.label || "";
    const filtered = !q ? options : options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));

    return (
        <div ref={ref} className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setOpen((s) => !s)}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                    isDark
                        ? "border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:border-slate-600"
                        : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400"
                }`}
            >
                {vv || <span className={isDark ? "text-slate-500" : "text-gray-400"}>{placeholder || "Выберите…"}</span>}
            </button>

            {open && (
                <div className={`absolute z-30 mt-2 w-full rounded-xl border shadow-xl animate-pop ${
                    isDark ? "border-slate-700 bg-slate-800 backdrop-blur-xl" : "border-gray-200 bg-white backdrop-blur-xl"
                }`}>
                    {searchable && (
                        <div className={`p-3 border-b ${isDark ? "border-slate-700" : "border-gray-200"}`}>
                            <input
                                autoFocus
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Поиск…"
                                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all duration-150 ${
                                    isDark
                                        ? "border-slate-700 bg-slate-900/50 text-slate-200 placeholder-slate-500"
                                        : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400"
                                }`}
                            />
                        </div>
                    )}

                    <Scrollbars
                        style={{ height: 256 }}
                        trackYProps={{ style: { width: '6px' } }}
                        thumbYProps={{
                            style: {
                                backgroundColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(156, 163, 175, 0.5)',
                                borderRadius: 4,
                            },
                        }}
                    >

                    {filtered.map((o) => (
                            <button
                                key={String(o.value)}
                                type="button"
                                onClick={() => {
                                    onChange(o.value);
                                    setOpen(false);
                                    setQ("");
                                }}
                                className={cn(
                                    "w-full px-4 py-2.5 text-left text-sm font-medium transition-all duration-100",
                                    value === o.value
                                        ? isDark
                                            ? "bg-blue-500/15 text-blue-400"
                                            : "bg-gray-900 text-white"
                                        : isDark
                                            ? "text-slate-300 hover:bg-slate-700/50"
                                            : "text-gray-900 hover:bg-gray-50"
                                )}
                            >
                                {o.label}
                            </button>
                        ))}

                        {filtered.length === 0 && (
                            <div className={`px-4 py-3 text-sm ${isDark ? "text-slate-500" : "text-gray-500"}`}>Ничего не найдено</div>
                        )}
                    </Scrollbars>
                </div>
            )}
        </div>
    );
}

function MultiSelect({
                         values,
                         onChange,
                         options,
                         placeholder,
                         className,
                         isDark = false,
                     }: {
    values: number[];
    onChange: (vals: number[]) => void;
    options: { label: string; value: number }[];
    placeholder?: string;
    className?: string;
    isDark?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const filtered = !q ? options : options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
    const clearAll = () => onChange([]);

    return (
        <div ref={ref} className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setOpen((s) => !s)}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-left text-sm transition-all duration-150 ${
                    isDark
                        ? "border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800"
                        : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                }`}
            >
                <div className="flex items-center gap-2">
                    <svg className={`h-4 w-4 ${isDark ? "text-slate-500" : "text-gray-400"}`} viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M3 5h18M6 10h12M10 15h4M12 20h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>

                    {values.length ? (
                        <div className="flex flex-wrap gap-1.5">
                            {values.slice(0, 3).map((v) => (
                                <span key={v} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    isDark ? "bg-slate-700 text-slate-200" : "bg-gray-100 text-gray-900"
                                }`}>
                                    {options.find((o) => o.value === v)?.label || v}
                                </span>
                            ))}

                            {values.length > 3 && (
                                <span className={`text-xs font-medium ${isDark ? "text-slate-500" : "text-gray-500"}`}>+{values.length - 3}</span>
                            )}
                        </div>
                    ) : (
                        <span className={isDark ? "text-slate-500" : "text-gray-400"}>{placeholder || "Выберите…"}</span>
                    )}
                </div>
            </button>

            {open && (
                <div className={`absolute z-30 mt-2 w-full rounded-xl border shadow-xl animate-pop ${
                    isDark ? "border-slate-700 bg-slate-800 backdrop-blur-xl" : "border-gray-200 bg-white backdrop-blur-xl"
                }`}>
                    <div className={`p-3 border-b flex items-center gap-2 ${isDark ? "border-slate-700" : "border-gray-200"}`}>
                        <svg className={`h-5 w-5 ${isDark ? "text-slate-500" : "text-gray-400"}`} viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>

                        <input
                            autoFocus
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Поиск групп…"
                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all duration-150 ${
                                isDark
                                    ? "border-slate-700 bg-slate-900/50 text-slate-200 placeholder-slate-500"
                                    : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400"
                            }`}
                        />

                        {values.length > 0 && (
                            <button
                                onClick={clearAll}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
                                    isDark
                                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                }`}
                            >
                                Очистить
                            </button>
                        )}
                    </div>

                    <Scrollbars
                        style={{ height: 256 }}
                        trackYProps={{ style: { width: '6px' } }}
                        thumbYProps={{
                            style: {
                                backgroundColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(156, 163, 175, 0.5)',
                                borderRadius: 4,
                            },
                        }}
                    >

                    {filtered.map((o) => {
                            const active = values.includes(o.value);
                            return (
                                <label key={o.value} className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium cursor-pointer transition-all duration-100 ${
                                    isDark ? "hover:bg-slate-700/50" : "hover:bg-gray-50"
                                }`}>
                                    <Tick
                                        checked={active}
                                        onChange={(v) => {
                                            const next = new Set(values);
                                            v ? next.add(o.value) : next.delete(o.value);
                                            onChange(Array.from(next));
                                        }}
                                        isDark={isDark}
                                    />
                                    <span className={isDark ? "text-slate-300" : "text-gray-900"}>{o.label}</span>
                                </label>
                            );
                        })}

                        {filtered.length === 0 && (
                            <div className={`px-4 py-3 text-sm ${isDark ? "text-slate-500" : "text-gray-500"}`}>Ничего не найдено</div>
                        )}
                    </Scrollbars>

                    <div className={`px-4 py-2.5 border-t text-right text-xs font-medium ${
                        isDark ? "border-slate-700 text-slate-500" : "border-gray-200 text-gray-500"
                    }`}>
                        Выбрано: {values.length}
                    </div>
                </div>
            )}
        </div>
    );
}

/* =========================
   Main Component
========================= */
export default function GroupEdit() {
    const { t } = useTranslation();
    const { id } = useParams();
    const gid = Number(id);
    const navigate = useNavigate();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    const [tab, setTab] = useState<"general" | "teachers" | "students">("general");
    const [group, setGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    // Pagination state
    const [allUsersCache, setAllUsersCache] = useState<Map<number, User>>(new Map());
    const [displayedUsers, setDisplayedUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    const [usersSearch, setUsersSearch] = useState("");
    const debouncedUsersSearch = useDebounced(usersSearch, 400);

    const [userStatus, setUserStatus] = useState<"" | "authorized" | "not_authorized" | "deactivated">("");
    const [filterGroupIds, setFilterGroupIds] = useState<number[]>([]);
    const debouncedFilterGroupIds = useDebounced(filterGroupIds, 250);

    const [enrolledTeachers, setEnrolledTeachers] = useState<User[]>([]);
    const [enrolledStudents, setEnrolledStudents] = useState<User[]>([]);

    const [workTeachers, setWorkTeachers] = useState<User[]>([]);
    const [workStudents, setWorkStudents] = useState<User[]>([]);

    const [leftSelected, setLeftSelected] = useState<Set<number>>(new Set());
    const [rightSelected, setRightSelected] = useState<Set<number>>(new Set());

    const [courses, setCourses] = useState<Course[]>([]);
    const [allGroups, setAllGroups] = useState<SimpleGroup[]>([]);

    const [form, setForm] = useState<Partial<Group> & { token_end_at?: string | "" }>({});

    const listHeight = useListHeight(168);
    const scrollbarRef = useRef<any>(null);

    function notify(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 2000);
    }

    const byId = (arr: User[]) => new Map(arr.map((u) => [u.id, u]));
    const idsOf = (arr: User[]) => new Set(arr.map((u) => u.id));

    const withAvatar = (u: User): User => {
        if (u.profile_photo) return u;
        const found = allUsersCache.get(u.id);
        return found?.profile_photo ? { ...u, profile_photo: found.profile_photo } : u;
    };

    /* -------- Load group + members -------- */
    useEffect(() => {
        let cancel = false;
        async function load() {
            try {
                setLoading(true);
                const { data } = await api.get<Group>(`course/groups/${gid}/`);
                if (cancel) return;
                setGroup(data);

                setForm({
                    name: data.name,
                    course: typeof data.course === "object" ? data.course.id : data.course,
                    students_limit: data.students_limit ?? undefined,
                    self_registration: data.self_registration,
                    is_active: data.is_active ?? true,
                    token_end_at: data.token_expires_at ? new Date(data.token_expires_at).toISOString().slice(0, 16) : "",
                });

                const members = await api.get<Enrollment[]>(`course/groups/${gid}/members/`);
                const teachers = members.data.filter((m) => m.role === "teacher").map((m) => m.user);
                const students = members.data.filter((m) => m.role === "student").map((m) => m.user);

                if (cancel) return;
                const teachersA = teachers.map(withAvatar);
                const studentsA = students.map(withAvatar);

                setEnrolledTeachers(teachersA);
                setEnrolledStudents(studentsA);
                setWorkTeachers(teachersA);
                setWorkStudents(studentsA);
            } catch (e: any) {
                alert(e?.message || t('groupEdit.loadError'));
            } finally {
                if (!cancel) setLoading(false);
            }
        }
        load();
        return () => { cancel = true; };
    }, [gid, t]);

    /* -------- Load users with pagination -------- */
    const loadUsers = useCallback(async (page: number, reset = false) => {
        if (usersLoading) return;

        try {
            setUsersLoading(true);
            const params: any = { page };
            if (debouncedUsersSearch) params.search = debouncedUsersSearch;
            if (userStatus) params.user_status = userStatus;
            if (debouncedFilterGroupIds?.length) params.group_ids = debouncedFilterGroupIds.join(",");

            const { data } = await api.get<PaginatedResponse>("course/all-users/all-users/", { params });

            setTotalCount(data.count);
            setHasMore(!!data.next);

            if (reset) {
                // Reset scenario - replace displayed users
                const newCache = new Map<number, User>();
                data.results.forEach(u => newCache.set(u.id, u));
                setAllUsersCache(newCache);
                setDisplayedUsers(data.results);
            } else {
                // Append scenario - merge with existing
                setAllUsersCache(prev => {
                    const newCache = new Map(prev);
                    data.results.forEach(u => newCache.set(u.id, u));
                    return newCache;
                });
                setDisplayedUsers(prev => {
                    const existingIds = new Set(prev.map(u => u.id));
                    const newUsers = data.results.filter(u => !existingIds.has(u.id));
                    return [...prev, ...newUsers];
                });
            }
        } catch (e: any) {
            alert(e?.message || t('groupEdit.usersLoadError'));
        } finally {
            setUsersLoading(false);
        }
    }, [debouncedUsersSearch, userStatus, debouncedFilterGroupIds, t, usersLoading]);

    // Reset and load first page when filters change
    useEffect(() => {
        setCurrentPage(1);
        setDisplayedUsers([]);
        loadUsers(1, true);
    }, [debouncedUsersSearch, userStatus, debouncedFilterGroupIds]);

    // Handle scroll to load more
    type ScrollValues = { scrollTop: number; scrollHeight: number; clientHeight: number };

    const handleScroll = useCallback((values: ScrollValues) => {
        if (!hasMore || usersLoading) return;

        const { scrollTop, scrollHeight, clientHeight } = values;

        if (scrollHeight - scrollTop - clientHeight < 200) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            loadUsers(nextPage, false);
        }
    }, [hasMore, usersLoading, currentPage, loadUsers]);


    /* -------- Load courses & groups -------- */
    useEffect(() => {
        async function loadCoursesAndGroups() {
            try {
                const [cRes, gRes] = await Promise.all([
                    api.get<Course[]>("course/courses/light-list/"),
                    api.get<SimpleGroup[]>("course/groups/light-list/", { params: { is_active: "all" } }),
                ]);
                setCourses(cRes.data);
                setAllGroups(gRes.data);
            } catch { /* noop */ }
        }
        loadCoursesAndGroups();
    }, []);

    /* -------- Derived lists -------- */
    const eligibleTeachers = useMemo(() => displayedUsers.filter((u) => (u.role === "teacher" || u.role === "admin")), [displayedUsers]);
    const eligibleStudents = useMemo(() => displayedUsers.filter((u) => u.role === "student"), [displayedUsers]);

    const availableTeachers = useMemo(() => {
        const enrolledIds = idsOf(workTeachers);
        return eligibleTeachers.filter((u) => !enrolledIds.has(u.id));
    }, [eligibleTeachers, workTeachers]);

    const availableStudents = useMemo(() => {
        const enrolledIds = idsOf(workStudents);
        return eligibleStudents.filter((u) => !enrolledIds.has(u.id));
    }, [eligibleStudents, workStudents]);

    /* -------- General saving -------- */
    async function saveGeneral() {
        if (!group) return;
        setSaving(true);
        try {
            const payload: any = {
                name: form.name,
                course: form.course,
                self_registration: !!form.self_registration,
                is_active: !!form.is_active,
            };
            if (form.students_limit !== undefined) payload.students_limit = form.students_limit;

            if (payload.self_registration) {
                const { days, hours } = endDtToValidityParts(form.token_end_at as string);
                payload.token_validity_days = days ?? null;
                payload.token_validity_hours = hours ?? null;
            } else {
                payload.token_validity_days = null;
                payload.token_validity_hours = null;
            }

            const { data } = await api.patch<Group>(`course/groups/${gid}/`, payload);
            setGroup(data);
            setForm((s) => ({
                ...s,
                token_end_at: data.token_expires_at ? new Date(data.token_expires_at).toISOString().slice(0, 16) : "",
            }));
            notify(t('groupEdit.saved'));
        } catch (e: any) {
            alert(e?.response?.data?.detail || e?.message || t('groupEdit.saveError'));
        } finally {
            setSaving(false);
        }
    }

    function resetGeneral() {
        if (!group) return;
        setForm({
            name: group.name,
            course: typeof group.course === "object" ? group.course.id : group.course,
            students_limit: group.students_limit ?? undefined,
            self_registration: group.self_registration,
            is_active: group.is_active ?? true,
            token_end_at: group.token_expires_at ? new Date(group.token_expires_at).toISOString().slice(0, 16) : "",
        });
        notify(t('groupEdit.reset'));
    }

    async function refreshToken() {
        if (!group?.self_registration) return;
        const { data } = await api.post<{ message: string; group: Group }>(`course/groups/${gid}/refresh-token/`);
        setGroup(data.group);
        setForm((s) => ({
            ...s,
            token_end_at: data.group.token_expires_at ? new Date(data.group.token_expires_at).toISOString().slice(0, 16) : "",
        }));
        notify(t('groupEdit.tokenRefreshed'));
    }

    function copyLink() {
        if (!group?.registration_link || group.registration_link === "Registration link is expired") return;
        navigator.clipboard.writeText(group.registration_link).then(() => notify(t('groupEdit.linkCopied')));
    }

    /* -------- Membership staging -------- */
    const studentsLimit = (group?.students_limit ?? undefined) as number | undefined;

    function moveRight(ids: number[]) {
        if (tab === "teachers") {
            const pool = byId(displayedUsers.filter(u => u.role === "teacher" || u.role === "admin"));
            const next = new Map(byId(workTeachers));
            ids.forEach((id) => { const u = pool.get(id); if (u) next.set(id, withAvatar(u)); });
            setWorkTeachers(Array.from(next.values()));
        } else {
            const pool = byId(displayedUsers.filter(u => u.role === "student"));
            const next = new Map(byId(workStudents));
            const targetSize = next.size + ids.filter((id) => !next.has(id)).length;
            if (studentsLimit !== undefined && targetSize > studentsLimit) {
                notify(t('groupEdit.limitExceeded'));
                return;
            }
            ids.forEach((id) => { const u = pool.get(id); if (u) next.set(id, withAvatar(u)); });
            setWorkStudents(Array.from(next.values()));
        }
    }

    function moveLeft(ids: number[]) {
        if (tab === "teachers") {
            const remove = new Set(ids);
            setWorkTeachers((prev) => prev.filter((u) => !remove.has(u.id)));
        } else {
            const remove = new Set(ids);
            setWorkStudents((prev) => prev.filter((u) => !remove.has(u.id)));
        }
    }

    /* -------- Apply / Cancel -------- */
    const dirtyTeachers = useMemo(() => {
        const a = idsOf(enrolledTeachers), b = idsOf(workTeachers);
        if (a.size !== b.size) return true;
        for (const id of a) if (!b.has(id)) return true;
        return false;
    }, [enrolledTeachers, workTeachers]);

    const dirtyStudents = useMemo(() => {
        const a = idsOf(enrolledStudents), b = idsOf(workStudents);
        if (a.size !== b.size) return true;
        for (const id of a) if (!b.has(id)) return true;
        return false;
    }, [enrolledStudents, workStudents]);

    async function applyMembers() {
        if (!group) return;
        setSaving(true);
        try {
            if (tab === "teachers" && dirtyTeachers) {
                const before = idsOf(enrolledTeachers), after = idsOf(workTeachers);
                const toAdd = Array.from(after).filter((id) => !before.has(id));
                const toRemove = Array.from(before).filter((id) => !after.has(id));
                if (toAdd.length) {
                    const { data } = await api.post<{ added: User[]; errors: any[] }>(`course/groups/${gid}/add-teachers/`, { user_ids: toAdd });
                    if (data?.errors?.length) alert(t('groupEdit.addTeachersError') + "\n" + JSON.stringify(data.errors, null, 2));
                }
                if (toRemove.length) await api.post(`course/groups/${gid}/remove-teachers/`, { user_ids: toRemove });
                setEnrolledTeachers(workTeachers);
                notify(t('groupEdit.teachersSaved'));
            }
            if (tab === "students" && dirtyStudents) {
                if (studentsLimit !== undefined && workStudents.length > studentsLimit) {
                    notify(t('groupEdit.saveLimitExceeded'));
                    return;
                }
                const before = idsOf(enrolledStudents), after = idsOf(workStudents);
                const toAdd = Array.from(after).filter((id) => !before.has(id));
                const toRemove = Array.from(before).filter((id) => !after.has(id));
                if (toAdd.length) {
                    const { data } = await api.post<{ enrolled: { user: User }[]; errors: any[] }>(`course/groups/${gid}/add-students/`, { user_ids: toAdd });
                    if (data?.errors?.length) alert(t('groupEdit.addStudentsError') + "\n" + JSON.stringify(data.errors, null, 2));
                }
                if (toRemove.length) await api.post(`course/groups/${gid}/remove-students/`, { user_ids: toRemove });
                setEnrolledStudents(workStudents);
                notify(t('groupEdit.studentsSaved'));
            }
            setLeftSelected(new Set());
            setRightSelected(new Set());
        } catch (e: any) {
            alert(e?.response?.data?.detail || e?.message || t('groupEdit.membersSaveError'));
        } finally {
            setSaving(false);
        }
    }

    function cancelMembers() {
        if (tab === "teachers") setWorkTeachers(enrolledTeachers);
        else setWorkStudents(enrolledStudents);
        setLeftSelected(new Set());
        setRightSelected(new Set());
        notify(t('groupEdit.reset'));
    }

    /* -------- User Row -------- */
    function UserRow({
                         user,
                         selected,
                         onToggle,
                         showRole = false,
                     }: {
        user: User;
        selected: boolean;
        onToggle: (v: boolean) => void;
        showRole?: boolean;
    }) {
        return (
            <div className={`flex items-center gap-3 px-4 py-3 transition-all duration-150 ${
                selected
                    ? isDark ? "bg-blue-500/10 border-l-2 border-blue-500" : "bg-gray-50 border-l-2 border-gray-900"
                    : isDark ? "hover:bg-slate-800/50" : "hover:bg-gray-50/50"
            }`}>
                <Tick checked={selected} onChange={(v) => onToggle(v)} isDark={isDark} />
                <Avatar src={user.profile_photo || undefined} alt={`${user.first_name} ${user.last_name}`} isDark={isDark} />
                <div className="min-w-0 flex-1">
                    <div className={`text-sm font-semibold truncate ${isDark ? "text-slate-100" : "text-gray-900"}`}>
                        {user.first_name} {user.last_name}
                    </div>
                    <div className={`text-xs truncate ${isDark ? "text-slate-500" : "text-gray-500"}`}>{user.email}</div>
                    <div className="mt-1 flex items-center gap-2">
                        {showRole && <RoleBadge role={user.role} isDark={isDark} t={t} />}
                        <StatusBadge status={user.status} isDark={isDark} t={t} />
                    </div>
                </div>
            </div>
        );
    }

    /* -------- Render -------- */
    if (loading || !group) {
        return (
            <div className={`min-h-screen ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                    <div className={`h-10 w-64 rounded-xl mb-6 ${isDark ? "bg-slate-800/50" : "bg-gray-200/50"} animate-pulse`} />
                    <div className={`h-96 rounded-2xl ${isDark ? "bg-slate-800/50" : "bg-white/50"} animate-pulse`} />
                </div>
            </div>
        );
    }

    const isTeachers = tab === "teachers";
    const leftList = isTeachers ? availableTeachers : availableStudents;
    const rightList = isTeachers ? workTeachers : workStudents;
    const dirty = isTeachers ? dirtyTeachers : dirtyStudents;

    return (
        <div className={`min-h-screen ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col">
                {/* Toast */}
                {toast && (
                    <div className={`fixed right-4 top-4 z-[9999] rounded-xl px-5 py-3 text-sm font-medium shadow-xl animate-pop ${
                        isDark ? "bg-slate-800 text-slate-100 border border-slate-700" : "bg-white text-gray-900 border border-gray-200"
                    }`}>
                        {toast}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="space-y-2">
                        <button
                            onClick={() => navigate("/groups")}
                            className={`text-sm font-medium cursor-pointer transition-all duration-150 inline-flex items-center gap-1.5 ${
                                isDark ? "text-slate-400 hover:text-slate-200" : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {t('groupEdit.backToList')}
                        </button>
                        <h1 className={`text-3xl font-bold ${isDark ? "text-slate-100" : "text-gray-900"}`}>{group.name}</h1>
                        <p className={`text-sm ${isDark ? "text-slate-500" : "text-gray-500"}`}>
                            {typeof group.course === "object" ? group.course.name : t('groupEdit.noCourse')}
                        </p>
                    </div>
                    <span
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-semibold self-start sm:self-auto",
                            group.is_active
                                ? isDark ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : isDark ? "bg-slate-800/50 text-slate-400 border border-slate-700/50" : "bg-gray-100 text-gray-600 border border-gray-200"
                        )}
                    >
                        {group.is_active ? t('groupEdit.active') : t('groupEdit.inactive')}
                    </span>
                </div>

                {/* Tabs */}
                <div className="mb-6 overflow-x-auto">
                    <div className={`inline-flex rounded-xl p-1 backdrop-blur-sm ${
                        isDark ? "bg-slate-800/50 border border-slate-700" : "bg-white/70 border border-gray-200"
                    }`}>
                        {(["general", "teachers", "students"] as const).map((k) => (
                            <button
                                key={k}
                                onClick={() => {
                                    setTab(k);
                                    setLeftSelected(new Set());
                                    setRightSelected(new Set());
                                }}
                                className={cn(
                                    "px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap",
                                    tab === k
                                        ? isDark
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-900 text-white"
                                        : isDark
                                            ? "text-slate-400 hover:bg-slate-700/50"
                                            : "text-gray-600 hover:bg-gray-100"
                                )}
                            >
                                {k === "general" ? t('groupEdit.tabGeneral') : k === "teachers" ? t('groupEdit.tabTeachers') : t('groupEdit.tabStudents')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content area */}
                <div className="flex-1 overflow-y-auto">
                    {tab === "general" ? (
                        <section className={`rounded-xl p-6 backdrop-blur-sm border mb-4 ${
                            isDark ? "border-slate-700 bg-slate-800/30" : "border-gray-200 bg-white/70"
                        }`}>
                            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                                {/* Main Info */}
                                <div className="xl:col-span-2 space-y-6">
                                    <h2 className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-gray-900"}`}>
                                        {t('groupEdit.generalInfo')}
                                    </h2>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>{t('groups.nameLabel')}</label>
                                            <input
                                                value={form.name ?? ""}
                                                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                                                className={`w-full rounded-lg border px-4 py-2.5 font-medium outline-none transition-all duration-150 ${
                                                    isDark
                                                        ? "border-slate-700 bg-slate-800/50 text-slate-200"
                                                        : "border-gray-300 bg-white text-gray-900"
                                                }`}
                                            />
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>{t('groups.courseLabel')}</label>
                                            <Select
                                                value={(form.course as number) ?? ""}
                                                onChange={(v) => setForm((s) => ({ ...s, course: Number(v) }))}
                                                options={courses.map((c) => ({ label: c.name, value: c.id }))}
                                                placeholder={t('groupEdit.selectCourse')}
                                                className="w-full"
                                                isDark={isDark}
                                            />
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>{t('groupEdit.studentsLimit')}</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={form.students_limit ?? ""}
                                                onChange={(e) => setForm((s) => ({ ...s, students_limit: e.target.value === "" ? undefined : Number(e.target.value) }))}
                                                className={`w-full rounded-lg border px-4 py-2.5 font-medium outline-none transition-all duration-150 ${
                                                    isDark
                                                        ? "border-slate-700 bg-slate-800/50 text-slate-200"
                                                        : "border-gray-300 bg-white text-gray-900"
                                                }`}
                                            />
                                        </div>
                                        {form.self_registration ? (
                                            <div>
                                                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>{t('groupEdit.tokenEnd')}</label>
                                                <input
                                                    type="datetime-local"
                                                    value={(form.token_end_at as string) || ""}
                                                    onChange={(e) => setForm((s) => ({ ...s, token_end_at: e.target.value }))}
                                                    className={`w-full rounded-lg border px-4 py-2.5 font-medium outline-none transition-all duration-150 ${
                                                        isDark
                                                            ? "border-slate-700 bg-slate-800/50 text-slate-200"
                                                            : "border-gray-300 bg-white text-gray-900"
                                                    }`}
                                                />
                                                <p className={`mt-2 text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>
                                                    {t('groupEdit.tokenNote')}
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                        <Switch
                                            id="selfReg"
                                            checked={!!form.self_registration}
                                            onChange={(v) => setForm((s) => ({ ...s, self_registration: v }))}
                                            label={t('groupEdit.selfRegistration')}
                                            isDark={isDark}
                                        />
                                        <Switch
                                            id="isActive"
                                            checked={!!form.is_active}
                                            onChange={(v) => setForm((s) => ({ ...s, is_active: v }))}
                                            label={t('groupEdit.activeLabel')}
                                            isDark={isDark}
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                                        <button
                                            onClick={resetGeneral}
                                            disabled={saving}
                                            className={cn(
                                                "rounded-lg px-6 py-3 text-sm font-semibold border transition-all duration-150",
                                                isDark
                                                    ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                                                    : "border-gray-300 text-gray-700 hover:bg-gray-50",
                                                saving && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            onClick={saveGeneral}
                                            disabled={saving}
                                            className={cn(
                                                "rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-150",
                                                saving
                                                    ? isDark
                                                        ? "bg-slate-700/50 text-slate-500 cursor-not-allowed"
                                                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                    : isDark
                                                        ? "bg-blue-500 text-white hover:bg-blue-600"
                                                        : "bg-gray-900 text-white hover:bg-gray-800"
                                            )}
                                        >
                                            {saving ? t('common.saving') : t('groupEdit.saveChanges')}
                                        </button>
                                    </div>
                                </div>

                                {/* Registration Link Card */}
                                <div className={`rounded-xl p-5 backdrop-blur-sm border h-fit ${
                                    isDark ? "border-slate-700 bg-slate-800/30" : "border-gray-200 bg-white/70"
                                }`}>
                                    <h2 className={`text-base font-bold mb-4 ${isDark ? "text-slate-100" : "text-gray-900"}`}>
                                        {t('groupEdit.registrationLink')}
                                    </h2>
                                    <div className="space-y-3">
                                        <div className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                                            {t('groupEdit.status')}: <span className={`font-semibold ${isDark ? "text-slate-200" : "text-gray-900"}`}>{group.token_status}</span>
                                        </div>
                                        {group.token_expires_at && (
                                            <div className={`text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>
                                                {t('groupEdit.expires')}: {new Date(group.token_expires_at).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-5 flex flex-col gap-2">
                                        {group.self_registration && group.registration_link && !group.is_token_expired && (
                                            <button
                                                onClick={copyLink}
                                                className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all duration-150 ${
                                                    isDark
                                                        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                                                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                                                }`}
                                            >
                                                {t('groupEdit.copyLink')}
                                            </button>
                                        )}
                                        {group.self_registration && (
                                            <button
                                                onClick={refreshToken}
                                                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 ${
                                                    isDark
                                                        ? "bg-blue-500 text-white hover:bg-blue-600"
                                                        : "bg-gray-900 text-white hover:bg-gray-800"
                                                }`}
                                            >
                                                {t('groupEdit.refreshToken')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    ) : (
                        <section className={`rounded-xl p-6 backdrop-blur-sm border ${
                            isDark ? "border-slate-700 bg-slate-800/30" : "border-gray-200 bg-white/70"
                        }`}>
                            {/* Top bar */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                <div className="space-y-1">
                                    <h2 className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-gray-900"}`}>
                                        {isTeachers ? t('groupEdit.manageTeachers') : t('groupEdit.manageStudents')}
                                    </h2>
                                    <p className={`text-sm ${isDark ? "text-slate-500" : "text-gray-500"}`}>
                                        {t('groupEdit.membersDesc')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={cancelMembers}
                                        disabled={!dirty || saving}
                                        className={cn(
                                            "rounded-lg px-6 py-3 text-sm font-semibold border transition-all duration-150",
                                            isDark
                                                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                                                : "border-gray-300 text-gray-700 hover:bg-gray-50",
                                            (!dirty || saving) && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={applyMembers}
                                        disabled={!dirty || saving}
                                        className={cn(
                                            "rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-150",
                                            !dirty || saving
                                                ? isDark
                                                    ? "bg-slate-700/50 text-slate-500 cursor-not-allowed"
                                                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                : isDark
                                                    ? "bg-blue-500 text-white hover:bg-blue-600"
                                                    : "bg-gray-900 text-white hover:bg-gray-800"
                                        )}
                                    >
                                        {saving ? t('common.saving') : t('groupEdit.saveChanges')}
                                    </button>
                                </div>
                            </div>

                            {/* Controls row */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
                                <div className="relative flex-1 sm:max-w-lg">
                                    <input
                                        value={usersSearch}
                                        onChange={(e) => {
                                            setUsersSearch(e.target.value);
                                            setLeftSelected(new Set());
                                        }}
                                        placeholder={t('groupEdit.usersSearch')}
                                        className={`w-full rounded-lg border px-10 py-3 text-sm font-medium outline-none transition-all duration-150 ${
                                            isDark
                                                ? "border-slate-700 bg-slate-800/50 text-slate-200 placeholder-slate-500"
                                                : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                                        }`}
                                    />
                                    <svg
                                        className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? "text-slate-500" : "text-gray-400"}`}
                                        viewBox="0 0 24 24" fill="none" aria-hidden
                                    >
                                        <path
                                            d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                                            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                                <Select
                                    value={userStatus}
                                    onChange={(v) => setUserStatus(v as any)}
                                    options={[
                                        { label: t('groupEdit.anyStatus'), value: "" },
                                        { label: t('status.authorized'), value: "authorized" },
                                        { label: t('status.notAuthorized'), value: "not_authorized" },
                                        { label: t('status.deactivated'), value: "deactivated" },
                                    ]}
                                    className="w-full sm:w-48"
                                    isDark={isDark}
                                />
                                <MultiSelect
                                    values={filterGroupIds}
                                    onChange={setFilterGroupIds}
                                    options={allGroups.map((g) => ({ label: g.name, value: g.id }))}
                                    placeholder={t('groupEdit.filterGroups')}
                                    className="w-full sm:w-60"
                                    isDark={isDark}
                                />
                            </div>

                            {/* Lists area */}
                            <div className="flex flex-col lg:grid lg:grid-cols-[1fr_auto_1fr] gap-4">
                                {/* Left list */}
                                <div className={`rounded-xl border-2 overflow-hidden shadow-lg ${
                                    isDark ? "border-slate-700 bg-slate-900/50" : "border-gray-300 bg-white"
                                }`}>
                                    <div className={`flex items-center justify-between px-4 py-3 border-b text-sm font-medium ${
                                        isDark ? "border-slate-700 text-slate-300 bg-slate-800/50" : "border-gray-200 text-gray-600 bg-gray-50"
                                    }`}>
                                        <span>{t('groupEdit.availableToAssign')}</span>
                                        <span>{usersLoading && displayedUsers.length === 0 ? t('common.loading') : `${leftList.length} / ${totalCount}`}</span>
                                    </div>
                                    <Scrollbars
                                        ref={scrollbarRef}
                                        style={{ height: listHeight }}
                                        onScroll={handleScroll}
                                        trackYProps={{ style: { width: '6px' } }}
                                        thumbYProps={{
                                            style: {
                                                backgroundColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(156, 163, 175, 0.5)',
                                                borderRadius: 4,
                                            },
                                        }}
                                    >

                                    <div className={`divide-y ${isDark ? "divide-slate-800" : "divide-gray-100"}`}>
                                            {leftList.map((u) => (
                                                <UserRow
                                                    key={u.id}
                                                    user={u}
                                                    selected={leftSelected.has(u.id)}
                                                    showRole={isTeachers}
                                                    onToggle={(v) => {
                                                        setLeftSelected((prev) => {
                                                            const next = new Set(prev);
                                                            v ? next.add(u.id) : next.delete(u.id);
                                                            return next;
                                                        });
                                                    }}
                                                />
                                            ))}

                                            {leftList.length === 0 && !usersLoading && (
                                                <div className={`px-4 py-6 text-sm text-center ${isDark ? "text-slate-500" : "text-gray-500"}`}>
                                                    {t('groupEdit.noUsers')}
                                                </div>
                                            )}

                                            {usersLoading && displayedUsers.length > 0 && (
                                                <div className={`px-4 py-4 text-sm text-center ${isDark ? "text-slate-500" : "text-gray-500"}`}>
                                                    {t('common.loading')}...
                                                </div>
                                            )}
                                        </div>
                                    </Scrollbars>
                                    {leftList.length > 0 && (
                                        <div className={`px-4 py-3 border-t text-right text-xs font-medium ${
                                            isDark ? "border-slate-700 text-slate-500 bg-slate-800/50" : "border-gray-200 text-gray-500 bg-gray-50"
                                        }`}>
                                            {t('groupEdit.selected')}: {leftSelected.size}
                                        </div>
                                    )}
                                </div>

                                {/* Middle arrows */}
                                <div className="flex flex-row lg:flex-col items-center justify-center gap-3">
                                    <button
                                        onClick={() => {
                                            const ids = Array.from(leftSelected);
                                            moveRight(ids);
                                            setLeftSelected(new Set());
                                        }}
                                        disabled={leftSelected.size === 0}
                                        title={t('groupEdit.assign')}
                                        className={cn(
                                            "flex items-center justify-center rounded-lg p-3 border-2 transition-all duration-150",
                                            leftSelected.size
                                                ? isDark
                                                    ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                                                    : "bg-gray-900 text-white border-gray-900 hover:bg-gray-800"
                                                : isDark
                                                    ? "bg-slate-800/50 text-slate-600 border-slate-700 cursor-not-allowed"
                                                    : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                        )}
                                    >
                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                                            <path d="M4 12h16m0 0-6-6m6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => {
                                            const ids = Array.from(rightSelected);
                                            moveLeft(ids);
                                            setRightSelected(new Set());
                                        }}
                                        disabled={rightSelected.size === 0}
                                        title={t('groupEdit.unassign')}
                                        className={cn(
                                            "flex items-center justify-center rounded-lg p-3 border-2 transition-all duration-150",
                                            rightSelected.size
                                                ? isDark
                                                    ? "bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-700"
                                                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                                : isDark
                                                    ? "bg-slate-800/50 text-slate-600 border-slate-700 cursor-not-allowed"
                                                    : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                        )}
                                    >
                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                                            <path d="M20 12H4m0 0 6 6m-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Right list */}
                                <div className={`rounded-xl border-2 overflow-hidden shadow-lg ${
                                    isDark ? "border-slate-700 bg-slate-900/50" : "border-gray-300 bg-white"
                                }`}>
                                    <div className={`flex items-center justify-between px-4 py-3 border-b text-sm font-medium ${
                                        isDark ? "border-slate-700 text-slate-300 bg-slate-800/50" : "border-gray-200 text-gray-600 bg-gray-50"
                                    }`}>
                                        <span>{isTeachers ? t('groupEdit.assigned') : t('groupEdit.enrolledStudents')}</span>
                                        <span>{rightList.length}</span>
                                    </div>
                                    <Scrollbars
                                        style={{ height: listHeight }}
                                        trackYProps={{ style: { width: '6px' } }}
                                        thumbYProps={{
                                            style: {
                                                backgroundColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(156, 163, 175, 0.5)',
                                                borderRadius: 4,
                                            },
                                        }}
                                    >

                                    <div className={`divide-y ${isDark ? "divide-slate-800" : "divide-gray-100"}`}>
                                            {rightList.map((u) => (
                                                <UserRow
                                                    key={u.id}
                                                    user={u}
                                                    selected={rightSelected.has(u.id)}
                                                    showRole={isTeachers}
                                                    onToggle={(v) => {
                                                        setRightSelected((prev) => {
                                                            const next = new Set(prev);
                                                            v ? next.add(u.id) : next.delete(u.id);
                                                            return next;
                                                        });
                                                    }}
                                                />
                                            ))}

                                            {rightList.length === 0 && (
                                                <div className={`px-4 py-6 text-sm text-center ${isDark ? "text-slate-500" : "text-gray-500"}`}>
                                                    {t('groupEdit.empty')}
                                                </div>
                                            )}
                                        </div>
                                    </Scrollbars>
                                    {rightList.length > 0 && (
                                        <div className={`px-4 py-3 border-t text-right text-xs font-medium ${
                                            isDark ? "border-slate-700 text-slate-500 bg-slate-800/50" : "border-gray-200 text-gray-500 bg-gray-50"
                                        }`}>
                                            {t('groupEdit.selected')}: {rightSelected.size}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}