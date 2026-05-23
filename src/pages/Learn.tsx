import { User, Award, Trophy, Star, BookOpen, PlayCircle } from "lucide-react";
import { useTheme } from "@/components/common/ThemeContext";

// --- Types ---
type Achievement = {
    id: string | number;
    title: string;
    detail?: string;
    icon?: "award" | "trophy" | "star";
};

type Course = {
    id: string | number;
    title: string;
    cover?: string; // image url
    progress?: number; // 0..100
    status?: "in_progress" | "completed" | "paused";
};

type Props = {
    photoUrl?: string;
    name?: string;
    achievements?: Achievement[];
    courses?: Course[];
};

const iconMap = {
    award: Award,
    trophy: Trophy,
    star: Star,
};

export default function ProfileLite({
                                        photoUrl = "",
                                        name = "",
                                        achievements = [
                                            { id: 1, title: "Top Student", detail: "Q1 2025", icon: "trophy" },
                                            { id: 2, title: "100 Days Streak", detail: "Practice", icon: "star" },
                                            { id: 3, title: "Course Finisher", detail: "React Basics", icon: "award" },
                                        ],
                                        courses = [
                                            { id: 1, title: "Django REST Framework", progress: 72, status: "in_progress" },
                                            { id: 2, title: "Advanced React & Vite", progress: 45, status: "in_progress" },
                                            { id: 3, title: "DevOps for Beginners", progress: 100, status: "completed" },
                                        ],
                                    }: Props) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";

    return (
        <div className={`${isDark ? "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900" : "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"} px-4 py-10`}>
            <div className="mx-auto w-full max-w-5xl space-y-8">
                {/* Header with photo */}
                <header className={`relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl`}>
                    <div className={`${isDark ? "rounded-3xl bg-slate-800 p-8" : "rounded-3xl bg-white/10 backdrop-blur-sm p-8"}`}>
                        <div className="flex flex-col items-center text-center">
                            <div className="relative -mt-4 mb-4">
                                <div className={`${isDark ? "h-28 w-28 overflow-hidden rounded-full ring-4 ring-slate-700 shadow-xl bg-slate-700" : "h-28 w-28 overflow-hidden rounded-full ring-4 ring-white/60 shadow-xl bg-white/60"}`}>
                                    {photoUrl ? (
                                        <img
                                            src={photoUrl}
                                            alt="User"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <User className={`${isDark ? "h-10 w-10 text-slate-200" : "h-10 w-10 text-slate-500"}`} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {name && (
                                <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
                                    {name}
                                </h1>
                            )}
                            <p className={`${isDark ? "mt-2 text-sm text-slate-300" : "mt-2 text-sm text-white/80"}`}>
                                Welcome back! Track your achievements and keep learning.
                            </p>
                        </div>
                    </div>
                </header>

                {/* Two vertical blocks */}
                <section className="space-y-8">
                    {/* Achievements Block */}
                    <div className={`${isDark ? "rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-xl" : "rounded-3xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur-sm"}`}>
                        <div className="mb-4 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <h2 className={`${isDark ? "text-xl font-semibold text-slate-100" : "text-xl font-semibold text-slate-900"}`}>Достижения</h2>
                        </div>

                        {achievements.length === 0 ? (
                            <p className={`${isDark ? "text-slate-400" : "text-slate-600"}`}>Пока нет достижений.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {achievements.map((a) => {
                                    const Icon = a.icon ? (iconMap as any)[a.icon] : Award;
                                    return (
                                        <div
                                            key={a.id}
                                            className={`${isDark ? "group rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow" : "group rounded-2xl border border-slate-100 bg-white p-4 shadow hover:shadow-lg transition-shadow"}`}
                                        >
                                            <div className="mb-2 flex items-center gap-2">
                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${isDark ? "bg-amber-900/20" : "bg-gradient-to-br from-amber-100 to-yellow-100"}`}>
                          <Icon className={`${isDark ? "h-5 w-5 text-amber-300" : "h-5 w-5 text-yellow-600"}`} />
                        </span>
                                                <p className={`${isDark ? "font-medium text-slate-100" : "font-medium text-slate-900"}`}>{a.title}</p>
                                            </div>
                                            {a.detail && (
                                                <p className={`${isDark ? "text-slate-400" : "text-sm text-slate-600"}`}>{a.detail}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Courses Block */}
                    <div className={`${isDark ? "rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-xl" : "rounded-3xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur-sm"}`}>
                        <div className="mb-4 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                            <h2 className={`${isDark ? "text-xl font-semibold text-slate-100" : "text-xl font-semibold text-slate-900"}`}>Курсы</h2>
                        </div>

                        {courses.length === 0 ? (
                            <p className={`${isDark ? "text-slate-400" : "text-slate-600"}`}>Курсы не найдены.</p>
                        ) : (
                            <ul className="space-y-4">
                                {courses.map((c) => (
                                    <li
                                        key={c.id}
                                        className={`${isDark ? "flex gap-4 rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow" : "flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow hover:shadow-lg transition-shadow"}`}
                                    >
                                        {/* Cover */}
                                        <div className={`relative h-20 w-32 shrink-0 overflow-hidden rounded-xl ${isDark ? "bg-indigo-900/30" : "bg-gradient-to-br from-indigo-100 to-purple-100"}`}>
                                            {c.cover ? (
                                                <img
                                                    src={c.cover}
                                                    alt={c.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center opacity-70">
                                                    <PlayCircle className={`${isDark ? "h-8 w-8 text-slate-200" : "h-8 w-8"}`} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Meta */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className={`${isDark ? "truncate text-base font-semibold text-slate-100" : "truncate text-base font-semibold text-slate-900"}`}>
                                                    {c.title}
                                                </h3>
                                                <span
                                                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                                                        c.status === "completed"
                                                            ? (isDark ? "bg-emerald-900/30 text-emerald-300" : "bg-emerald-100 text-emerald-700")
                                                            : c.status === "paused"
                                                                ? (isDark ? "bg-amber-900/30 text-amber-300" : "bg-amber-100 text-amber-700")
                                                                : (isDark ? "bg-indigo-900/30 text-indigo-300" : "bg-indigo-100 text-indigo-700")
                                                    }`}
                                                >
                          {c.status === "completed"
                              ? "Завершен"
                              : c.status === "paused"
                                  ? "Пауза"
                                  : "В процессе"}
                        </span>
                                            </div>

                                            {/* Progress */}
                                            <div className="mt-2">
                                                <div className={`${isDark ? "h-2 w-full rounded-full bg-slate-700" : "h-2 w-full rounded-full bg-slate-100"}`}>
                                                    <div
                                                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                                                        style={{ width: `${Math.min(Math.max(c.progress ?? 0, 0), 100)}%` }}
                                                    />
                                                </div>
                                                <div className={`${isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-600"}`}>
                                                    Прогресс: {Math.min(Math.max(c.progress ?? 0, 0), 100)}%
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
