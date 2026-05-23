import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/api/api";
import { useTheme } from "@/components/common/ThemeContext";
import {
    PencilLine,
    Users,
    UserCog,
    School,
    Link2,
    ShieldCheck,
    LockKeyhole,
} from "lucide-react";

/* =========================
   Types
========================= */
type Teacher = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
};

type Course = {
    id: number;
    name: string;
    category: { id: number; name: string };
    image: string | null;
    role: string;
};

type Group = {
    id: number;
    name: string;
    course: Course;
    teachers: Teacher[];
    members_count: number;
    students_count: number;
    students_limit: number;
    self_registration: boolean;
    token_status: string;
};

export default function CourseGroups() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [courseRole, setCourseRole] = useState<string>("");
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";

    useEffect(() => {
        let on = true;
        (async () => {
            try {
                setLoading(true);
                const [gr, cr] = await Promise.all([
                    api.get(`course/courses/${id}/groups/`),
                    api.get(`course/courses/${id}/`),
                ]);
                if (!on) return;
                setGroups(gr.data || []);
                setCourseRole(cr.data.role);
            } finally {
                if (on) setLoading(false);
            }
        })();
        return () => {
            on = false;
        };
    }, [id]);

    const isAdmin = courseRole === "Admin";

    const totals = useMemo(() => {
        const count = groups.length;
        const students = groups.reduce((s, g) => s + (g.students_count || 0), 0);
        const capacity = groups.reduce((s, g) => s + (g.students_limit || 0), 0);
        const teachers = groups.reduce((s, g) => s + (g.teachers?.length || 0), 0);
        return { count, students, capacity, teachers };
    }, [groups]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className={`animate-pulse rounded-2xl border p-5 ${
                            isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-neutral-200"
                        }`}
                    >
                        <div className="h-6 w-1/2 rounded bg-black/10 dark:bg-white/10" />
                        <div className="mt-3 h-4 w-2/3 rounded bg-black/10 dark:bg-white/10" />
                        <div className="mt-6 h-2 w-full rounded bg-black/10 dark:bg-white/10" />
                        <div className="mt-2 h-2 w-3/5 rounded bg-black/10 dark:bg-white/10" />
                        <div className="mt-6 h-9 w-28 rounded bg-black/10 dark:bg-white/10" />
                    </div>
                ))}
            </div>
        );
    }

    if (!groups.length) {
        return (
            <div
                className={`rounded-2xl border p-8 text-center ${
                    isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-neutral-200 text-neutral-600"
                }`}
            >
                Пока нет групп.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KPI
                    icon={School}
                    label="Групп"
                    value={totals.count}
                    tone={isDark ? "bg-indigo-500/15 text-indigo-300" : "bg-indigo-50 text-indigo-700"}
                />
                <KPI
                    icon={Users}
                    label="Студентов"
                    value={totals.students}
                    tone={isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700"}
                />
                <KPI
                    icon={UserCog}
                    label="Преподавателей"
                    value={totals.teachers}
                    tone={isDark ? "bg-sky-500/15 text-sky-300" : "bg-sky-50 text-sky-700"}
                />
                <KPI
                    icon={ShieldCheck}
                    label="Заполненность"
                    value={`${Math.min(100, Math.round((totals.students / Math.max(1, totals.capacity)) * 100))}%`}
                    tone={isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-50 text-amber-700"}
                />
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {groups.map((g) => {
                    const pct = Math.min(100, Math.round((g.students_count / Math.max(1, g.students_limit)) * 100));
                    return (
                        <div
                            key={g.id}
                            className={`group relative overflow-hidden rounded-2xl border transition hover:shadow-lg ${
                                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200"
                            }`}
                        >
                            {/* Top ribbon */}
                            <div
                                className={`flex items-center justify-between border-b px-5 py-4 ${
                                    isDark
                                        ? "border-slate-700 bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900"
                                        : "border-neutral-200 bg-gradient-to-r from-neutral-50 via-white to-neutral-50"
                                }`}
                            >
                                <div className="min-w-0">
                                    <div className={`truncate text-lg font-semibold ${isDark ? "text-slate-100" : "text-neutral-900"}`}>
                                        {g.name}
                                    </div>
                                    <div className={`truncate text-sm ${isDark ? "text-slate-400" : "text-neutral-500"}`}>
                                        Курс: <span className={isDark ? "text-slate-300" : "text-neutral-800"}>{g.course.name}</span>
                                        {g.course.category?.name ? ` · ${g.course.category.name}` : ""}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge
                                        tone={
                                            g.self_registration
                                                ? isDark
                                                    ? "bg-emerald-900/30 text-emerald-300 ring-1 ring-emerald-700/40"
                                                    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                                : isDark
                                                    ? "bg-rose-900/30 text-rose-300 ring-1 ring-rose-700/40"
                                                    : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                                        }
                                        icon={g.self_registration ? Link2 : LockKeyhole}
                                    >
                                        {g.token_status}
                                    </Badge>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="space-y-4 px-5 py-4">
                                {/* Teachers */}
                                {g.teachers?.length ? (
                                    <div>
                                        <div className={`mb-1 text-xs ${isDark ? "text-slate-400" : "text-neutral-500"}`}>Преподаватели</div>
                                        <div className="flex flex-wrap gap-2">
                                            {g.teachers.map((t) => (
                                                <span
                                                    key={t.id}
                                                    className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ${
                                                        isDark ? "bg-slate-700 text-slate-200" : "bg-neutral-100 text-neutral-800"
                                                    }`}
                                                >
                          <span
                              className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold ${
                                  isDark ? "bg-slate-600 text-slate-200" : "bg-white text-neutral-700"
                              }`}
                          >
                            {getInitials(t.first_name, t.last_name)}
                          </span>
                                                    {t.first_name} {t.last_name}
                        </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {/* Capacity */}
                                <div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className={isDark ? "text-slate-400" : "text-neutral-500"}>Студенты</span>
                                        <span className={isDark ? "text-slate-200" : "text-neutral-800"}>
                      {g.students_count} / {g.students_limit}
                    </span>
                                    </div>
                                    <div className={`mt-2 h-2 w-full overflow-hidden rounded-full ${isDark ? "bg-slate-700" : "bg-neutral-200"}`}>
                                        <div
                                            style={{ width: `${pct}%` }}
                                            className={`h-2 rounded-full transition-all ${
                                                isDark ? "bg-blue-500" : "bg-blue-600"
                                            }`}
                                        />
                                    </div>
                                </div>

                                {/* Footer actions */}
                                <div className="flex items-center justify-between pt-2">
                                    <div className={`text-xs ${isDark ? "text-slate-400" : "text-neutral-500"}`}>
                                        Участников: <span className={isDark ? "text-slate-300" : "text-neutral-800"}>{g.members_count}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => navigate(`/groups/${g.id}`)}
                                            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                                                isDark
                                                    ? "bg-slate-700/60 text-slate-100 hover:bg-slate-700"
                                                    : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
                                            }`}
                                        >
                                            <PencilLine size={16} />
                                            Редактировать
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* =========================
   Small UI bits
========================= */
function KPI({
                 icon: Icon,
                 label,
                 value,
                 tone,
             }: {
    icon: any;
    label: string;
    value: number | string;
    tone: string;
}) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";
    return (
        <div
            className={`flex items-center gap-4 rounded-2xl border p-4 ${
                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200"
            }`}
        >
            <div className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}>
                <Icon size={18} />
            </div>
            <div>
                <div className={`text-xs ${isDark ? "text-slate-400" : "text-neutral-500"}`}>{label}</div>
                <div className={`text-xl font-semibold ${isDark ? "text-slate-100" : "text-neutral-900"}`}>{value}</div>
            </div>
        </div>
    );
}

function Badge({
                   children,
                   tone,
                   icon: Icon,
               }: {
    children: React.ReactNode;
    tone: string;
    icon?: any;
}) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${tone}`}>
      {Icon ? <Icon size={14} /> : null}
            {children}
    </span>
    );
}

function getInitials(a?: string, b?: string) {
    return `${(a?.[0] || "").toUpperCase()}${(b?.[0] || "").toUpperCase()}` || "•";
}
