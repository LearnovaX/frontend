import {useEffect, useMemo, useState, useRef} from "react";
import {useNavigate} from "react-router-dom";
import {useTheme} from "@/components/common/ThemeContext";
import api from "@/api/api";
import {
    Search,
    Filter,
    ChevronDown,
    User2,
    Clock,
    AlertCircle,
    CheckCircle2,
    ArrowUpDown,
    ChevronUp,
    ChevronDown as ChDown,
    X,
    Users,
    Eye,
    ClipboardList,
    Sparkles,
    TrendingUp,
} from "lucide-react";

/* ======================== Types ======================== */

type TeacherStudentRow = {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    profile_photo: string | null;
    to_check_count: number;
    group_id: number;
    group_name: string;
    course_id: number;
    course_name: string;
    last_updated_at: string | null;
};

type SortKey = "to_check" | "last_updated";
type SortDir = "asc" | "desc";

type OptVal = number | "all";
type FancyOption = { value: OptVal; label: string };

/* ======================== Utils ======================== */

const cx = (...c: (string | false | null | undefined)[]) =>
    c.filter(Boolean).join(" ");

/** Строим корректный URL для медиа:
 *  - поддержка https://
 *  - поддержка относительных путей (/media/…)
 *  - фикc для file:///… и C:\…\media\… (Windows), вырезаем часть после "media/"
 */
