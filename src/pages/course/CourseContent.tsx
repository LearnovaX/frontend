import {useEffect, useMemo, useState} from "react";
import {useOutletContext, useNavigate, useLocation} from "react-router-dom";
import {
    ArrowRight, Plus, ListIcon, PencilLine, Check, X, HelpCircle, Clock, FileText,
    ChevronLeft, ChevronRight, Upload, Loader2, Award, MessageSquare, Download
} from "lucide-react";
import api from "@/api/api";
import type {CourseDetail, CourseOutletContext} from "./CourseLayout";
import {useTheme} from "@/components/common/ThemeContext";
import DOMPurify from "dompurify";

/* CKEditor (для большого модального окна создания задания) */
import {CKEditor} from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

/* ------------ types ------------ */
type Task = {
    id: number;
    name: string;
    number: number;
    description?: string;
    created_at?: string;
    updated_at?: string;
    video?: string | null;
    image?: string | null;
    file?: string | null;
    allow_resubmitting_task?: boolean;
    enable_context_menu_for_students?: boolean;
};
type TaskStatus = {
    task_id: number;
    status: 'approved' | 'rejected' | 'have_flaws' | 'in_review' | null;
    grade: number | null;
};
type Answer = {
    id: number;
    description: string;
    status: "in_review" | "approved" | "have_flaws" | "rejected";
    plagiarism_status?: "pending_analysis" | "analyzed" | "failed";
    analyzed_at?: string | null;
    files: { id: number; file: string; file_name: string; file_size: number; file_url: string }[];
    grade: {
        score: number;
        max_score: number;
        percentage: number;
        letter_grade: string;
        feedback_text: string;
        graded_by: { first_name: string; last_name: string };
    } | null;
};

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const plagiarismStatusLabel: Record<string, string> = {
    pending_analysis: "Pending Analysis",
    analyzed: "Analysis Completed",
    failed: "Analysis Failed",
};

/** ---- CKEditor: заглушка upload-адаптера ---- */
function CustomUploadAdapterPlugin(editor: any) {
    editor.plugins.get("FileRepository").createUploadAdapter = (_loader: any) => {
        return {
            upload: () =>
                Promise.reject(new Error("Upload adapter not implemented.")),
            abort: () => {
            }
        };
    };
}

