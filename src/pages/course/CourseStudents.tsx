// src/pages/CourseStudents.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import {
    Search as SearchIcon,
    ChevronDown,
    MoreVertical,
    ArrowUpAZ,
    ArrowDownAZ,
    CheckCircle2,
    Clock3,
    Circle,
    Eye,
    Repeat2,
    UserCheck,
    UserX,
    Check,
    Loader2,
    X,
} from "lucide-react";
import api from "@/api/api";
import { useTheme } from "@/components/common/ThemeContext";
import StudentViewModal from "@/components/admin/StudentCourseView";

/* =========================================
   Types (added optional fields for sorting)
========================================= */
type UserMini = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    photo?: string | null;
    status?: string | null; // backend may send EN; we map to RU
};

type GroupMini = {
    id: number;
    name: string;
};

type Enrollment = {
    id: number;
    user: UserMini;
    group: GroupMini | null;
    role: "student" | string;
    enrolled_date?: string | null;     // Назначено
    started_at?: string | null;        // Начат
    finished_at?: string | null;       // Завершение
    points?: number | null;            // Баллов
    course_status?: "finished" | "in_progress" | "not_started" | string | null;
};

type StatsMaybe =
    | {
    students_count?: number;
    groups_count?: number;
    tasks_count?: number;
    teachers_count?: number;
}
    | Enrollment[];

type SortKey =
    | "name"
    | "group"
    | "points"
    | "enrolled"
    | "course_status"
    | "started"
    | "finished";

/* =========================================
   Utils
========================================= */
const initials = (u: UserMini) =>
    (u.first_name?.[0] ?? "").toUpperCase() + (u.last_name?.[0] ?? "").toUpperCase();

const fullName = (u: UserMini) =>
    [u.first_name, u.last_name].filter(Boolean).join(" ").trim();

const parseISO = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
};

const fmtDate = (iso?: string | null) => {
    const d = parseISO(iso);
    if (!d) return "—";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
};

// English-ish backend → Russian label + color
function userStatusRU(status?: string | null) {
    const s = (status ?? "").toLowerCase();
    if (s.includes("author")) return { ru: "Авторизован", tone: "green" };
    if (s.includes("unauthor")) return { ru: "Не авторизован", tone: "blue" };
    if (s.includes("deactiv") || s.includes("block")) return { ru: "Деактивирован", tone: "red" };
    if (s.includes("await") || s.includes("delet"))
        return { ru: "Ожидает удаления", tone: "amber" };
    return { ru: "—", tone: "blue" };
}

function courseStatusNorm(s?: string | null): "finished" | "in_progress" | "not_started" {
    const v = (s ?? "").toLowerCase();
    if (v.includes("finish")) return "finished";
    if (v.includes("progress") || v.includes("process")) return "in_progress";
    return "not_started";
}

const courseStatusOrder: Record<ReturnType<typeof courseStatusNorm>, number> = {
    not_started: 0,
    in_progress: 1,
    finished: 2,
};

