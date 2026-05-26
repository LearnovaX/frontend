import React, {useEffect, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Loader2,
    Download,
    Image as ImageIcon,
    PlayCircle,
    X,
    Upload,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    Star,
    MessageSquare,
    Calendar,
    User,
    Award,
    RefreshCw
} from "lucide-react";
import {CKEditor} from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import DOMPurify from "dompurify";
import api from "@/api/api";
import {useTheme} from "@/components/common/ThemeContext";

type CourseMini = {
    id: number;
    name: string;
    role: string;
    can_manage_tasks: boolean;
    allow_teachers_to_manage_tasks: boolean
};
type Task = {
    id: number;
    name: string;
    number: number;
    description?: string | null;
    video?: string | null;
    image?: string | null;
    file?: string | null;
    course: CourseMini;
    created_at?: string | null;
    updated_at?: string | null;
    enable_context_menu_for_students: boolean;
    allow_resubmitting_task: boolean;
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

/** ---- CKEditor: custom upload adapter plugin (NOTE: regular function, NOT an arrow) ---- */
function CustomUploadAdapterPlugin(editor: any) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
        return {
            upload: () =>
                loader.file.then((file: File) =>
                    new Promise((resolve, reject) => {
                        // TODO: implement your upload logic here.
                        reject(new Error("Upload adapter not implemented."));
                    })
                ),
            abort: () => {
                // Optional: implement abort logic if your upload can be canceled
            }
        };
    };
}


