// src/components/admin/StudentViewModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    X,
    MoreVertical,
    ExternalLink,
    ArrowRight,
    Check,
    XCircle,
    Eye,
    RotateCcw,
    UserCheck,
    UserX,
    Award,
    LayoutGrid,
    List as ListIcon,
    Loader2,
    CheckCircle2,
    PauseCircle,
    Clock,
    ShieldCheck,
    ShieldAlert,
    Ban,
    Hourglass,
    Trash2,
    TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Scrollbar } from "react-scrollbars-custom";
import api from "@/api/api";
import { useTheme } from "@/components/common/ThemeContext";
import { createPortal } from "react-dom";

// ВАЖНО: модалка уже существует — просто открываем её
import StudentCourseView from "@/components/admin/StudentCourseView";

/* ---------------------- Types ---------------------- */
type UserLike = {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    profile?: { profile_photo?: string | null };
    // статус может прийти и в user пропа, и внутри enrollments[0].user.status
    status?: string;
};

type Enrollment = {
    id: number;
    user: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        role: string;
        status?: string;
    };
    group: { id: number; name: string };
    role: "student" | "assistant" | "teacher";
    enrolled_date: string;
    points: number;
    course_status: string;
    progress: number; // 0..1 or 0..100
    finished_at?: string | null;
    started_at?: string | null;
    course_id: number;
    course_name: string;
};

type SummaryFromBackend = {
    courses_count?: number;
    total_points?: number;
    overall_progress_percent?: number; // 0..100
    approved_tasks_count?: number;
    pending_tasks_count?: number;
};

/* ---------------------- Helpers ---------------------- */
function toPercent(val?: number | null) {
    if (!val && val !== 0) return 0;
    const p = val <= 1 ? Math.round(val * 100) : Math.round(val);
    return Math.max(0, Math.min(100, p));
}

function useOnClickOutside<T extends HTMLElement>(ref: React.RefObject<T>, handler: () => void) {
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) handler();
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [ref, handler]);
}

/* ---------------------- Visual atoms ---------------------- */
function CircularProgress({
                              percent,
                              size = 72,
                              stroke = 6,
                              trackClass = "",
                              barClass = "",
                          }: {
    percent: number;
    size?: number;
    stroke?: number;
    trackClass?: string;
    barClass?: string;
}) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = (percent / 100) * c;
    return (
        <svg width={size} height={size} className="block transform -rotate-90">
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                strokeWidth={stroke}
                className={trackClass}
                fill="none"
                strokeOpacity={0.15}
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                strokeWidth={stroke}
                className={barClass}
                fill="none"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeLinecap="round"
                style={{
                    transition: 'stroke-dasharray 0.6s ease-in-out',
                }}
            />
            <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                className="text-xs font-bold fill-current transform rotate-90"
            >
                {percent}%
            </text>
        </svg>
    );
}

/* ---------- Course status (mapped + styled) ---------- */
function courseStatusMeta(raw: string | undefined) {
    const key = (raw || "").toLowerCase().replace(/[\s-]+/g, "_");
    if (key === "finished" || key === "done" || key === "completed") {
        return {
            label: "Закончил",
            classes: "text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800/50 dark:bg-emerald-900/20",
            Icon: CheckCircle2,
        };
    }
    if (key === "not_started" || key === "notstarted" || key === "none") {
        return {
            label: "Не начат",
            classes: "text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800/50 dark:bg-amber-900/20",
            Icon: PauseCircle,
        };
    }
    // default: in progress
    return {
        label: "В прогрессе",
        classes: "text-blue-700 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800/50 dark:bg-blue-900/20",
        Icon: Clock,
    };
}