/* =========================================
   Main Component
========================================= */
export default function CourseStudents() {
    const { id: courseId } = useParams<{ id: string }>();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<StatsMaybe | null>(null);
    const [rows, setRows] = useState<Enrollment[]>([]);
    const [search, setSearch] = useState("");
    const [groupFilter, setGroupFilter] = useState<number | "all">("all");
    const [statusFilter, setStatusFilter] = useState<string | "all">("all");
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [selected, setSelected] = useState<number[]>([]); // enrollment ids
    const [openMenu, setOpenMenu] = useState<{ id: number; rect: DOMRect } | null>(null);

    // Modal state
    const [viewUserId, setViewUserId] = useState<number | null>(null);

    // Toast
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const fireToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 2600);
    };

    // Data load
    const loadData = async () => {
        setLoading(true);
        try {
            const r = await api.get(`course/courses/${courseId}/students/`);
            const payload: StatsMaybe = r.data;
            setStats(payload);
            if (Array.isArray(payload)) setRows(payload);
            else {
                const r2 = await api.get(`course/courses/${courseId}/students/`);
                setRows(Array.isArray(r2.data) ? r2.data : []);
            }
        } catch {
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);

    // Derived
    const allGroups = useMemo(
        () =>
            Array.from(
                new Map(rows.map((r) => [r.group?.id ?? 0, r.group?.name ?? "Без группы"])).entries()
            ).map(([id, name]) => ({ id, name })),
        [rows]
    );
    const allStatuses = useMemo(
        () => Array.from(new Set(rows.map((r) => userStatusRU(r.user.status).ru))),
        [rows]
    );

    const filtered = useMemo(() => {
        let list = rows;

        if (search.trim()) {
            const s = search.toLowerCase();
            list = list.filter(
                (r) =>
                    fullName(r.user).toLowerCase().includes(s) ||
                    r.user.email.toLowerCase().includes(s)
            );
        }

        if (groupFilter !== "all") list = list.filter((r) => (r.group?.id ?? 0) === groupFilter);

        if (statusFilter !== "all")
            list = list.filter((r) => userStatusRU(r.user.status).ru === statusFilter);

        // Sorting
        const dir = sortDir === "asc" ? 1 : -1;
        list = [...list].sort((a, b) => {
            const aName = fullName(a.user);
            const bName = fullName(b.user);
            const aGroup = a.group?.name ?? "";
            const bGroup = b.group?.name ?? "";
            const aPts = a.points ?? -Infinity;
            const bPts = b.points ?? -Infinity;
            const aEnr = parseISO(a.enrolled_date)?.getTime() ?? -Infinity;
            const bEnr = parseISO(b.enrolled_date)?.getTime() ?? -Infinity;
            const aSta = parseISO(a.started_at)?.getTime() ?? -Infinity;
            const bSta = parseISO(a.started_at)?.getTime() ?? -Infinity;
            const aFin = parseISO(a.finished_at)?.getTime() ?? -Infinity;
            const bFin = parseISO(a.finished_at)?.getTime() ?? -Infinity;
            const aCS = courseStatusOrder[courseStatusNorm(a.course_status)];
            const bCS = courseStatusOrder[courseStatusNorm(b.course_status)];

            const valA =
                sortKey === "name"
                    ? aName
                    : sortKey === "group"
                        ? aGroup
                        : sortKey === "points"
                            ? aPts
                            : sortKey === "enrolled"
                                ? aEnr
                                : sortKey === "started"
                                    ? aSta
                                    : sortKey === "finished"
                                        ? aFin
                                        : /* course_status */ aCS;

            const valB =
                sortKey === "name"
                    ? bName
                    : sortKey === "group"
                        ? bGroup
                        : sortKey === "points"
                            ? bPts
                            : sortKey === "enrolled"
                                ? bEnr
                                : sortKey === "started"
                                    ? bSta
                                    : sortKey === "finished"
                                        ? bFin
                                        : /* course_status */ bCS;

            if (typeof valA === "number" && typeof valB === "number") {
                return (valA - valB) * dir;
            }
            return String(valA).localeCompare(String(valB)) * dir;
        });

        return list;
    }, [rows, search, groupFilter, statusFilter, sortKey, sortDir]);

    const allSelected = selected.length > 0 && selected.length === filtered.length;
    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    // Bulk helpers
    const selectedUserIds = useMemo(() => {
        const set = new Set(selected);
        return filtered.filter((r) => set.has(r.id)).map((r) => r.user.id);
    }, [filtered, selected]);

    const postBulk = async (action: "reassign" | "accept" | "remove", userIds: number[]) => {
        try {
            await api.post(`course/courses/${courseId}/${action}/`, { user_ids: userIds });
            fireToast("success", "Успешно");
            setSelected([]);
            await loadData();
        } catch (e: any) {
            const msg =
                e?.response?.data?.detail || e?.message || "Не удалось выполнить действие";
            fireToast("error", msg);
        }
    };

    // Row "view" -> big modal
    const openView = (userId: number) => {
        setViewUserId(userId);
    };

    // Close menus on scroll/resize
    useEffect(() => {
        const close = () => setOpenMenu(null);
        window.addEventListener("scroll", close, true);
        window.addEventListener("resize", close);
        return () => {
            window.removeEventListener("scroll", close, true);
            window.removeEventListener("resize", close);
        };
    }, []);

    const asStats =
        !Array.isArray(stats) && stats && Object.keys(stats).length > 0 ? stats : null;

    return (
        <div className="flex flex-col gap-4">
            {/* KPI */}
            {asStats ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard label="Студентов" value={asStats.students_count ?? 0} />
                    <KpiCard label="Групп" value={asStats.groups_count ?? 0} />
                    <KpiCard label="Заданий" value={asStats.tasks_count ?? 0} />
                    <KpiCard label="Преподавателей" value={asStats.teachers_count ?? 0} />
                </div>
            ) : null}

            {/* Controls + Bulk actions */}
            <div
                className={`rounded-2xl border p-3 ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200"
                }`}
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search */}
                    <div className="relative w-full sm:max-w-md">
                        <SearchIcon
                            className={`pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${
                                isDark ? "text-slate-400" : "text-neutral-400"
                            }`}
                        />
                        <input
                            className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 ${
                                isDark
                                    ? "bg-slate-700 border-slate-600 text-slate-100 focus:ring-slate-500/30"
                                    : "bg-neutral-50 border-neutral-200 text-neutral-900 focus:ring-neutral-200"
                            }`}
                            placeholder="Поиск по ФИО или email"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <NiceSelect
                            label="Группа"
                            value={groupFilter}
                            onChange={(v) => setGroupFilter(v as any)}
                            items={[{ label: "Все группы", value: "all" }].concat(
                                allGroups.map((g) => ({ label: g.name, value: g.id }))
                            )}
                        />
                        <NiceSelect
                            label="Статус"
                            value={statusFilter}
                            onChange={(v) => setStatusFilter(v as any)}
                            items={[{ label: "Все статусы", value: "all" }].concat(
                                allStatuses.map((s) => ({ label: s, value: s }))
                            )}
                        />
                    </div>
                </div>

                {/* Bulk actions bar */}
                {selected.length > 0 && (
                    <div
                        className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${
                            isDark ? "border-slate-700 bg-slate-700/40" : "border-neutral-200 bg-neutral-50"
                        }`}
                    >
                        <div className={isDark ? "text-slate-300" : "text-neutral-700"}>
                            Выбрано: <span className="font-semibold">{selected.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BulkBtn
                                label="Переназначить"
                                onClick={() => postBulk("reassign", selectedUserIds)}
                            />
                            <BulkBtn
                                label="Принять"
                                onClick={() => postBulk("accept", selectedUserIds)}
                            />
                            <BulkBtn
                                label="Снять"
                                danger
                                onClick={() => postBulk("remove", selectedUserIds)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div
                className={`rounded-2xl border ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200"
                }`}
            >
                <div>
                    <table
                        className={`w-full border-collapse ${
                            isDark ? "text-slate-100" : "text-neutral-900"
                        }`}
                    >
                        <thead
                            className={`sticky top-0 z-20 text-xs ${
                                isDark ? "bg-slate-700 text-slate-300" : "bg-neutral-50 text-neutral-600"
                            }`}
                        >
                        <tr className="[&>th]:px-3 [&>th]:py-3 [&>th]:text-left [&>th]:font-semibold [&>th]:whitespace-nowrap">
                            <th className="w-10">
                                <input
                                    aria-label="Выбрать все"
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={(e) =>
                                        setSelected(e.target.checked ? filtered.map((r) => r.id) : [])
                                    }
                                />
                            </th>
                            {/* Course status icon */}
                            <th className="w-8"></th>

                            <ThSort
                                title="Студент"
                                active={sortKey === "name"}
                                dir={sortDir}
                                onClick={() => toggleSort("name")}
                            />
                            <ThSort
                                title="Группа"
                                active={sortKey === "group"}
                                dir={sortDir}
                                onClick={() => toggleSort("group")}
                            />
                            <ThSort
                                title="Баллов"
                                active={sortKey === "points"}
                                dir={sortDir}
                                onClick={() => toggleSort("points")}
                            />
                            <ThPlain title="Медалей" />
                            <ThPlain title="Пересдач" />
                            <ThSort
                                title="Назначено"
                                active={sortKey === "enrolled"}
                                dir={sortDir}
                                onClick={() => toggleSort("enrolled")}
                            />
                            <ThSort
                                title="Статус курса"
                                active={sortKey === "course_status"}
                                dir={sortDir}
                                onClick={() => toggleSort("course_status")}
                            />
                            <ThSort
                                title="Начат"
                                active={sortKey === "started"}
                                dir={sortDir}
                                onClick={() => toggleSort("started")}
                            />
                            <ThSort
                                title="Завершение"
                                active={sortKey === "finished"}
                                dir={sortDir}
                                onClick={() => toggleSort("finished")}
                            />
                            <ThPlain title="Затрачено" />
                            {/* Sticky actions */}
                            <th className={`sticky right-0 z-30 w-12 ${isDark ? "bg-slate-700" : "bg-neutral-50"}`} />
                        </tr>
                        </thead>

                        <tbody
                            className={`text-sm [&>tr]:border-b ${
                                isDark ? "[&>tr]:border-slate-700" : "[&>tr]:border-neutral-100"
                            }`}
                        >
                        {loading ? (
                            <tr>
                                <td colSpan={13} className="px-3 py-6">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Загрузка…
                                    </div>
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={13}
                                    className={`px-3 py-8 text-center ${
                                        isDark ? "text-slate-400" : "text-neutral-500"
                                    }`}
                                >
                                    Ничего не найдено.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((r) => {
                                const selectedRow = selected.includes(r.id);
                                const { ru: ruStatus, tone } = userStatusRU(r.user.status);
                                const toneCls =
                                    tone === "green"
                                        ? isDark
                                            ? "bg-emerald-900/40 text-emerald-300"
                                            : "bg-emerald-100 text-emerald-700"
                                        : tone === "red"
                                            ? isDark
                                                ? "bg-rose-900/40 text-rose-300"
                                                : "bg-rose-100 text-rose-700"
                                            : tone === "amber"
                                                ? isDark
                                                    ? "bg-amber-900/40 text-amber-300"
                                                    : "bg-amber-100 text-amber-700"
                                                : isDark
                                                    ? "bg-sky-900/40 text-sky-300"
                                                    : "bg-sky-100 text-sky-700";

                                const cStatus = courseStatusNorm(r.course_status);
                                const CSIcon =
                                    cStatus === "finished" ? CheckCircle2 : cStatus === "in_progress" ? Clock3 : Circle;
                                const CSColor =
                                    cStatus === "finished"
                                        ? isDark
                                            ? "text-emerald-300"
                                            : "text-emerald-600"
                                        : cStatus === "in_progress"
                                            ? isDark
                                                ? "text-sky-300"
                                                : "text-sky-600"
                                            : isDark
                                                ? "text-slate-500"
                                                : "text-neutral-400";

                                return (
                                    <tr
                                        key={r.id}
                                        className={`transition-colors ${
                                            isDark
                                                ? selectedRow
                                                    ? "bg-slate-700/60"
                                                    : "hover:bg-slate-700/40"
                                                : selectedRow
                                                    ? "bg-blue-50/60"
                                                    : "hover:bg-neutral-50"
                                        }`}
                                        onClick={(e) => {
                                            const el = e.target as HTMLElement;
                                            if (el.closest("button,input,[data-menu]")) return; // ignore clicks on controls
                                            openView(r.user.id);
                                        }}
                                    >
                                        {/* checkbox */}
                                        <td className="px-3 py-3">
                                            <input
                                                aria-label="Выбрать строку"
                                                type="checkbox"
                                                checked={selectedRow}
                                                onChange={(e) =>
                                                    setSelected((prev) =>
                                                        e.target.checked
                                                            ? [...prev, r.id]
                                                            : prev.filter((id) => id !== r.id)
                                                    )
                                                }
                                            />
                                        </td>

                                        {/* course status icon */}
                                        <td className="px-1 py-3">
                                            <CSIcon className={`h-5 w-5 ${CSColor}`} />
                                        </td>

                                        {/* name + photo + RU user status badge */}
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar photo={r.user.photo} user={r.user} />
                                                <div className="min-w-0">
                                                    <div className={`truncate font-semibold leading-5 ${isDark ? "text-slate-100" : "text-neutral-900"} text-base sm:text-lg`}>
                                                        {fullName(r.user) || "—"}
                                                    </div>
                                                    <div className={`mt-0.5 text-xs ${isDark ? "text-slate-400" : "text-neutral-500"}`}>
                                                        {r.user.email}
                                                    </div>
                                                    <span
                                                        title={ruStatus}
                                                        className={`mt-1 inline-flex max-w-[160px] items-center truncate rounded px-2 py-0.5 text-[11px] leading-4 ${toneCls}`}
                                                    >
                              {ruStatus}
                            </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className={`px-3 py-3 ${isDark ? "text-slate-300" : ""}`}>
                                            {r.group?.name ?? "—"}
                                        </td>

                                        <td className={`px-3 py-3 ${isDark ? "text-slate-100" : "text-neutral-900"}`}>
                                            {r.points ?? "—"}
                                        </td>

                                        <td className={`px-3 py-3 ${isDark ? "text-slate-400" : ""}`}>—</td>
                                        <td className={`px-3 py-3 ${isDark ? "text-slate-400" : ""}`}>—</td>
                                        <td className={`px-3 py-3 ${isDark ? "text-slate-100" : "text-neutral-900"}`}>
                                            {fmtDate(r.enrolled_date)}
                                        </td>
                                        <td className={`px-3 py-3 ${isDark ? "text-slate-100" : "text-neutral-900"}`}>
                                            {cStatus === "finished"
                                                ? "Завершен"
                                                : cStatus === "in_progress"
                                                    ? "В процессе"
                                                    : "Не начат"}
                                        </td>
                                        <td className={`px-3 py-3 ${isDark ? "text-slate-100" : "text-neutral-900"}`}>
                                            {fmtDate(r.started_at)}
                                        </td>
                                        <td className={`px-3 py-3 ${isDark ? "text-slate-100" : "text-neutral-900"}`}>
                                            {fmtDate(r.finished_at)}
                                        </td>
                                        <td className={`px-3 py-3 ${isDark ? "text-slate-400" : ""}`}>—</td>

                                        {/* sticky actions, always visible */}
                                        <td className={`sticky right-0 z-30 px-2 py-2 ${isDark ? "bg-slate-700" : "bg-neutral-50"}`}>
                                            <button
                                                data-menu
                                                className={`rounded-lg p-1 ${isDark ? "hover:bg-slate-600" : "hover:bg-neutral-200"}`}
                                                onClick={(e) => {
                                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                    setOpenMenu({ id: r.id, rect });
                                                }}
                                            >
                                                <MoreVertical className={`h-5 w-5 ${isDark ? "text-slate-100" : "text-neutral-700"}`} />
                                            </button>
                                            {openMenu?.id === r.id ? (
                                                <MenuPortal
                                                    rect={openMenu.rect}
                                                    onClose={() => setOpenMenu(null)}
                                                    items={[
                                                        {
                                                            icon: Eye,
                                                            label: "Посмотреть",
                                                            onClick: () => {
                                                                setOpenMenu(null);
                                                                openView(r.user.id);
                                                            },
                                                        },
                                                        {
                                                            icon: Repeat2,
                                                            label: "Переназначить курс",
                                                            onClick: async () => {
                                                                setOpenMenu(null);
                                                                await postBulk("reassign", [r.user.id]);
                                                            },
                                                        },
                                                        {
                                                            icon: UserCheck,
                                                            label: "Принять курс",
                                                            onClick: async () => {
                                                                setOpenMenu(null);
                                                                await postBulk("accept", [r.user.id]);
                                                            },
                                                        },
                                                        {
                                                            icon: UserX,
                                                            label: "Снять с курса",
                                                            danger: true,
                                                            onClick: async () => {
                                                                setOpenMenu(null);
                                                                await postBulk("remove", [r.user.id]);
                                                            },
                                                        },
                                                    ]}
                                                />
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {viewUserId !== null ? (
                <StudentViewModal courseId={courseId!} userId={viewUserId} onClose={() => setViewUserId(null)} />
            ) : null}

            {toast ? <Toast type={toast.type} msg={toast.msg} /> : null}
        </div>
    );
}

/* =========================================
   Presentational components
========================================= */
function KpiCard({ label, value }: { label: string; value: number }) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";
    return (
        <div
            className={`rounded-2xl border p-4 ${
                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200"
            }`}
        >
            <div className={isDark ? "text-slate-400 text-sm" : "text-neutral-500 text-sm"}>
                {label}
            </div>
            <div className={`text-2xl font-semibold ${isDark ? "text-slate-100" : "text-neutral-900"}`}>
                {value}
            </div>
        </div>
    );
}

function ThPlain({ title }: { title: string }) {
    return <th className="px-3 py-3">{title}</th>;
}

function ThSort({
                    title,
                    active,
                    dir,
                    onClick,
                }: {
    title: string;
    active: boolean;
    dir: "asc" | "desc";
    onClick: () => void;
}) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";
    return (
        <th className="px-3 py-3">
            <button
                onClick={onClick}
                className={`group inline-flex items-center gap-1 rounded px-1 py-0.5 transition ${
                    active
                        ? isDark
                            ? "text-slate-100"
                            : "text-neutral-900"
                        : isDark
                            ? "text-slate-400"
                            : "text-neutral-600 hover:text-neutral-800"
                }`}
            >
                {title}
                <ChevronDown
                    className={`h-4 w-4 transition ${
                        active ? (dir === "asc" ? "rotate-180" : "") : "opacity-50 group-hover:translate-y-[1px]"
                    }`}
                />
                {active ? (
                    dir === "asc" ? (
                        <ArrowUpAZ className="ml-0.5 h-3.5 w-3.5 opacity-70" />
                    ) : (
                        <ArrowDownAZ className="ml-0.5 h-3.5 w-3.5 opacity-70" />
                    )
                ) : null}
            </button>
        </th>
    );
}

type SelectItem = { label: string; value: string | number };
function NiceSelect({
                        value,
                        onChange,
                        items,
                        label,
                        placeholder = "Выбрать…",
                    }: {
    value: string | number;
    onChange: (v: string | number) => void;
    items: SelectItem[];
    label?: string;
    placeholder?: string;
}) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";
    const [open, setOpen] = useState(false);
    const [hoverIdx, setHoverIdx] = useState(-1);
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const popRef = useRef<HTMLDivElement | null>(null);

    const selectedItem = items.find((i) => i.value === value);
    const text = selectedItem ? selectedItem.label : placeholder;

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (
                popRef.current &&
                !popRef.current.contains(e.target as Node) &&
                btnRef.current &&
                !btnRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            setOpen(true);
            setHoverIdx(0);
            e.preventDefault();
            return;
        }
        if (!open) return;
        if (e.key === "Escape") setOpen(false);
        else if (e.key === "ArrowDown") {
            setHoverIdx((i) => Math.min(items.length - 1, i + 1));
            e.preventDefault();
        } else if (e.key === "ArrowUp") {
            setHoverIdx((i) => Math.max(0, i - 1));
            e.preventDefault();
        } else if (e.key === "Enter") {
            if (hoverIdx >= 0 && items[hoverIdx]) onChange(items[hoverIdx].value);
            setOpen(false);
            e.preventDefault();
        }
    };

    return (
        <div className="relative" onKeyDown={onKeyDown}>
            {label ? (
                <div className={`mb-1 text-xs ${isDark ? "text-slate-400" : "text-neutral-600"}`}>
                    {label}
                </div>
            ) : null}
            <button
                ref={btnRef}
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`inline-flex min-w-[12rem] items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                    isDark
                        ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                        : "bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50"
                }`}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
        <span className={selectedItem ? "" : isDark ? "text-slate-400" : "text-neutral-500"}>
          {text}
        </span>
                <ChevronDown className={isDark ? "text-slate-400 h-4 w-4" : "text-neutral-400 h-4 w-4"} />
            </button>

            {open ? (
                <div
                    ref={popRef}
                    className={`absolute z-50 mt-2 w-full overflow-hidden rounded-xl border shadow-xl ${
                        isDark ? "border-slate-700 bg-slate-800" : "border-neutral-200 bg-white"
                    }`}
                    role="listbox"
                >
                    <ul className="max-h-72 overflow-auto py-1">
                        {items.map((it, idx) => {
                            const active = value === it.value;
                            const hovered = hoverIdx === idx;
                            return (
                                <li key={String(it.value)}>
                                    <button
                                        type="button"
                                        onMouseEnter={() => setHoverIdx(idx)}
                                        onClick={() => {
                                            onChange(it.value);
                                            setOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                                            hovered ? (isDark ? "bg-slate-700" : "bg-neutral-100") : ""
                                        } ${isDark ? "text-slate-200" : "text-neutral-800"}`}
                                        role="option"
                                        aria-selected={active}
                                    >
                                        {it.label}
                                        {active ? (
                                            <Check className={isDark ? "text-sky-300 h-4 w-4" : "text-sky-600 h-4 w-4"} />
                                        ) : null}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}

function Avatar({ photo, user }: { photo?: string | null; user: UserMini }) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";
    if (photo) {
        return (
            <img
                src={photo}
                alt={fullName(user) || "avatar"}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-transparent"
            />
        );
    }
    return (
        <div
            className={`flex h-9 w-9 items-center justify-center rounded-full font-semibold ${
                isDark ? "bg-slate-600 text-slate-100" : "bg-neutral-200 text-neutral-800"
            }`}
        >
            {initials(user) || "?"}
        </div>
    );
}

function BulkBtn({
                     label,
                     onClick,
                     danger,
                 }: {
    label: string;
    onClick: () => void;
    danger?: boolean;
}) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";
    const cls = danger
        ? isDark
            ? "border-rose-700/60 text-rose-200 hover:bg-rose-900/30"
            : "border-rose-200 text-rose-700 hover:bg-rose-50"
        : isDark
            ? "border-slate-600 text-slate-100 hover:bg-slate-700"
            : "border-neutral-200 text-neutral-900 hover:bg-neutral-100";
    return (
        <button
            className={`rounded-xl border px-3 py-1.5 text-sm transition ${cls}`}
            onClick={onClick}
        >
            {label}
        </button>
    );
}

/* =========================================
   Menu in a portal (no clipping)
========================================= */
function MenuPortal({
                        rect,
                        onClose,
                        items,
                    }: {
    rect: DOMRect;
    onClose: () => void;
    items: {
        icon: React.ComponentType<{ className?: string; size?: number }>;
        label: string;
        onClick: () => void;
        danger?: boolean;
    }[];
}) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            const t = e.target as HTMLElement;
            if (!t.closest?.("[data-portal-menu]")) onClose();
        };
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onEsc);
        };
    }, [onClose]);

    const width = 260;
    const top = rect.bottom + 8;
    const left = Math.max(8, rect.right - width);

    return createPortal(
        <div
            data-portal-menu
            className={`fixed z-[1000] w-[260px] overflow-hidden rounded-xl border shadow-2xl ${
                isDark ? "border-slate-700 bg-slate-800" : "border-neutral-200 bg-white"
            }`}
            style={{ top, left }}
        >
            <ul className="py-1">
                {items.map((it, i) => {
                    const Icon = it.icon;
                    const base = "flex w-full items-center gap-2 px-3 py-2.5 text-sm transition text-left";
                    const normal = isDark
                        ? "text-slate-200 hover:bg-slate-700"
                        : "text-neutral-800 hover:bg-neutral-100";
                    const danger = isDark
                        ? "text-rose-300 hover:bg-rose-950/50"
                        : "text-rose-700 hover:bg-rose-50";
                    return (
                        <li key={i}>
                            <button className={`${base} ${it.danger ? danger : normal}`} onClick={it.onClick}>
                                <Icon className="h-4 w-4" />
                                {it.label}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>,
        document.body
    );
}

/* =========================================
   Toast
========================================= */
function Toast({ type, msg }: { type: "success" | "error"; msg: string }) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";
    const tone =
        type === "success"
            ? isDark
                ? "bg-emerald-900/50 text-emerald-200 border-emerald-700/50"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            : isDark
                ? "bg-rose-900/40 text-rose-200 border-rose-700/40"
                : "bg-rose-50 text-rose-700 border-rose-200";

    return (
        <div className="fixed bottom-6 right-6 z-[1100]">
            <div className={`rounded-xl border px-4 py-2 text-sm shadow ${tone}`}>{msg}</div>
        </div>
    );
}