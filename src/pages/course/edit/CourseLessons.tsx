import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import api from "@/api/api";
import type { CourseDetail } from "./CourseManagementLayout";
import { useTheme } from "@/components/common/ThemeContext";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import {cx} from "class-variance-authority";
const VIDEO_FIELD = "video"; // <-- change to match backend if needed

/* =========================
   Types
========================= */
type Task = {
    id: number;
    name: string;
    description?: string;
    video_url?: string;              // or use your 'video' file field URL if backend returns it
    course: number;
    created_at?: string;
    updated_at?: string;
    number: number;
    enable_context_menu_for_students: boolean;
    allow_resubmitting_task: boolean;
};

type FormState = {
    name: string;
    description: string;             // HTML from CKEditor
    video_url: string;
    videoFile: File | null;
    number: number;
    enable_context_menu_for_students: boolean;
    allow_resubmitting_task: boolean;
};

/* =========================
   Page Component
========================= */
export default function CourseLessons() {
    const { id } = useParams<{ id: string }>();
    const courseId = Number(id);
    const { course } = useOutletContext<{ course: CourseDetail }>();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // Create modal
    const [openCreate, setOpenCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createProgress, setCreateProgress] = useState<number | null>(null);
    const [createForm, setCreateForm] = useState<FormState>({
        name: "",
        description: "",
        video_url: "",
        videoFile: null,
        number: 0,
        enable_context_menu_for_students: true,
        allow_resubmitting_task: true,
    });

    // Edit modal (BIG)
    const [openEdit, setOpenEdit] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editProgress, setEditProgress] = useState<number | null>(null);
    const [editTarget, setEditTarget] = useState<Task | null>(null);
    const [editForm, setEditForm] = useState<FormState>({
        name: "",
        description: "",
        video_url: "",
        videoFile: null,
        number: 0,
        enable_context_menu_for_students: true,
        allow_resubmitting_task: true,
    });

    // Delete confirm
    const [confirm, setConfirm] = useState<{ id: number; name: string } | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Inject CKEditor dark mode styles once
    useEffect(() => {
        const existingStyle = document.getElementById('ckeditor-dark-styles');
        if (!existingStyle) {
            const style = document.createElement('style');
            style.id = 'ckeditor-dark-styles';
            style.innerHTML = `
        .dark .ck.ck-editor__editable_inline {
          background: hsl(270, 1%, 29%) !important;
          color: hsl(0, 0%, 98%) !important;
        }
        .dark .ck.ck-toolbar {
          background: hsl(255, 3%, 18%) !important;
          border-color: hsl(300, 1%, 22%) !important;
        }
        .dark .ck.ck-button, .dark .ck.ck-button__label {
          color: hsl(0, 0%, 98%) !important;
        }
        .dark .ck.ck-button:hover {
          background: hsl(270, 1%, 22%) !important;
        }
        .dark .ck.ck-editor__editable a {
          color: hsl(210, 100%, 63%) !important;
        }
        .dark .ck-content pre {
          color: hsl(0, 0%, 91%) !important;
          border-color: hsl(0, 0%, 77%) !important;
          background: hsl(270, 1%, 22%) !important;
        }
      `;
            document.head.appendChild(style);
        }
    }, []);

    // Load tasks
    useEffect(() => {
        let on = true;
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                const r = await api.get("tasks/", { params: { course: courseId } });
                const data: Task[] = Array.isArray(r.data) ? r.data : r.data ? [r.data] : [];
                const list = data.some((t) => t.course === courseId)
                    ? data.filter((t) => t.course === courseId)
                    : data;
                if (on) setTasks(list);
            } catch (e: any) {
                if (on) setErr(e?.response?.data?.detail || "Не удалось загрузить список заданий.");
            } finally {
                if (on) setLoading(false);
            }
        })();
        return () => {
            on = false;
        };
    }, [courseId]);

    /* ---------------- helpers ---------------- */
    function buildFormData(values: {
        name: string;
        description: string;
        video_url?: string;
        videoFile?: File | null;
        course?: number;
        number: number;
        enable_context_menu_for_students: boolean;
        allow_resubmitting_task: boolean;
    }) {
        const fd = new FormData();
        fd.append("name", values.name.trim());
        fd.append("number", values.number.toString());
        fd.append("description", values.description); // HTML
        fd.append("enable_context_menu_for_students", values.enable_context_menu_for_students.toString());
        fd.append("allow_resubmitting_task", values.allow_resubmitting_task.toString());
        if (values.course != null) fd.append("course", String(values.course));
        if (values.videoFile) fd.append(VIDEO_FIELD, values.videoFile);
        if (values.video_url && values.video_url.trim()) fd.append("video_url", values.video_url.trim());
        return fd;
    }

    /* ---------------- create ---------------- */
    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!courseId) return;
        setCreating(true);
        setCreateProgress(null);
        setErr(null);
        try {
            const fd = buildFormData({
                name: createForm.name,
                number: createForm.number,
                description: createForm.description,
                video_url: createForm.video_url,
                videoFile: createForm.videoFile || undefined,
                course: courseId,
                enable_context_menu_for_students: createForm.enable_context_menu_for_students,
                allow_resubmitting_task: createForm.allow_resubmitting_task,
            });

            const r = await api.post("tasks/", fd, {
                onUploadProgress: (pe) => {
                    if (pe.total) setCreateProgress(Math.round((pe.loaded * 100) / pe.total));
                },
            });

            const created: Task = r.data;
            setTasks((prev) => [created, ...prev]);
            setOpenCreate(false);
            setCreateForm({ name: "", description: "", video_url: "", videoFile: null, number: 0, enable_context_menu_for_students: true, allow_resubmitting_task: true });
            setCreateProgress(null);
        } catch (e: any) {
            setErr(
                e?.response?.data?.message ||
                e?.response?.data?.detail ||
                "Не удалось создать урок. Проверьте данные."
            );
        } finally {
            setCreating(false);
        }
    }

    /* ---------------- edit ---------------- */
    function startEdit(t: Task) {
        setEditTarget(t);
        setEditForm({
            name: t.name ?? "",
            description: t.description ?? "",
            video_url: t.video_url ?? "",
            videoFile: null,
            number: t.number ?? 0,
            enable_context_menu_for_students: t.enable_context_menu_for_students ?? true,
            allow_resubmitting_task: t.allow_resubmitting_task ?? true,
        });
        setOpenEdit(true);
    }

    async function handleEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editTarget) return;
        setEditing(true);
        setEditProgress(null);
        setErr(null);
        try {
            const fd = buildFormData({
                name: editForm.name,
                number: editForm.number,
                description: editForm.description,
                video_url: editForm.video_url,
                videoFile: editForm.videoFile || undefined,
                enable_context_menu_for_students: editForm.enable_context_menu_for_students,
                allow_resubmitting_task: editForm.allow_resubmitting_task,
            });

            const r = await api.patch(`tasks/${editTarget.id}/`, fd, {
                onUploadProgress: (pe) => {
                    if (pe.total) setEditProgress(Math.round((pe.loaded * 100) / pe.total));
                },
            });

            const updated: Task = r.data ?? { ...editTarget, ...editForm };
            setTasks((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
            setOpenEdit(false);
            setEditTarget(null);
            setEditProgress(null);
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.response?.data?.detail || "Не удалось сохранить.");
        } finally {
            setEditing(false);
        }
    }

    /* ---------------- delete ---------------- */
    async function handleDelete(taskId: number) {
        setDeletingId(taskId);
        setErr(null);
        try {
            await api.delete(`tasks/${taskId}/`);
            setTasks((prev) => prev.filter((x) => x.id !== taskId));
            setConfirm(null);
        } catch (e: any) {
            setErr(e?.response?.data?.detail || "Не удалось удалить урок.");
        } finally {
            setDeletingId(null);
        }
    }

    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => a.number - b.number);
    }, [tasks]);

    const total = useMemo(() => sortedTasks.length, [sortedTasks]);

    if (loading) return <div className={`${isDark ? "text-slate-400" : "text-neutral-500"}`}>Загрузка…</div>;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className={`rounded-xl border px-4 py-2 text-sm ${isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-neutral-200 text-neutral-600"}`}>
                    Всего уроков: <b>{total}</b> • Курс: <b>{course.name}</b>
                </div>
                <button
                    onClick={() => setOpenCreate(true)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] hover:bg-neutral-800 ${isDark ? "bg-blue-600" : "bg-black"}`}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="-ml-0.5">
                        <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />
                    </svg>
                    Создать урок
                </button>
            </div>

            {err && (
                <div className={`rounded-lg border px-3 py-2 text-sm animate-[fadeIn_.2s_ease] ${isDark ? "bg-rose-900/30 border-rose-700 text-rose-300" : "bg-red-50 border-red-200 text-red-700"}`}>
                    {err}
                </div>
            )}

            {/* List */}
            {sortedTasks.length === 0 ? (
                <div className={`rounded-xl border p-6 ${isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-neutral-200 text-neutral-500"}`}>
                    Уроки не найдены.
                </div>
            ) : (
                <ul className="space-y-3">
                    {sortedTasks.map((t) => (
                        <li
                            key={t.id}
                            className={`group relative rounded-xl border p-4 transition-shadow hover:shadow-md ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200"}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h3 className={`truncate text-base font-semibold ${isDark ? "text-slate-200" : "text-black"}`}>{t.number}. {t.name}</h3>
                                    {t.description ? (
                                        <p className={`mt-1 line-clamp-2 text-sm ${isDark ? "text-slate-400" : "text-neutral-600"}`}>{stripHtml(t.description)}</p>
                                    ) : null}

                                    {t.video_url ? (
                                        <div className="mt-2">
                                            <video className="max-h-48 w-full rounded-lg" controls src={t.video_url} />
                                            <a
                                                href={t.video_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={`mt-1 inline-block text-xs underline ${isDark ? "text-blue-400" : "text-blue-600"}`}
                                            >
                                                Открыть видео
                                            </a>
                                        </div>
                                    ) : null}
                                </div>

                                {/* 3 dots actions */}
                                <div className="relative">
                                    <KebabMenu
                                        actions={[
                                            { label: "Редактировать", onClick: () => startEdit(t) },
                                            {
                                                label: "Удалить",
                                                variant: "danger",
                                                onClick: () => setConfirm({ id: t.id, name: t.name }),
                                            },
                                        ]}
                                    />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Create Modal (medium) */}
            {openCreate && (
                <Modal onClose={() => !creating && setOpenCreate(false)} size="xl" title="Новый урок">
                    <form onSubmit={handleCreate} className="space-y-4 animate-[fadeIn_.15s_ease]">
                        <FieldText
                            label="Номер *"
                            value={createForm.number.toString()}
                            onChange={(v) => setCreateForm((f) => ({ ...f, number: Number(v) }))}
                            required
                            placeholder="Номер задания"
                        />
                        <FieldText
                            label="Название *"
                            value={createForm.name}
                            onChange={(v) => setCreateForm((f) => ({ ...f, name: v }))}
                            required
                            placeholder="Например: Введение"
                        />
                        <FieldCKEditor
                            label="Описание"
                            value={createForm.description}
                            onChange={(v) => setCreateForm((f) => ({ ...f, description: v }))}
                        />
                        <FieldText
                            label="Ссылка на видео (по желанию)"
                            value={createForm.video_url}
                            onChange={(v) => setCreateForm((f) => ({ ...f, video_url: v }))}
                            placeholder="https://…"
                        />

                        {/* File upload */}
                        <div>
                            <label className={`mb-1 block text-sm font-medium ${isDark ? "text-slate-300" : "text-neutral-700"}`}>
                                Видео-файл (по желанию)
                            </label>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={(e) =>
                                    setCreateForm((f) => ({ ...f, videoFile: e.target.files?.[0] ?? null }))
                                }
                                className={`block w-full rounded-xl border px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-2 file:text-sm hover:file:bg-neutral-200 ${isDark ? "bg-slate-700 border-slate-600 text-slate-200 file:bg-slate-600 hover:file:bg-slate-500" : "bg-white border-neutral-300 text-black file:bg-neutral-100 hover:file:bg-neutral-200"}`}
                            />
                            {createForm.videoFile ? (
                                <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-neutral-500"}`}>
                                    Выбрано: {createForm.videoFile.name} ({Math.round(createForm.videoFile.size / 1024)} kB)
                                </p>
                            ) : null}
                            {createProgress != null && <ProgressBar value={createProgress} className="mt-2" />}
                        </div>

                        <ToggleSwitch
                            checked={createForm.enable_context_menu_for_students}
                            onChange={(v) => setCreateForm((f) => ({ ...f, enable_context_menu_for_students: v }))}
                            label="Включить контекстное меню для студентов (правый клик)"
                            id="enable_context_menu_for_students"
                        />
                        <ToggleSwitch
                            checked={createForm.allow_resubmitting_task}
                            onChange={(v) => setCreateForm((f) => ({ ...f, allow_resubmitting_task: v }))}
                            label="Разрешить студентам переотправлять ответы"
                            id="allow_resubmitting_task"
                        />

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <BtnSecondary onClick={() => setOpenCreate(false)} disabled={creating}>
                                Отмена
                            </BtnSecondary>
                            <BtnPrimary type="submit" disabled={creating || !createForm.name.trim()}>
                                {creating ? "Загрузка…" : "Создать"}
                            </BtnPrimary>
                        </div>
                    </form>
                </Modal>
            )}

            {/* BIG Edit Modal (94vw x 92vh) */}
            {openEdit && editTarget && (
                <Modal
                    onClose={() => !editing && setOpenEdit(false)}
                    size="full"
                    title="Редактировать урок"
                    big
                >
                    <form onSubmit={handleEdit} className="space-y-4 animate-[fadeIn_.15s_ease]">
                        <FieldText
                            label="Номер *"
                            value={editForm.number.toString()}
                            onChange={(v) => setEditForm((f) => ({ ...f, number: Number(v) }))}
                            required
                        />
                        <FieldText
                            label="Название *"
                            value={editForm.name}
                            onChange={(v) => setEditForm((f) => ({ ...f, name: v }))}
                            required
                        />
                        <FieldCKEditor
                            label="Описание"
                            value={editForm.description}
                            onChange={(v) => setEditForm((f) => ({ ...f, description: v }))}
                            height="60vh"
                        />
                        <FieldText
                            label="Ссылка на видео"
                            value={editForm.video_url}
                            onChange={(v) => setEditForm((f) => ({ ...f, video_url: v }))}
                        />

                        <div>
                            <label className={`mb-1 block text-sm font-medium ${isDark ? "text-slate-300" : "text-neutral-700"}`}>
                                Заменить видео-файл
                            </label>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => setEditForm((f) => ({ ...f, videoFile: e.target.files?.[0] ?? null }))}
                                className={`block w-full rounded-xl border px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-2 file:text-sm hover:file:bg-neutral-200 ${isDark ? "bg-slate-700 border-slate-600 text-slate-200 file:bg-slate-600 hover:file:bg-slate-500" : "bg-white border-neutral-300 text-black file:bg-neutral-100 hover:file:bg-neutral-200"}`}
                            />
                            {editForm.videoFile ? (
                                <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-neutral-500"}`}>
                                    Выбрано: {editForm.videoFile.name} ({Math.round(editForm.videoFile.size / 1024)} kB)
                                </p>
                            ) : null}
                            {editProgress != null && <ProgressBar value={editProgress} className="mt-2" />}
                        </div>

                        <ToggleSwitch
                            checked={editForm.enable_context_menu_for_students}
                            onChange={(v) => setEditForm((f) => ({ ...f, enable_context_menu_for_students: v }))}
                            label="Включить контекстное меню для студентов (правый клик)"
                            id="enable_context_menu_for_students"
                        />
                        <ToggleSwitch
                            checked={editForm.allow_resubmitting_task}
                            onChange={(v) => setEditForm((f) => ({ ...f, allow_resubmitting_task: v }))}
                            label="Разрешить студентам переотправлять ответы"
                            id="allow_resubmitting_task"
                        />

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <BtnSecondary onClick={() => setOpenEdit(false)} disabled={editing}>
                                Отмена
                            </BtnSecondary>
                            <BtnPrimary type="submit" disabled={editing || !editForm.name.trim()}>
                                {editing ? "Сохранение…" : "Сохранить"}
                            </BtnPrimary>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete confirmation */}
            {confirm && (
                <ConfirmModal
                    title="Удалить урок?"
                    message={
                        <>
                            Вы действительно хотите удалить урок <b>{confirm.name}</b>? Это действие нельзя
                            отменить.
                        </>
                    }
                    confirmText={deletingId === confirm.id ? "Удаление…" : "Удалить"}
                    onCancel={() => setConfirm(null)}
                    onConfirm={() => handleDelete(confirm.id)}
                    confirmDisabled={deletingId === confirm.id}
                />
            )}
        </div>
    );
}