export default function CourseContent() {
    // из родителя получаем флаг hideHero (прятать баннер) и сам курс
    const {course, hideHero} = useOutletContext<CourseOutletContext>();
    const {actualTheme} = useTheme();
    const isDark = actualTheme === 'dark';
    const navigate = useNavigate();
    const location = useLocation();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusesLoading, setStatusesLoading] = useState(false);

    // two-pane: выбранное задание (?task=)
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

    // детали выбранного задания и мой ответ
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [myAnswer, setMyAnswer] = useState<Answer | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // ------- модальное создание задания (обновлено) -------
    const [openCreate, setOpenCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState<{
        number: number;
        name: string;
        description: string;
        video: File | null;
        image: File | null;
        file: File | null;
        enable_context_menu_for_students: boolean;
        allow_resubmitting_task: boolean;
    }>({
        number: 0,
        name: "",
        description: "",
        video: null,
        image: null,
        file: null,
        enable_context_menu_for_students: true,
        allow_resubmitting_task: true
    });

    const isManager = course.role === 'Admin' || (course.role === 'Teacher' && course.can_manage_tasks);
    const isStudent = course.role === 'Student';

    /* ------------- fetch tasks + statuses ------------- */
    useEffect(() => {
        let on = true;
        (async () => {
            try {
                const r = await api.get(`course/courses/${course.id}/tasks/`);
                if (on) setTasks((r.data || []).map((t: Task) => ({...t})));
            } finally {
                on && setLoading(false);
            }
        })();
        return () => {
            on = false;
        };
    }, [course.id]);

    useEffect(() => {
        if (!isStudent) return;
        let on = true;
        setStatusesLoading(true);
        (async () => {
            try {
                const r = await api.get(`course/courses/${course.id}/student-tasks-statuses/`);
                if (on) setTaskStatuses(r.data || []);
            } finally {
                on && setStatusesLoading(false);
            }
        })();
        return () => {
            on = false;
        };
    }, [course.id, isStudent]);

    const sortedTasks = useMemo(() => [...tasks].sort((a, b) => (a.number || 0) - (b.number || 0)), [tasks]);
    const statusByTask = useMemo(() => {
        const m = new Map<number, TaskStatus>();
        taskStatuses.forEach(s => m.set(s.task_id, s));
        return m;
    }, [taskStatuses]);

    /* ------------- deep link: ?task= ------------- */
    useEffect(() => {
        const sp = new URLSearchParams(location.search);
        const t = sp.get("task");
        setSelectedTaskId(t ? Number(t) : null);
    }, [location.search]);

    /* ------------- open/close task ------------- */
    const openTask = (id: number) => {
        const sp = new URLSearchParams(location.search);
        sp.set("task", String(id));
        navigate({pathname: location.pathname, search: sp.toString()}, {replace: false});
    };
    const closeTask = () => {
        const sp = new URLSearchParams(location.search);
        sp.delete("task");
        navigate({pathname: location.pathname, search: sp.toString() || ""}, {replace: true});
    };

    /* ------------- load selected task + my answer ------------- */
    useEffect(() => {
        if (!isStudent || !selectedTaskId) {
            setSelectedTask(null);
            setMyAnswer(null);
            return;
        }
        let on = true;
        setDetailsLoading(true);
        (async () => {
            try {
                const [t, a] = await Promise.all([
                    api.get<Task>(`tasks/${selectedTaskId}/`),
                    api.get<Answer>(`tasks/${selectedTaskId}/my-answer/`).catch(() => ({data: null as any}))
                ]);
                if (!on) return;
                setSelectedTask(t.data || null);
                const ans = a?.data && typeof a.data === 'object' && 'id' in a.data ? a.data : null;
                setMyAnswer(ans ? {...ans, files: ans.files ?? []} : null);
            } finally {
                on && setDetailsLoading(false);
            }
        })();
        return () => {
            on = false;
        };
    }, [selectedTaskId, isStudent]);

    /* ========== CKEditor dark theme support (один раз) ========== */
    useEffect(() => {
        const id = "ckeditor-dark-styles";
        if (document.getElementById(id)) return;
        const style = document.createElement("style");
        style.id = id;
        style.innerHTML = `
      .dark .ck.ck-editor__editable_inline {
        background: hsl(215, 25%, 27%) !important;
        color: hsl(210, 40%, 98%) !important;
        border-color: hsl(215, 25%, 35%) !important;
      }
      .dark .ck.ck-toolbar {
        background: hsl(215, 25%, 20%) !important;
        border-color: hsl(215, 25%, 35%) !important;
      }
      .dark .ck.ck-button, .dark .ck.ck-button__label {
        color: hsl(210, 40%, 98%) !important;
      }
      .dark .ck.ck-button:hover {
        background: hsl(215, 25%, 35%) !important;
      }
      .dark .ck.ck-editor__editable a {
        color: hsl(212, 100%, 70%) !important;
      }
      .dark .ck-content pre {
        color: hsl(210, 40%, 95%) !important;
        border-color: hsl(215, 25%, 35%) !important;
        background: hsl(215, 25%, 22%) !important;
      }
    `;
        document.head.appendChild(style);
    }, []);

    /* ------------- create task (NEW: FormData + все поля) ------------- */
    const handleCreate = async () => {
        setCreating(true);
        try {
            const fd = new FormData();
            fd.append("course", String(course.id));
            fd.append("name", createForm.name || "");
            fd.append("number", String(createForm.number || 0));
            fd.append("description", createForm.description || "");
            if (createForm.video) fd.append("video", createForm.video);
            if (createForm.image) fd.append("image", createForm.image);
            if (createForm.file) fd.append("file", createForm.file);
            fd.append("enable_context_menu_for_students", String(createForm.enable_context_menu_for_students));
            fd.append("allow_resubmitting_task", String(createForm.allow_resubmitting_task));

            const r = await api.post("tasks/", fd, {headers: {"Content-Type": "multipart/form-data"}});
            setTasks(prev => [...prev, r.data]);
            setOpenCreate(false);
            setCreateForm({
                number: 0, name: "", description: "", video: null, image: null, file: null,
                enable_context_menu_for_students: true, allow_resubmitting_task: true
            });
        } finally {
            setCreating(false);
        }
    };

    /* =================== UI =================== */

    // ---------- 1) OVERVIEW ----------
    if (!isStudent || selectedTaskId === null) {
        return (
            <div className="space-y-6">
                {/* Описание курса */}
                <div
                    className={cx("rounded-2xl border p-5", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200")}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className={cx("text-lg font-semibold", isDark ? "text-slate-200" : "text-black")}>Описание</h2>
                            <p className={cx("mt-2 whitespace-pre-wrap text-[0.95rem]", isDark ? "text-slate-400" : "text-neutral-700")}>
                                {course.description || "—"}
                            </p>
                        </div>
                        {course.role === 'Admin' && (
                            <button onClick={() => navigate(`/courses/${course.id}/edit`)}
                                    className={cx("text-sm", isDark ? "text-slate-300" : "text-neutral-700")}>
                                <PencilLine size={16}/>
                            </button>
                        )}
                    </div>
                </div>

                {/* Список заданий */}
                <div
                    className={cx("rounded-2xl border p-5", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200")}>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className={cx("text-lg font-semibold", isDark ? "text-slate-200" : "text-black")}>Задания
                            курса</h2>
                        <span
                            className={cx("text-sm", isDark ? "text-slate-400" : "text-neutral-500")}>Всего: {tasks.length}</span>
                        {isManager && (
                            <button
                                onClick={() => setOpenCreate(true)}
                                className={cx("flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-white",
                                    isDark ? "bg-blue-600 hover:bg-blue-700" : "bg-black hover:bg-gray-800")}
                            >
                                <Plus size={16}/> Добавить задание
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div
                            className={cx("py-8", isDark ? "text-slate-400" : "text-neutral-500")}>Загрузка
                            заданий…</div>
                    ) : sortedTasks.length === 0 ? (
                        <div
                            className={cx("py-8", isDark ? "text-slate-400" : "text-neutral-500")}>Заданий
                            пока нет</div>
                    ) : (
                        <ul className="space-y-3">
                            {sortedTasks.map((t) => {
                                const st = isStudent ? statusByTask.get(t.id) : undefined;
                                const S = st ? getStatusDisplay(st.status, isDark) : null;
                                return (
                                    <li key={t.id}>
                                        <button
                                            onClick={() => isStudent ? openTask(t.id) : navigate(`/tasks/${t.id}?course=${course.id}`)}
                                            className={cx("group w-full rounded-2xl border px-5 py-4 text-left transition",
                                                isDark ? "bg-slate-800 border-slate-700 hover:border-slate-600"
                                                    : "bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-md")}
                                        >
                                            <div
                                                className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={cx(
                                                            "flex h-10 w-10 items-center justify-center rounded-xl border-2",
                                                            S ? S.borderC : (isDark ? "bg-slate-700 border-slate-600" : "bg-neutral-100 border-neutral-300")
                                                        )}
                                                    >
                                                        {S
                                                            ? <S.icon
                                                                className={cx("h-5 w-5", S.iconC)}/>
                                                            : <ListIcon
                                                                className={cx("h-5 w-5", isDark ? "text-slate-400" : "text-neutral-600")}/>
                                                        }
                                                    </div>

                                                    <div className="flex flex-col">
                                                        <div
                                                            className={cx("text-[1.05rem] font-medium", isDark ? "text-slate-200" : "text-black")}>
                                                            {t.number}. {t.name}
                                                        </div>
                                                        {isStudent && st && (
                                                            <div
                                                                className="flex items-center gap-2 mt-1">
                                                                <span
                                                                    className={cx("text-xs px-2 py-1 rounded-full font-medium", S?.pillC)}>{S?.label}</span>
                                                                {st.grade !== null && (
                                                                    <span
                                                                        className={cx("text-xs px-2 py-1 rounded-full font-medium",
                                                                            isDark ? "bg-purple-900/30 text-purple-300" : "bg-purple-100 text-purple-700")}>
                                    Оценка: {st.grade}
                                  </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <ArrowRight
                                                    className={cx("h-5 w-5 transition-transform group-hover:translate-x-0.5",
                                                        isDark ? "text-slate-400" : "text-neutral-400")}/>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* ----- Большое модальное окно создания задания (NEW) ----- */}
                {openCreate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* backdrop */}
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                             onClick={() => setOpenCreate(false)}/>

                        <div
                            className={cx(
                                "relative z-10 w-[min(1000px,96vw)] max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl",
                                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200"
                            )}
                        >
                            {/* header */}
                            <div className={cx("px-6 py-4 border-b sticky top-0 z-10",
                                isDark ? "bg-slate-800/95 border-slate-700 backdrop-blur" : "bg-white/95 border-neutral-200 backdrop-blur")}>
                                <h3 className={cx("text-lg font-semibold", isDark ? "text-white" : "text-neutral-900")}>Создать
                                    задание</h3>
                            </div>

                            {/* content */}
                            <div className="p-6 space-y-6">
                                {/* Basic */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            className={cx("block text-sm mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>Номер
                                            задания</label>
                                        <input
                                            type="number"
                                            value={createForm.number}
                                            onChange={(e) => setCreateForm({
                                                ...createForm,
                                                number: Number(e.target.value)
                                            })}
                                            className={cx("w-full rounded-lg border px-3 py-2",
                                                isDark ? "bg-slate-700 border-slate-600 text-slate-200" : "bg-white border-neutral-300 text-neutral-900")}
                                            placeholder="Например: 1"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className={cx("block text-sm mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>Название</label>
                                        <input
                                            value={createForm.name}
                                            onChange={(e) => setCreateForm({
                                                ...createForm,
                                                name: e.target.value
                                            })}
                                            className={cx("w-full rounded-lg border px-3 py-2",
                                                isDark ? "bg-slate-700 border-slate-600 text-slate-200" : "bg-white border-neutral-300 text-neutral-900")}
                                            placeholder="Введите название"
                                        />
                                    </div>
                                </div>

                                {/* Description (CKEditor) */}
                                <div>
                                    <label
                                        className={cx("block text-sm mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>Описание</label>
                                    <div className={cx("rounded-lg border overflow-hidden",
                                        isDark ? "border-slate-600" : "border-neutral-300")}>
                                        <CKEditor
                                            editor={ClassicEditor}
                                            data={createForm.description}
                                            onChange={(_, editor: any) => setCreateForm({
                                                ...createForm,
                                                description: editor.getData()
                                            })}
                                            config={{
                                                extraPlugins: [CustomUploadAdapterPlugin],
                                                toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'outdent', 'indent', '|', 'blockQuote', 'insertTable', 'undo', 'redo'],
                                                placeholder: 'Введите описание задания...'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Media */}
                                <div>
                                    <h4 className={cx("text-base font-semibold mb-3", isDark ? "text-white" : "text-neutral-900")}>Материалы</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label
                                                className={cx("block text-sm mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>Видео</label>
                                            <input
                                                type="file"
                                                accept="video/*"
                                                onChange={(e) => setCreateForm({
                                                    ...createForm,
                                                    video: e.target.files?.[0] || null
                                                })}
                                                className={cx("w-full text-sm", isDark ? "text-slate-200" : "text-neutral-900")}
                                            />
                                        </div>
                                        <div>
                                            <label
                                                className={cx("block text-sm mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>Изображение</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setCreateForm({
                                                    ...createForm,
                                                    image: e.target.files?.[0] || null
                                                })}
                                                className={cx("w-full text-sm", isDark ? "text-slate-200" : "text-neutral-900")}
                                            />
                                        </div>
                                        <div>
                                            <label
                                                className={cx("block text-sm mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>Файл</label>
                                            <input
                                                type="file"
                                                onChange={(e) => setCreateForm({
                                                    ...createForm,
                                                    file: e.target.files?.[0] || null
                                                })}
                                                className={cx("w-full text-sm", isDark ? "text-slate-200" : "text-neutral-900")}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Settings */}
                                <div>
                                    <h4 className={cx("text-base font-semibold mb-3", isDark ? "text-white" : "text-neutral-900")}>Настройки</h4>
                                    <div className="space-y-3">
                                        <ToggleSwitch
                                            checked={createForm.enable_context_menu_for_students}
                                            onChange={(v) => setCreateForm({
                                                ...createForm,
                                                enable_context_menu_for_students: v
                                            })}
                                            label="Разрешить контекстное меню (правый клик) для студентов"
                                            id="create-context"
                                        />
                                        <ToggleSwitch
                                            checked={createForm.allow_resubmitting_task}
                                            onChange={(v) => setCreateForm({
                                                ...createForm,
                                                allow_resubmitting_task: v
                                            })}
                                            label="Разрешить студентам переотправлять ответы"
                                            id="create-resubmit"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* footer */}
                            <div
                                className={cx("px-6 py-4 border-t sticky bottom-0 z-10 flex items-center justify-end gap-3",
                                    isDark ? "bg-slate-800/95 border-slate-700 backdrop-blur" : "bg-white/95 border-neutral-200 backdrop-blur")}>
                                <button
                                    type="button"
                                    onClick={() => setOpenCreate(false)}
                                    className={cx("px-4 py-2 rounded-lg font-medium",
                                        isDark ? "border border-slate-600 text-slate-300 hover:bg-slate-700"
                                            : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50")}
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={creating || !createForm.name.trim()}
                                    className={cx("inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium disabled:opacity-50",
                                        isDark ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white")}
                                >
                                    {creating ? <Loader2 className="h-4 w-4 animate-spin"/> :
                                        <Upload className="h-4 w-4"/>}
                                    {creating ? "Создается..." : "Создать"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ---------- 2) SPLIT VIEW (student clicks a task) ----------
    const heightClass =
        hideHero
            ? "h-[calc(100vh-92px)] md:h-[calc(100vh-92px)]"
            : "h-[calc(100vh-140px)] md:h-[calc(100vh-92px)]";

    return (
        <div className="relative">
            <style>{`
        @keyframes slideIn { from { opacity:.0; transform: translateY(8px) } to { opacity:1; transform: translateY(0) } }
        .animate-slideIn { animation: slideIn .22s cubic-bezier(.2,.8,.2,1) both; }
      `}</style>

            <div
                className={cx("flex rounded-2xl overflow-hidden border", heightClass)}
                style={{minHeight: 560}}
                aria-busy={detailsLoading}
                role="region"
                aria-label="Просмотр задания"
            >
                {/* Sidebar with tasks */}
                <aside
                    className={cx("w-[300px] shrink-0 overflow-y-auto border-r p-4", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200")}>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className={cx("text-xs font-semibold uppercase tracking-wide", isDark ? "text-slate-400" : "text-neutral-500")}>Задания</h4>
                        <button onClick={closeTask}
                                className={cx("text-xs underline", isDark ? "text-slate-300" : "text-neutral-700")}>к
                            списку
                        </button>
                    </div>
                    <ul className="space-y-1">
                        {sortedTasks.map((t, idx) => {
                            const st = statusByTask.get(t.id) || null;
                            const active = t.id === selectedTaskId;
                            const disp = getStatusDisplay(st?.status ?? null, isDark);
                            return (
                                <li key={t.id}>
                                    <button
                                        onClick={() => openTask(t.id)}
                                        className={cx(
                                            "w-full rounded-lg p-3 text-left transition-all",
                                            active
                                                ? (isDark ? "bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/50 shadow-lg" : "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-sm")
                                                : (isDark ? "hover:bg-slate-700/50" : "hover:bg-neutral-50")
                                        )}
                                        aria-current={active ? "true" : "false"}
                                        aria-label={`Задание ${t.number}: ${t.name}`}
                                    >
                                        <div className="flex items-center gap-3">
                      <span
                          className={cx("inline-flex items-center justify-center rounded-md h-6 w-6 text-xs font-mono",
                              isDark ? "bg-slate-700 text-slate-200" : "bg-neutral-100 text-neutral-800")}>
                        {t.number ?? idx + 1}
                      </span>
                                            <div className="min-w-0 flex-1">
                                                <div
                                                    className={cx("truncate text-sm font-medium", isDark ? "text-slate-200" : "text-neutral-900")}>
                                                    {t.name}
                                                </div>
                                                <div
                                                    className={cx("mt-1 text-xs flex items-center gap-2", isDark ? "text-slate-400" : "text-neutral-500")}>
                                                    <span
                                                        className={cx("px-1.5 py-0.5 rounded-full", disp.pillC)}>{disp.label}</span>
                                                    {st && st.grade != null && (
                                                        <span className={cx(
                                                            "px-1.5 py-0.5 rounded-full",
                                                            isDark ? "bg-purple-900/30 text-purple-300" : "bg-purple-100 text-purple-700"
                                                        )}>
                              Оценка: {st.grade}
                            </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </aside>

                {/* Right panel */}
                <main
                    className={cx("flex-1 overflow-y-auto", isDark ? "bg-slate-900" : "bg-neutral-50")}>
                    {detailsLoading || !selectedTask ? (
                        <div
                            className={cx("h-full flex items-center justify-center", isDark ? "text-slate-400" : "text-neutral-600")}>
                            <Loader2 className="animate-spin mr-2"/> Загрузка задания...
                        </div>
                    ) : (
                        <div className="p-6 space-y-6 animate-slideIn">
                            {/* header */}
                            <div
                                className={cx("rounded-2xl border p-6 shadow-sm", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200")}>
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                      <span
                          className={cx("px-2 py-0.5 rounded-full text-xs font-medium", isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700")}>
                        Задание {selectedTask.number}
                      </span>
                                            {selectedTask.allow_resubmitting_task === false && (
                                                <span
                                                    className={cx("px-2 py-0.5 rounded-full text-xs font-medium", isDark ? "bg-slate-700 text-slate-300" : "bg-neutral-200 text-neutral-700")}>
                          Одна попытка
                        </span>
                                            )}
                                        </div>
                                        <h1 className={cx("text-xl md:text-2xl font-bold truncate", isDark ? "text-white" : "text-neutral-900")}>
                                            {selectedTask.name}
                                        </h1>
                                    </div>
                                    <div className="hidden md:flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                const i = sortedTasks.findIndex(t => t.id === selectedTaskId);
                                                if (i > 0) openTask(sortedTasks[i - 1].id);
                                            }}
                                            className={cx("p-2 rounded-lg border", isDark ? "border-slate-600 hover:bg-slate-700" : "border-neutral-300 hover:bg-neutral-50")}
                                            title="Предыдущее"
                                        >
                                            <ChevronLeft className="h-4 w-4"/>
                                        </button>
                                        <button
                                            onClick={() => {
                                                const i = sortedTasks.findIndex(t => t.id === selectedTaskId);
                                                if (i < sortedTasks.length - 1) openTask(sortedTasks[i + 1].id);
                                            }}
                                            className={cx("p-2 rounded-lg border", isDark ? "border-slate-600 hover:bg-slate-700" : "border-neutral-300 hover:bg-neutral-50")}
                                            title="Следующее"
                                        >
                                            <ChevronRight className="h-4 w-4"/>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* description */}
                            <div
                                className={cx("rounded-2xl border p-6 shadow-sm", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200")}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div
                                        className={cx("p-2 rounded-lg", isDark ? "bg-purple-900/30" : "bg-purple-50")}>
                                        <FileText
                                            className={cx("h-5 w-5", isDark ? "text-purple-400" : "text-purple-600")}/>
                                    </div>
                                    <h2 className={cx("text-lg font-semibold", isDark ? "text-white" : "text-neutral-900")}>Описание
                                        задания</h2>
                                </div>
                                <div
                                    className={cx("prose prose-sm max-w-none leading-relaxed",
                                        isDark ? "prose-invert text-slate-300" : "text-neutral-700",
                                        "[&_img]:max-w-full [&_img]:rounded-lg [&_img]:shadow-sm")}
                                    dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(selectedTask.description || "<p>Описание отсутствует</p>")}}
                                />
                            </div>

                            {/* media */}
                            {(selectedTask.video || selectedTask.image || selectedTask.file) && (
                                <div
                                    className={cx("rounded-2xl border p-6 shadow-sm", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200")}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div
                                            className={cx("p-2 rounded-lg", isDark ? "bg-green-900/30" : "bg-green-50")}/>
                                        <h2 className={cx("text-lg font-semibold", isDark ? "text-white" : "text-neutral-900")}>Материалы</h2>
                                    </div>
                                    <div className="space-y-4">
                                        {selectedTask.video && (
                                            <div
                                                className={cx("rounded-xl border overflow-hidden", isDark ? "border-slate-600" : "border-neutral-200")}>
                                                <div
                                                    className={cx("px-4 py-3 text-sm font-medium border-b", isDark ? "bg-slate-700 border-slate-600 text-slate-300" : "bg-neutral-50 border-neutral-200 text-neutral-700")}>Видеоматериал
                                                </div>
                                                <video src={selectedTask.video} controls
                                                       className="w-full h-80 bg-black"/>
                                            </div>
                                        )}
                                        {selectedTask.image && (
                                            <div
                                                className={cx("rounded-xl border overflow-hidden", isDark ? "border-slate-600" : "border-neutral-200")}>
                                                <div
                                                    className={cx("px-4 py-3 text-sm font-medium border-b", isDark ? "bg-slate-700 border-slate-600 text-slate-300" : "bg-neutral-50 border-neutral-200 text-neutral-700")}>Изображение
                                                </div>
                                                <div className="p-4">
                                                    <img src={selectedTask.image} alt="Task visual"
                                                         className="max-h-96 w-full object-contain rounded-lg shadow-sm"/>
                                                </div>
                                            </div>
                                        )}
                                        {selectedTask.file && (
                                            <a href={selectedTask.file} target="_blank"
                                               rel="noopener noreferrer"
                                               className={cx("inline-flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors",
                                                   isDark ? "border-slate-600 hover:bg-slate-700 text-slate-300" : "border-neutral-200 hover:bg-neutral-50 text-neutral-700")}>
                                                <div
                                                    className={cx("p-2 rounded", isDark ? "bg-slate-600" : "bg-neutral-200")}>
                                                    <Download className="h-4 w-4"/></div>
                                                <span className="font-medium">Скачать прикрепленный файл</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* answer */}
                            <StudentAnswer
                                task={selectedTask}
                                answer={myAnswer}
                                onAnswerChange={(ans) => setMyAnswer(ans)}
                                isDark={isDark}
                            />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

/* ---------- helpers for статус- бейджиков ---------- */

/* ---------- helpers for статус-бейджиков ---------- */
function getStatusDisplay(status: TaskStatus['status'], isDark?: boolean) {
    const dark = !!isDark;

    const tone = (c: 'green' | 'red' | 'yellow' | 'blue') => ({
        iconC: dark ? `text-${c}-400` : `text-${c}-600`,
        borderC: `border-${c}-500`,
        pillC: dark
            ? `bg-${c}-900/20 text-${c}-300 border border-${c}-500`
            : `bg-${c}-50   text-${c}-700 border border-${c}-500`,
    });

    switch (status) {
        case 'approved':
            return {icon: Check, label: 'Принято', ...tone('green')};
        case 'rejected':
            return {icon: X, label: 'Отклонено', ...tone('red')};
        case 'have_flaws':
            return {icon: HelpCircle, label: 'Есть недочеты', ...tone('yellow')};
        case 'in_review':
            return {icon: Clock, label: 'На проверке', ...tone('blue')};
        default:
            return {
                icon: FileText, label: 'Не сдано',
                iconC: dark ? 'text-slate-400' : 'text-neutral-600',
                borderC: dark ? 'border-slate-600' : 'border-neutral-300',
                pillC: dark
                    ? 'bg-slate-700 text-slate-300 border border-slate-600'
                    : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
            };
    }
}


/* =================== Student Answer block =================== */

function StudentAnswer({task, answer, onAnswerChange, isDark}: {
    task: Task;
    answer: Answer | null;
    onAnswerChange: (a: Answer | null) => void;
    isDark: boolean;
}) {
    const [showForm, setShowForm] = useState(!answer);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<{
        description: string;
        files: File[]
    }>({description: answer?.description ?? "", files: []});

    useEffect(() => {
        if (answer) setForm(f => ({...f, description: answer.description || ""}));
    }, [answer]);

    async function submit() {
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("task", String(task.id));
            fd.append("description", form.description);
            form.files.forEach(f => fd.append("files", f));

            const res = answer
                ? await api.patch(`answers/${answer.id}/`, fd, {headers: {"Content-Type": "multipart/form-data"}})
                : await api.post(`answers/`, fd, {headers: {"Content-Type": "multipart/form-data"}});

            onAnswerChange(res.data ? {...res.data, files: res.data.files ?? []} : null);
            setForm({description: res.data?.description ?? "", files: []});
            setShowForm(false);
        } finally {
            setSubmitting(false);
        }
    }

    async function removeExistingFile(fileId: number) {
        if (!answer) return;
        await api.delete(`answers/${answer.id}/remove-file/${fileId}/`);
        onAnswerChange({
            ...answer,
            files: (answer.files ?? []).filter(f => f.id !== fileId)
        });
    }

    return (
        <div
            className={cx("rounded-2xl border p-6 shadow-sm", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200")}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className={cx("p-2 rounded-lg", isDark ? "bg-orange-900/30" : "bg-orange-50")}>
                        <MessageSquare
                            className={cx("h-5 w-5", isDark ? "text-orange-400" : "text-orange-600")}/>
                    </div>
                    <h2 className={cx("text-lg font-semibold", isDark ? "text-white" : "text-neutral-900")}>Ваш
                        ответ</h2>
                </div>
                {answer && (task.allow_resubmitting_task ?? true) && !showForm && (
                    <button onClick={() => setShowForm(true)}
                            className={cx("px-4 py-2 rounded-lg text-sm font-medium",
                                isDark ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white")}>
                        Изменить ответ
                    </button>
                )}
            </div>

            {/* existing answer */}
            {answer && !showForm && (
                <div className="space-y-6">
                    <div
                        className={cx("rounded-xl border p-5", isDark ? "bg-slate-900/50 border-slate-600" : "bg-neutral-50 border-neutral-200")}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className={cx("font-medium", isDark ? "text-white" : "text-neutral-900")}>Отправленное
                                решение</h3>
                            {(() => {
                                const S = getStatusDisplay(answer.status as any, isDark);
                                return <span
                                    className={cx("text-xs px-2 py-1 rounded-full", S.pillC)}>{S.label}</span>;
                            })()}
                        </div>
                        <p className={cx("whitespace-pre-wrap text-sm leading-relaxed", isDark ? "text-slate-300" : "text-neutral-800")}>
                            {answer.description || "—"}
                        </p>

                        <div className={cx("mt-4 rounded-lg border px-3 py-2 text-sm", isDark ? "border-slate-600 bg-slate-800 text-slate-300" : "border-neutral-200 bg-white text-neutral-700")}>
                            Academic integrity status: <span className="font-medium">{plagiarismStatusLabel[answer.plagiarism_status || "pending_analysis"] || "Uploaded"}</span>
                        </div>

                        {answer.files?.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {answer.files.map(f => (
                                    <div key={f.id}
                                         className={cx("flex items-center gap-3 p-3 rounded-lg border group",
                                             isDark ? "border-slate-600 bg-slate-700/50" : "border-neutral-200 bg-white")}>
                                        <div
                                            className={cx("p-2 rounded", isDark ? "bg-slate-600" : "bg-neutral-200")}>
                                            <FileText className="h-4 w-4"/></div>
                                        <div className="flex-1 min-w-0">
                                            <a href={f.file_url} target="_blank"
                                               rel="noopener noreferrer"
                                               className={cx("font-medium text-sm hover:underline truncate block",
                                                   isDark ? "text-blue-400" : "text-blue-600")}>{f.file_name}</a>
                                            <p className={cx("text-xs", isDark ? "text-slate-400" : "text-neutral-500")}>{Math.round(f.file_size / 1024)} KB</p>
                                        </div>
                                        <button onClick={() => removeExistingFile(f.id)}
                                                className={cx("opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity",
                                                    isDark ? "hover:bg-rose-900/30 text-rose-400" : "hover:bg-rose-100 text-rose-600")}
                                                title="Удалить файл">
                                            <X className="h-4 w-4"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* grade */}
                    {answer.grade ? (
                        <div
                            className={cx("rounded-xl border p-6", isDark ? "bg-slate-900/50 border-slate-600" : "bg-neutral-50 border-neutral-200")}>
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className={cx("p-2 rounded-lg", isDark ? "bg-green-900/30" : "bg-green-50")}>
                                    <Award
                                        className={cx("h-5 w-5", isDark ? "text-green-400" : "text-green-600")}/>
                                </div>
                                <h3 className={cx("text-lg font-semibold", isDark ? "text-white" : "text-neutral-900")}>Оценка</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                <div className="text-center">
                                    <div
                                        className={cx("text-3xl font-bold mb-1", isDark ? "text-white" : "text-neutral-900")}>
                                        {answer.grade.score}<span
                                        className="text-lg font-normal opacity-75">/{answer.grade.max_score}</span>
                                    </div>
                                    <div
                                        className={cx("text-sm", isDark ? "text-slate-400" : "text-neutral-600")}>Баллы
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div
                                        className={cx("text-3xl font-bold mb-1", isDark ? "text-white" : "text-neutral-900")}>
                                        {Math.round(answer.grade.percentage)}%
                                    </div>
                                    <div
                                        className={cx("text-sm", isDark ? "text-slate-400" : "text-neutral-600")}>Процент
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div
                                        className={cx("inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold border-2 mb-1",
                                            answer.grade.letter_grade === 'A' ? (isDark ? "bg-emerald-900/30 text-emerald-300 border-emerald-700/50" : "bg-emerald-100 text-emerald-700 border-emerald-200")
                                                : answer.grade.letter_grade === 'B' ? (isDark ? "bg-blue-900/30 text-blue-300 border-blue-700/50" : "bg-blue-100 text-blue-700 border-blue-200")
                                                    : answer.grade.letter_grade === 'C' ? (isDark ? "bg-amber-900/30 text-amber-300 border-amber-700/50" : "bg-amber-100 text-amber-700 border-amber-200")
                                                        : answer.grade.letter_grade === 'D' ? (isDark ? "bg-orange-900/30 text-orange-300 border-orange-700/50" : "bg-orange-100 text-orange-700 border-orange-200")
                                                            : (isDark ? "bg-rose-900/30 text-rose-300 border-rose-700/50" : "bg-rose-100 text-rose-700 border-rose-200")
                                        )}>{answer.grade.letter_grade}</div>
                                    <div
                                        className={cx("text-sm", isDark ? "text-slate-400" : "text-neutral-600")}>Оценка
                                    </div>
                                </div>
                            </div>
                            {answer.grade.feedback_text && (
                                <div
                                    className={cx("border-t pt-4", isDark ? "border-slate-700" : "border-neutral-200")}>
                                    <h4 className={cx("font-medium mb-2 flex items-center gap-2", isDark ? "text-slate-300" : "text-neutral-700")}>
                                        <MessageSquare className="h-4 w-4"/>Комментарий
                                        преподавателя</h4>
                                    <p className={cx("text-sm leading-relaxed", isDark ? "text-slate-300" : "text-neutral-700")}>{answer.grade.feedback_text}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div
                            className={cx("rounded-xl border p-5 text-center", isDark ? "bg-slate-900/50 border-slate-600" : "bg-neutral-50 border-neutral-200")}>
                            <Clock
                                className={cx("h-8 w-8 mx-auto mb-3 opacity-50", isDark ? "text-slate-400" : "text-neutral-500")}/>
                            <h3 className={cx("font-semibold mb-1", isDark ? "text-white" : "text-neutral-900")}>Ожидает
                                оценки</h3>
                            <p className={cx("text-sm", isDark ? "text-slate-400" : "text-neutral-600")}>Преподаватель
                                еще не проверил ваш ответ</p>
                        </div>
                    )}
                </div>
            )}

            {/* форма отправки/изменения */}
            {(showForm || (!answer && showForm)) && (
                <div
                    className={cx("mt-6 rounded-xl border p-6", isDark ? "bg-slate-900/50 border-slate-600" : "bg-neutral-50 border-neutral-200")}>
                    <h3 className={cx("text-lg font-semibold mb-4", isDark ? "text-white" : "text-neutral-900")}>{answer ? "Изменить ответ" : "Отправить ответ"}</h3>
                    <div className="space-y-4">
                        <div>
                            <label
                                className={cx("block text-sm font-medium mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>Описание
                                решения *</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({...form, description: e.target.value})}
                                rows={6}
                                className={cx("w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 resize-none",
                                    isDark ? "bg-slate-700 border-slate-600 text-slate-200 focus:ring-blue-500/30" : "bg-white border-neutral-300 text-neutral-900 focus:ring-blue-500/30")}
                                placeholder="Опишите ваше решение подробно..."
                            />
                        </div>

                        <div>
                            <label
                                className={cx("block text-sm font-medium mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>Прикрепить
                                файлы</label>
                            <div className={cx("border-2 border-dashed rounded-lg p-6 text-center",
                                isDark ? "border-slate-600 hover:border-slate-500 hover:bg-slate-800/50" : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50")}>
                                <input type="file" multiple id="student-upload" className="hidden"
                                       onChange={(e) => setForm(f => ({
                                           ...f,
                                           files: [...f.files, ...Array.from(e.target.files || [])]
                                       }))}/>
                                <label htmlFor="student-upload" className="cursor-pointer">
                                    <Upload
                                        className={cx("h-8 w-8 mx-auto mb-2", isDark ? "text-slate-400" : "text-neutral-500")}/>
                                    <p className={cx("text-sm font-medium", isDark ? "text-slate-300" : "text-neutral-700")}>Нажмите
                                        для выбора файлов</p>
                                    <p className={cx("text-xs mt-1", isDark ? "text-slate-400" : "text-neutral-500")}>Поддерживаются
                                        все форматы</p>
                                </label>
                            </div>
                        </div>

                        {form.files.length > 0 && (
                            <div>
                                <h4 className={cx("text-sm font-medium mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>Выбранные
                                    файлы ({form.files.length}):</h4>
                                <div className="space-y-2">
                                    {form.files.map((f, i) => (
                                        <div key={i}
                                             className={cx("flex items-center gap-3 p-3 rounded-lg border", isDark ? "border-slate-600 bg-slate-700/50" : "border-neutral-200 bg-white")}>
                                            <FileText className="h-4 w-4"/>
                                            <div className="flex-1 min-w-0">
                                                <p className={cx("text-sm font-medium truncate", isDark ? "text-slate-200" : "text-neutral-900")}>{f.name}</p>
                                                <p className={cx("text-xs", isDark ? "text-slate-400" : "text-neutral-500")}>{Math.round(f.size / 1024)} KB</p>
                                            </div>
                                            <button onClick={() => setForm(s => ({
                                                ...s,
                                                files: s.files.filter((_, idx) => idx !== i)
                                            }))}
                                                    className={cx("p-1 rounded", isDark ? "hover:bg-rose-900/30 text-rose-400" : "hover:bg-rose-100 text-rose-600")}>
                                                <X className="h-4 w-4"/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <button onClick={submit}
                                    disabled={submitting || !form.description.trim()}
                                    className={cx("inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50",
                                        isDark ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white")}>
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> :
                                    <Upload className="h-4 w-4"/>}
                                {submitting ? "Отправляется..." : (answer ? "Сохранить изменения" : "Отправить ответ")}
                            </button>
                            {answer && <button onClick={() => setShowForm(false)}
                                               className={cx("px-4 py-3 rounded-lg font-medium",
                                                   isDark ? "border border-slate-600 text-slate-300 hover:bg-slate-700"
                                                       : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50")}>Отмена</button>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ====== маленький тумблер для настроек ====== */
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
    const {actualTheme} = useTheme();
    const isDark = actualTheme === 'dark';

    return (
        <div
            className={`flex items-center justify-between rounded-xl border px-3 py-2 ${isDark ? "border-slate-700 bg-slate-800" : "border-neutral-200 bg-white"}`}>
            <label htmlFor={id}
                   className={`text-sm select-none ${isDark ? "text-slate-200" : "text-neutral-900"}`}>
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
                checked ? "left-[22px]" : "left-[4px]"
            )}
        />
            </button>
        </div>
    );
}
