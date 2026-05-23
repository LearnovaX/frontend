import { useEffect, useState } from "react";
import { NavLink, Outlet, useParams, Navigate, Link, useLocation } from "react-router-dom";
import api from "@/api/api";
import { useTheme } from "@/components/common/ThemeContext";
import { PencilLine } from "lucide-react";

export type CourseDetail = {
    id: number;
    name: string;c
    description: string;
    free_order: boolean;
    image?: string | null;
    is_certificated: boolean;
    role: string;
    can_manage_tasks: boolean;
};

export type CourseOutletContext = {
    course: CourseDetail;
    /** true => студент в режиме деталей задания, нужно прятать верх баннера */
    hideHero: boolean;
    isStudent: boolean;
};

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export default function CourseLayout() {
    const { id } = useParams<{ id: string }>();
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";
    const location = useLocation();

    useEffect(() => {
        let on = true;
        (async () => {
            try {
                const r = await api.get(`course/courses/${id}/`);
                if (on) setCourse(r.data);
            } finally {
                if (on) setLoading(false);
            }
        })();
        return () => {
            on = false;
        };
    }, [id]);

    if (loading) return <div className={`p-8 ${isDark ? "text-slate-400" : "text-neutral-500"}`}>Загрузка…</div>;
    if (!course) return <div className={`p-8 ${isDark ? "text-rose-300" : "text-rose-600"}`}>Курс не найден</div>;

    if (course.role === "Not enrolled") {
        return <Navigate to="/courses" replace />;
    }

    const isStudent = course.role === "Student";
    const sp = new URLSearchParams(location.search);
    // студент открыл детали задания внутри CourseContent (?task=…)
    const hideHero = isStudent && sp.has("task");

    return (
        <div className={`mx-auto max-w-screen-2xl px-4 py-6 ${isDark ? "text-slate-200" : "text-black"}`}>
            {/* Banner (прячем только в режиме деталей для студента) */}
            {!hideHero && (
                <div
                    className={`relative h-48 w-full overflow-hidden rounded-2xl border ${
                        isDark ? "bg-slate-700 border-slate-600" : "bg-neutral-100 border-neutral-200"
                    }`}
                >
                    {course.image ? (
                        <img src={course.image} alt={course.name} className="h-full w-full object-cover" />
                    ) : (
                        <div
                            className={`flex h-full items-center justify-center text-sm ${
                                isDark ? "text-slate-400" : "text-neutral-400"
                            }`}
                        >
                            Нет изображения
                        </div>
                    )}
                    {course.role === "Admin" && (
                        <div className="absolute top-2 right-2">
                            <Link
                                to={`/courses/${course.id}/edit`}
                                className={`bg-white/80 px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                                    isDark ? "text-slate-700" : "text-neutral-700"
                                }`}
                            >
                                <PencilLine size={16} /> Редактировать
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* Title */}
            <div className={cx("flex items-start justify-between gap-3", hideHero ? "mt-0" : "mt-4")}>
                <div>
                    <h1 className={cx("text-2xl font-semibold tracking-tight", isDark ? "text-slate-200" : "text-black")}>
                        {course.name}
                    </h1>
                </div>
            </div>

            {/* Tabs */}
            <div className={`mt-6 border-b ${isDark ? "border-slate-700" : "border-neutral-200"}`}>
                <nav className="-mb-px flex gap-6 text-[0.95rem]">
                    <NavLink
                        to={`/courses/${course.id}`}
                        end
                        className={({ isActive }) =>
                            cx(
                                "border-b-2 px-1 pb-3 transition-colors",
                                isActive
                                    ? isDark
                                        ? "border-blue-600 text-slate-200"
                                        : "border-black text-black"
                                    : isDark
                                        ? "border-transparent text-slate-400 hover:text-slate-200"
                                        : "border-transparent text-neutral-500 hover:text-neutral-800"
                            )
                        }
                    >
                        Содержимое
                    </NavLink>
                    {course.role !== "Student" && (
                        <>
                            <NavLink
                                to={`/courses/${course.id}/trainers`}
                                className={({ isActive }) =>
                                    cx(
                                        "border-b-2 px-1 pb-3 transition-colors",
                                        isActive
                                            ? isDark
                                                ? "border-blue-600 text-slate-200"
                                                : "border-black text-black"
                                            : isDark
                                                ? "border-transparent text-slate-400 hover:text-slate-200"
                                                : "border-transparent text-neutral-500 hover:text-neutral-800"
                                    )
                                }
                            >
                                Тренеры
                            </NavLink>
                            <NavLink
                                to={`/courses/${course.id}/groups`}
                                className={({ isActive }) =>
                                    cx(
                                        "border-b-2 px-1 pb-3 transition-colors",
                                        isActive
                                            ? isDark
                                                ? "border-blue-600 text-slate-200"
                                                : "border-black text-black"
                                            : isDark
                                                ? "border-transparent text-slate-400 hover:text-slate-200"
                                                : "border-transparent text-neutral-500 hover:text-neutral-800"
                                    )
                                }
                            >
                                Группы
                            </NavLink>
                            <NavLink
                                to={`/courses/${course.id}/students`}
                                className={({ isActive }) =>
                                    cx(
                                        "border-b-2 px-1 pb-3 transition-colors",
                                        isActive
                                            ? isDark
                                                ? "border-blue-600 text-slate-200"
                                                : "border-black text-black"
                                            : isDark
                                                ? "border-transparent text-slate-400 hover:text-slate-200"
                                                : "border-transparent text-neutral-500 hover:text-neutral-800"
                                    )
                                }
                            >
                                Студенты
                            </NavLink>
                            <NavLink
                                to={`/courses/${course.id}/reviews`}
                                className={({ isActive }) =>
                                    cx(
                                        "border-b-2 px-1 pb-3 transition-colors",
                                        isActive
                                            ? isDark
                                                ? "border-blue-600 text-slate-200"
                                                : "border-black text-black"
                                            : isDark
                                                ? "border-transparent text-slate-400 hover:text-slate-200"
                                                : "border-transparent text-neutral-500 hover:text-neutral-800"
                                    )
                                }
                            >
                                Отзывы
                            </NavLink>
                        </>
                    )}
                </nav>
            </div>

            {/* Pages */}
            <div className="mt-6">
                <Outlet context={{ course, hideHero, isStudent } satisfies CourseOutletContext} />
            </div>
        </div>
    );
}