/* =========================
   Small UI helpers
========================= */

function stripHtml(html: string) {
    const tmp = typeof document !== "undefined" ? document.createElement("div") : null;
    if (!tmp) return html;
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || "").trim();
}

/* ---------- Kebab (3-dots) Menu ---------- */
function KebabMenu({
                       actions,
                   }: {
    actions: { label: string; onClick: () => void; variant?: "danger" | "normal" }[];
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    useEffect(() => {
        function outside(e: MouseEvent) {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        }
        if (open) document.addEventListener("mousedown", outside);
        return () => document.removeEventListener("mousedown", outside);
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className={`rounded-lg p-2 active:scale-95 transition ${isDark ? "text-slate-400 hover:bg-slate-700" : "text-neutral-600 hover:bg-neutral-100"}`}
                aria-label="Действия"
            >
                <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                        fill="currentColor"
                        d="M6 12a2 2 0 1 1-4.001-.001A2 2 0 0 1 6 12m8 0a2 2 0 1 1-4.001-.001A2 2 0 0 1 14 12m8 0a2 2 0 1 1-4.001-.001A2 2 0 0 1 22 12"
                    />
                </svg>
            </button>

            {open && (
                <div
                    className={`absolute right-0 z-20 mt-2 w-44 origin-top-right rounded-xl border p-1.5 shadow-lg animate-[menuIn_.12s_ease] ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200"}`}
                    style={{ transformOrigin: "top right" }}
                >
                    {actions.map((a, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setOpen(false);
                                a.onClick();
                            }}
                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-neutral-100 ${
                                a.variant === "danger" ? (isDark ? "text-rose-300 hover:text-rose-200" : "text-rose-600 hover:text-rose-700") : (isDark ? "text-slate-300" : "text-neutral-800")
                            }`}
                        >
                            {a.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ---------- Modals ---------- */

function Modal({
                   title,
                   children,
                   onClose,
                   size = "xl",
                   // big = false,
               }: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    size?: "lg" | "xl" | "full";
    big?: boolean; // adds sticky header/footer spacing presets
}) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    const sizes: Record<typeof size, string> = {
        lg: "w-[680px] max-w-[92vw]",
        xl: "w-[920px] max-w-[94vw]",
        full: "w-[94vw] max-w-[1600px] h-[92vh]",
    };

    return (
        <div className="fixed inset-0 z-40 grid place-items-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_.15s_ease]"
                onClick={onClose}
            />
            <div
                className={`relative z-50 rounded-2xl border shadow-xl animate-[popIn_.12s_ease] ${sizes[size]} ${size === "full" ? "flex flex-col" : ""} ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200"}`}
            >
                {/* Header */}
                <div
                    className={`${
                        size === "full" ? "sticky top-0" : ""
                    } px-6 pt-5 pb-4 text-lg font-semibold border-b ${isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-neutral-100 text-black"}`}
                >
                    {title}
                </div>

                {/* Body */}
                <div className={`${size === "full" ? "flex-1 overflow-y-auto px-6 py-5" : "p-6"}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}

function ConfirmModal({
                          title,
                          message,
                          onCancel,
                          onConfirm,
                          confirmText = "Удалить",
                          confirmDisabled,
                      }: {
    title: string;
    message: React.ReactNode;
    onCancel: () => void;
    onConfirm: () => void;
    confirmText?: string;
    confirmDisabled?: boolean;
}) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    return (
        <div className="fixed inset-0 z-50 grid place-items-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className={`relative z-50 w-[520px] max-w-[94vw] rounded-2xl border p-6 shadow-xl animate-[popIn_.12s_ease] ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200"}`}>
                <h3 className={`text-lg font-semibold ${isDark ? "text-slate-200" : "text-black"}`}>{title}</h3>
                <div className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-neutral-700"}`}>{message}</div>
                <div className="mt-6 flex items-center justify-end gap-2">
                    <BtnSecondary onClick={onCancel}>Отмена</BtnSecondary>
                    <button
                        onClick={onConfirm}
                        disabled={!!confirmDisabled}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60 ${isDark ? "bg-rose-600" : "bg-rose-600"}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ---------- Fields & Buttons ---------- */

function FieldText({
                       label,
                       value,
                       onChange,
                       placeholder,
                       required,
                   }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    required?: boolean;
}) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    return (
        <div>
            <label className={`mb-1 block text-sm font-medium ${isDark ? "text-slate-300" : "text-neutral-700"}`}>{label}</label>
            <input
                type="text"
                required={required}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ring-0 transition focus:border-neutral-400 ${isDark ? "bg-slate-700 border-slate-600 text-slate-200" : "bg-white border-neutral-300 text-black"}`}
                placeholder={placeholder}
            />
        </div>
    );
}

function FieldCKEditor({
                           label,
                           value,
                           onChange,
                           height = "360px",
                       }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    height?: string; // e.g., "60vh"
}) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    const editorContainerStyle = {
        '--ck-custom-foreground': isDark ? 'hsl(255, 3%, 18%)' : '#fff',
        '--ck-custom-border': isDark ? 'hsl(300, 1%, 22%)' : '#ccc',
        '--ck-custom-white': isDark ? 'hsl(0, 0%, 100%)' : '#000',
        '--ck-color-base-background': isDark ? 'hsl(270, 1%, 29%)' : '#fff',
        '--ck-color-base-border': isDark ? 'hsl(240, 4%, 24%)' : '#dfdee0',
        '--ck-color-focus-border': 'hsl(208, 90%, 62%)',
        '--ck-color-text': isDark ? 'hsl(0, 0%, 98%)' : '#333',
        '--ck-color-toolbar-border': isDark ? 'var(--ck-custom-border)' : '#ccc',
        '--ck-color-button-default-hover-background': isDark ? 'hsl(270, 1%, 22%)' : '#f7f7f7',
        '--ck-color-button-default-active-background': isDark ? 'hsl(270, 2%, 20%)' : '#efeeef',
    } as React.CSSProperties;

    return (
        <div>
            <label className={`mb-1 block text-sm font-medium ${isDark ? "text-slate-300" : "text-neutral-700"}`}>{label}</label>
            <div className={`rounded-xl border p-2 ${isDark ? "border-slate-600" : "border-neutral-300"}`} style={editorContainerStyle}>
                <CKEditor
                    editor={ClassicEditor}
                    data={value}
                    config={{
                        toolbar: [
                            "heading",
                            "|",
                            "bold",
                            "italic",
                            "underline",
                            "strikethrough",
                            "link",
                            "|",
                            "bulletedList",
                            "numberedList",
                            "blockQuote",
                            "|",
                            "subscript",
                            "superscript",
                            "|",
                            "insertTable",
                            "undo",
                            "redo",
                        ],
                    }}
                    onReady={(editor: any) => {
                        const el = editor?.ui?.view?.editable?.element || editor?.ui?.getEditableElement?.();
                        if (el) {
                            el.style.minHeight = typeof window !== "undefined" && window.innerHeight > 800 ? "360px" : "280px";
                            el.style.height = height;
                            el.style.maxHeight = height;
                            el.style.overflowY = "auto";
                        }
                    }}
                    onChange={(_, editor: any) => onChange(editor.getData())}
                />
            </div>
        </div>
    );
}

function BtnPrimary({
                        children,
                        disabled,
                        type = "button",
                        onClick,
                    }: {
    children: React.ReactNode;
    disabled?: boolean;
    type?: "button" | "submit";
    onClick?: () => void;
}) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60 ${isDark ? "bg-blue-600" : "bg-black"}`}
        >
            {children}
        </button>
    );
}

function BtnSecondary({
                          children,
                          disabled,
                          onClick,
                      }: {
    children: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
}) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`rounded-xl border px-4 py-2 text-sm transition hover:bg-neutral-50 active:scale-[0.98] disabled:opacity-60 ${isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-neutral-300 text-black hover:bg-neutral-50"}`}
        >
            {children}
        </button>
    );
}

function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    return (
        <div className={`h-2 w-full rounded-full ${className} ${isDark ? "bg-slate-700" : "bg-neutral-200"}`}>
            <div
                className={`h-full rounded-full transition-[width] duration-200 ${isDark ? "bg-blue-600" : "bg-black"}`}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    );
}

/* ---------- tiny keyframes (Tailwind arbitrary names) ---------- */
/* Put these in your global CSS if you prefer. Tailwind supports arbitrary animations with @layer. */
const style = document.createElement("style");
style.innerHTML = `
@keyframes popIn { from { transform: scale(.98); opacity: 0 } to { transform: scale(1); opacity: 1 } }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes menuIn { from { transform: scale(.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }
`;
if (typeof document !== "undefined" && !document.getElementById("lessons-anim")) {
    style.id = "lessons-anim";
    document.head.appendChild(style);
}

function ToggleSwitch({
                          checked,
                          onChange,
                          label,
                          id,
                      }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: React.ReactNode;
    id?: string;
}) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    return (
        <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
            isDark ? "border-slate-700 bg-slate-800" : "border-neutral-200 bg-white"
        }`}>
            <label htmlFor={id} className={`text-sm select-none ${isDark ? "text-slate-200" : "text-neutral-900"}`}>
                {label}
            </label>
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={typeof label === "string" ? label : "Toggle"}
                onClick={() => onChange(!checked)}
                className={cx("relative h-6 w-11 rounded-full transition-colors duration-200",
                    checked ? (isDark ? "bg-blue-500" : "bg-black") : (isDark ? "bg-slate-600" : "bg-neutral-300")
                )}
            >
        <span
            className={cx(
                "absolute top-1/2 h-4 w-4 -translate-y-1/2 transform rounded-full bg-white shadow transition-all duration-200",
                checked ? "left-[22px]" : "left-[4px]",
                checked ? "border-blue-200" : "border-neutral-200"
            )}
        />
            </button>
        </div>
    );
}