/* ---------- User status (colored badge) ---------- */
function userStatusMeta(raw?: string) {
    const key = (raw || "").toLowerCase().trim();
    if (key === "authorized") {
        return {
            label: "Authorized",
            classes: "text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800/50 dark:bg-emerald-900/20",
            Icon: ShieldCheck,
        };
    }
    if (key === "not authorized" || key === "not_authorized") {
        return {
            label: "Not Authorized",
            classes: "text-blue-700 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800/50 dark:bg-blue-900/20",
            Icon: ShieldAlert,
        };
    }
    if (key === "deactivated") {
        return {
            label: "Deactivated",
            classes: "text-rose-700 border-rose-200 bg-rose-50 dark:text-rose-400 dark:border-rose-800/50 dark:bg-rose-900/20",
            Icon: Ban,
        };
    }
    if (key === "awaiting deletion" || key === "awaiting_deletion") {
        return {
            label: "Awaiting Deletion",
            classes: "text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800/50 dark:bg-amber-900/20",
            Icon: Hourglass,
        };
    }
    if (key === "deleted") {
        return {
            label: "Deleted",
            classes: "text-red-700 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800/50 dark:bg-red-900/20",
            Icon: Trash2,
        };
    }
    // fallback
    return {
        label: raw || "Unknown",
        classes: "text-slate-700 border-slate-200 bg-slate-50 dark:text-slate-400 dark:border-slate-700/50 dark:bg-slate-800/20",
        Icon: ShieldAlert,
    };
}

/* ---------- Elegant confirm dialog ---------- */
function ConfirmDialog({
                           open,
                           title,
                           description,
                           confirmText,
                           confirmTone,
                           loading,
                           onConfirm,
                           onClose,
                           isDark,
                       }: {
    open: boolean;
    title: string;
    description?: string;
    confirmText: string;
    confirmTone: "blue" | "green" | "red";
    loading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
    isDark: boolean;
}) {
    if (!open) return null;
    const tone =
        confirmTone === "red"
            ? "bg-red-600 hover:bg-red-700 shadow-red-500/25"
            : confirmTone === "green"
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25";

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`relative w-full max-w-md rounded-3xl border-2 shadow-2xl backdrop-blur-sm ${
                    isDark
                        ? "bg-slate-900/95 border-slate-700/50 text-slate-100"
                        : "bg-white/95 border-gray-200/50 text-gray-900"
                }`}
            >
                <div className="px-8 pt-6 pb-2 flex items-center justify-between">
                    <div className="text-xl font-bold">{title}</div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                            isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
                        }`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {description && (
                    <div className={`px-8 text-sm leading-relaxed ${
                        isDark ? "text-slate-300" : "text-gray-600"
                    }`}>{description}</div>
                )}
                <div className="px-8 pb-6 pt-6 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className={`px-6 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-200 cursor-pointer ${
                            isDark
                                ? "border-slate-600 hover:bg-slate-800 hover:border-slate-500"
                                : "border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                        }`}
                    >
                        Отмена
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-200 cursor-pointer ${tone} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : confirmTone === "red" ? (
                            <XCircle className="w-4 h-4" />
                        ) : confirmTone === "green" ? (
                            <UserCheck className="w-4 h-4" />
                        ) : (
                            <RotateCcw className="w-4 h-4" />
                        )}
                        {confirmText}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

