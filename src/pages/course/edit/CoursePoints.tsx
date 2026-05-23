import { useOutletContext } from "react-router-dom";
import type { CourseDetail } from "./CourseManagementLayout";
import { useTheme } from "@/components/common/ThemeContext";

export default function CoursePoints() {
    const { course } = useOutletContext<{ course: CourseDetail }>();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    return (
        <div className={`rounded-2xl border p-5 space-y-4 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200"}`}>
            <h2 className={`text-lg font-semibold ${isDark ? "text-slate-200" : "text-black"}`}>Ваша система баллов</h2>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-neutral-600"}`}>
                Здесь будет управление баллами/очками курса <b>{course.name}</b>.
            </p>
            <div className={`rounded-xl border border-dashed p-6 text-sm ${isDark ? "border-slate-600 text-slate-400" : "border-neutral-300 text-neutral-500"}`}>
                Пока API не предоставлено. Когда будет эндпоинт (например, правила начисления, шкала, веса),
                легко добавим загрузку/сохранение настроек.
            </div>
        </div>
    );
}