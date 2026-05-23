import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { ArrowLeft, Check, Loader2, Save, X } from "lucide-react";
import api from "@/api/api";
import { useTheme } from "@/components/common/ThemeContext";

type ReviewStatus = "pending_review" | "false_positive" | "confirmed_suspicious";

type Report = {
    id: number;
    assignment_name: string;
    course_name: string;
    similarity_percent: number;
    review_status: ReviewStatus;
    review_note: string;
    reviewed_by_name?: string | null;
    reviewed_at?: string | null;
    submission_a: { student_name: string; student_email: string };
    submission_b: { student_name: string; student_email: string };
};

type ComparisonPayload = {
    report: Report;
    diff_html: string;
    includes_ocr: boolean;
};

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const reviewOptions: Array<{ value: ReviewStatus; label: string }> = [
    { value: "pending_review", label: "Requires Review" },
    { value: "false_positive", label: "Dismiss False Positive" },
    { value: "confirmed_suspicious", label: "Confirm Suspicious" },
];

export default function PlagiarismReportDetail() {
    const { id } = useParams<{ id: string }>();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";
    const [payload, setPayload] = useState<ComparisonPayload | null>(null);
    const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("pending_review");
    const [reviewNote, setReviewNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        let active = true;
        setLoading(true);
        api.get<ComparisonPayload>(`plagiarism/reports/${id}/comparison/`)
            .then((response) => {
                if (!active) return;
                setPayload(response.data);
                setReviewStatus(response.data.report.review_status);
                setReviewNote(response.data.report.review_note || "");
            })
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [id]);

    const sanitizedDiff = useMemo(() => {
        return DOMPurify.sanitize(payload?.diff_html || "", {
            ADD_ATTR: ["summary"],
        });
    }, [payload?.diff_html]);

    const saveReview = async () => {
        setSaving(true);
        setMessage("");
        try {
            const response = await api.patch<Report>(`plagiarism/reports/${id}/review/`, {
                review_status: reviewStatus,
                review_note: reviewNote,
            });
            setPayload((current) => current ? { ...current, report: response.data } : current);
            setMessage("Review saved.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] grid place-items-center">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
            </div>
        );
    }

    if (!payload) {
        return (
            <main className="p-6">
                <Link to="/plagiarism" className="text-sm underline">Back to reports</Link>
                <p className="mt-4">Report not found.</p>
            </main>
        );
    }

    const report = payload.report;

    return (
        <main className={cx("mx-auto w-full max-w-7xl px-4 py-6", isDark ? "text-slate-100" : "text-neutral-950")}>
            <Link to="/plagiarism" className={cx("mb-5 inline-flex items-center gap-2 text-sm", isDark ? "text-slate-300 hover:text-white" : "text-neutral-600 hover:text-neutral-950")}>
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
            </Link>

            <section className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className={cx("text-sm", isDark ? "text-slate-400" : "text-neutral-500")}>{report.course_name}</p>
                    <h1 className="text-2xl font-semibold">{report.assignment_name}</h1>
                    <p className={cx("mt-2 text-sm", isDark ? "text-slate-400" : "text-neutral-600")}>
                        Potential Similarity Detected: <span className="font-semibold">{report.similarity_percent}%</span>
                    </p>
                </div>
                <div className={cx("rounded-lg border p-4 lg:w-[360px]", isDark ? "border-slate-700 bg-slate-900" : "border-neutral-200 bg-white")}>
                    <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
                        <StudentBlock label="Student A" name={report.submission_a.student_name} email={report.submission_a.student_email} isDark={isDark} />
                        <StudentBlock label="Student B" name={report.submission_b.student_name} email={report.submission_b.student_email} isDark={isDark} />
                    </div>
                    {payload.includes_ocr && (
                        <div className={cx("rounded-md border px-3 py-2 text-xs", isDark ? "border-amber-700/50 bg-amber-950/30 text-amber-100" : "border-amber-200 bg-amber-50 text-amber-900")}>
                            This comparison includes OCR-extracted text and may contain inaccuracies.
                        </div>
                    )}
                </div>
            </section>

            <section className={cx("mb-5 rounded-lg border p-4", isDark ? "border-slate-700 bg-slate-900" : "border-neutral-200 bg-white")}>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Review decision</h2>
                    {message && <span className="text-sm text-emerald-500">{message}</span>}
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[320px_1fr_auto]">
                    <select
                        value={reviewStatus}
                        onChange={(event) => setReviewStatus(event.target.value as ReviewStatus)}
                        className={cx("rounded-md border px-3 py-2 text-sm outline-none", isDark ? "border-slate-600 bg-slate-950 text-white" : "border-neutral-300 bg-white text-neutral-950")}
                    >
                        {reviewOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <input
                        value={reviewNote}
                        onChange={(event) => setReviewNote(event.target.value)}
                        placeholder="Optional note"
                        className={cx("rounded-md border px-3 py-2 text-sm outline-none", isDark ? "border-slate-600 bg-slate-950 text-white" : "border-neutral-300 bg-white text-neutral-950")}
                    />
                    <button
                        onClick={saveReview}
                        disabled={saving}
                        className={cx("inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60", isDark ? "bg-white text-neutral-950 hover:bg-slate-200" : "bg-neutral-950 text-white hover:bg-neutral-800")}
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save
                    </button>
                </div>
                <div className={cx("mt-3 flex flex-wrap gap-2 text-xs", isDark ? "text-slate-400" : "text-neutral-500")}>
                    <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" /> Teachers decide after review.</span>
                    <span className="inline-flex items-center gap-1"><X className="h-3 w-3" /> This page is never visible to students.</span>
                </div>
            </section>

            <section className={cx("rounded-lg border", isDark ? "border-slate-700 bg-slate-900" : "border-neutral-200 bg-white")}>
                <div className="border-b p-4">
                    <h2 className="text-lg font-semibold">Side-by-side comparison</h2>
                    <p className={cx("text-sm", isDark ? "text-slate-400" : "text-neutral-500")}>
                        Matching and changed sections are highlighted by the comparison engine.
                    </p>
                </div>
                <div className="overflow-auto p-4">
                    <div className={cx("plagiarism-diff text-sm", isDark && "plagiarism-diff-dark")} dangerouslySetInnerHTML={{ __html: sanitizedDiff }} />
                </div>
            </section>

            <style>{`
                .plagiarism-diff table.diff { width: 100%; border-collapse: collapse; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
                .plagiarism-diff .diff_header { background: ${isDark ? "#111827" : "#f5f5f5"}; color: ${isDark ? "#d1d5db" : "#404040"}; padding: 6px; border: 1px solid ${isDark ? "#334155" : "#e5e5e5"}; }
                .plagiarism-diff td { vertical-align: top; padding: 5px 7px; border: 1px solid ${isDark ? "#334155" : "#e5e5e5"}; white-space: pre-wrap; word-break: break-word; }
                .plagiarism-diff .diff_next { display: none; }
                .plagiarism-diff .diff_add { background: ${isDark ? "rgba(22, 101, 52, .35)" : "#dcfce7"}; }
                .plagiarism-diff .diff_chg { background: ${isDark ? "rgba(180, 83, 9, .35)" : "#fef3c7"}; }
                .plagiarism-diff .diff_sub { background: ${isDark ? "rgba(127, 29, 29, .35)" : "#fee2e2"}; }
            `}</style>
        </main>
    );
}

function StudentBlock({ label, name, email, isDark }: { label: string; name: string; email: string; isDark: boolean }) {
    return (
        <div>
            <div className={cx("text-xs", isDark ? "text-slate-500" : "text-neutral-500")}>{label}</div>
            <div className="font-medium">{name}</div>
            <div className={cx("truncate text-xs", isDark ? "text-slate-400" : "text-neutral-500")}>{email}</div>
        </div>
    );
}
