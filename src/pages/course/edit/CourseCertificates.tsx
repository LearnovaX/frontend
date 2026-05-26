import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "@/api/api";
import type { CourseDetail } from "./CourseManagementLayout";
import { useTheme } from "@/components/common/ThemeContext";

export default function CourseCertificates() {
    const { course } = useOutletContext<{ course: CourseDetail }>();
    const [isCert, setIsCert] = useState(!!course.is_certificated);
    const [saving, setSaving] = useState(false);
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    async function toggle() {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("is_certificated", String(!isCert));
            await api.patch(`course/courses/${course.id}/`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setIsCert((s) => !s);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className={`rounded-2xl border p-5 space-y-4 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200"}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={`text-lg font-semibold ${isDark ? "text-slate-200" : "text-black"}`}>Сертификат курса</h2>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-neutral-600"}`}>
                        Включите выдачу сертификата по завершению курса.
                    </p>
                </div>
                <button
                    onClick={toggle}
                    disabled={saving}
                    className={`rounded-xl px-4 py-2 text-sm text-white disabled:opacity-60 ${isDark ? "bg-blue-600" : "bg-black"}`}
                >
                    {saving ? "Сохранение…" : isCert ? "Отключить" : "Включить"}
                </button>
            </div>

            <div className={`rounded-xl border border-dashed p-6 text-center text-sm ${isDark ? "border-slate-600 text-slate-400" : "border-neutral-300 text-neutral-500"}`}>
                (Опционально) Здесь может быть предпросмотр сертификата или загрузка шаблона —
                когда появится API/дизайн, просто добавим форму.
            </div>
        </div>
    );
}