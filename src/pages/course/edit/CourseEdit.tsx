// CourseEdit.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "@/api/api";
import { useTheme } from "@/components/common/ThemeContext";

type Category = { id: number; name: string; parent_category: number | null };

export default function CourseEdit() {
    const { id } = useParams<{ id: string }>();
    const nav = useNavigate();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [role, setRole] = useState<string | null>(null);

    // raw setting (admin can edit this)
    const [form, setForm] = useState({
        name: "",
        description: "",
        category: "" as number | "",
        free_order: true,
        is_certificated: true,
        block_course_after_deadline: false,
        allow_teachers_to_manage_tasks: false, // raw flag (editable by Admin only)
        image: null as File | null,
    });

    // computed permission (teachers should SEE this)
    const [canManageTasks, setCanManageTasks] = useState<boolean>(false);

    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    useEffect(() => {
        let on = true;

        (async () => {
            try {
                const [d, cats] = await Promise.all([
                    api.get(`course/courses/${id}/`),
                    api.get(`course/categories/`),
                ]);
                if (!on) return;
                const c = d.data;

                setForm({
                    name: c.name || "",
                    description: c.description || "",
                    category: c.category?.id ?? "",
                    free_order: !!c.free_order,
                    is_certificated: !!c.is_certificated,
                    block_course_after_deadline: !!c.block_course_after_deadline,
                    // prefer raw flag if backend returns it (Admin needs this to reflect current setting)
                    // if it's not present in read serializer, it will default to false until backend includes it
                    allow_teachers_to_manage_tasks: !!c.allow_teachers_to_manage_tasks,
                    image: null,
                });

                setRole(c.role ?? null);
                setCanManageTasks(!!c.can_manage_tasks); // computed, used for Teachers' view
                setCategories(cats.data || []);
            } finally {
                if (on) setLoading(false);
            }
        })();
        return () => { on = false; };
    }, [id]);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        const fd = new FormData();
        fd.append("name", form.name);
        fd.append("description", form.description);
        if (form.category !== "") fd.append("category", String(form.category));
        fd.append("free_order", String(form.free_order));
        fd.append("is_certificated", String(form.is_certificated));
        fd.append("block_course_after_deadline", String(form.block_course_after_deadline));

        // Only Admins can change the raw setting
        if (role === "Admin") {
            fd.append("allow_teachers_to_manage_tasks", String(form.allow_teachers_to_manage_tasks));
        }

        if (form.image) fd.append("image", form.image);

        await api.patch(`course/courses/${id}/`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        nav(`/courses`);
    }

    if (loading) return <div className={`p-8 ${isDark ? "text-slate-400" : "text-neutral-500"}`}>Загрузка…</div>;

    const isAdmin = role === "Admin";
    const toggleBase =
        `flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200"}`;
    const labelText = `text-sm ${isDark ? "text-slate-300" : "text-black"}`;

    return (
        <div className="mx-auto max-w-[900px] space-y-4 py-6">
            <div className="flex items-center justify-between">
                <h1 className={`text-2xl font-semibold ${isDark ? "text-slate-200" : "text-black"}`}>Редактирование курса</h1>
                <Link to={`/courses/${id}`} className={`text-sm hover:underline ${isDark ? "text-slate-400" : "text-neutral-600"}`}>
                    ← Вернуться к курсу
                </Link>
            </div>

            <form onSubmit={submit} className={`rounded-2xl border p-5 space-y-4 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200"}`}>
                <div>
                    <label className={`text-sm ${isDark ? "text-slate-300" : "text-black"}`}>Название</label>
                    <input
                        required
                        value={form.name}
                        onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                        className={`mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 ${isDark ? "bg-slate-700 border-slate-600 text-slate-200" : "bg-white border-neutral-200 text-black"}`}
                    />
                </div>

                <div>
                    <label className={`text-sm ${isDark ? "text-slate-300" : "text-black"}`}>Категория</label>
                    <select
                        value={form.category as any}
                        onChange={(e) => setForm((s) => ({ ...s, category: e.target.value ? Number(e.target.value) : "" }))}
                        className={`mt-1 w-full rounded-xl border px-3 py-2 ${isDark ? "bg-slate-700 border-slate-600 text-slate-200" : "bg-white border-neutral-200 text-black"}`}
                    >
                        <option value="">Без категории</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={`text-sm ${isDark ? "text-slate-300" : "text-black"}`}>Описание</label>
                    <textarea
                        required
                        value={form.description}
                        onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                        className={`mt-1 min-h-28 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 ${isDark ? "bg-slate-700 border-slate-600 text-slate-200" : "bg-white border-neutral-200 text-black"}`}
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                        ["free_order", "Свободный порядок"],
                        ["is_certificated", "Сертификация"],
                        ["block_course_after_deadline", "Блокировать после дедлайна"],
                    ].map(([k, label]) => (
                        <label key={k} className={toggleBase}>
                            <input
                                type="checkbox"
                                checked={(form as any)[k]}
                                onChange={(e) => setForm((s) => ({ ...s, [k]: e.target.checked } as any))}
                            />
                            <span className={labelText}>{label}</span>
                        </label>
                    ))}
                </div>

                {/* NEW: Allow teachers to manage tasks (Admins edit raw flag; Teachers see computed permission) */}
                <div className="grid grid-cols-1">
                    <label
                        className={toggleBase}
                        title={!isAdmin ? "Показывается вычисленное разрешение (can_manage_tasks). Изменять может только администратор." : undefined}
                    >
                        <input
                            type="checkbox"
                            checked={isAdmin ? form.allow_teachers_to_manage_tasks : canManageTasks}
                            onChange={(e) => {
                                if (isAdmin) {
                                    setForm((s) => ({ ...s, allow_teachers_to_manage_tasks: e.target.checked }));
                                }
                            }}
                            disabled={!isAdmin}
                        />
                        <span className={labelText}>Разрешить преподавателям редактировать задания</span>
                    </label>
                    {!isAdmin && (
                        <p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-neutral-500"}`}>
                            Значение берётся из <code>can_manage_tasks</code> и учитывает роль и зачисление.
                        </p>
                    )}
                </div>

                <div>
                    <label className={`text-sm ${isDark ? "text-slate-300" : "text-black"}`}>Изображение (опционально)</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setForm((s) => ({ ...s, image: e.target.files?.[0] || null }))}
                        className={`mt-1 w-full rounded-xl border px-3 py-2 ${isDark ? "bg-slate-700 border-slate-600 text-slate-200" : "bg-white border-neutral-200 text-black"}`}
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Link to={`/courses/${id}`} className={`rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50 ${isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-neutral-200 text-black hover:bg-neutral-50"}`}>
                        Отмена
                    </Link>
                    <button type="submit" className={`rounded-xl px-4 py-2 text-sm text-white ${isDark ? "bg-blue-600" : "bg-black"}`}>
                        Сохранить
                    </button>
                </div>
            </form>
        </div>
    );
}