/* ---------- Improved Dots menu ---------- */
export function DotsMenu({
                             onView,
                             onAccept,
                             onReassign,
                             onRemove,
                             isDark,
                         }: {
    onView: () => void;
    onAccept: () => void;
    onReassign: () => void;
    onRemove: () => void;
    isDark: boolean;
}) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    useOnClickOutside(menuRef, () => setOpen(false));

    useEffect(() => {
        if (open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 8, // 8px offset
                left: rect.right - 288, // align right, since menu width = 288px (w-72)
            });
        }
    }, [open]);

    const surface = isDark
        ? "bg-slate-900/98 border-slate-700/60 text-slate-100 shadow-2xl"
        : "bg-white/98 border-gray-200/60 text-gray-900 shadow-2xl";
    const itemHover = isDark ? "hover:bg-slate-800/60" : "hover:bg-gray-50/80";

    return (
        <>
            <button
                ref={btnRef}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((v) => !v);
                }}
                className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    isDark ? "hover:bg-slate-800/60" : "hover:bg-gray-100/60"
                } ${open ? (isDark ? "bg-slate-800" : "bg-gray-100") : ""}`}
                aria-label="Меню"
            >
                <MoreVertical className="w-5 h-5" />
            </button>

            {open &&
                createPortal(
                    <AnimatePresence>
                        <motion.div
                            ref={menuRef}
                            initial={{ y: 8, opacity: 0, scale: 0.96 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 8, opacity: 0, scale: 0.96 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className={`fixed z-[9999] w-72 rounded-2xl border-2 backdrop-blur-md ${surface}`}
                            style={{ top: coords.top, left: coords.left }}
                        >
                            <div className="py-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpen(false);
                                        onView();
                                    }}
                                    className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-all duration-200 cursor-pointer ${itemHover}`}
                                >
                                    <Eye className="w-4 h-4 text-blue-500" />
                                    <span className="font-medium">Посмотреть</span>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpen(false);
                                        onAccept();
                                    }}
                                    className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-all duration-200 cursor-pointer ${itemHover}`}
                                >
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className="font-medium">Принять курс</span>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpen(false);
                                        onReassign();
                                    }}
                                    className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-all duration-200 cursor-pointer ${itemHover}`}
                                >
                                    <RotateCcw className="w-4 h-4 text-blue-500" />
                                    <span className="font-medium">Переназначить курс</span>
                                </button>
                                <div className={`mx-3 my-2 h-px ${isDark ? "bg-slate-700" : "bg-gray-200"}`} />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpen(false);
                                        onRemove();
                                    }}
                                    className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-all duration-200 cursor-pointer ${itemHover}`}
                                >
                                    <UserX className="w-4 h-4 text-red-500" />
                                    <span className="font-medium text-red-600 dark:text-red-400">Снять с курса</span>
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>,
                    document.body
                )}
        </>
    );
}

/* ====================== MAIN MODAL ====================== */
export default function StudentViewModal({
                                             open,
                                             onClose,
                                             user,
                                         }: {
    open: boolean;
    onClose: () => void;
    user: UserLike | null;
}) {
    const navigate = useNavigate();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";

    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<Enrollment[]>([]);
    const [summary, setSummary] = useState<SummaryFromBackend>({
        courses_count: 0,
        total_points: 0,
        overall_progress_percent: 0,
        approved_tasks_count: 0,
        pending_tasks_count: 0,
    });

    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Для модалки просмотра студента по конкретному курсу
    const [courseViewOpen, setCourseViewOpen] = useState(false);
    const [activeCourseId, setActiveCourseId] = useState<number | null>(null);

    // Подтверждения
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTone, setConfirmTone] = useState<"blue" | "green" | "red">("blue");
    const [confirmTitle, setConfirmTitle] = useState("Подтвердите действие");
    const [confirmDesc, setConfirmDesc] = useState<string | undefined>("Вы уверены?");
    const [confirmAction, setConfirmAction] = useState<"accept" | "reassign" | "remove">("reassign");
    const [confirmForCourse, setConfirmForCourse] = useState<number | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    // Блокируем скролл фона и ESC
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    useEffect(() => {
        if (!open || !user?.id) return;
        let ignore = false;
        (async () => {
            setLoading(true);
            setActionMessage(null);
            try {
                const res = await api.get("course/courses/all-user-courses-and-groups/", { params: { user_id: user.id } });
                let enrollments: Enrollment[] = [];
                let s: SummaryFromBackend | undefined;

                if (Array.isArray(res.data)) {
                    enrollments = res.data as Enrollment[];
                } else if (res.data && typeof res.data === "object") {
                    if (Array.isArray(res.data.items)) enrollments = res.data.items;
                    if (res.data.summary) s = res.data.summary;
                }

                if (!ignore) {
                    setItems(enrollments);
                    const computed = {
                        courses_count: s?.courses_count ?? enrollments.length,
                        total_points: s?.total_points ?? enrollments.reduce((sum, e) => sum + (e.points || 0), 0),
                        overall_progress_percent:
                            s?.overall_progress_percent ??
                            Math.round(enrollments.length ? enrollments.reduce((sum, e) => sum + toPercent(e.progress), 0) / enrollments.length : 0),
                        approved_tasks_count: s?.approved_tasks_count ?? 0,
                        pending_tasks_count: s?.pending_tasks_count ?? 0,
                    };
                    setSummary(computed);
                }
            } catch (e) {
                if (!ignore) {
                    setItems([]);
                    setSummary({
                        courses_count: 0,
                        total_points: 0,
                        overall_progress_percent: 0,
                        approved_tasks_count: 0,
                        pending_tasks_count: 0,
                    });
                    setActionMessage("Не удалось загрузить данные. Проверьте бэкенд или права.");
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [open, user?.id]);

    const theme = useMemo(
        () => ({
            // Enhanced color palette with better contrast
            modal: isDark
                ? "bg-slate-900/98 border-slate-700/60"
                : "bg-white/98 border-gray-200/60",
            card: isDark
                ? "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800/80"
                : "bg-white/80 border-gray-200/60 hover:bg-white/95",
            soft: isDark
                ? "bg-slate-800/40"
                : "bg-gray-50/60",
            text: isDark
                ? "text-slate-100"
                : "text-gray-900",
            subtext: isDark
                ? "text-slate-300"
                : "text-gray-600",
            border: isDark
                ? "border-slate-700/60"
                : "border-gray-200/60",
            hoverRow: isDark
                ? "hover:bg-slate-800/50"
                : "hover:bg-gray-50/50",
            accent: "from-blue-600 via-indigo-600 to-purple-600",
            glass: isDark
                ? "bg-slate-900/95 backdrop-blur-xl"
                : "bg-white/95 backdrop-blur-xl",
            shadow: "shadow-2xl shadow-black/10",
        }),
        [isDark]
    );

    if (!open) return null;

    const handleOpenCourseView = (courseId: number) => {
        setActiveCourseId(courseId);
        setCourseViewOpen(true);
    };

    const askConfirm = (courseId: number, action: "accept" | "reassign" | "remove") => {
        setConfirmForCourse(courseId);
        setConfirmAction(action);
        if (action === "accept") {
            setConfirmTitle("Принять курс для студента?");
            setConfirmDesc("Студент будет отмечен как принятый на этот курс.");
            setConfirmTone("green");
        } else if (action === "remove") {
            setConfirmTitle("Снять студента с курса?");
            setConfirmDesc("Доступ к материалам курса будет отозван.");
            setConfirmTone("red");
        } else {
            setConfirmTitle("Переназначить курс студенту?");
            setConfirmDesc("Статус и задания могут быть обновлены.");
            setConfirmTone("blue");
        }
        setConfirmOpen(true);
    };

    const doAction = async () => {
        if (!user?.id || !confirmForCourse) return;
        setActionLoading(true);
        setActionMessage(null);
        try {
            const url = `course/courses/${confirmForCourse}/${confirmAction}/`;
            await api.post(url, { user_ids: [user.id] });
            setActionMessage("Действие выполнено успешно.");
            setConfirmOpen(false);
            const res = await api.get("course/courses/all-user-courses-and-groups/", { params: { user_id: user.id } });
            let enrollments: Enrollment[] = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
            setItems(enrollments);
        } catch (e) {
            setActionMessage("Ошибка при выполнении действия (проверьте маршруты и права).");
        } finally {
            setActionLoading(false);
        }
    };

    // user status from either prop or enrollments
    const resolvedUserStatus = (user?.status || items[0]?.user.status) ?? undefined;
    const uMeta = userStatusMeta(resolvedUserStatus);

    /* ---------- Reusable Course line (LIST view) ---------- */
    const CourseRow = ({ enroll }: { enroll: Enrollment }) => {
        const pct = toPercent(enroll.progress);
        const cs = courseStatusMeta(enroll.course_status);
        return (
            <motion.div
                whileHover={{ y: -2, scale: 1.002 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`group rounded-2xl border-2 transition-all duration-300 backdrop-blur-sm ${theme.card} ${theme.shadow}`}
            >
                <div className="flex items-center gap-6 p-6">
                    {/* Progress circle */}
                    <div className="w-16 h-16 shrink-0">
                        <CircularProgress
                            percent={pct}
                            size={64}
                            stroke={6}
                            trackClass={isDark ? "stroke-slate-600" : "stroke-gray-300"}
                            barClass="stroke-blue-500"
                        />
                    </div>

                    {/* Main */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                            <button
                                className={`inline-flex items-center gap-2 font-bold text-base transition-all duration-200 cursor-pointer hover:underline truncate ${theme.text}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/courses/${enroll.course_id}/edit`);
                                }}
                                title="Перейти к редактированию курса"
                            >
                                {enroll.course_name}
                                <ExternalLink className="w-4 h-4 opacity-60 shrink-0" />
                            </button>
                            <span className="text-xs opacity-50">•</span>
                            <span className={`text-sm opacity-75 truncate ${theme.subtext}`}>
                                Группа:{" "}
                                <button
                                    className="underline underline-offset-2 hover:opacity-80 cursor-pointer transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/groups/${enroll.group.id}`);
                                    }}
                                >
                                    {enroll.group.name}
                                </button>
                            </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className={`${theme.subtext}`}>
                                <span className="opacity-70">Роль:</span>
                                <span className={`font-semibold ml-1 ${theme.text}`}>
                                    {enroll.role === "student" ? "Студент" : enroll.role}
                                </span>
                            </div>
                            <div className={`${theme.subtext}`}>
                                <span className="opacity-70">Баллы:</span>
                                <span className={`font-bold ml-1 text-blue-600 dark:text-blue-400`}>{enroll.points ?? 0}</span>
                            </div>
                            <div className={`${theme.subtext}`}>
                                <span className="opacity-70">Начал:</span>
                                <span className={`font-semibold ml-1 ${theme.text}`}>
                                    {enroll.started_at ? new Date(enroll.started_at).toLocaleDateString("ru-RU") : "—"}
                                </span>
                            </div>
                            <div className={`${theme.subtext}`}>
                                <span className="opacity-70">Завершил:</span>
                                <span className={`font-semibold ml-1 ${theme.text}`}>
                                    {enroll.finished_at ? new Date(enroll.finished_at).toLocaleDateString("ru-RU") : "—"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="shrink-0">
                        <span
                            className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl border-2 ${cs.classes}`}
                            title={cs.label}
                        >
                            <cs.Icon className="w-4 h-4" />
                            {cs.label}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0">
                        <DotsMenu
                            isDark={isDark}
                            onView={() => handleOpenCourseView(enroll.course_id)}
                            onAccept={() => askConfirm(enroll.course_id, "accept")}
                            onReassign={() => askConfirm(enroll.course_id, "reassign")}
                            onRemove={() => askConfirm(enroll.course_id, "remove")}
                        />
                    </div>
                </div>

                {/* Row click -> open details */}
                <button
                    className={`w-full text-left border-t-2 ${theme.border} px-6 py-4 text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${theme.hoverRow} rounded-b-2xl`}
                    onClick={() => handleOpenCourseView(enroll.course_id)}
                    title="Открыть подробный просмотр студента по курсу"
                >
                    <span className="inline-flex items-center gap-2 font-medium">
                        <Eye className="w-4 h-4 text-blue-500" />
                        Подробнее <span className="opacity-70">(Посмотреть детали)</span>
                    </span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
            </motion.div>
        );
    };

    /* ---------- Grid Card (BLOCK view) ---------- */
    const CourseCard = ({ enroll }: { enroll: Enrollment }) => {
        const pct = toPercent(enroll.progress);
        const cs = courseStatusMeta(enroll.course_status);
        return (
            <motion.div
                whileHover={{ y: -4, scale: 1.005 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`group rounded-2xl border-2 transition-all duration-300 backdrop-blur-sm ${theme.card} ${theme.shadow}`}
            >
                {/* header */}
                <div className="flex items-start justify-between gap-4 p-6 border-b-2 border-dashed border-opacity-30">
                    <div className="min-w-0 flex-1">
                        <button
                            className={`inline-flex items-center gap-2 font-bold text-lg transition-all duration-200 cursor-pointer hover:underline ${theme.text}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/courses/${enroll.course_id}/edit`);
                            }}
                            title="Открыть редактирование курса"
                        >
                            {enroll.course_name}
                            <ExternalLink className="w-4 h-4 opacity-60" />
                        </button>
                        <div className={`mt-2 text-sm ${theme.subtext} truncate`}>
                            <span className="font-medium">
                                Роль: {enroll.role === "student" ? "Студент" : enroll.role}
                            </span>
                            <span className="mx-2 opacity-50">•</span>
                            <span>Группа: </span>
                            <button
                                className="underline underline-offset-2 hover:opacity-80 cursor-pointer font-medium transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/groups/${enroll.group.id}`);
                                }}
                                title="Открыть редактирование группы"
                            >
                                {enroll.group.name}
                            </button>
                        </div>
                    </div>
                    <DotsMenu
                        isDark={isDark}
                        onView={() => handleOpenCourseView(enroll.course_id)}
                        onAccept={() => askConfirm(enroll.course_id, "accept")}
                        onReassign={() => askConfirm(enroll.course_id, "reassign")}
                        onRemove={() => askConfirm(enroll.course_id, "remove")}
                    />
                </div>

                <button
                    className="w-full text-left cursor-pointer"
                    onClick={() => handleOpenCourseView(enroll.course_id)}
                    title="Открыть подробный просмотр студента по курсу"
                >
                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                            {/* progress */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16">
                                    <CircularProgress
                                        percent={pct}
                                        size={64}
                                        stroke={6}
                                        trackClass={isDark ? "stroke-slate-600" : "stroke-gray-300"}
                                        barClass="stroke-blue-500"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <div className={`text-sm font-medium ${theme.subtext}`}>Прогресс</div>
                                    <div className={`text-xl font-bold ${theme.text}`}>{pct}%</div>
                                </div>
                            </div>

                            {/* points and dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className={`text-sm font-medium ${theme.subtext}`}>Баллы</div>
                                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{enroll.points ?? 0}</div>
                                </div>
                                <div>
                                    <div className={`text-sm font-medium ${theme.subtext}`}>Начал</div>
                                    <div className={`font-semibold ${theme.text}`}>
                                        {enroll.started_at ? new Date(enroll.started_at).toLocaleDateString("ru-RU") : "—"}
                                    </div>
                                </div>
                            </div>

                            {/* status */}
                            <div className="flex flex-col items-start lg:items-end gap-3">
                                <div className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl border-2 ${cs.classes}`}>
                                    <cs.Icon className="w-4 h-4" />
                                    {cs.label}
                                </div>
                                <div className={`text-sm font-medium ${theme.subtext}`}>
                                    Завершил: <span className={`${theme.text}`}>
                                        {enroll.finished_at ? new Date(enroll.finished_at).toLocaleDateString("ru-RU") : "—"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center">
                            <span
                                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
                                    isDark
                                        ? "border-slate-600 group-hover:bg-slate-700 group-hover:border-slate-500"
                                        : "border-gray-300 group-hover:bg-gray-50 group-hover:border-gray-400"
                                }`}
                            >
                                <Eye className="w-4 h-4 text-blue-500" />
                                Подробнее
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </span>
                        </div>
                    </div>
                </button>
            </motion.div>
        );
    };

    /* ---------------------- UI ---------------------- */
    return (
        <>
            {/* Backdrop + Modal */}
            <div className="fixed inset-0 z-[110] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-md"
                    onClick={onClose}
                />
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    initial={{ y: 24, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 24, opacity: 0, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`relative w-[96vw] max-w-[1500px] h-[92vh] rounded-3xl border-2 overflow-hidden backdrop-blur-xl ${theme.modal} ${theme.shadow}`}
                >
                    {/* Header */}
                    <div className={`sticky top-0 z-10 border-b-2 ${theme.border} px-8 py-6 ${theme.glass}`}>
                        <div className="flex items-center justify-between gap-6">
                            {/* User block (enhanced) */}
                            <div className="flex items-center gap-5 min-w-0">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center ring-2 ring-blue-500/20">
                                        {user?.profile?.profile_photo ? (
                                            <img alt="avatar" src={user.profile.profile_photo} className="w-full h-full object-cover" />
                                        ) : (
                                            <Award className="w-8 h-8 text-blue-500" />
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                        <TrendingUp className="w-3 h-3 text-white" />
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <div className={`text-xl font-bold ${theme.text} truncate`}>
                                        {user?.first_name} {user?.last_name}
                                    </div>
                                    <div className={`text-sm ${theme.subtext} truncate font-medium`}>{user?.email}</div>

                                    {/* User Status badge */}
                                    <div className="mt-2">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border-2 ${uMeta.classes}`}>
                                            <uMeta.Icon className="w-3.5 h-3.5" />
                                            {uMeta.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Summary */}
                            <div className="hidden md:grid grid-cols-3 gap-8">
                                <div className="text-center">
                                    <div className={`text-xs uppercase tracking-wider font-bold ${theme.subtext}`}>Курсов</div>
                                    <div className={`text-2xl font-black ${theme.text}`}>{summary.courses_count ?? 0}</div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-xs uppercase tracking-wider font-bold ${theme.subtext}`}>Баллы</div>
                                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{summary.total_points ?? 0}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <CircularProgress
                                            percent={toPercent(summary.overall_progress_percent ?? 0)}
                                            size={64}
                                            stroke={6}
                                            trackClass={isDark ? "stroke-slate-600" : "stroke-gray-300"}
                                            barClass="stroke-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <div className={`text-xs uppercase tracking-wider font-bold ${theme.subtext}`}>Прогресс</div>
                                        <div className={`text-2xl font-black ${theme.text}`}>{toPercent(summary.overall_progress_percent ?? 0)}%</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right controls: Enhanced View toggle + Close */}
                            <div className="flex items-center gap-3">
                                <div
                                    className={`inline-flex items-center rounded-xl border-2 ${theme.border} overflow-hidden backdrop-blur-sm`}
                                    role="tablist"
                                    aria-label="Представление списка"
                                >
                                    <button
                                        aria-selected={viewMode === "grid"}
                                        onClick={() => setViewMode("grid")}
                                        className={`px-4 py-2.5 text-sm font-bold inline-flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                                            viewMode === "grid"
                                                ? isDark
                                                    ? "bg-slate-800 text-slate-100 shadow-lg"
                                                    : "bg-gray-100 text-gray-900 shadow-lg"
                                                : isDark
                                                    ? "text-slate-300 hover:bg-slate-800/50"
                                                    : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                        title="Блочное представление"
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                        Grid
                                    </button>
                                    <button
                                        aria-selected={viewMode === "list"}
                                        onClick={() => setViewMode("list")}
                                        className={`px-4 py-2.5 text-sm font-bold inline-flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                                            viewMode === "list"
                                                ? isDark
                                                    ? "bg-slate-800 text-slate-100 shadow-lg"
                                                    : "bg-gray-100 text-gray-900 shadow-lg"
                                                : isDark
                                                    ? "text-slate-300 hover:bg-slate-800/50"
                                                    : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                        title="Список"
                                    >
                                        <ListIcon className="w-4 h-4" />
                                        List
                                    </button>
                                </div>

                                <button
                                    onClick={onClose}
                                    className={`p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                                        isDark
                                            ? "hover:bg-slate-800 text-slate-400 hover:text-slate-100"
                                            : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                                    }`}
                                    aria-label="Закрыть"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Body + Custom Scrollbar */}
                    <Scrollbar
                        style={{ height: "calc(92vh - 110px)" }}
                        trackYProps={{
                            className: `rsc-track-y ${isDark ? "bg-slate-800/40" : "bg-gray-200/40"} rounded-full w-3 mr-2`,
                        }}
                        thumbYProps={{
                            className: `rsc-thumb-y ${isDark ? "bg-slate-600 hover:bg-slate-500" : "bg-gray-400 hover:bg-gray-500"} rounded-full`,
                        }}
                        trackXProps={{ className: "hidden" }}
                    >
                        <div className="px-8 py-6">
                            {actionMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`mb-6 px-6 py-4 rounded-2xl border-2 backdrop-blur-sm ${
                                        isDark
                                            ? "bg-slate-800/60 border-slate-700/60 text-slate-200"
                                            : "bg-gray-50/60 border-gray-200/60 text-gray-800"
                                    }`}
                                >
                                    {actionMessage}
                                </motion.div>
                            )}

                            {loading ? (
                                <div className={viewMode === "grid" ? "grid grid-cols-1 xl:grid-cols-2 gap-6" : "space-y-4"}>
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className={`rounded-2xl border-2 p-6 animate-pulse backdrop-blur-sm ${theme.card}`}>
                                            <div className={`h-7 w-48 rounded-lg mb-4 ${isDark ? "bg-slate-700" : "bg-gray-200"}`} />
                                            <div className={`h-5 w-64 rounded-lg mb-3 ${isDark ? "bg-slate-700" : "bg-gray-200"}`} />
                                            <div className={`h-5 w-56 rounded-lg mb-3 ${isDark ? "bg-slate-700" : "bg-gray-200"}`} />
                                            <div className={`h-24 w-full rounded-xl mt-4 ${isDark ? "bg-slate-700" : "bg-gray-200"}`} />
                                        </div>
                                    ))}
                                </div>
                            ) : items.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`rounded-2xl border-2 p-12 text-center backdrop-blur-sm ${theme.card}`}
                                >
                                    <div className={`text-xl font-bold mb-2 ${theme.text}`}>Нет записей о курсах</div>
                                    <div className={`${theme.subtext} text-base`}>Студент пока никуда не зачислен.</div>
                                </motion.div>
                            ) : viewMode === "grid" ? (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {items.map((enroll, index) => (
                                        <motion.div
                                            key={`${enroll.course_id}-${enroll.id}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <CourseCard enroll={enroll} />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {items.map((enroll, index) => (
                                        <motion.div
                                            key={`${enroll.course_id}-${enroll.id}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <CourseRow enroll={enroll} />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Scrollbar>
                </motion.div>
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                open={confirmOpen}
                title={confirmTitle}
                description={confirmDesc}
                confirmText={confirmAction === "accept" ? "Принять" : confirmAction === "remove" ? "Снять с курса" : "Переназначить"}
                confirmTone={confirmTone}
                loading={actionLoading}
                onConfirm={doAction}
                onClose={() => setConfirmOpen(false)}
                isDark={isDark}
            />

            {/* Детальная модалка студента по курсу */}
            {courseViewOpen && activeCourseId != null && user?.id != null && (
                <StudentCourseView courseId={activeCourseId} userId={user.id} onClose={() => setCourseViewOpen(false)} />
            )}
        </>
    );
}