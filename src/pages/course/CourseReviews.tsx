import { useTheme } from "@/components/common/ThemeContext";

export default function CourseReviews() {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    return (
        <div className={`rounded-2xl border p-4 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200"}`}>
            <h2 className={`text-lg font-semibold ${isDark ? "text-slate-200" : "text-black"}`}>Отзывы</h2>
            <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-neutral-600"}`}>
                Отзывы пока отсутствуют. Добавим позже.
            </p>
        </div>
    );
}