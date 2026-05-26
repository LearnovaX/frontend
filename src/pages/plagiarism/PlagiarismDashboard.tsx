import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, FileSearch, Loader2, Search, ShieldCheck } from "lucide-react";
import api from "@/api/api";
import { useTheme } from "@/components/common/ThemeContext";

type AssignmentSummary = {
    task_id: number;
    assignment_name: string;
    course_name: string;
    suspicious_reports: number;
    total_reports: number;
    highest_similarity_percent: number;
};

type DashboardData = {
    assignments: AssignmentSummary[];
    summary: {
        total_reports: number;
        flagged_reports: number;
        pending_review: number;
    };
    admin_metrics?: {
        submissions_analyzed_today: number;
        flagged_reports_count: number;
        failed_processing_count: number;
    };
};

type Report = {
    id: number;
    assignment_name: string;
    course_name: string;
    similarity_percent: number;
    flagged: boolean;
    review_status: "pending_review" | "false_positive" | "confirmed_suspicious";
    created_at: string;
    submission_a: { student_name: string; student_email: string };
    submission_b: { student_name: string; student_email: string };
};

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const statusLabel: Record<Report["review_status"], string> = {
    pending_review: "Requires Review",
    false_positive: "False Positive",
    confirmed_suspicious: "Confirmed Suspicious",
};

