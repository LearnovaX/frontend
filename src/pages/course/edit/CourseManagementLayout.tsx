import { useEffect, useState } from "react";
import {Link, NavLink, Outlet, useParams} from "react-router-dom";
import api from "@/api/api";
import { useTheme } from "@/components/common/ThemeContext";

type Author = { id: number; first_name: string; last_name: string; email: string };
type Category = { id: number; name: string; parent_category: number | null };

export type CourseDetail = {
    id: number;
    name: string;
    description: string;
    author?: Author | null;
    free_order: boolean;
    category?: Category | null;
    image?: string | null;
    deadline_to_finish_course?: string | null;
    block_course_after_deadline: boolean;
    is_certificated: boolean;
    created_at: string;
    updated_at: string;
    allow_teachers_to_manage_tasks: boolean;
};

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export default function CourseManageLayout() {
    const { id } = useParams<{ id: string }>();
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

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
        return () => { on = false; };
    }, [id]);

    if (loading) return <div className={`p-8 ${isDark ? "text-slate-400" : "text-neutral-500"}`}>Загрузка…</div>;
    if (!course)  return <div className={`p-8 ${isDark ? "text-rose-300" : "text-red-600"}`}>Курс не найден</div>;

    const tabs = [
        { to: `/courses/${course.id}/edit`, label: "Информация", end: true },
        { to: `/courses/${course.id}/lessons`, label: "Уроки" },
        { to: `/courses/${course.id}/certificate`, label: "Сертификат" },
        { to: `/courses/${course.id}/points`, label: "Баллы" },
    ];

    return (
        <div className={`mx-auto max-w-screen pb-10 ${isDark ? "text-slate-200" : "text-black"}`}>
            {/* Simple header */}
            <div className="mt-6 flex items-center justify-between">
                <div className="min-w-0">
                    <h1 className={`truncate text-2xl font-semibold ${isDark ? "text-slate-200" : "text-black"}`}>{course.name}</h1>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-neutral-500"}`}>
                        {course.category?.name ?? "Без категории"}
                        {course.author ? ` • ${course.author.first_name} ${course.author.last_name}` : ""}
                    </p>
                </div>
                <Link
                    to="/courses"
                    className={`rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50 ${isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-neutral-200 text-black hover:bg-neutral-50"}`}
                >
                    ← Ко всем курсам
                </Link>
            </div>

            {/* Tabs */}
            <div className={`mt-6 border-b ${isDark ? "border-slate-700" : "border-neutral-200"}`}>
                <nav className="-mb-px flex gap-6 text-[0.95rem]">
                    {tabs.map((t) => (
                        <NavLink
                            key={t.to}
                            to={t.to}
                            end={t.end as any}
                            className={({ isActive }) =>
                                cx(
                                    "border-b-2 px-1 pb-3 transition-colors",
                                    isActive ? (isDark ? "border-blue-600 text-slate-200" : "border-black text-black") : (isDark ? "border-transparent text-slate-400 hover:text-slate-200" : "border-transparent text-neutral-500 hover:text-neutral-800")
                                )
                            }
                        >
                            {t.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Tab body */}
            <div className="mt-6">
                <Outlet context={{ course }} />
            </div>
        </div>
    );
}