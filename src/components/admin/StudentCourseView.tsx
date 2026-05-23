import {useEffect, useState, useMemo} from "react";
import {createPortal} from "react-dom";
import {
    Loader2,
    X,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Circle,
    FileText,
    User,
    Calendar,
    Award,
    RotateCcw,
    Download,
    Eye,
} from "lucide-react";

import {AnimatePresence, motion} from "framer-motion";
import {Scrollbar} from "react-scrollbars-custom";

import api from "@/api/api";
import {useTheme} from "@/components/common/ThemeContext";

/* -------------------------------------------
   Elegant Confirm Modal (glassmorphism)
--------------------------------------------*/
function ConfirmDialog({open, onClose, onConfirm, loading, isDark}) {
    if (!open) return null;

    const surface =
        isDark
            ? "bg-slate-900/70 border-slate-800 text-slate-100"
            : "bg-white/70 border-neutral-200 text-neutral-900";

    return createPortal(
        <AnimatePresence>
            <motion.div
                key="confirm-root"
                className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
                aria-modal="true"
                role="dialog"
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
            >
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                />
                {/* Card */}
                <motion.div
                    className={`relative z-10 w-full max-w-md rounded-2xl border shadow-2xl ${surface}`}
                    initial={{y: 24, scale: 0.98, opacity: 0}}
                    animate={{y: 0, scale: 1, opacity: 1}}
                    exit={{y: 24, scale: 0.98, opacity: 0}}
                    transition={{type: "spring", stiffness: 320, damping: 28}}
                >
                    <div className="px-6 pt-5 pb-2 flex items-center justify-between">
                        <div className="text-lg font-semibold">Подтвердите действие</div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition-colors ${
                                isDark ? "hover:bg-slate-800" : "hover:bg-neutral-100"
                            }`}
                            aria-label="Закрыть"
                        >
                            <X className="w-5 h-5"/>
                        </button>
                    </div>

                    <div className="px-6 pb-6">
                        <div className="flex items-start gap-3">
                            <div
                                className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shadow-inner ${
                                    isDark ? "bg-slate-800" : "bg-neutral-100"
                                }`}
                            >
                                <RotateCcw className="w-5 h-5 text-blue-500"/>
                            </div>
                            <div>
                                <p className="font-medium mb-1">Переназначить задание этому
                                    студенту?</p>
                                <p
                                    className={`text-sm ${
                                        isDark ? "text-slate-400" : "text-neutral-600"
                                    }`}
                                >
                                    Текущее состояние будет обновлено, а данные по заданиям —
                                    перезагружены.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                                    isDark
                                        ? "border-slate-700 hover:bg-slate-800"
                                        : "border-neutral-300 hover:bg-neutral-100"
                                }`}
                            >
                                Отмена
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all ${
                                    isDark
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                } disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin"/>
                                ) : (
                                    <RotateCcw className="w-4 h-4"/>
                                )}
                                Подтвердить
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}

function MediaPreviewDialog({open, onClose, media, isDark}) {
    if (!open || !media) return null;

    const surface =
        isDark
            ? "bg-slate-900/70 border-slate-800 text-slate-100"
            : "bg-white/70 border-neutral-200 text-neutral-900";

    return createPortal(
        <AnimatePresence>
            <motion.div
                key="media-root"
                className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
                aria-modal="true"
                role="dialog"
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
            >
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                />
                {/* Card */}
                <motion.div
                    className={`relative z-10 w-full max-w-4xl h-[80vh] rounded-2xl border shadow-2xl ${surface}`}
                    initial={{y: 24, scale: 0.98, opacity: 0}}
                    animate={{y: 0, scale: 1, opacity: 1}}
                    exit={{y: 24, scale: 0.98, opacity: 0}}
                    transition={{type: "spring", stiffness: 320, damping: 28}}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white"
                        aria-label="Закрыть"
                    >
                        <X className="w-6 h-6"/>
                    </button>
                    <div className="flex items-center justify-center h-full p-4">
                        {media.is_image ? (
                            <img src={media.file_url} alt={media.file_name}
                                 className="max-w-full max-h-full object-contain"/>
                        ) : media.is_video ? (
                            <video controls className="max-w-full max-h-full">
                                <source src={media.file_url} type={media.content_type}/>
                            </video>
                        ) : null}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}

export default function StudentViewModal({courseId, userId, onClose}) {
    const {actualTheme} = useTheme();
    const isDark = actualTheme === "dark";

    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [reassigning, setReassigning] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [previewMedia, setPreviewMedia] = useState(null);

    // Fancy, fresh yet professional theme tokens
    const theme = useMemo(
        () => ({
            border: isDark ? "border-slate-800" : "border-neutral-200",
            surface: isDark ? "bg-slate-950 text-slate-100" : "bg-white text-neutral-900",
            surfaceSubtle: isDark
                ? "bg-slate-900/80"
                : "bg-neutral-50/90",
            chip: isDark ? "bg-slate-900 border-slate-800" : "bg-neutral-50 border-neutral-300",
            accent: "from-blue-600 via-indigo-600 to-fuchsia-600",
            accentSoft: isDark ? "bg-blue-500/10" : "bg-blue-600/10",
            mutedText: isDark ? "text-slate-400" : "text-neutral-600",
            hover: isDark ? "hover:bg-slate-900/60" : "hover:bg-neutral-100",
        }),
        [isDark]
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get(`course/courses/${courseId}/view-student/`, {
                    params: {user_id: userId},
                });
                const sortedTasks = response.data.sort((a, b) => a.number - b.number);
                setTasks(sortedTasks);
                if (sortedTasks.length > 0) setSelectedTask(sortedTasks[0]);
            } catch (e) {
                console.error("Error fetching tasks:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId, userId]);

    // Reassign (API unchanged) — action goes through confirm modal
    const handleReassignTask = async () => {
        if (!selectedTask) return;
        setReassigning(true);
        try {
            await api.post("tasks/reassign-to-user/", {
                task_id: selectedTask.id,
                user_id: userId,
            });

            // Refresh the task data after reassignment (UNCHANGED)
            const response = await api.get(`course/courses/${courseId}/view-student/`, {
                params: {user_id: userId},
            });
            const sortedTasks = response.data.sort((a, b) => a.number - b.number);
            setTasks(sortedTasks);

            // Update selected task
            const updatedTask = sortedTasks.find((t) => t.id === selectedTask.id);
            setSelectedTask(updatedTask);
            setConfirmOpen(false);
        } catch (e) {
            console.error("Error reassigning task:", e);
        } finally {
            setReassigning(false);
        }
    };

    const handleDownload = async (file) => {
        try {
            const response = await fetch(file.file_url);
            if (!response.ok) throw new Error('Failed to download');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.file_name;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Download error', e);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "approved":
                return <CheckCircle2 className="w-4 h-4 text-emerald-500"/>;
            case "rejected":
                return <XCircle className="w-4 h-4 text-red-500"/>;
            case "in_review":
                return <Clock className="w-4 h-4 text-blue-500"/>;
            case "have_flaws":
                return <AlertTriangle className="w-4 h-4 text-amber-500"/>;
            default:
                return <Circle className="w-4 h-4 text-gray-500"/>;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "approved":
                return "Принято";
            case "rejected":
                return "Отклонено";
            case "in_review":
                return "На проверке";
            case "have_flaws":
                return "Есть замечания";
            default:
                return "Не отправлено";
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "approved":
                return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "rejected":
                return "bg-red-500/10 text-red-400 border-red-500/20";
            case "in_review":
                return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case "have_flaws":
                return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            default:
                return "bg-gray-500/10 text-gray-400 border-gray-500/20";
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    // Close on Escape
    useEffect(() => {
        const onEsc = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onEsc);
        return () => document.removeEventListener("keydown", onEsc);
    }, [onClose]);

    // Lock body scroll while modal is open
    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previous || "";
        };
    }, []);

    return createPortal(
        <>
            {/* Main Modal */}
            <div
                className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-label="Просмотр студента"
            >
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                />
                {/* Modal Window */}
                <motion.div
                    className={`relative z-10 w-[96vw] max-w-[1400px] h-[90vh] rounded-3xl border overflow-hidden shadow-2xl ${theme.border}`}
                    onClick={(e) => e.stopPropagation()}
                    initial={{y: 28, scale: 0.98, opacity: 0}}
                    animate={{y: 0, scale: 1, opacity: 1}}
                    transition={{type: "spring", stiffness: 340, damping: 30}}
                    style={{outline: "none"}}
                >
                    {/* Header with gradient accent & subtle sheen */}
                    <div
                        className={`relative ${theme.surface} border-b ${theme.border} px-6 py-4`}
                    >
                        <div
                            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent"/>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-xl shadow-inner ${theme.accentSoft}`}
                >
                  <User className="w-4 h-4 text-blue-500"/>
                </span>
                                <h2 className="text-xl font-semibold tracking-tight">
                                    Просмотр студента
                                </h2>
                            </div>

                            <div className="flex items-center gap-3">
                                {selectedTask && (
                                    <motion.button
                                        whileTap={{scale: 0.98}}
                                        whileHover={{y: -1}}
                                        onClick={() => setConfirmOpen(true)}
                                        disabled={reassigning}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer ${
                                            isDark
                                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                : "bg-blue-600 hover:bg-blue-700 text-white"
                                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                                    >
                                        {reassigning ? (
                                            <Loader2 className="w-4 h-4 animate-spin"/>
                                        ) : (
                                            <RotateCcw className="w-4 h-4"/>
                                        )}
                                        Переназначить
                                    </motion.button>
                                )}
                                <button
                                    onClick={onClose}
                                    aria-label="Close"
                                    className={`rounded-xl p-2 transition-colors ${theme.hover}`}
                                >
                                    <X className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className={`flex h-[calc(90vh-64px)] ${theme.surface}`}>
                        {loading ? (
                            // Polished skeleton
                            <div className="flex-1 grid grid-cols-3 gap-0">
                                <div className={`col-span-1 h-full border-r ${theme.border} p-4`}>
                                    <div
                                        className={`h-6 w-32 rounded-lg mb-3 ${
                                            isDark ? "bg-slate-800" : "bg-neutral-200"
                                        } animate-pulse`}
                                    />
                                    <div
                                        className={`h-4 w-56 rounded-lg mb-6 ${
                                            isDark ? "bg-slate-900" : "bg-neutral-100"
                                        } animate-pulse`}
                                    />
                                    {[...Array(6)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-16 rounded-xl mb-3 border ${theme.border} ${
                                                isDark ? "bg-slate-900" : "bg-neutral-50"
                                            } animate-pulse`}
                                        />
                                    ))}
                                </div>
                                <div className="col-span-2 h-full p-6">
                                    <div
                                        className={`h-8 w-80 rounded-lg mb-4 ${
                                            isDark ? "bg-slate-800" : "bg-neutral-200"
                                        } animate-pulse`}
                                    />
                                    <div
                                        className={`h-5 w-40 rounded-lg mb-6 ${
                                            isDark ? "bg-slate-900" : "bg-neutral-100"
                                        } animate-pulse`}
                                    />
                                    <div
                                        className={`h-48 rounded-2xl border ${theme.border} ${
                                            isDark ? "bg-slate-900" : "bg-neutral-50"
                                        } animate-pulse`}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Left: Tasks List with custom scrollbars */}
                                <div
                                    className={`w-[320px] h-full border-r ${theme.border} ${theme.surfaceSubtle} backdrop-blur-sm`}
                                >
                                    <div className={`p-4 border-b ${theme.border}`}>
                                        <h3 className="font-semibold text-base">Задания</h3>
                                        <p className={`text-sm ${theme.mutedText}`}>
                                            Выполнено:{" "}
                                            {tasks.filter((t) => t.answer?.status === "approved").length}/
                                            {tasks.length}
                                        </p>
                                    </div>

                                    <Scrollbar
                                        style={{height: "calc(100% - 72px)"}}
                                        trackYProps={{
                                            style: {
                                                width: 8,
                                                borderRadius: 999,
                                                background: isDark ? "rgba(30,41,59,0.6)" : "rgba(0,0,0,0.06)",
                                            },
                                        }}
                                        thumbYProps={{
                                            style: {
                                                borderRadius: 999,
                                                background: isDark ? "rgba(148,163,184,0.6)" : "rgba(0,0,0,0.25)",
                                            },
                                        }}
                                        momentum
                                        removeTracksWhenNotUsed
                                        noDefaultStyles={false}
                                    >
                                        <div className="pt-2">
                                            <AnimatePresence initial={false}>
                                                {tasks.map((task) => {
                                                    const active = selectedTask?.id === task.id;
                                                    return (
                                                        <motion.button
                                                            key={task.id}
                                                            type="button"
                                                            onClick={() => setSelectedTask(task)}
                                                            className={`w-full text-left p-4 border-b ${theme.border} transition-colors relative ${
                                                                active
                                                                    ? isDark
                                                                        ? "bg-slate-800/60"
                                                                        : "bg-blue-50"
                                                                    : "hover:bg-black/5 dark:hover:bg-white/5"
                                                            }`}
                                                            initial={{opacity: 0, y: 8}}
                                                            animate={{opacity: 1, y: 0}}
                                                            exit={{opacity: 0, y: 8}}
                                                        >
                                                            {/* Left selection bar */}
                                                            <motion.span
                                                                layoutId="task-active-bar"
                                                                className={`absolute left-0 top-0 bottom-0 w-1 ${
                                                                    active ? "bg-gradient-to-b from-blue-500 to-indigo-500" : "bg-transparent"
                                                                }`}
                                                                transition={{
                                                                    type: "spring",
                                                                    stiffness: 500,
                                                                    damping: 40
                                                                }}
                                                            />
                                                            <div className="flex items-start gap-3">
                                                                <div
                                                                    className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-inner ${
                                                                        isDark
                                                                            ? "bg-slate-900 text-slate-200"
                                                                            : "bg-neutral-100 text-neutral-700"
                                                                    }`}
                                                                >
                                                                    {task.number}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div
                                                                        className="flex items-center justify-between gap-2 mb-1">
                                                                        <h4 className="font-medium text-sm truncate">
                                                                            {task.name}
                                                                        </h4>
                                                                        {getStatusIcon(task.answer?.status)}
                                                                    </div>
                                                                    <div
                                                                        className={`text-[11px] px-2 py-1 rounded-full inline-flex items-center gap-1 border shadow-sm ${getStatusBadgeClass(
                                                                            task.answer?.status
                                                                        )}`}
                                                                    >
                                                                        {getStatusText(task.answer?.status)}
                                                                    </div>
                                                                    {task.answer?.grade && (
                                                                        <div
                                                                            className="mt-2 text-xs">
                                      <span
                                          className={`font-bold ${
                                              task.answer.grade.letter_grade === "A"
                                                  ? "text-emerald-500"
                                                  : task.answer.grade.letter_grade === "F"
                                                      ? "text-red-500"
                                                      : "text-blue-500"
                                          }`}
                                      >
                                        {task.answer.grade.letter_grade}
                                      </span>
                                                                            <span
                                                                                className={`ml-2 ${theme.mutedText}`}>
                                        {task.answer.grade.score || 0}/
                                                                                {task.answer.grade.max_score}
                                      </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.button>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    </Scrollbar>
                                </div>

                                {/* Right: Details with custom scrollbars */}
                                <div className="flex-1 h-full">
                                    {selectedTask ? (
                                        <Scrollbar
                                            style={{height: "100%"}}
                                            trackYProps={{
                                                style: {
                                                    width: 8,
                                                    borderRadius: 999,
                                                    background: isDark ? "rgba(30,41,59,0.6)" : "rgba(0,0,0,0.06)",
                                                },
                                            }}
                                            thumbYProps={{
                                                style: {
                                                    borderRadius: 999,
                                                    background: isDark ? "rgba(148,163,184,0.6)" : "rgba(0,0,0,0.25)",
                                                },
                                            }}
                                            momentum
                                            removeTracksWhenNotUsed
                                            noDefaultStyles={false}
                                        >
                                            <div className="p-6">
                                                {/* Task Header */}
                                                <div className="mb-6">
                                                    <div
                                                        className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <div
                                                                className="flex items-center gap-2 mb-1">
                                <span className="text-2xl font-bold">
                                  {selectedTask.number}. {selectedTask.name}
                                </span>
                                                            </div>
                                                            <div
                                                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border shadow-sm ${getStatusBadgeClass(
                                                                    selectedTask.answer?.status
                                                                )}`}
                                                            >
                                                                {getStatusIcon(selectedTask.answer?.status)}
                                                                {getStatusText(selectedTask.answer?.status)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Description */}
                                                    <motion.div
                                                        className={`p-4 rounded-2xl mb-6 border ${theme.border} ${
                                                            isDark ? "bg-slate-900/70" : "bg-neutral-50"
                                                        } shadow-sm`}
                                                        initial={{opacity: 0, y: 8}}
                                                        animate={{opacity: 1, y: 0}}
                                                    >
                                                        <h3 className="font-semibold mb-2 text-blue-500">
                                                            Условие задачи
                                                        </h3>
                                                        <div
                                                            className="prose prose-sm max-w-none"
                                                            dangerouslySetInnerHTML={{
                                                                __html: selectedTask.description,
                                                            }}
                                                        />
                                                    </motion.div>
                                                </div>

                                                {/* Answer Section */}
                                                {selectedTask.answer ? (
                                                    <div className="space-y-6">
                                                        {/* Answer Details */}
                                                        <motion.div
                                                            className={`p-4 rounded-2xl border ${theme.border} ${
                                                                isDark ? "bg-slate-900/70" : "bg-neutral-50"
                                                            } shadow-sm`}
                                                            initial={{opacity: 0, y: 8}}
                                                            animate={{opacity: 1, y: 0}}
                                                        >
                                                            <h3 className="font-semibold mb-3 text-purple-500 flex items-center gap-2">
                                                                <User className="w-4 h-4"/>
                                                                Ответ студента
                                                            </h3>

                                                            <div
                                                                className="grid grid-cols-2 gap-4 mb-4">
                                                                <div>
                                  <span className={`text-sm ${theme.mutedText}`}>
                                    Создано:
                                  </span>
                                                                    <p className="font-medium">
                                                                        {formatDate(selectedTask.answer.created_at)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                  <span className={`text-sm ${theme.mutedText}`}>
                                    Обновлено:
                                  </span>
                                                                    <p className="font-medium">
                                                                        {formatDate(selectedTask.answer.updated_at)}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="mb-4">
                                <span className={`text-sm ${theme.mutedText}`}>
                                  Описание решения:
                                </span>
                                                                <div
                                                                    className={`mt-2 p-3 rounded-xl font-mono text-sm whitespace-pre-wrap border ${theme.border} shadow-inner ${
                                                                        isDark ? "bg-slate-950" : "bg-white"
                                                                    }`}
                                                                >
                                                                    {selectedTask.answer.description}
                                                                </div>
                                                            </div>

                                                            {/* Files */}
                                                            {selectedTask.answer.files &&
                                                                selectedTask.answer.files.length > 0 && (
                                                                    <div>
                                    <span className={`text-sm ${theme.mutedText}`}>
                                      Прикрепленные файлы:
                                    </span>
                                                                        <div
                                                                            className="mt-2 space-y-2">
                                                                            {selectedTask.answer.files.map((file) => (
                                                                                <div
                                                                                    key={file.id}
                                                                                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${theme.border} shadow-sm ${
                                                                                        isDark ? "bg-slate-900/70" : "bg-white"
                                                                                    }`}
                                                                                >
                                                                                    <FileText
                                                                                        className="w-5 h-5 text-blue-500"/>
                                                                                    <div
                                                                                        className="flex-1 min-w-0">
                                                                                        <p className="font-medium text-sm truncate">
                                                                                            {file.file_name}
                                                                                        </p>
                                                                                        <p className={`text-xs ${theme.mutedText}`}>
                                                                                            {formatFileSize(file.file_size)}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div
                                                                                        className="flex items-center gap-2">
                                                                                        {file.is_image || file.is_video ? (
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => setPreviewMedia(file)}
                                                                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-all cursor-pointer shadow-sm ${
                                                                                                    isDark ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"
                                                                                                }`}
                                                                                            >
                                                                                                <Eye
                                                                                                    className="w-4 h-4"/>
                                                                                                Посмотреть
                                                                                            </button>
                                                                                        ) : null}

                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleDownload(file)}
                                                                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-all cursor-pointer shadow-sm ${
                                                                                                isDark ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                                                                                            }`}
                                                                                        >
                                                                                            <Download
                                                                                                className="w-4 h-4"/>
                                                                                            Скачать
                                                                                        </button>
                                                                                    </div>

                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                        </motion.div>

                                                        {/* Grade Section */}
                                                        {selectedTask.answer.grade && (
                                                            <motion.div
                                                                className={`p-4 rounded-2xl border ${theme.border} ${
                                                                    isDark ? "bg-slate-900/70" : "bg-neutral-50"
                                                                } shadow-sm`}
                                                                initial={{opacity: 0, y: 8}}
                                                                animate={{opacity: 1, y: 0}}
                                                            >
                                                                <h3 className="font-semibold mb-4 text-green-500 flex items-center gap-2">
                                                                    <Award className="w-4 h-4"/>
                                                                    Текущая оценка
                                                                </h3>

                                                                <div
                                                                    className="grid grid-cols-3 gap-6 mb-6">
                                                                    <div className="text-center">
                                                                        <div
                                                                            className="text-3xl font-bold text-blue-500">
                                                                            {selectedTask.answer.grade.score || 0}
                                                                            <span
                                                                                className={`text-lg ${theme.mutedText}`}>
                                        /{selectedTask.answer.grade.max_score}
                                      </span>
                                                                        </div>
                                                                        <p className={`text-sm ${theme.mutedText}`}>Баллы</p>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div
                                                                            className="text-3xl font-bold text-blue-500">
                                                                            {selectedTask.answer.grade.percentage}%
                                                                        </div>
                                                                        <p className={`text-sm ${theme.mutedText}`}>Процент</p>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div
                                                                            className={`text-3xl font-bold ${
                                                                                selectedTask.answer.grade.letter_grade === "A"
                                                                                    ? "text-emerald-500"
                                                                                    : selectedTask.answer.grade.letter_grade === "F"
                                                                                        ? "text-red-500"
                                                                                        : "text-blue-500"
                                                                            }`}
                                                                        >
                                                                            {selectedTask.answer.grade.letter_grade}
                                                                        </div>
                                                                        <p className={`text-sm ${theme.mutedText}`}>Оценка</p>
                                                                    </div>
                                                                </div>

                                                                <div className="mb-4">
                                  <span className={`text-sm ${theme.mutedText}`}>
                                    Комментарий:
                                  </span>
                                                                    <p className="mt-1 font-medium">
                                                                        {selectedTask.answer.grade.feedback_text}
                                                                    </p>
                                                                </div>

                                                                <div
                                                                    className={`p-3 rounded-xl shadow-inner ${
                                                                        isDark ? "bg-slate-800/60" : "bg-neutral-100"
                                                                    }`}
                                                                >
                                                                    <div
                                                                        className="flex items-center gap-2 mb-2">
                                                                        <User
                                                                            className="w-4 h-4 text-blue-500"/>
                                                                        <span
                                                                            className="font-medium">
                                      {
                                          selectedTask.answer.grade.graded_by.first_name
                                      }{" "}
                                                                            {selectedTask.answer.grade.graded_by.last_name}
                                    </span>
                                                                    </div>
                                                                    <div
                                                                        className="flex items-center gap-4 text-sm">
                                                                        <div
                                                                            className="flex items-center gap-1">
                                                                            <Calendar
                                                                                className="w-3 h-3"/>
                                                                            {formatDate(
                                                                                selectedTask.answer.grade.created_at
                                                                            )}
                                                                        </div>
                                                                        <div
                                                                            className={`px-2 py-1 rounded text-xs shadow-sm ${
                                                                                isDark ? "bg-slate-700" : "bg-neutral-200"
                                                                            }`}
                                                                        >
                                                                            {selectedTask.answer.grade.graded_by.role}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={`p-8 rounded-2xl text-center border ${theme.border} ${
                                                            isDark ? "bg-slate-900/70" : "bg-neutral-50"
                                                        } shadow-sm`}
                                                    >
                                                        <Circle
                                                            className={`w-12 h-12 mx-auto mb-3 ${
                                                                isDark ? "text-slate-500" : "text-gray-400"
                                                            }`}
                                                        />
                                                        <h3 className="font-semibold mb-2">Ответ не
                                                            отправлен</h3>
                                                        <p className={`text-sm ${theme.mutedText}`}>
                                                            Студент еще не отправил решение для
                                                            этого задания
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </Scrollbar>
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="text-center">
                                                <FileText
                                                    className={`w-16 h-16 mx-auto mb-4 ${
                                                        isDark ? "text-slate-500" : "text-gray-400"
                                                    }`}
                                                />
                                                <h3 className="font-semibold text-xl mb-2">
                                                    Выберите задание
                                                </h3>
                                                <p className={theme.mutedText}>
                                                    Выберите задание из списка слева для просмотра
                                                    деталей
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Elegant Confirmation Modal */}
            <ConfirmDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleReassignTask}
                loading={reassigning}
                isDark={isDark}
            />
            <MediaPreviewDialog
                open={!!previewMedia}
                onClose={() => setPreviewMedia(null)}
                media={previewMedia}
                isDark={isDark}
            />
        </>,
        document.body
    );
}