function resolveMediaUrl(url?: string | null): string | undefined {
    if (!url) return undefined;

    const base =
        // axios baseURL
        (api as any)?.defaults?.baseURL ||
        // vite env
        (import.meta as any)?.env?.VITE_API_URL ||
        // fallback на origin фронта
        window.location.origin;

    const baseNorm = String(base).replace(/\/+$/, "") + "/";

    const join = (p: string) =>
        new URL(p.replace(/^\/+/, ""), baseNorm).toString();

    try {
        // уже нормальный абсолютный
        if (/^https?:\/\//i.test(url)) return url;

        // file:///C:/…/media/… или file:///…/media/…
        if (/^file:\/\//i.test(url)) {
            const idx = url.toLowerCase().indexOf("/media/");
            if (idx !== -1) return join(url.slice(idx + 1)); // убираем ведущий '/': 'media/...'
            return undefined;
        }

        // Windows-путь C:\…\media\…
        if (/^[a-zA-Z]:\\/.test(url) || url.includes("\\media\\")) {
            const norm = url.replace(/\\/g, "/");
            const idx = norm.toLowerCase().indexOf("/media/");
            if (idx !== -1) return join(norm.slice(idx + 1));
            return undefined;
        }

        // относительные, типа /media/... или media/...
        return join(url);
    } catch {
        return undefined;
    }
}

/* ======================== Page ======================== */

export default function Students() {
    const {actualTheme} = useTheme();
    const isDark = actualTheme === "dark";
    const nav = useNavigate();

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<TeacherStudentRow[]>([]);
    const [q, setQ] = useState("");
    const [courseId, setCourseId] = useState<OptVal>("all");
    const [groupId, setGroupId] = useState<OptVal>("all");

    // сортировка
    const [sortKey, setSortKey] = useState<SortKey>("to_check");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    useEffect(() => {
        let on = true;
        (async () => {
            try {
                const r = await api.get<TeacherStudentRow[]>(
                    "course/enrollments/teacher-students/"
                );
                if (!on) return;
                const key = (s: TeacherStudentRow) =>
                    `${s.user_id}_${s.course_id}_${s.group_id}`;
                const uniq = Array.from(new Map(r.data.map((x) => [key(x), x])).values());
                setRows(uniq);
            } catch (e) {
                console.error(e);
            } finally {
                on && setLoading(false);
            }
        })();
        return () => {
            on = false;
        };
    }, []);

    // фильтры
    const courses = useMemo(() => {
        const m = new Map<number, string>();
        rows.forEach((r) => m.set(r.course_id, r.course_name));
        return Array.from(m, ([id, name]) => ({id, name})).sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }, [rows]);

    const groups = useMemo(() => {
        const m = new Map<number, { name: string; course_id: number }>();
        rows.forEach((r) => m.set(r.group_id, {name: r.group_name, course_id: r.course_id}));
        return Array.from(m, ([id, v]) => ({id, name: v.name, course_id: v.course_id}))
            .filter((g) => (courseId === "all" ? true : g.course_id === courseId))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [rows, courseId]);

    // список
    const list = useMemo(() => {
        let data = rows.slice();

        if (courseId !== "all") data = data.filter((r) => r.course_id === courseId);
        if (groupId !== "all") data = data.filter((r) => r.group_id === groupId);
        if (q.trim()) {
            const k = q.trim().toLowerCase();
            data = data.filter(
                (r) =>
                    `${r.first_name} ${r.last_name}`.toLowerCase().includes(k) ||
                    r.email.toLowerCase().includes(k)
            );
        }

        // sort
        data.sort((a, b) => {
            const ad = a.last_updated_at ? +new Date(a.last_updated_at) : 0;
            const bd = b.last_updated_at ? +new Date(b.last_updated_at) : 0;

            let diff = 0;
            if (sortKey === "to_check") diff = a.to_check_count - b.to_check_count;
            else if (sortKey === "last_updated") diff = ad - bd;

            if (diff !== 0) return sortDir === "asc" ? diff : -diff;

            // вторичные ключи
            if (b.to_check_count !== a.to_check_count)
                return b.to_check_count - a.to_check_count;
            if (bd !== ad) return bd - ad;

            const an = `${a.first_name} ${a.last_name}`.trim().toLowerCase();
            const bn = `${b.first_name} ${b.last_name}`.trim().toLowerCase();
            return an.localeCompare(bn);
        });

        return data;
    }, [rows, q, courseId, groupId, sortKey, sortDir]);

    const totals = useMemo(() => {
        const total = list.length;
        const withCheck = list.reduce((acc, r) => acc + (r.to_check_count > 0 ? 1 : 0), 0);
        const sumToCheck = list.reduce((acc, r) => acc + (r.to_check_count || 0), 0);
        return {total, withCheck, sumToCheck};
    }, [list]);

    const prettyDate = (s: string | null) => (s ? new Date(s).toLocaleString() : "—");

    const clearFilters = () => {
        setCourseId("all");
        setGroupId("all");
        setQ("");
    };

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSortKey(key);
            setSortDir("desc");
        }
    };

    /* ======================== Render ======================== */

    if (loading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                {/* Background Pattern */}
                <div className={cx(
                    "absolute inset-0 opacity-30",
                    isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
                )}>
                    <div
                        className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                    <div
                        className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                    <div
                        className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative mx-auto max-w-[95%] px-6 py-8">
                    <SkeletonHeader dark={isDark}/>
                    <SkeletonTable dark={isDark}/>
                </div>
            </div>
        );
    }

    const courseOptions = [{value: "all" as const, label: "Все курсы"}].concat(
        courses.map((c) => ({value: c.id, label: c.name}))
    );
    const groupOptions = [{value: "all" as const, label: "Все группы"}].concat(
        groups.map((g) => ({value: g.id, label: g.name}))
    );

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Enhanced Background with Animated Blobs */}
            <div className={cx(
                "absolute inset-0 opacity-40",
                isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
            )}>
                <div
                    className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div
                    className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div
                    className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            <div
                className={cx("relative mx-auto max-w-[95%] px-6 py-8", isDark ? "text-slate-100" : "text-gray-900")}>
                {/* ======= Stats Section at Top ======= */}
                <div className="mb-8">
                    {/* Compact Header */}
                    <div className="mb-6 text-center">
                        <div className="inline-flex items-center gap-3 mb-2">
                            <div className={cx(
                                "p-2 rounded-xl",
                                isDark ? "bg-gradient-to-r from-purple-500 to-indigo-600" : "bg-gradient-to-r from-blue-500 to-indigo-600"
                            )}>
                                <Sparkles className="h-6 w-6 text-white"/>
                            </div>
                            <h1 className={cx(
                                "text-3xl font-black tracking-tight bg-gradient-to-r bg-clip-text text-transparent",
                                isDark ? "from-slate-100 to-slate-300" : "from-gray-900 to-gray-600"
                            )}>
                                Центр проверки
                            </h1>
                        </div>
                    </div>

                    {/* Compact Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                        <StatCard
                            icon={<Users className="h-5 w-5"/>}
                            label="Всего студентов"
                            value={totals.total}
                            gradient="from-blue-500 to-cyan-500"
                            dark={isDark}
                        />
                        <StatCard
                            icon={<Eye className="h-5 w-5"/>}
                            label="Требуют внимания"
                            value={totals.withCheck}
                            subtitle={`${totals.withCheck} студент${totals.withCheck === 1 ? '' : totals.withCheck < 5 ? 'а' : 'ов'}`}
                            gradient="from-amber-500 to-orange-500"
                            dark={isDark}
                        />
                        <StatCard
                            icon={<ClipboardList className="h-5 w-5"/>}
                            label="Заданий к проверке"
                            value={totals.sumToCheck}
                            gradient="from-emerald-500 to-teal-500"
                            dark={isDark}
                        />
                    </div>
                </div>

                {/* ======= Modern Filters Section ======= */}
                <div className="mb-6">
                    <div className={cx(
                        "relative z-50 backdrop-blur-xl rounded-2xl p-4 border shadow-xl",
                        isDark ? "bg-slate-800/40 border-slate-700/50" : "bg-white/70 border-white/20"
                    )}>

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                            {/* Enhanced Search */}
                            <div className="flex-1">
                                <div className="relative group">
                                    <Search
                                        className={cx(
                                            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-all duration-200 group-focus-within:scale-110",
                                            isDark ? "text-slate-400 group-focus-within:text-indigo-400" : "text-gray-500 group-focus-within:text-indigo-500"
                                        )}
                                    />
                                    <input
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                        placeholder="Найти студента по имени или email..."
                                        className={cx(
                                            "w-full rounded-xl pl-10 pr-28 py-2.5 text-sm font-medium outline-none transition-all duration-300 focus:scale-[1.01] placeholder:text-sm",
                                            isDark
                                                ? "bg-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:bg-slate-700/80 border border-slate-600/50 focus:border-indigo-500/50"
                                                : "bg-white/80 text-gray-900 placeholder:text-gray-500 focus:bg-white border border-gray-200 focus:border-indigo-400/50"
                                        )}
                                    />
                                    {(q || courseId !== "all" || groupId !== "all") && (
                                        <button
                                            onClick={clearFilters}
                                            className={cx(
                                                "absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold inline-flex items-center gap-1 transition-all duration-200 hover:scale-105",
                                                isDark
                                                    ? "bg-slate-600/80 text-slate-200 hover:bg-slate-600"
                                                    : "bg-gray-100/80 text-gray-700 hover:bg-gray-200/80"
                                            )}
                                        >
                                            <X className="h-3 w-3"/>
                                            Очистить
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Enhanced Filter Selects */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <FancySelect
                                    icon={<Filter className="h-4 w-4"/>}
                                    value={courseId}
                                    onChange={(v) => {
                                        const val = v as OptVal;
                                        setCourseId(val);
                                        if (val !== "all" && groupId !== "all") {
                                            const ok = groups.some((g) => g.id === groupId && g.course_id === val);
                                            if (!ok) setGroupId("all");
                                        }
                                    }}
                                    options={courseOptions}
                                    placeholder="Все курсы"
                                    dark={isDark}
                                />
                                <FancySelect
                                    icon={<Filter className="h-4 w-4"/>}
                                    value={groupId}
                                    onChange={(v) => setGroupId(v as OptVal)}
                                    options={groupOptions}
                                    placeholder="Все группы"
                                    dark={isDark}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ======= Professional Table Design ======= */}
                <div className={cx(
                    "relative z-10 backdrop-blur-xl rounded-2xl border shadow-xl overflow-hidden",
                    isDark ? "bg-slate-800/40 border-slate-700/50" : "bg-white/80 border-white/20"
                )}>

                    {/* Compact Table Header */}
                    <div className={cx(
                        "grid grid-cols-12 px-6 py-4 text-xs font-bold sticky top-0 z-10 backdrop-blur-xl border-b",
                        isDark
                            ? "text-slate-200 bg-slate-800/90 border-slate-700/50"
                            : "text-gray-700 bg-white/90 border-gray-200/50"
                    )}>
                        <div className="col-span-5 flex items-center gap-2">
                            <User2 className="h-4 w-4 opacity-70"/>
                            Студент
                        </div>
                        <div className="col-span-1">
                            <SortButton
                                label="К проверке"
                                active={sortKey === "to_check"}
                                dir={sortDir}
                                onClick={() => toggleSort("to_check")}
                                dark={isDark}
                            />
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                            <Users className="h-3 w-3 opacity-70"/>
                            Группа
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                            <ClipboardList className="h-3 w-3 opacity-70"/>
                            Курс
                        </div>
                        <div className="col-span-2 text-right">
                            <SortButton
                                label="Последнее изменение"
                                active={sortKey === "last_updated"}
                                dir={sortDir}
                                onClick={() => toggleSort("last_updated")}
                                align="right"
                                dark={isDark}
                            />
                        </div>
                    </div>

                    {/* Compact Table Body */}
                    <div className="divide-y divide-gray-200/10">
                        {list.map((r, idx) => {
                            const fullName = `${r.first_name} ${r.last_name}`.trim() || r.email;
                            const hasReview = r.to_check_count > 0;

                            return (
                                <div
                                    key={`${r.user_id}_${r.course_id}_${r.group_id}`}
                                    className={cx(
                                        "grid grid-cols-12 items-center px-6 py-4 transition-all duration-300 cursor-pointer group relative overflow-hidden",
                                        "hover:scale-[1.005] hover:shadow-md",
                                        isDark
                                            ? "hover:bg-slate-700/30"
                                            : "hover:bg-white/60",
                                        idx % 2 === 0 ? "" : isDark ? "bg-slate-900/20" : "bg-gray-50/30"
                                    )}
                                    onClick={() =>
                                        nav(`/checking/${r.user_id}/review/${r.course_id}`, {
                                            state: {
                                                student: {
                                                    id: r.user_id,
                                                    first_name: r.first_name,
                                                    last_name: r.last_name,
                                                    email: r.email,
                                                    profile: {photo: r.profile_photo},
                                                },
                                                course: {id: r.course_id, name: r.course_name},
                                                groupName: r.group_name,
                                            },
                                        })
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") (e.currentTarget as HTMLDivElement).click();
                                    }}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`Открыть проверки: ${fullName}`}
                                >
                                    {/* Hover Effect Overlay */}
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-[-100%] group-hover:translate-x-[100%] group-hover:transition-transform group-hover:duration-700"></div>

                                    {/* Student Info */}
                                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                                        <Avatar url={r.profile_photo} alt={fullName}/>
                                        <div className="min-w-0">
                                            <div
                                                className="truncate text-sm font-semibold mb-0.5">{fullName}</div>
                                            <div
                                                className={cx("truncate text-xs", isDark ? "text-slate-400" : "text-gray-500")}>
                                                {r.email}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Review Status */}
                                    <div className="col-span-1">
                                        <div
                                            className={cx(
                                                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 group-hover:scale-105",
                                                hasReview
                                                    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30"
                                                    : isDark
                                                        ? "bg-slate-700/80 text-slate-300"
                                                        : "bg-gray-100/80 text-gray-600"
                                            )}
                                            title={hasReview ? "Есть задания к проверке" : "Нет заданий к проверке"}
                                        >
                                            {hasReview ? <AlertCircle className="h-3 w-3"/> :
                                                <CheckCircle2 className="h-3 w-3"/>}
                                            {r.to_check_count}
                                        </div>
                                    </div>

                                    {/* Group */}
                                    <div className="col-span-2">
                                        <div
                                            className={cx(
                                                "inline-block max-w-full truncate rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 group-hover:scale-105",
                                                isDark
                                                    ? "bg-slate-700/60 text-slate-200 group-hover:bg-slate-700/80"
                                                    : "bg-gray-100/60 text-gray-800 group-hover:bg-gray-200/80"
                                            )}
                                        >
                                            {r.group_name}
                                        </div>
                                    </div>

                                    {/* Course */}
                                    <div className="col-span-2">
                                        <div
                                            className={cx(
                                                "inline-block max-w-full truncate rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 group-hover:scale-105",
                                                isDark
                                                    ? "bg-slate-700/60 text-slate-200 group-hover:bg-slate-700/80"
                                                    : "bg-gray-100/60 text-gray-800 group-hover:bg-gray-200/80"
                                            )}
                                        >
                                            {r.course_name}
                                        </div>
                                    </div>

                                    {/* Last Update */}
                                    <div className="col-span-2 text-right">
                                        <div
                                            className={cx(
                                                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 group-hover:scale-105",
                                                isDark
                                                    ? "bg-slate-700/60 text-slate-300 group-hover:bg-slate-700/80"
                                                    : "bg-gray-100/60 text-gray-700 group-hover:bg-gray-200/80"
                                            )}
                                            title="Последнее изменение"
                                        >
                                            <Clock className="h-3 w-3"/>
                                            {prettyDate(r.last_updated_at)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {list.length === 0 && (
                            <div
                                className={cx("px-6 py-12 text-center", isDark ? "text-slate-400" : "text-gray-600")}>
                                <div className={cx(
                                    "inline-flex items-center justify-center w-12 h-12 rounded-full mb-3",
                                    isDark ? "bg-slate-700" : "bg-gray-100"
                                )}>
                                    <Search className="h-6 w-6 opacity-50"/>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Ничего не найдено</h3>
                                <p className="text-sm">Попробуйте изменить параметры поиска или
                                    фильтры</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom CSS for animations */}
            <style>{`
                @keyframes blob {
                    0% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                    100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}

/* ======================== Fixed FancySelect ======================== */

function FancySelect({
                         value,
                         onChange,
                         options,
                         icon,
                         placeholder,
                         dark,
                     }: {
    value: OptVal;
    onChange: (v: OptVal) => void;
    options: FancyOption[];
    icon?: React.ReactNode;
    placeholder?: string;
    dark: boolean;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
    const selected = options.find((o) => o.value === value) || null;

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={cx(
                    "inline-flex min-w-[220px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-105 focus:scale-105 border",
                    dark
                        ? "bg-slate-700/60 border-slate-600/50 text-slate-200 hover:bg-slate-700/80"
                        : "bg-white/80 border-gray-200/50 text-gray-800 hover:bg-white"
                )}
            >
                <div className="flex items-center gap-2 flex-1">
                    {icon}
                    <span
                        className={cx(!selected && "opacity-60")}>{selected?.label || placeholder}</span>
                </div>
                <ChevronDown className={cx(
                    "h-4 w-4 transition-transform duration-200",
                    open && "rotate-180"
                )}/>
            </button>
            {open && (
                <div
                    className={cx(
                        "absolute left-0 top-full mt-1 z-50 min-w-full overflow-hidden rounded-xl border shadow-xl backdrop-blur-xl",
                        dark
                            ? "bg-slate-800/95 border-slate-700/50"
                            : "bg-white/95 border-gray-200/50"
                    )}
                >
                    <div className="max-h-60 overflow-auto py-1">
                        {options.map((o) => (
                            <button
                                key={`${o.value}`}
                                onClick={() => {
                                    onChange(o.value);
                                    setOpen(false);
                                }}
                                className={cx(
                                    "w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-200",
                                    dark ? "hover:bg-slate-700/50" : "hover:bg-gray-100/50",
                                    o.value === value && (dark ? "bg-slate-700/60 text-indigo-300" : "bg-indigo-50 text-indigo-700")
                                )}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

}

/* ======================== Compact Sort Button ======================== */
function SortButton({
                        label,
                        active,
                        dir,
                        onClick,
                        align = "left",
                        dark,
                    }: {
    label: string;
    active?: boolean;
    dir?: SortDir;
    onClick?: () => void;
    align?: "left" | "right";
    dark: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={cx(
                "inline-flex items-center gap-1.5 select-none transition-all duration-200 hover:scale-105 group",
                align === "right" && "float-right"
            )}
            title="Сортировать"
        >
            <span className={cx("text-xs", active && "font-bold")}>{label}</span>
            <div className={cx(
                "p-0.5 rounded transition-all duration-200",
                active
                    ? dark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"
                    : dark ? "text-slate-400 group-hover:text-slate-300" : "text-gray-500 group-hover:text-gray-700"
            )}>
                {!active ? (
                    <ArrowUpDown className="h-3 w-3"/>
                ) : dir === "asc" ? (
                    <ChevronUp className="h-3 w-3"/>
                ) : (
                    <ChDown className="h-3 w-3"/>
                )}
            </div>
        </button>
    );
}

/* ======================== Compact Avatar ======================== */
function Avatar({url, alt}: { url?: string | null; alt?: string }) {
    const {actualTheme} = useTheme();
    const isDark = actualTheme === "dark";
    const [broken, setBroken] = useState(false);
    const src = resolveMediaUrl(url);

    if (!src || broken) {
        return (
            <div
                className={cx(
                    "flex h-10 w-10 items-center justify-center rounded-xl shadow-md ring-2 transition-all duration-200 group-hover:scale-110",
                    isDark
                        ? "bg-gradient-to-br from-slate-600 to-slate-700 text-slate-300 ring-slate-600/20"
                        : "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 ring-gray-200/40"
                )}
            >
                <User2 className="h-5 w-5"/>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className="h-10 w-10 rounded-xl object-cover shadow-md ring-2 ring-white/20 transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg"
            onError={() => setBroken(true)}
            loading="lazy"
            referrerPolicy="no-referrer"
        />
    );
}

/* ======================== Compact StatCard ======================== */
function StatCard({
                      icon,
                      label,
                      value,
                      subtitle,
                      gradient,
                      dark,
                  }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    subtitle?: string;
    gradient: string;
    dark: boolean;
}) {
    return (
        <div
            className={cx(
                "relative overflow-hidden rounded-2xl p-6 shadow-xl backdrop-blur-xl border transition-all duration-300 hover:scale-105 group",
                dark
                    ? "bg-slate-800/40 border-slate-700/50"
                    : "bg-white/70 border-white/20"
            )}
        >
            {/* Background Gradient */}
            <div
                className={cx(
                    "absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300",
                    `bg-gradient-to-br ${gradient}`
                )}
            >
            </div>


            <div className="relative flex items-center justify-between">
                <div className="flex-1">
                    <p className={cx(
                        "text-xs font-semibold mb-1",
                        dark ? "text-slate-400" : "text-gray-600"
                    )}>
                        {label}
                    </p>
                    <p className={cx(
                        "text-3xl font-black tracking-tight mb-1",
                        dark ? "text-slate-100" : "text-gray-900"
                    )}>
                        {value.toLocaleString()}
                    </p>
                    {subtitle && (
                        <p className={cx(
                            "text-xs font-medium",
                            dark ? "text-slate-400" : "text-gray-600"
                        )}>
                            {subtitle}
                        </p>
                    )}
                </div>
                <div className={cx(
                    "p-3 rounded-xl text-white shadow-md transition-all duration-300 group-hover:scale-110",
                    `bg-gradient-to-r ${gradient}`
                )}>
                    {icon}
                </div>
            </div>

            {/* Trend indicator */}
            <div className="relative mt-3 flex items-center gap-1.5">
                <TrendingUp className={cx(
                    "h-3 w-3",
                    dark ? "text-emerald-400" : "text-emerald-600"
                )}/>
                <span className={cx(
                    "text-xs font-medium",
                    dark ? "text-emerald-400" : "text-emerald-600"
                )}>
                Активные данные
            </span>
            </div>
        </div>
    );
}

/* ======================== Compact Skeleton Components ======================== */
function SkeletonHeader({dark}: { dark: boolean }) {
    return (
        <div className="animate-pulse mb-6 text-center">
            <div className={cx(
                "h-8 w-60 rounded-xl mb-2 mx-auto",
                dark ? "bg-slate-700" : "bg-gray-200"
            )}/>
        </div>
    );
}

function SkeletonTable({dark}: { dark: boolean }) {
    return (
        <div className={cx(
            "rounded-2xl border backdrop-blur-xl p-6",
            dark ? "border-slate-700 bg-slate-800/40" : "border-gray-200 bg-white/70"
        )}>
            <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4">
                        <div className={cx(
                            "h-10 w-10 rounded-xl",
                            dark ? "bg-slate-700" : "bg-gray-200"
                        )}/>
                        <div className="flex-1 space-y-2">
                            <div className={cx(
                                "h-4 w-40 rounded",
                                dark ? "bg-slate-700" : "bg-gray-200"
                            )}/>
                            <div className={cx(
                                "h-3 w-24 rounded",
                                dark ? "bg-slate-700" : "bg-gray-200"
                            )}/>
                        </div>
                        <div className={cx(
                            "h-6 w-16 rounded",
                            dark ? "bg-slate-700" : "bg-gray-200"
                        )}/>
                    </div>
                ))}
            </div>
        </div>
    );
}