export default function PlagiarismDashboard() {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";
    const [searchParams, setSearchParams] = useSearchParams();
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");

    const taskId = searchParams.get("task_id") || "";

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");

        Promise.all([
            api.get<DashboardData>("plagiarism/dashboard/"),
            api.get<Report[]>("plagiarism/reports/", { params: taskId ? { task_id: taskId } : {} }),
        ])
            .then(([dashboardResponse, reportsResponse]) => {
                if (!active) return;
                setDashboard(dashboardResponse.data);
                setReports(reportsResponse.data || []);
            })
            .catch(() => active && setError("Could not load plagiarism reports."))
            .finally(() => active && setLoading(false));

        return () => {
            active = false;
        };
    }, [taskId]);

    const filteredReports = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return reports;
        return reports.filter((report) =>
            [
                report.assignment_name,
                report.course_name,
                report.submission_a.student_name,
                report.submission_b.student_name,
                report.submission_a.student_email,
                report.submission_b.student_email,
            ]
                .join(" ")
                .toLowerCase()
                .includes(needle)
        );
    }, [reports, query]);

    const selectTask = (id: number | "") => {
        const next = new URLSearchParams(searchParams);
        if (id) next.set("task_id", String(id));
        else next.delete("task_id");
        setSearchParams(next);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] grid place-items-center">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
            </div>
        );
    }

    return (
        <main className={cx("mx-auto w-full max-w-7xl px-4 py-6", isDark ? "text-slate-100" : "text-neutral-950")}>
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className={cx("text-sm", isDark ? "text-slate-400" : "text-neutral-500")}>Academic integrity</p>
                    <h1 className="text-2xl font-semibold tracking-normal">Potential Similarity Review</h1>
                </div>
                <div className={cx("rounded-lg border px-3 py-2 text-sm", isDark ? "border-slate-700 bg-slate-900 text-slate-300" : "border-neutral-200 bg-white text-neutral-700")}>
                    Similarity is a review signal, not a conclusion.
                </div>
            </div>

            {error && (
                <div className={cx("mb-5 rounded-lg border px-4 py-3 text-sm", isDark ? "border-red-900/60 bg-red-950/30 text-red-200" : "border-red-200 bg-red-50 text-red-800")}>
                    {error}
                </div>
            )}

            <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                <Metric label="Total reports" value={dashboard?.summary.total_reports ?? 0} isDark={isDark} />
                <Metric label="Flagged reports" value={dashboard?.summary.flagged_reports ?? 0} isDark={isDark} />
                <Metric label="Pending review" value={dashboard?.summary.pending_review ?? 0} isDark={isDark} />
            </section>

            {dashboard?.admin_metrics && (
                <section className={cx("mb-6 rounded-lg border p-4", isDark ? "border-slate-700 bg-slate-900" : "border-neutral-200 bg-white")}>
                    <div className="mb-3 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">Admin processing overview</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <Metric label="Analyzed today" value={dashboard.admin_metrics.submissions_analyzed_today} isDark={isDark} compact />
                        <Metric label="Flagged globally" value={dashboard.admin_metrics.flagged_reports_count} isDark={isDark} compact />
                        <Metric label="Processing failures" value={dashboard.admin_metrics.failed_processing_count} isDark={isDark} compact />
                    </div>
                </section>
            )}

            <section className={cx("mb-6 rounded-lg border", isDark ? "border-slate-700 bg-slate-900" : "border-neutral-200 bg-white")}>
                <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Assignments</h2>
                        <p className={cx("text-sm", isDark ? "text-slate-400" : "text-neutral-500")}>Grouped by assignment or exam.</p>
                    </div>
                    {taskId && (
                        <button
                            onClick={() => selectTask("")}
                            className={cx("rounded-md border px-3 py-2 text-sm", isDark ? "border-slate-600 hover:bg-slate-800" : "border-neutral-300 hover:bg-neutral-100")}
                        >
                            Show all reports
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className={cx(isDark ? "text-slate-400" : "text-neutral-500")}>
                            <tr className="border-b">
                                <th className="px-4 py-3 font-medium">Assignment</th>
                                <th className="px-4 py-3 font-medium">Course</th>
                                <th className="px-4 py-3 font-medium">Suspicious reports</th>
                                <th className="px-4 py-3 font-medium">Highest similarity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(dashboard?.assignments || []).map((item) => (
                                <tr
                                    key={item.task_id}
                                    onClick={() => selectTask(item.task_id)}
                                    className={cx("cursor-pointer border-b last:border-b-0", taskId === String(item.task_id) ? (isDark ? "bg-white/10" : "bg-neutral-100") : (isDark ? "hover:bg-white/5" : "hover:bg-neutral-50"))}
                                >
                                    <td className="px-4 py-3 font-medium">{item.assignment_name}</td>
                                    <td className="px-4 py-3">{item.course_name}</td>
                                    <td className="px-4 py-3">{item.suspicious_reports}</td>
                                    <td className="px-4 py-3">{item.highest_similarity_percent}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className={cx("rounded-lg border", isDark ? "border-slate-700 bg-slate-900" : "border-neutral-200 bg-white")}>
                <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                        <FileSearch className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">Reports</h2>
                    </div>
                    <label className={cx("flex items-center gap-2 rounded-md border px-3 py-2", isDark ? "border-slate-600 bg-slate-950" : "border-neutral-300 bg-white")}>
                        <Search className="h-4 w-4 text-neutral-500" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search student or assignment"
                            className="w-full bg-transparent text-sm outline-none md:w-72"
                        />
                    </label>
                </div>
                <ReportTable reports={filteredReports} isDark={isDark} />
            </section>
        </main>
    );
}

function Metric({ label, value, isDark, compact = false }: { label: string; value: number; isDark: boolean; compact?: boolean }) {
    return (
        <div className={cx("rounded-lg border", compact ? "p-3" : "p-4", isDark ? "border-slate-700 bg-slate-900" : "border-neutral-200 bg-white")}>
            <div className={cx("text-sm", isDark ? "text-slate-400" : "text-neutral-500")}>{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
    );
}

function ReportTable({ reports, isDark }: { reports: Report[]; isDark: boolean }) {
    if (!reports.length) {
        return (
            <div className={cx("flex items-center gap-2 p-6 text-sm", isDark ? "text-slate-400" : "text-neutral-500")}>
                <AlertCircle className="h-4 w-4" />
                No reports found.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
                <thead className={cx(isDark ? "text-slate-400" : "text-neutral-500")}>
                    <tr className="border-b">
                        <th className="px-4 py-3 font-medium">Student A</th>
                        <th className="px-4 py-3 font-medium">Student B</th>
                        <th className="px-4 py-3 font-medium">Similarity</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Created</th>
                        <th className="px-4 py-3 font-medium"></th>
                    </tr>
                </thead>
                <tbody>
                    {reports.map((report) => (
                        <tr key={report.id} className={cx("border-b last:border-b-0", isDark ? "hover:bg-white/5" : "hover:bg-neutral-50")}>
                            <td className="px-4 py-3">
                                <div className="font-medium">{report.submission_a.student_name}</div>
                                <div className={cx("text-xs", isDark ? "text-slate-500" : "text-neutral-500")}>{report.submission_a.student_email}</div>
                            </td>
                            <td className="px-4 py-3">
                                <div className="font-medium">{report.submission_b.student_name}</div>
                                <div className={cx("text-xs", isDark ? "text-slate-500" : "text-neutral-500")}>{report.submission_b.student_email}</div>
                            </td>
                            <td className="px-4 py-3 font-semibold">{report.similarity_percent}%</td>
                            <td className="px-4 py-3">{statusLabel[report.review_status]}</td>
                            <td className="px-4 py-3">{new Date(report.created_at).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                                <Link className={cx("rounded-md px-3 py-2 text-sm font-medium", isDark ? "bg-white text-neutral-950 hover:bg-slate-200" : "bg-neutral-950 text-white hover:bg-neutral-800")} to={`/plagiarism/reports/${report.id}`}>
                                    Review
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
