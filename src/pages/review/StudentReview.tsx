// src/pages/StudentReview.tsx
import {useEffect, useMemo, useState, useCallback} from "react";
import {Link, useLocation, useParams} from "react-router-dom";
import {useTheme} from "@/components/common/ThemeContext";
import api from "@/api/api";
import DOMPurify from "dompurify";
import {
    ArrowLeft, CheckCircle2, XCircle, HelpCircle, Clock, Loader2, User2,
    ChevronLeft, ChevronRight, RotateCcw, Star, Award, MessageCircle
} from "lucide-react";

/* ---------- types ---------- */
type Task = {
    id: number;
    number?: number | null;
    name: string;
    description?: string | null;
    allow_resubmitting_task: boolean;
};
type MiniCourse = { id: number; name: string };
type MiniUser = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    profile?: { photo?: string | null } | null
};
type AnswerFile = { id: number; file_name: string; file_url: string; file_size: number };
type Grade = null | {
    score: number | null;
    max_score: number;
    percentage: number;
    letter_grade: string;
    feedback_text?: string | null;
    graded_by?: { id: number; first_name: string; last_name: string; email: string };
};
type Answer = {
    id: number; description: string;
    status: "in_review" | "approved" | "have_flaws" | "rejected";
    files: AnswerFile[]; grade: Grade; updated_at: string;
    task: { id: number; number?: number | null; name: string; course: MiniCourse };
    user: MiniUser;
    created_at: string;
};
type TeacherReviewPayload = { answers: Answer[] };

const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(" ");

