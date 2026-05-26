import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/api/api";
import { useTheme } from "@/components/common/ThemeContext";

type Teacher = { id: number; first_name?: string; last_name?: string; email?: string };

export default function CourseTrainers() {
    const { id } = useParams<{ id: string }>();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    useEffect(() => {
        let on = true;
        (async () => {
            try {
                const r = await api.get(`course/courses/${id}/teachers/`);
                if (on) setTeachers(r.data || []);
            } finally {
                if (on) setLoading(false);
            }
        })();
        return () => { on = false; };
    }, [id]);

    if (loading) return <div className={`p-4 ${isDark ? "text-slate-400" : "text-neutral-500"}`}>Загрузка…</div>;
    if (!teachers.length) return <div className={`p-4 ${isDark ? "text-slate-400" : "text-neutral-500"}`}>Пока нет тренеров</div>;

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {teachers.map((t) => (
                <div key={t.id} className={`rounded-2xl border p-4 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200"}`}>
                    <div className={`font-medium ${isDark ? "text-slate-200" : "text-black"}`}>
                        {t.first_name} {t.last_name}
                    </div>
                    <div className={`text-sm ${isDark ? "text-slate-400" : "text-neutral-600"}`}>{t.email}</div>
                </div>
            ))}
        </div>
    );
}