export default function CourseTaskView() {
    const {taskId} = useParams<{ taskId: string }>();
    const nav = useNavigate();
    const {actualTheme} = useTheme();
    const isDark = actualTheme === 'dark';

    const [task, setTask] = useState<Task | null>(null);
    const [answer, setAnswer] = useState<Answer | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
    // рядом с другими useState
    const [reassigning, setReassigning] = useState(false);


    // form state for edit task (for teachers/admins)
    const [form, setForm] = useState<{
        name: string;
        number: number;
        description: string;
        video: File | null;
        image: File | null;
        file: File | null;
        enable_context_menu_for_students: boolean;
        allow_resubmitting_task: boolean;
    }>({
        name: "",
        number: 0,
        description: "",
        video: null,
        image: null,
        file: null,
        enable_context_menu_for_students: true,
        allow_resubmitting_task: true
    });

    // for student submit
    const [submitForm, setSubmitForm] = useState<{
        description: string;
        files: File[];
    }>({description: "", files: []});
    const [uploading, setUploading] = useState(false);
    const [showSubmissionForm, setShowSubmissionForm] = useState(false);

    // Inject CKEditor dark mode styles once
    useEffect(() => {
        const existingStyle = document.getElementById('ckeditor-dark-styles');
        if (!existingStyle) {
            const style = document.createElement('style');
            style.id = 'ckeditor-dark-styles';
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
        }
    }, []);

    // Load task and my answer if student
    useEffect(() => {
        let on = true;
        (async () => {
            try {
                const r = await api.get<Task>(`tasks/${taskId}/`);
                if (!on) return;
                setTask(r.data);
                setForm((f) => ({
                    ...f,
                    name: r.data.name || "",
                    number: r.data.number || 0,
                    description: r.data.description || "",
                    enable_context_menu_for_students: r.data.enable_context_menu_for_students,
                    allow_resubmitting_task: r.data.allow_resubmitting_task,
                }));

                // If student, fetch my answer
                if (r.data.course.role === 'Student') {
                    try {
                        const a = await api.get<Answer>(`tasks/${taskId}/my-answer/`);
                        if (a.data && typeof a.data === 'object' && 'id' in a.data && !('detail' in a.data)) {
                            setAnswer({...a.data, files: a.data.files ?? []});
                            setSubmitForm((f) => ({...f, description: a.data.description || ""}));
                        } else {
                            setAnswer(null);
                        }
                    } catch (error) {
                        console.error("Error fetching answer:", error);
                        setAnswer(null);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (on) setLoading(false);
            }
        })();
        return () => {
            on = false;
        };
    }, [taskId]);

    // Edit submit (for managers)
    const submitEdit = async () => {
        if (!task) return;
        setSaving(true);
        setStatusMsg(null);
        try {
            const fd = new FormData();
            fd.append("name", form.name || "");
            fd.append("number", form.number.toString());
            fd.append("description", form.description || "");
            if (form.video) fd.append("video", form.video);
            if (form.image) fd.append("image", form.image);
            if (form.file) fd.append("file", form.file);
            const courseId = typeof task.course === "object" ? task.course.id : task.course;
            fd.append("course", String(courseId));
            fd.append("enable_context_menu_for_students", form.enable_context_menu_for_students.toString());
            fd.append("allow_resubmitting_task", form.allow_resubmitting_task.toString());

            const r = await api.put(`tasks/${task.id}/`, fd, {
                headers: {"Content-Type": "multipart/form-data"},
            });
            setTask(r.data);
            setShowEdit(false);
            setStatusMsg({type: "ok", text: "Изменения сохранены успешно"});
            setTimeout(() => setStatusMsg(null), 3000);
        } catch (e: any) {
            console.error(e);
            setStatusMsg({
                type: "err",
                text: e?.response?.data?.detail || "Не удалось сохранить изменения"
            });
        } finally {
            setSaving(false);
        }
    };

    // Delete task (for managers)
    const deleteTask = async () => {
        if (!task) return;
        if (!window.confirm("Вы уверены, что хотите удалить это задание? Это действие нельзя отменить.")) return;
        setDeleting(true);
        setStatusMsg(null);
        try {
            await api.delete(`tasks/${task.id}/`);
            setStatusMsg({type: "ok", text: "Задание удалено. Переходим к курсу..."});
            setTimeout(() => nav(`/courses/${task.course.id}`), 1500);
        } catch (e: any) {
            console.error(e);
            setStatusMsg({
                type: "err",
                text: e?.response?.data?.detail || "Не удалось удалить задание"
            });
        } finally {
            setDeleting(false);
        }
    };

    // Student submit or update answer
    const handleSubmitAnswer = async () => {
        if (!task) return;
        setUploading(true);
        setStatusMsg(null);
        try {
            const fd = new FormData();
            fd.append("task", String(task.id));
            fd.append("description", submitForm.description);
            submitForm.files.forEach((f) => fd.append("files", f));

            let r;
            if (answer) {
                r = await api.patch(`answers/${answer.id}/`, fd, {
                    headers: {"Content-Type": "multipart/form-data"},
                });
            } else {
                r = await api.post(`answers/`, fd, {
                    headers: {"Content-Type": "multipart/form-data"},
                });
            }
            setAnswer(r.data ? {...r.data, files: r.data.files ?? []} : null);
            setStatusMsg({type: "ok", text: "Ответ успешно отправлен"});
            setSubmitForm(prev => ({...prev, files: []}));
            setShowSubmissionForm(false);
            setTimeout(() => setStatusMsg(null), 3000);
        } catch (e: any) {
            console.error(e);
            setStatusMsg({
                type: "err",
                text: e?.response?.data?.detail || "Не удалось отправить ответ"
            });
        } finally {
            setUploading(false);
        }
    };
    const reassignToAll = async () => {
        if (!task) return;
        const ok = window.confirm(
            "Вы уверены, что хотите переназначить задание всем? " +
            "Это удалит все ответы и оценки по этому заданию. Действие необратимо."
        );
        if (!ok) return;

        setReassigning(true);
        setStatusMsg(null);
        try {
            const r = await api.post(`tasks/${task.id}/reassign-to-all/`);
            setStatusMsg({type: "ok", text: r?.data?.detail || "Задание переназначено всем"});
            setTimeout(() => setStatusMsg(null), 4000);
        } catch (e: any) {
            console.error(e);
            setStatusMsg({
                type: "err",
                text: e?.response?.data?.detail || "Не удалось переназначить задание"
            });
        } finally {
            setReassigning(false);
        }
    };
    // Handle file change for student
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        setSubmitForm((f) => ({...f, files: [...f.files, ...newFiles]}));
    };

    // Remove file for student
    const removeFile = (index: number) => {
        setSubmitForm((f) => ({...f, files: f.files.filter((_, i) => i !== index)}));
    };

    // Remove existing file
    const removeExistingFile = async (fileId: number) => {
        if (!answer) return;
        try {
            await api.delete(`answers/${answer.id}/remove-file/${fileId}/`);
            setAnswer((a) => a ? {
                ...a,
                files: (a.files ?? []).filter(f => f.id !== fileId)
            } : null);
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div className={cx("min-h-screen flex items-center justify-center",
                isDark ? "bg-slate-900 text-slate-400" : "bg-neutral-50 text-neutral-600")}>
                <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin"/>
                    <span>Загрузка задания...</span>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className={cx("min-h-screen flex items-center justify-center",
                isDark ? "bg-slate-900 text-slate-300" : "bg-neutral-50 text-neutral-700")}>
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                    <h2 className="text-xl font-semibold mb-2">Задание не найдено</h2>
                    <p className="text-sm opacity-75">Возможно, задание было удалено или у вас нет
                        доступа к нему.</p>
                </div>
            </div>
        );
    }

    const isManager = task.course.role === 'Admin' || (task.course.role === 'Teacher' && task.course.can_manage_tasks);
    const isStudent = task.course.role === 'Student';
    const isAdmin = task.course.role === 'Admin';
    const canEditAnswer = !answer || (answer && task.allow_resubmitting_task);
    const courseId = typeof task.course === "object" ? task.course.id : task.course;

    return (
        <div className={cx("min-h-screen", isDark ? "bg-slate-900" : "bg-neutral-50")}>
            <div className="mx-auto max-w-screen-xl">
                {/* Header */}
                <header
                    className={cx("border-b px-6 py-4", isDark ? "border-slate-700 bg-slate-800" : "border-neutral-200 bg-white")}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                to={`/courses/${courseId}`}
                                className={cx("inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isDark ? "text-slate-300 hover:bg-slate-700" : "text-neutral-700 hover:bg-neutral-100")}
                            >
                                <ArrowLeft className="h-4 w-4"/>
                                Назад к курсу
                            </Link>
                            <div
                                className={cx("text-sm", isDark ? "text-slate-400" : "text-neutral-500")}>
                                / {task.course.name}
                            </div>
                        </div>

                        {/* Manager Actions */}
                        {isManager && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowEdit(true)}
                                    className={cx("inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                        isDark ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white")}
                                >
                                    <Pencil className="h-4 w-4"/>
                                    Редактировать
                                </button>

                                {/* ТОЛЬКО ДЛЯ АДМИНОВ */}
                                {isAdmin && (
                                    <button
                                        onClick={reassignToAll}
                                        disabled={reassigning}
                                        className={cx(
                                            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
                                            isDark ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"
                                        )}
                                        title="Удалит все ответы и оценки по этому заданию"
                                    >
                                        {reassigning ? <Loader2 className="h-4 w-4 animate-spin"/> :
                                            <RefreshCw className="h-4 w-4"/>}
                                        Переназначить всем
                                    </button>
                                )}

                                <button
                                    onClick={deleteTask}
                                    disabled={deleting}
                                    className={cx("inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
                                        isDark ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-rose-500 hover:bg-rose-600 text-white")}
                                >
                                    {deleting ? <Loader2 className="h-4 w-4 animate-spin"/> :
                                        <Trash2 className="h-4 w-4"/>}
                                    Удалить
                                </button>
                            </div>
                        )}

                    </div>
                </header>

                {/* Status Message */}
                {statusMsg && (
                    <div className={cx("mx-6 mt-4 p-4 rounded-lg border",
                        statusMsg.type === "ok"
                            ? (isDark ? "bg-emerald-900/20 border-emerald-700/30 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-700")
                            : (isDark ? "bg-rose-900/20 border-rose-700/30 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-700")
                    )}>
                        <div className="flex items-center gap-2">
                            {statusMsg.type === "ok" ?
                                <CheckCircle2 className="h-5 w-5"/> :
                                <AlertCircle className="h-5 w-5"/>
                            }
                            <span className="font-medium">{statusMsg.text}</span>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="p-6">
                    {/* Task Header Card */}
                    <div className={cx("mb-6 rounded-2xl border p-8 shadow-sm",
                        isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200")}>
                        <div className="flex items-start justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={cx("px-3 py-1 rounded-full text-sm font-medium",
                                        isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700")}>
                                        Задание {task.number}
                                    </div>
                                    <TaskStatusBadges task={task} isDark={isDark}/>
                                </div>
                                <h1 className={cx("text-3xl font-bold mb-4",
                                    isDark ? "text-white" : "text-neutral-900")}>
                                    {task.name}
                                </h1>
                                {isManager && task.created_at && (
                                    <div className="flex items-center gap-4 text-sm opacity-75">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4"/>
                                            Создано: {new Date(task.created_at).toLocaleDateString()}
                                        </div>
                                        {task.updated_at && task.updated_at !== task.created_at && (
                                            <div className="flex items-center gap-2">
                                                <RefreshCw className="h-4 w-4"/>
                                                Изменено: {new Date(task.updated_at).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {/* Task Description */}
                        <TaskDescriptionCard task={task} isDark={isDark}/>

                        {/* Task Media */}
                        {(task.video || task.image || task.file) && (
                            <TaskMediaCard task={task} isDark={isDark}/>
                        )}

                        {/* Student Answer Section */}
                        {isStudent && (
                            <StudentAnswerSection
                                task={task}
                                answer={answer}
                                canEditAnswer={canEditAnswer}
                                showSubmissionForm={showSubmissionForm}
                                setShowSubmissionForm={setShowSubmissionForm}
                                submitForm={submitForm}
                                setSubmitForm={setSubmitForm}
                                uploading={uploading}
                                onSubmitAnswer={handleSubmitAnswer}
                                onFileChange={handleFileChange}
                                onRemoveFile={removeFile}
                                onRemoveExistingFile={removeExistingFile}
                                isDark={isDark}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Task Edit Modal */}
            {showEdit && isManager && (
                <TaskEditModal
                    task={task}
                    form={form}
                    setForm={setForm}
                    saving={saving}
                    isDark={isDark}
                    onClose={() => setShowEdit(false)}
                    onSubmit={submitEdit}
                />
            )}
        </div>
    );
}

/* ===================================== */
/*             COMPONENTS                */

/* ===================================== */

function TaskStatusBadges({task, isDark}: { task: Task; isDark: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <span className={cx("px-2 py-1 rounded-full text-xs font-medium",
                task.allow_resubmitting_task
                    ? (isDark ? "bg-emerald-900/30 text-emerald-300" : "bg-emerald-100 text-emerald-700")
                    : (isDark ? "bg-amber-900/30 text-amber-300" : "bg-amber-100 text-amber-700")
            )}>
                {task.allow_resubmitting_task ? "Можно переотправлять" : "Одна попытка"}
            </span>
            {task.enable_context_menu_for_students && (
                <span className={cx("px-2 py-1 rounded-full text-xs font-medium",
                    isDark ? "bg-slate-700 text-slate-300" : "bg-neutral-200 text-neutral-700"
                )}>
                    Контекстное меню доступно
                </span>
            )}
        </div>
    );
}

function TaskDescriptionCard({task, isDark}: { task: Task; isDark: boolean }) {
    return (
        <div className={cx("rounded-2xl border p-6 shadow-sm",
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200")}>
            <div className="flex items-center gap-3 mb-4">
                <div className={cx("p-2 rounded-lg", isDark ? "bg-purple-900/30" : "bg-purple-50")}>
                    <FileText
                        className={cx("h-5 w-5", isDark ? "text-purple-400" : "text-purple-600")}/>
                </div>
                <h2 className={cx("text-xl font-semibold", isDark ? "text-white" : "text-neutral-900")}>
                    Описание задания
                </h2>
            </div>
            <div
                className={cx("prose prose-sm max-w-none leading-relaxed",
                    isDark ? "prose-invert text-slate-300" : "text-neutral-700",
                    "[&_img]:max-w-full [&_img]:rounded-lg [&_img]:shadow-sm",
                    "[&_table]:border [&_td]:border [&_th]:border [&_blockquote]:border-l-4 [&_blockquote]:pl-4")}
                dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(task.description || "<p>Описание отсутствует</p>")}}
            />
        </div>
    );
}

function TaskMediaCard({task, isDark}: { task: Task; isDark: boolean }) {
    return (
        <div className={cx("rounded-2xl border p-6 shadow-sm",
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200")}>
            <div className="flex items-center gap-3 mb-4">
                <div className={cx("p-2 rounded-lg", isDark ? "bg-green-900/30" : "bg-green-50")}>
                    <ImageIcon
                        className={cx("h-5 w-5", isDark ? "text-green-400" : "text-green-600")}/>
                </div>
                <h2 className={cx("text-xl font-semibold", isDark ? "text-white" : "text-neutral-900")}>
                    Материалы
                </h2>
            </div>

            <div className="space-y-4">
                {task.video && (
                    <div className={cx("rounded-xl border overflow-hidden",
                        isDark ? "border-slate-600" : "border-neutral-200")}>
                        <div
                            className={cx("px-4 py-3 flex items-center gap-2 text-sm font-medium border-b",
                                isDark ? "bg-slate-700 border-slate-600 text-slate-300" : "bg-neutral-50 border-neutral-200 text-neutral-700")}>
                            <PlayCircle className="h-4 w-4"/>
                            Видеоматериал
                        </div>
                        <video src={task.video} controls className="w-full h-80 bg-black"/>
                    </div>
                )}

                {task.image && (
                    <div className={cx("rounded-xl border overflow-hidden",
                        isDark ? "border-slate-600" : "border-neutral-200")}>
                        <div
                            className={cx("px-4 py-3 flex items-center gap-2 text-sm font-medium border-b",
                                isDark ? "bg-slate-700 border-slate-600 text-slate-300" : "bg-neutral-50 border-neutral-200 text-neutral-700")}>
                            <ImageIcon className="h-4 w-4"/>
                            Изображение
                        </div>
                        <div className="p-4">
                            <img src={task.image} alt="Task visual"
                                 className="max-h-96 w-full object-contain rounded-lg shadow-sm"/>
                        </div>
                    </div>
                )}

                {task.file && (
                    <a
                        href={task.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cx("inline-flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors",
                            isDark
                                ? "border-slate-600 hover:bg-slate-700 text-slate-300"
                                : "border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                        )}
                    >
                        <div
                            className={cx("p-2 rounded", isDark ? "bg-slate-600" : "bg-neutral-200")}>
                            <Download className="h-4 w-4"/>
                        </div>
                        <span className="font-medium">Скачать прикрепленный файл</span>
                    </a>
                )}
            </div>
        </div>
    );
}

function StudentAnswerSection({
                                  task,
                                  answer,
                                  canEditAnswer,
                                  showSubmissionForm,
                                  setShowSubmissionForm,
                                  submitForm,
                                  setSubmitForm,
                                  uploading,
                                  onSubmitAnswer,
                                  onFileChange,
                                  onRemoveFile,
                                  onRemoveExistingFile,
                                  isDark
                              }: {
    task: Task;
    answer: Answer | null;
    canEditAnswer: boolean;
    showSubmissionForm: boolean;
    setShowSubmissionForm: (show: boolean) => void;
    submitForm: { description: string; files: File[] };
    setSubmitForm: (form: { description: string; files: File[] }) => void;
    uploading: boolean;
    onSubmitAnswer: () => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (index: number) => void;
    onRemoveExistingFile: (fileId: number) => void;
    isDark: boolean;
}) {
    return (
        <div className={cx("rounded-2xl border p-6 shadow-sm",
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200")}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div
                        className={cx("p-2 rounded-lg", isDark ? "bg-orange-900/30" : "bg-orange-50")}>
                        <MessageSquare
                            className={cx("h-5 w-5", isDark ? "text-orange-400" : "text-orange-600")}/>
                    </div>
                    <h2 className={cx("text-xl font-semibold", isDark ? "text-white" : "text-neutral-900")}>
                        Ваш ответ
                    </h2>
                </div>

                {answer && canEditAnswer && !showSubmissionForm && (
                    <button
                        onClick={() => setShowSubmissionForm(true)}
                        className={cx("inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            isDark ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white")}
                    >
                        <Pencil className="h-4 w-4"/>
                        Изменить ответ
                    </button>
                )}
            </div>

            {/* Existing Answer Display */}
            {answer && !showSubmissionForm ? (
                <div className="space-y-6">
                    <AnswerDisplay answer={answer} onRemoveFile={onRemoveExistingFile}
                                   isDark={isDark}/>
                    <GradeDisplay grade={answer.grade} isDark={isDark}/>
                </div>
            ) : !answer && !showSubmissionForm ? (
                <div className="text-center py-12">
                    <div
                        className={cx("p-4 rounded-full inline-flex mb-4", isDark ? "bg-slate-700" : "bg-neutral-100")}>
                        <Upload
                            className={cx("h-8 w-8", isDark ? "text-slate-400" : "text-neutral-500")}/>
                    </div>
                    <h3 className={cx("text-lg font-semibold mb-2", isDark ? "text-white" : "text-neutral-900")}>
                        Ответ не отправлен
                    </h3>
                    <p className={cx("text-sm mb-6", isDark ? "text-slate-400" : "text-neutral-600")}>
                        Вы еще не отправили решение для этого задания
                    </p>
                    <button
                        onClick={() => setShowSubmissionForm(true)}
                        className={cx("inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors",
                            isDark ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white")}
                    >
                        <Upload className="h-4 w-4"/>
                        Отправить ответ
                    </button>
                </div>
            ) : null}

            {/* Submission Form */}
            {(showSubmissionForm || (!answer && showSubmissionForm)) && (
                <SubmissionForm
                    submitForm={submitForm}
                    setSubmitForm={setSubmitForm}
                    uploading={uploading}
                    onSubmit={onSubmitAnswer}
                    onFileChange={onFileChange}
                    onRemoveFile={onRemoveFile}
                    onCancel={() => setShowSubmissionForm(false)}
                    isEdit={!!answer}
                    isDark={isDark}
                />
            )}
        </div>
    );
}

function AnswerDisplay({answer, onRemoveFile, isDark}: {
    answer: Answer;
    onRemoveFile: (fileId: number) => void;
    isDark: boolean;
}) {
    const getStatusConfig = (status: Answer["status"]) => {
        switch (status) {
            case "approved":
                return {
                    icon: <CheckCircle2 className="h-5 w-5"/>,
                    label: "Принято",
                    classes: isDark ? "bg-emerald-900/30 text-emerald-300 border border-emerald-700/50" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                };
            case "have_flaws":
                return {
                    icon: <AlertCircle className="h-5 w-5"/>,
                    label: "Требуются исправления",
                    classes: isDark ? "bg-amber-900/30 text-amber-300 border border-amber-700/50" : "bg-amber-100 text-amber-700 border border-amber-200"
                };
            case "rejected":
                return {
                    icon: <X className="h-5 w-5"/>,
                    label: "Отклонено",
                    classes: isDark ? "bg-rose-900/30 text-rose-300 border border-rose-700/50" : "bg-rose-100 text-rose-700 border border-rose-200"
                };
            case "in_review":
            default:
                return {
                    icon: <Clock className="h-5 w-5"/>,
                    label: "На проверке",
                    classes: isDark ? "bg-slate-700 text-slate-300 border border-slate-600" : "bg-neutral-200 text-neutral-800 border border-neutral-300"
                };
        }
    };

    const statusConfig = getStatusConfig(answer.status);

    return (
        <div className={cx("rounded-xl border p-5",
            isDark ? "bg-slate-900/50 border-slate-600" : "bg-neutral-50 border-neutral-200")}>
            <div className="flex items-center justify-between mb-4">
                <h3 className={cx("font-semibold", isDark ? "text-white" : "text-neutral-900")}>
                    Отправленное решение
                </h3>
                <div
                    className={cx("inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium", statusConfig.classes)}>
                    {statusConfig.icon}
                    {statusConfig.label}
                </div>
            </div>

            <div className={cx("prose prose-sm max-w-none mb-4",
                isDark ? "prose-invert text-slate-300" : "text-neutral-700")}>
                <p className="whitespace-pre-wrap leading-relaxed">
                    {answer.description || "Текстовое описание отсутствует"}
                </p>
            </div>

            <div className={cx("mb-4 rounded-lg border px-3 py-2 text-sm", isDark ? "border-slate-600 bg-slate-800 text-slate-300" : "border-neutral-200 bg-white text-neutral-700")}>
                Academic integrity status: <span className="font-medium">{plagiarismStatusLabel[answer.plagiarism_status || "pending_analysis"] || "Uploaded"}</span>
            </div>

            {answer.files && answer.files.length > 0 && (
                <div>
                    <h4 className={cx("font-medium mb-3 text-sm", isDark ? "text-slate-300" : "text-neutral-700")}>
                        Прикрепленные файлы:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {answer.files.map((file) => (
                            <div key={file.id}
                                 className={cx("flex items-center gap-3 p-3 rounded-lg border group",
                                     isDark ? "border-slate-600 bg-slate-700/50" : "border-neutral-200 bg-white")}>
                                <div
                                    className={cx("p-2 rounded", isDark ? "bg-slate-600" : "bg-neutral-200")}>
                                    <FileText className="h-4 w-4"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <a href={file.file_url}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className={cx("font-medium text-sm hover:underline truncate block",
                                           isDark ? "text-blue-400" : "text-blue-600")}>
                                        {file.file_name}
                                    </a>
                                    <p className={cx("text-xs", isDark ? "text-slate-400" : "text-neutral-500")}>
                                        {Math.round(file.file_size / 1024)} KB
                                    </p>
                                </div>
                                <button
                                    onClick={() => onRemoveFile(file.id)}
                                    className={cx("opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity",
                                        isDark ? "hover:bg-rose-900/30 text-rose-400" : "hover:bg-rose-100 text-rose-600")}
                                    title="Удалить файл"
                                >
                                    <X className="h-4 w-4"/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function GradeDisplay({grade, isDark}: { grade: Answer["grade"]; isDark: boolean }) {
    if (!grade) {
        return (
            <div className={cx("rounded-xl border p-5 text-center",
                isDark ? "bg-slate-900/50 border-slate-600" : "bg-neutral-50 border-neutral-200")}>
                <Clock
                    className={cx("h-8 w-8 mx-auto mb-3 opacity-50", isDark ? "text-slate-400" : "text-neutral-500")}/>
                <h3 className={cx("font-semibold mb-2", isDark ? "text-white" : "text-neutral-900")}>
                    Ожидает оценки
                </h3>
                <p className={cx("text-sm", isDark ? "text-slate-400" : "text-neutral-600")}>
                    Преподаватель еще не проверил ваш ответ
                </p>
            </div>
        );
    }

    const getGradeColor = (letter: string) => {
        switch (letter) {
            case "A":
                return isDark ? "bg-emerald-900/30 text-emerald-300 border-emerald-700/50" : "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "B":
                return isDark ? "bg-blue-900/30 text-blue-300 border-blue-700/50" : "bg-blue-100 text-blue-700 border-blue-200";
            case "C":
                return isDark ? "bg-amber-900/30 text-amber-300 border-amber-700/50" : "bg-amber-100 text-amber-700 border-amber-200";
            case "D":
                return isDark ? "bg-orange-900/30 text-orange-300 border-orange-700/50" : "bg-orange-100 text-orange-700 border-orange-200";
            case "F":
                return isDark ? "bg-rose-900/30 text-rose-300 border-rose-700/50" : "bg-rose-100 text-rose-700 border-rose-200";
            default:
                return isDark ? "bg-slate-700 text-slate-300 border-slate-600" : "bg-neutral-100 text-neutral-700 border-neutral-200";
        }
    };

    return (
        <div className={cx("rounded-xl border p-6",
            isDark ? "bg-slate-900/50 border-slate-600" : "bg-neutral-50 border-neutral-200")}>
            <div className="flex items-center gap-3 mb-4">
                <div className={cx("p-2 rounded-lg", isDark ? "bg-green-900/30" : "bg-green-50")}>
                    <Award className={cx("h-5 w-5", isDark ? "text-green-400" : "text-green-600")}/>
                </div>
                <h3 className={cx("text-lg font-semibold", isDark ? "text-white" : "text-neutral-900")}>
                    Оценка
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                    <div
                        className={cx("text-3xl font-bold mb-1", isDark ? "text-white" : "text-neutral-900")}>
                        {grade.score}
                        <span className="text-lg font-normal opacity-75">/{grade.max_score}</span>
                    </div>
                    <div
                        className={cx("text-sm font-medium", isDark ? "text-slate-400" : "text-neutral-600")}>
                        Баллы
                    </div>
                </div>
                <div className="text-center">
                    <div
                        className={cx("text-3xl font-bold mb-1", isDark ? "text-white" : "text-neutral-900")}>
                        {Math.round(grade.percentage)}%
                    </div>
                    <div
                        className={cx("text-sm font-medium", isDark ? "text-slate-400" : "text-neutral-600")}>
                        Процент
                    </div>
                </div>
                <div className="text-center">
                    <div
                        className={cx("inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold border-2 mb-1",
                            getGradeColor(grade.letter_grade))}>
                        {grade.letter_grade}
                    </div>
                    <div
                        className={cx("text-sm font-medium", isDark ? "text-slate-400" : "text-neutral-600")}>
                        Оценка
                    </div>
                </div>
            </div>

            {grade.feedback_text && (
                <div
                    className={cx("border-t pt-4", isDark ? "border-slate-700" : "border-neutral-200")}>
                    <h4 className={cx("font-medium mb-2 flex items-center gap-2", isDark ? "text-slate-300" : "text-neutral-700")}>
                        <MessageSquare className="h-4 w-4"/>
                        Комментарий преподавателя
                    </h4>
                    <p className={cx("text-sm leading-relaxed", isDark ? "text-slate-300" : "text-neutral-700")}>
                        {grade.feedback_text}
                    </p>
                </div>
            )}

            <div className={cx("flex items-center gap-2 mt-4 pt-4 border-t text-sm",
                isDark ? "border-slate-700 text-slate-400" : "border-neutral-200 text-neutral-600")}>
                <User className="h-4 w-4"/>
                <span>Проверил: {grade.graded_by.first_name} {grade.graded_by.last_name}</span>
            </div>
        </div>
    );
}

function SubmissionForm({
                            submitForm, setSubmitForm, uploading, onSubmit, onFileChange,
                            onRemoveFile, onCancel, isEdit, isDark
                        }: {
    submitForm: { description: string; files: File[] };
    setSubmitForm: (form: { description: string; files: File[] }) => void;
    uploading: boolean;
    onSubmit: () => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (index: number) => void;
    onCancel: () => void;
    isEdit: boolean;
    isDark: boolean;
}) {
    return (
        <div className={cx("rounded-xl border p-6",
            isDark ? "bg-slate-900/50 border-slate-600" : "bg-neutral-50 border-neutral-200")}>
            <h3 className={cx("text-lg font-semibold mb-4", isDark ? "text-white" : "text-neutral-900")}>
                {isEdit ? "Изменить ответ" : "Отправить ответ"}
            </h3>

            <div className="space-y-4">
                <div>
                    <label
                        className={cx("block text-sm font-medium mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>
                        Описание решения *
                    </label>
                    <textarea
                        value={submitForm.description}
                        onChange={(e) => setSubmitForm({
                            ...submitForm,
                            description: e.target.value
                        })}
                        placeholder="Опишите ваше решение подробно..."
                        rows={6}
                        className={cx("w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 resize-none",
                            isDark
                                ? "bg-slate-700 border-slate-600 text-slate-200 focus:ring-blue-500/30 placeholder-slate-400"
                                : "bg-white border-neutral-300 text-neutral-900 focus:ring-blue-500/30 placeholder-neutral-400"
                        )}
                    />
                </div>

                <div>
                    <label
                        className={cx("block text-sm font-medium mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>
                        Прикрепить файлы
                    </label>
                    <div
                        className={cx("border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                            isDark
                                ? "border-slate-600 hover:border-slate-500 hover:bg-slate-800/50"
                                : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
                        )}>
                        <input
                            type="file"
                            multiple
                            onChange={onFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <Upload
                                className={cx("h-8 w-8 mx-auto mb-2", isDark ? "text-slate-400" : "text-neutral-500")}/>
                            <p className={cx("text-sm font-medium", isDark ? "text-slate-300" : "text-neutral-700")}>
                                Нажмите для выбора файлов
                            </p>
                            <p className={cx("text-xs mt-1", isDark ? "text-slate-400" : "text-neutral-500")}>
                                Поддерживаются все форматы файлов
                            </p>
                        </label>
                    </div>
                </div>

                {submitForm.files.length > 0 && (
                    <div>
                        <h4 className={cx("text-sm font-medium mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>
                            Выбранные файлы ({submitForm.files.length}):
                        </h4>
                        <div className="space-y-2">
                            {submitForm.files.map((file, index) => (
                                <div key={index}
                                     className={cx("flex items-center gap-3 p-3 rounded-lg border",
                                         isDark ? "border-slate-600 bg-slate-700/50" : "border-neutral-200 bg-white")}>
                                    <FileText className="h-4 w-4 flex-shrink-0"/>
                                    <div className="flex-1 min-w-0">
                                        <p className={cx("text-sm font-medium truncate", isDark ? "text-slate-200" : "text-neutral-900")}>
                                            {file.name}
                                        </p>
                                        <p className={cx("text-xs", isDark ? "text-slate-400" : "text-neutral-500")}>
                                            {Math.round(file.size / 1024)} KB
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onRemoveFile(index)}
                                        className={cx("p-1 rounded transition-colors",
                                            isDark ? "hover:bg-rose-900/30 text-rose-400" : "hover:bg-rose-100 text-rose-600")}
                                    >
                                        <X className="h-4 w-4"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 pt-4">
                    <button
                        onClick={onSubmit}
                        disabled={uploading || !submitForm.description.trim()}
                        className={cx("inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                            isDark
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-blue-500 hover:bg-blue-600 text-white"
                        )}
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin"/>
                        ) : (
                            <Upload className="h-4 w-4"/>
                        )}
                        {uploading ? "Отправляется..." : (isEdit ? "Сохранить изменения" : "Отправить ответ")}
                    </button>

                    {isEdit && (
                        <button
                            onClick={onCancel}
                            className={cx("px-4 py-3 rounded-lg font-medium transition-colors",
                                isDark
                                    ? "border border-slate-600 text-slate-300 hover:bg-slate-700"
                                    : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                            )}
                        >
                            Отмена
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function TaskEditModal({task, form, setForm, saving, isDark, onClose, onSubmit}: {
    task: Task;
    form: any;
    setForm: (form: any) => void;
    saving: boolean;
    isDark: boolean;
    onClose: () => void;
    onSubmit: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>

            <div
                className={cx("relative w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col",
                    isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200")}>

                {/* Header */}
                <div className={cx("px-6 py-4 border-b flex items-center justify-between",
                    isDark ? "border-slate-700" : "border-neutral-200")}>
                    <h2 className={cx("text-xl font-semibold", isDark ? "text-white" : "text-neutral-900")}>
                        Редактировать задание
                    </h2>
                    <button
                        onClick={onClose}
                        className={cx("p-2 rounded-lg transition-colors",
                            isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-neutral-100 text-neutral-500")}
                    >
                        <X className="h-5 w-5"/>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label
                                    className={cx("block text-sm font-medium mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>
                                    Номер задания
                                </label>
                                <input
                                    type="number"
                                    value={form.number}
                                    onChange={(e) => setForm({
                                        ...form,
                                        number: Number(e.target.value)
                                    })}
                                    className={cx("w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2",
                                        isDark
                                            ? "bg-slate-700 border-slate-600 text-slate-200 focus:ring-blue-500/30"
                                            : "bg-white border-neutral-300 text-neutral-900 focus:ring-blue-500/30"
                                    )}
                                />
                            </div>
                            <div>
                                <label
                                    className={cx("block text-sm font-medium mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>
                                    Название
                                </label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({...form, name: e.target.value})}
                                    className={cx("w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2",
                                        isDark
                                            ? "bg-slate-700 border-slate-600 text-slate-200 focus:ring-blue-500/30"
                                            : "bg-white border-neutral-300 text-neutral-900 focus:ring-blue-500/30"
                                    )}
                                    placeholder="Введите название задания"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                className={cx("block text-sm font-medium mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>
                                Описание
                            </label>
                            <div className={cx("rounded-lg border overflow-hidden",
                                isDark ? "border-slate-600" : "border-neutral-300")}>
                                <CKEditor
                                    editor={ClassicEditor}
                                    data={form.description}
                                    onChange={(_, editor: any) => setForm({
                                        ...form,
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

                        {/* Media Files */}
                        <div>
                            <h3 className={cx("text-lg font-semibold mb-4", isDark ? "text-white" : "text-neutral-900")}>
                                Материалы
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label
                                        className={cx("block text-sm font-medium mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>
                                        Видео
                                    </label>
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={(e) => setForm({
                                            ...form,
                                            video: e.target.files?.[0] || null
                                        })}
                                        className={cx("w-full text-sm", isDark ? "text-slate-200" : "text-neutral-900")}
                                    />
                                    {task.video && (
                                        <p className={cx("text-xs mt-1", isDark ? "text-slate-400" : "text-neutral-500")}>
                                            Текущий файл: есть
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label
                                        className={cx("block text-sm font-medium mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>
                                        Изображение
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setForm({
                                            ...form,
                                            image: e.target.files?.[0] || null
                                        })}
                                        className={cx("w-full text-sm", isDark ? "text-slate-200" : "text-neutral-900")}
                                    />
                                    {task.image && (
                                        <p className={cx("text-xs mt-1", isDark ? "text-slate-400" : "text-neutral-500")}>
                                            Текущий файл: есть
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label
                                        className={cx("block text-sm font-medium mb-2", isDark ? "text-slate-300" : "text-neutral-700")}>
                                        Файл
                                    </label>
                                    <input
                                        type="file"
                                        onChange={(e) => setForm({
                                            ...form,
                                            file: e.target.files?.[0] || null
                                        })}
                                        className={cx("w-full text-sm", isDark ? "text-slate-200" : "text-neutral-900")}
                                    />
                                    {task.file && (
                                        <p className={cx("text-xs mt-1", isDark ? "text-slate-400" : "text-neutral-500")}>
                                            Текущий файл: есть
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Settings */}
                        <div>
                            <h3 className={cx("text-lg font-semibold mb-4", isDark ? "text-white" : "text-neutral-900")}>
                                Настройки
                            </h3>
                            <div className="space-y-3">
                                <ToggleSwitch
                                    checked={form.enable_context_menu_for_students}
                                    onChange={(v) => setForm({
                                        ...form,
                                        enable_context_menu_for_students: v
                                    })}
                                    label="Разрешить контекстное меню (правый клик) для студентов"
                                    id="context-menu"
                                />
                                <ToggleSwitch
                                    checked={form.allow_resubmitting_task}
                                    onChange={(v) => setForm({...form, allow_resubmitting_task: v})}
                                    label="Разрешить студентам переотправлять ответы"
                                    id="resubmit"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={cx("px-6 py-4 border-t flex items-center justify-end gap-3",
                    isDark ? "border-slate-700" : "border-neutral-200")}>
                    <button
                        onClick={onClose}
                        className={cx("px-4 py-2 rounded-lg font-medium transition-colors",
                            isDark
                                ? "border border-slate-600 text-slate-300 hover:bg-slate-700"
                                : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                        )}
                    >
                        Отмена
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={saving}
                        className={cx("inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50",
                            isDark
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-blue-500 hover:bg-blue-600 text-white"
                        )}
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin"/>
                        ) : (
                            <Star className="h-4 w-4"/>
                        )}
                        {saving ? "Сохраняется..." : "Сохранить изменения"}
                    </button>
                </div>
            </div>
        </div>
    );
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
    const {actualTheme} = useTheme();
    const isDark = actualTheme === 'dark';

    return (
        <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
            isDark ? "border-slate-700 bg-slate-800" : "border-neutral-200 bg-white"
        }`}>
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
                checked ? "left-[22px]" : "left-[4px]",
                checked ? "border-blue-200" : "border-neutral-200"
            )}
        />
            </button>
        </div>
    );
}