/* ===================================== */
/*               PAGE                    */
/* ===================================== */
export default function StudentReview() {
    const {studentId, courseId} = useParams<{ studentId: string; courseId: string }>();
    const location = useLocation() as any;
    const passedStudent: MiniUser | undefined = location.state?.student;
    const passedCourse: MiniCourse | undefined = location.state?.course;
    const {actualTheme} = useTheme();
    const isDark = actualTheme === "dark";

    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState<"grade" | "reassign" | null>(null);

    // Mock user role - in real app, get from auth context
    const [userRole] = useState<"teacher" | "admin">("teacher"); // Change this as needed

    /* -------- fetch data -------- */
    useEffect(() => {
        let on = true;
        (async () => {
            try {
                const [t, a] = await Promise.all([
                    api.get<Task[]>(`course/courses/${courseId}/tasks/`),
                    api.get<TeacherReviewPayload>(`answers/teacher-review/?course_id=${courseId}`)
                ]);
                if (!on) return;

                const sortedTasks = (t.data || []).slice().sort((a, b) => (a.number || 0) - (b.number || 0));
                setTasks(sortedTasks);

                const onlyThisStudent = (a.data.answers || []).filter(x => String(x.user.id) === String(studentId));
                setAnswers(onlyThisStudent);

                const firstWithAnswer = sortedTasks.find(tk => onlyThisStudent.some(ans => ans.task.id === tk.id));
                setSelectedTaskId(firstWithAnswer?.id ?? sortedTasks[0]?.id ?? null);
            } catch (e) {
                console.error(e);
            } finally {
                on && setLoading(false);
            }
        })();
        return () => {
            on = false;
        };
    }, [studentId, courseId]);

    const answersByTask = useMemo(() => {
        const m = new Map<number, Answer>();
        answers.forEach(a => m.set(a.task.id, a));
        return m;
    }, [answers]);

    const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;
    const selectedAnswer = selectedTask ? answersByTask.get(selectedTask.id) || null : null;

    const student: MiniUser | null = passedStudent ?? (selectedAnswer?.user ?? null);
    const course: MiniCourse | null = passedCourse ?? (selectedAnswer?.task.course ?? null);

    /* -------- keyboard/step ---------- */
    const step = useCallback((dir: 1 | -1) => {
        if (!tasks.length || selectedTaskId == null) return;
        const i = tasks.findIndex(t => t.id === selectedTaskId);
        const next = tasks[i + dir];
        if (next) setSelectedTaskId(next.id);
    }, [tasks, selectedTaskId]);

    /* -------- review -------- */
    async function submitGrade(status: "approve" | "flaws" | "reject", data: {
        score?: number | null;
        feedback_text?: string
    }) {
        if (!selectedAnswer) return;
        setSubmitting("grade");
        try {
            const statusMap = {
                approve: "approved",
                flaws: "have_flaws",
                reject: "rejected"
            } as const;
            const body: any = {
                status: statusMap[status],
                max_score: selectedAnswer.grade?.max_score ?? 100
            };
            if (status === "approve") body.score = data.score ?? null;
            if ((data.feedback_text || "").trim()) body.feedback_text = (data.feedback_text || "").trim();
            if (status === "reject") body.delete_grade = true;

            const res = await api.patch<Answer>(`answers/${selectedAnswer.id}/check/`, body);
            const updated = res.data;
            setAnswers(prev => prev.map(a => a.id === updated.id ? updated : a));
            if (updated.status === "approved") step(+1);
        } catch (e) {
            console.error(e);
            alert("Не удалось сохранить решение.");
        } finally {
            setSubmitting(null);
        }
    }

    async function reassignTask() {
        if (!selectedTask || !student) return;
        setSubmitting("reassign");
        try {
            await api.post(`tasks/${selectedTask.id}/reassign/`, {user_id: student.id});
            // Refresh data after reassign
            window.location.reload(); // Simple reload, or implement proper refresh
        } catch (e) {
            console.error(e);
            alert("Не удалось переназначить задание.");
        } finally {
            setSubmitting(null);
        }
    }


    if (loading) {
        return (
            <div className={cx("min-h-screen flex items-center justify-center",
                isDark ? "bg-slate-900 text-slate-400" : "bg-neutral-50 text-neutral-600")}>
                <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin"/>
                    <span>Загрузка...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={cx("min-h-screen", isDark ? "bg-slate-900" : "bg-neutral-50")}>
            <div className="mx-auto max-w-screen-2xl">
                {/* Header */}
                <header
                    className={cx("border-b px-6 py-4", isDark ? "border-slate-700 bg-slate-800" : "border-neutral-200 bg-white")}>
                    <div className="flex items-center justify-between">
                        <Link to="/teacher/students"
                              className={cx("inline-flex items-center gap-2 text-sm font-medium transition-colors",
                                  isDark ? "text-slate-300 hover:text-white" : "text-neutral-700 hover:text-neutral-900")}>
                            <ArrowLeft className="h-4 w-4"/>
                            Назад к студентам
                        </Link>
                        <div
                            className={cx("text-sm font-medium", isDark ? "text-slate-300" : "text-neutral-700")}>
                            {course?.name || "Курс"}
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="flex h-[calc(100vh-73px)]">
                    {/* Sidebar */}
                    <aside className={cx("w-80 shrink-0 border-r overflow-y-auto",
                        isDark ? "border-slate-700 bg-slate-800" : "border-neutral-200 bg-white")}>

                        {/* Student Info */}
                        <div
                            className={cx("p-6 border-b", isDark ? "border-slate-700" : "border-neutral-200")}>
                            <div className="flex items-center gap-4">
                                <Avatar url={student?.profile?.photo} size="lg"/>
                                <div className="min-w-0">
                                    <h3 className={cx("font-semibold truncate", isDark ? "text-white" : "text-neutral-900")}>
                                        {student ? `${student.first_name} ${student.last_name}` : "Студент"}
                                    </h3>
                                    <p className={cx("text-sm truncate", isDark ? "text-slate-400" : "text-neutral-500")}>
                                        {student?.email || "—"}
                                    </p>
                                    <div className={cx("flex items-center gap-2 mt-2 text-xs",
                                        isDark ? "text-slate-400" : "text-neutral-500")}>
                                        <span>Заданий выполнено:</span>
                                        <span
                                            className={cx("font-medium", isDark ? "text-slate-300" : "text-neutral-700")}>
                                            {answers.filter(a => a.status === "approved").length}/{tasks.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Task List */}
                        <div className="p-4">
                            <h4 className={cx("text-xs font-semibold uppercase tracking-wide mb-3",
                                isDark ? "text-slate-400" : "text-neutral-500")}>
                                Задания
                            </h4>
                            <ul className="space-y-1">
                                {tasks.map(task => {
                                    const answer = answersByTask.get(task.id) || null;
                                    const isActive = selectedTaskId === task.id;

                                    return (
                                        <li key={task.id}>
                                            <button
                                                onClick={() => setSelectedTaskId(task.id)}
                                                className={cx("w-full p-3 rounded-lg text-left transition-all duration-200",
                                                    isActive
                                                        ? (isDark
                                                            ? "bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700/50 shadow-lg"
                                                            : "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-sm")
                                                        : (isDark
                                                            ? "hover:bg-slate-700/50"
                                                            : "hover:bg-neutral-50")
                                                )}>
                                                <div className="flex items-center gap-3">
                                                    <div className="shrink-0">
                                                        <StatusBadge status={answer?.status}
                                                                     isDark={isDark}/>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div
                                                            className={cx("font-medium text-sm truncate",
                                                                isDark ? "text-slate-200" : "text-neutral-900")}>
                                                            {task.number ? `${task.number}. ` : ""}{task.name}
                                                        </div>
                                                        <div className={cx("text-xs mt-1",
                                                            isDark ? "text-slate-400" : "text-neutral-500")}>
                                                            {answer ? (
                                                                <>
                                                                    {prettyStatus(answer.status)}
                                                                    {answer.grade && (
                                                                        <span className="ml-2">
                                                                            {answer.grade.score ?? "—"}/{answer.grade.max_score}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            ) : "Ответа нет"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main
                        className={cx("flex-1 overflow-y-auto", isDark ? "bg-slate-900" : "bg-neutral-50")}>
                        {selectedTask ? (
                            <>
                                {/* Task Header */}
                                <div className={cx("sticky top-0 z-10 border-b backdrop-blur-sm",
                                    isDark ? "bg-slate-900/90 border-slate-700" : "bg-white/90 border-neutral-200")}>
                                    <div className="flex items-center justify-between p-6">
                                        <div>
                                            <h1 className={cx("text-xl font-bold", isDark ? "text-white" : "text-neutral-900")}>
                                                {selectedTask.number ? `${selectedTask.number}. ` : ""}{selectedTask.name}
                                            </h1>
                                            <div className="flex items-center gap-2 mt-1">
                                                <TaskTypeBadge
                                                    allowResubmit={selectedTask.allow_resubmitting_task}
                                                    isDark={isDark}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => step(-1)}
                                                disabled={tasks.findIndex(t => t.id === selectedTask.id) === 0}
                                                className={cx("p-2 rounded-lg border transition-colors disabled:opacity-50",
                                                    isDark
                                                        ? "border-slate-600 hover:bg-slate-700 disabled:hover:bg-transparent"
                                                        : "border-neutral-300 hover:bg-neutral-50 disabled:hover:bg-transparent")}
                                                title="Предыдущее задание">
                                                <ChevronLeft className="h-4 w-4"/>
                                            </button>
                                            <button
                                                onClick={() => step(+1)}
                                                disabled={tasks.findIndex(t => t.id === selectedTask.id) === tasks.length - 1}
                                                className={cx("p-2 rounded-lg border transition-colors disabled:opacity-50",
                                                    isDark
                                                        ? "border-slate-600 hover:bg-slate-700 disabled:hover:bg-transparent"
                                                        : "border-neutral-300 hover:bg-neutral-50 disabled:hover:bg-transparent")}
                                                title="Следующее задание">
                                                <ChevronRight className="h-4 w-4"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Task Description */}
                                    <TaskDescriptionCard
                                        task={selectedTask}
                                        isDark={isDark}
                                    />

                                    {/* Answer Section */}
                                    <AnswerSection
                                        answer={selectedAnswer}
                                        task={selectedTask}
                                        userRole={userRole}
                                        isDark={isDark}
                                        submitting={submitting}
                                        onSubmitGrade={submitGrade}
                                        onReassign={reassignTask}
                                        onNext={() => step(+1)}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className={cx("flex items-center justify-center h-full",
                                isDark ? "text-slate-500" : "text-neutral-500")}>
                                <div className="text-center">
                                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                                    <p>Выберите задание для просмотра</p>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

/* ===================================== */
/*             COMPONENTS                */

/* ===================================== */

function TaskDescriptionCard({task, isDark}: { task: Task; isDark: boolean }) {
    return (
        <div className={cx("rounded-xl border p-6 shadow-sm",
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200")}>
            <div className="flex items-center gap-2 mb-4">
                <div className={cx("p-2 rounded-lg", isDark ? "bg-blue-900/30" : "bg-blue-50")}>
                    <HelpCircle
                        className={cx("h-5 w-5", isDark ? "text-blue-400" : "text-blue-600")}/>
                </div>
                <h2 className={cx("text-lg font-semibold", isDark ? "text-white" : "text-neutral-900")}>
                    Условие задачи
                </h2>
            </div>
            <div
                className={cx("prose prose-sm max-w-none [&_img]:max-w-full [&_img]:rounded-lg",
                    isDark ? "prose-invert text-slate-300" : "text-neutral-700")}
                dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(task.description || "Описание отсутствует.")}}
            />
        </div>
    );
}

function formatDateTime(s?: string) {
    if (!s) return "—";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString(undefined, {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
    });
}

function MetaPill({
                      icon, label, value, isDark
                  }: { icon: React.ReactNode; label: string; value: string; isDark: boolean }) {
    return (
        <span
            className={cx(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                isDark
                    ? "bg-slate-900 text-slate-300 border-slate-600"
                    : "bg-neutral-50 text-neutral-700 border-neutral-200"
            )}
        >
            {icon}
            <span className="font-medium">{label}:</span>
            <time className="tabular-nums">{value}</time>
        </span>
    );
}


function AnswerSection({
                           answer, task, userRole, isDark, submitting,
                           onSubmitGrade, onReassign, onNext
                       }: {
    answer: Answer | null;
    task: Task;
    userRole: "teacher" | "admin";
    isDark: boolean;
    submitting: "grade" | "reassign" | null;
    onSubmitGrade: (status: "approve" | "flaws" | "reject", data: {
        score?: number | null;
        feedback_text?: string
    }) => void;
    onReassign: () => void;
    onNext: () => void;
}) {
    if (!answer) {
        return (
            <div className={cx("rounded-xl border p-6 text-center shadow-sm",
                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200")}>
                <div className={cx("p-3 rounded-full inline-flex mb-4",
                    isDark ? "bg-slate-700" : "bg-neutral-100")}>
                    <Clock
                        className={cx("h-6 w-6", isDark ? "text-slate-400" : "text-neutral-500")}/>
                </div>
                <h3 className={cx("text-lg font-semibold mb-2", isDark ? "text-white" : "text-neutral-900")}>
                    Ответ не отправлен
                </h3>
                <p className={cx("text-sm", isDark ? "text-slate-400" : "text-neutral-600")}>
                    Студент еще не отправил решение для этого задания
                </p>
            </div>
        );
    }

    const isApproved = answer.status === "approved";
    const canEdit = !isApproved || userRole === "admin";

    return (
        <div className={cx("rounded-xl border shadow-sm",
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-neutral-200")}>

            {/* Answer Header */}
            <div className={cx("p-6 border-b", isDark ? "border-slate-700" : "border-neutral-200")}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={cx("p-2 rounded-lg", isDark ? "bg-purple-900/30" : "bg-purple-50")}>
                            <MessageCircle
                                className={cx("h-5 w-5", isDark ? "text-purple-400" : "text-purple-600")}/>
                        </div>
                        <h3 className={cx("text-lg font-semibold", isDark ? "text-white" : "text-neutral-900")}>
                            Ответ студента
                        </h3>
                    </div>
                    <StatusBadge status={answer.status} isDark={isDark} size="lg"/>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <MetaPill
                        icon={<Clock className="h-4 w-4"/>}
                        label="Создано"
                        value={formatDateTime(answer.created_at)}
                        isDark={isDark}
                    />
                    <MetaPill
                        icon={<RotateCcw className="h-4 w-4"/>}
                        label="Обновлено"
                        value={formatDateTime(answer.updated_at)}
                        isDark={isDark}
                    />
                </div>
            </div>

            {/* Answer Content */}
            <div className="p-6">
                {/* Student Response */}
                <div className="mb-6">
                    <h4 className={cx("font-medium mb-3", isDark ? "text-slate-300" : "text-neutral-700")}>
                        Описание решения:
                    </h4>
                    <div className={cx("rounded-lg p-4 border",
                        isDark ? "bg-slate-900 border-slate-600 text-slate-300" : "bg-neutral-50 border-neutral-200 text-neutral-800")}>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {answer.description || "Описание отсутствует"}
                        </p>
                    </div>
                </div>

                {/* Files */}
                {answer.files && answer.files.length > 0 && (
                    <div className="mb-6">
                        <h4 className={cx("font-medium mb-3", isDark ? "text-slate-300" : "text-neutral-700")}>
                            Прикрепленные файлы:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {answer.files.map(file => (
                                <a
                                    key={file.id}
                                    href={file.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cx("flex items-center gap-3 p-3 rounded-lg border transition-colors",
                                        isDark
                                            ? "border-slate-600 hover:bg-slate-700 text-slate-300"
                                            : "border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                                    )}>
                                    <div
                                        className={cx("p-2 rounded", isDark ? "bg-slate-600" : "bg-neutral-200")}>
                                        <svg className="h-4 w-4" fill="currentColor"
                                             viewBox="0 0 20 20">
                                            <path d="M4 3a2 2 0 00-2 2v1.5h16V5a2 2 0 00-2-2H4z"/>
                                            <path d="M2 8.5V15a2 2 0 002 2h12a2 2 0 002-2V8.5H2z"/>
                                        </svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm truncate">{file.file_name}</p>
                                        <p className={cx("text-xs", isDark ? "text-slate-400" : "text-neutral-500")}>
                                            {Math.round(file.file_size / 1024)} KB
                                        </p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Current Grade Display */}
                {answer.grade && (
                    <div className="mb-6">
                        <h4 className={cx("font-medium mb-3", isDark ? "text-slate-300" : "text-neutral-700")}>
                            Текущая оценка:
                        </h4>
                        <GradeDisplay grade={answer.grade} isDark={isDark}/>
                    </div>
                )}

                {/* Grading Interface */}
                {canEdit && answer.status !== "approved" ? (
                    <GradingInterface
                        answer={answer}
                        isDark={isDark}
                        submitting={submitting === "grade"}
                        onSubmit={onSubmitGrade}
                    />
                ) : isApproved && userRole === "admin" ? (
                    <AdminControls
                        isDark={isDark}
                        submitting={submitting === "reassign"}
                        onReassign={onReassign}
                    />
                ) : isApproved ? (
                    <ApprovedState
                        isDark={isDark}
                        onNext={onNext}
                    />
                ) : null}
            </div>
        </div>
    );
}

function GradeDisplay({grade, isDark}: { grade: Grade; isDark: boolean }) {
    if (!grade) return null;

    return (
        <div className={cx("rounded-lg border p-4",
            isDark ? "bg-slate-900 border-slate-600" : "bg-neutral-50 border-neutral-200")}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                    <div
                        className={cx("text-2xl font-bold", isDark ? "text-white" : "text-neutral-900")}>
                        {grade.score ?? "—"}<span
                        className="text-sm font-normal">/{grade.max_score}</span>
                    </div>
                    <div
                        className={cx("text-xs", isDark ? "text-slate-400" : "text-neutral-500")}>Баллы
                    </div>
                </div>
                <div className="text-center">
                    <div
                        className={cx("text-2xl font-bold", isDark ? "text-white" : "text-neutral-900")}>
                        {Math.round(grade.percentage)}%
                    </div>
                    <div
                        className={cx("text-xs", isDark ? "text-slate-400" : "text-neutral-500")}>Процент
                    </div>
                </div>
                <div className="text-center">
                    <div
                        className={cx("text-2xl font-bold inline-flex items-center justify-center w-12 h-12 rounded-full",
                            letterGradeColors(grade.letter_grade, isDark))}>
                        {grade.letter_grade}
                    </div>
                    <div
                        className={cx("text-xs mt-1", isDark ? "text-slate-400" : "text-neutral-500")}>Оценка
                    </div>
                </div>
            </div>
            {grade.feedback_text && (
                <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                    <p className={cx("text-sm", isDark ? "text-slate-300" : "text-neutral-700")}>
                        <strong>Комментарий:</strong> {grade.feedback_text}
                    </p>
                </div>
            )}
        </div>
    );
}

function GradingInterface({answer, isDark, submitting, onSubmit}: {
    answer: Answer;
    isDark: boolean;
    submitting: boolean;
    onSubmit: (status: "approve" | "flaws" | "reject", data: {
        score?: number | null;
        feedback_text?: string
    }) => void;
}) {
    const [selectedAction, setSelectedAction] = useState<"approve" | "flaws" | "reject">("approve");
    const [score, setScore] = useState<number | "">(answer.grade?.score ?? "");
    const [feedback, setFeedback] = useState<string>(answer.grade?.feedback_text ?? "");

    const maxScore = answer.grade?.max_score ?? 100;

    const handleSubmit = () => {
        onSubmit(selectedAction, {
            score: selectedAction === "approve" ? (score === "" ? null : Number(score)) : undefined,
            feedback_text: feedback.trim()
        });
    };

    const isValid = selectedAction !== "approve" || score !== "";

    return (
        <div className={cx("border-t pt-6", isDark ? "border-slate-700" : "border-neutral-200")}>
            <h4 className={cx("font-medium mb-4", isDark ? "text-slate-300" : "text-neutral-700")}>
                Проверка задания:
            </h4>

            {/* Action Selection */}
            <div className="flex flex-wrap gap-2 mb-6">
                <ActionButton
                    selected={selectedAction === "approve"}
                    onClick={() => setSelectedAction("approve")}
                    icon={<CheckCircle2 className="h-4 w-4"/>}
                    variant="success"
                    isDark={isDark}>
                    Принять
                </ActionButton>
                <ActionButton
                    selected={selectedAction === "flaws"}
                    onClick={() => setSelectedAction("flaws")}
                    icon={<HelpCircle className="h-4 w-4"/>}
                    variant="warning"
                    isDark={isDark}>
                    Нужны исправления
                </ActionButton>
                <ActionButton
                    selected={selectedAction === "reject"}
                    onClick={() => setSelectedAction("reject")}
                    icon={<XCircle className="h-4 w-4"/>}
                    variant="danger"
                    isDark={isDark}>
                    Отклонить
                </ActionButton>
            </div>

            {/* Score Input for Approval */}
            {selectedAction === "approve" && (
                <div className="mb-6">
                    <label className={cx("block text-sm font-medium mb-2",
                        isDark ? "text-slate-300" : "text-neutral-700")}>
                        Балл (0–{maxScore}) *
                    </label>
                    <input
                        type="number"
                        min={0}
                        max={maxScore}
                        value={score}
                        onChange={(e) => {
                            const val = e.target.value === "" ? "" : Math.max(0, Math.min(maxScore, Number(e.target.value)));
                            setScore(val as any);
                        }}
                        className={cx("w-full max-w-xs rounded-lg border px-3 py-2 focus:outline-none focus:ring-2",
                            isDark
                                ? "bg-slate-700 border-slate-600 text-slate-200 focus:ring-blue-500/30"
                                : "bg-white border-neutral-300 text-neutral-900 focus:ring-blue-500/30"
                        )}
                        placeholder={`Введите балл от 0 до ${maxScore}`}
                    />
                </div>
            )}

            {/* Feedback */}
            <div className="mb-6">
                <label className={cx("block text-sm font-medium mb-2",
                    isDark ? "text-slate-300" : "text-neutral-700")}>
                    Комментарий для студента
                </label>
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    className={cx("w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 resize-none",
                        isDark
                            ? "bg-slate-700 border-slate-600 text-slate-200 focus:ring-blue-500/30 placeholder-slate-400"
                            : "bg-white border-neutral-300 text-neutral-900 focus:ring-blue-500/30 placeholder-neutral-400"
                    )}
                    placeholder="Оставьте комментарий для студента (необязательно)"
                />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={!isValid || submitting}
                    className={cx("inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                        getSubmitButtonStyles(selectedAction, isDark)
                    )}>
                    {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin"/>
                    ) : (
                        getActionIcon(selectedAction)
                    )}
                    {getActionText(selectedAction)}
                </button>
            </div>
        </div>
    );
}

function AdminControls({isDark, submitting, onReassign}: {
    isDark: boolean;
    submitting: boolean;
    onReassign: () => void;
}) {
    return (
        <div className={cx("border-t pt-6", isDark ? "border-slate-700" : "border-neutral-200")}>
            <div className={cx("rounded-lg p-4 mb-4",
                isDark ? "bg-amber-900/20 border border-amber-700/30" : "bg-amber-50 border border-amber-200")}>
                <div className="flex items-center gap-2 mb-2">
                    <Award className={cx("h-5 w-5", isDark ? "text-amber-400" : "text-amber-600")}/>
                    <span
                        className={cx("font-medium", isDark ? "text-amber-300" : "text-amber-700")}>
                        Администраторские права
                    </span>
                </div>
                <p className={cx("text-sm", isDark ? "text-amber-200" : "text-amber-600")}>
                    Задание уже принято. Как администратор, вы можете переназначить это задание для
                    повторного выполнения.
                </p>
            </div>

            <button
                onClick={onReassign}
                disabled={submitting}
                className={cx("inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                    isDark
                        ? "bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                        : "bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
                )}>
                {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin"/>
                ) : (
                    <RotateCcw className="h-4 w-4"/>
                )}
                Переназначить задание
            </button>
        </div>
    );
}

function ApprovedState({isDark, onNext}: { isDark: boolean; onNext: () => void }) {
    return (
        <div className={cx("border-t pt-6", isDark ? "border-slate-700" : "border-neutral-200")}>
            <div className={cx("rounded-lg p-4 mb-4",
                isDark ? "bg-emerald-900/20 border border-emerald-700/30" : "bg-emerald-50 border border-emerald-200")}>
                <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2
                        className={cx("h-5 w-5", isDark ? "text-emerald-400" : "text-emerald-600")}/>
                    <span
                        className={cx("font-medium", isDark ? "text-emerald-300" : "text-emerald-700")}>
                        Задание принято
                    </span>
                </div>
                <p className={cx("text-sm", isDark ? "text-emerald-200" : "text-emerald-600")}>
                    Это задание уже проверено и принято. Только администратор может изменить статус.
                </p>
            </div>

            <button
                onClick={onNext}
                className={cx("inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                    isDark
                        ? "bg-slate-700 hover:bg-slate-600 text-slate-200"
                        : "bg-neutral-200 hover:bg-neutral-300 text-neutral-700"
                )}>
                Перейти к следующему
                <ChevronRight className="h-4 w-4"/>
            </button>
        </div>
    );
}

/* ===================================== */
/*          HELPER COMPONENTS            */

/* ===================================== */

function Avatar({url, size = "md"}: { url?: string | null; size?: "md" | "lg" }) {
    const {actualTheme} = useTheme();
    const isDark = actualTheme === "dark";

    const sizeClasses = size === "lg" ? "h-12 w-12" : "h-10 w-10";
    const iconSize = size === "lg" ? "h-6 w-6" : "h-5 w-5";

    if (!url) {
        return (
            <div className={cx(`${sizeClasses} flex items-center justify-center rounded-full`,
                isDark ? "bg-slate-700 text-slate-300" : "bg-neutral-200 text-neutral-700")}>
                <User2 className={iconSize}/>
            </div>
        );
    }
    return <img src={url} className={`${sizeClasses} rounded-full object-cover`} alt="Avatar"/>;
}

function StatusBadge({status, isDark, size = "md"}: {
    status?: Answer["status"];
    isDark: boolean;
    size?: "md" | "lg";
}) {
    const isLarge = size === "lg";
    const iconSize = isLarge ? "h-5 w-5" : "h-4 w-4";
    const textSize = isLarge ? "text-sm" : "text-xs";
    const padding = isLarge ? "px-3 py-2" : "px-2 py-1";

    const getStatusConfig = (s?: Answer["status"]) => {
        switch (s) {
            case "approved":
                return {
                    icon: <CheckCircle2 className={iconSize}/>,
                    label: "Принято",
                    classes: isDark
                        ? "bg-emerald-900/30 text-emerald-300 border border-emerald-700/50"
                        : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                };
            case "have_flaws":
                return {
                    icon: <HelpCircle className={iconSize}/>,
                    label: "Есть замечания",
                    classes: isDark
                        ? "bg-amber-900/30 text-amber-300 border border-amber-700/50"
                        : "bg-amber-100 text-amber-700 border border-amber-200"
                };
            case "rejected":
                return {
                    icon: <XCircle className={iconSize}/>,
                    label: "Отклонено",
                    classes: isDark
                        ? "bg-rose-900/30 text-rose-300 border border-rose-700/50"
                        : "bg-rose-100 text-rose-700 border border-rose-200"
                };
            case "in_review":
                return {
                    icon: <Clock className={iconSize}/>,
                    label: "На проверке",
                    classes: isDark
                        ? "bg-slate-700 text-slate-300 border border-slate-600"
                        : "bg-neutral-200 text-neutral-800 border border-neutral-300"
                };
            default:
                return {
                    icon: <Clock className={`${iconSize} opacity-50`}/>,
                    label: "Не отправлено",
                    classes: isDark
                        ? "bg-slate-700 text-slate-400 border border-slate-600"
                        : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <div
            className={cx(`inline-flex items-center gap-2 rounded-full font-medium ${padding} ${textSize}`, config.classes)}>
            {config.icon}
            <span>{config.label}</span>
        </div>
    );
}

function TaskTypeBadge({allowResubmit, isDark}: { allowResubmit: boolean; isDark: boolean }) {
    return (
        <span
            className={cx("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                allowResubmit
                    ? (isDark ? "bg-blue-900/30 text-blue-300 border border-blue-700/50" : "bg-blue-100 text-blue-700 border border-blue-200")
                    : (isDark ? "bg-slate-700 text-slate-300 border border-slate-600" : "bg-neutral-200 text-neutral-700 border border-neutral-300")
            )}>
            {allowResubmit ? "Можно переотправлять" : "Одна попытка"}
        </span>
    );
}

function ActionButton({selected, onClick, icon, variant, isDark, children}: {
    selected: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    variant: "success" | "warning" | "danger";
    isDark: boolean;
    children: React.ReactNode;
}) {
    const getStyles = () => {
        const base = "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all border-2";

        if (selected) {
            switch (variant) {
                case "success":
                    return `${base} ${isDark ? "bg-emerald-600 border-emerald-500 text-white" : "bg-emerald-500 border-emerald-400 text-white"}`;
                case "warning":
                    return `${base} ${isDark ? "bg-amber-600 border-amber-500 text-white" : "bg-amber-500 border-amber-400 text-white"}`;
                case "danger":
                    return `${base} ${isDark ? "bg-rose-600 border-rose-500 text-white" : "bg-rose-500 border-rose-400 text-white"}`;
            }
        } else {
            switch (variant) {
                case "success":
                    return `${base} ${isDark ? "border-emerald-700 text-emerald-300 hover:bg-emerald-900/20" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`;
                case "warning":
                    return `${base} ${isDark ? "border-amber-700 text-amber-300 hover:bg-amber-900/20" : "border-amber-200 text-amber-700 hover:bg-amber-50"}`;
                case "danger":
                    return `${base} ${isDark ? "border-rose-700 text-rose-300 hover:bg-rose-900/20" : "border-rose-200 text-rose-700 hover:bg-rose-50"}`;
            }
        }
    };

    return (
        <button onClick={onClick} className={getStyles()}>
            {icon}
            {children}
        </button>
    );
}

/* ===================================== */
/*          UTILITY FUNCTIONS            */

/* ===================================== */

function prettyStatus(status: Answer["status"]) {
    switch (status) {
        case "approved":
            return "Принято";
        case "have_flaws":
            return "Есть замечания";
        case "rejected":
            return "Отклонено";
        case "in_review":
            return "На проверке";
        default:
            return "—";
    }
}

function letterGradeColors(grade: string, isDark: boolean) {
    switch (grade) {
        case "A":
            return isDark ? "bg-emerald-900/30 text-emerald-300" : "bg-emerald-100 text-emerald-700";
        case "B":
            return isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700";
        case "C":
            return isDark ? "bg-amber-900/30 text-amber-300" : "bg-amber-100 text-amber-700";
        case "D":
            return isDark ? "bg-orange-900/30 text-orange-300" : "bg-orange-100 text-orange-700";
        default:
            return isDark ? "bg-rose-900/30 text-rose-300" : "bg-rose-100 text-rose-700";
    }
}

function getSubmitButtonStyles(action: "approve" | "flaws" | "reject", isDark: boolean) {
    switch (action) {
        case "approve":
            return isDark
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg";
        case "flaws":
            return isDark
                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
                : "bg-amber-500 hover:bg-amber-600 text-white shadow-lg";
        case "reject":
            return isDark
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-lg"
                : "bg-rose-500 hover:bg-rose-600 text-white shadow-lg";
    }
}

function getActionIcon(action: "approve" | "flaws" | "reject") {
    switch (action) {
        case "approve":
            return <CheckCircle2 className="h-4 w-4"/>;
        case "flaws":
            return <HelpCircle className="h-4 w-4"/>;
        case "reject":
            return <XCircle className="h-4 w-4"/>;
    }
}

function getActionText(action: "approve" | "flaws" | "reject") {
    switch (action) {
        case "approve":
            return "Принять задание";
        case "flaws":
            return "Отправить на исправления";
        case "reject":
            return "Отклонить задание";
    }
}