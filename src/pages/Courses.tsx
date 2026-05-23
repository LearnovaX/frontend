import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Plus,
    List as ListIcon,
    LayoutGrid,
    Search as SearchIcon,
    ChevronDown,
    Loader2,
    X,
    PencilLine,
    Download,
    MoreVertical,
    Trash2,
    UserX,
    UserCheck,
    ArrowUpAZ,
    ArrowDownAZ,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";
import { useTheme } from "@/components/common/ThemeContext";
import { useTranslation } from "react-i18next";

/* ------------ Types ------------ */
type Category = { id: number; name: string; parent_category: number | null };
type UserMini = { id: number; first_name: string; last_name: string; email: string };
type Course = {
    id: number;
    name: string;
    description: string;
    author?: UserMini | null;
    free_order: boolean;
    category?: Category | null;
    image?: string | null;
    deadline_to_finish_course?: string | null;
    block_course_after_deadline: boolean;
    is_certificated: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    role: "Admin" | "Teacher" | "Student" | "Not enrolled";
    can_manage_tasks: boolean;
    allow_teachers_to_manage_tasks: boolean;
};
type CourseStats = {
    course_id: number;
    students_count: number;
    teachers_count: number;
    groups_count: number;
    tasks_count: number;
};

const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : "—");
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

function useDebounce<T>(value: T, delay = 400) {
    const [d, setD] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setD(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return d;
}

function useOutsideClick<T extends HTMLElement>(
    ref: React.RefObject<T | null>,
    onOutside: () => void
) {
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onOutside();
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onOutside, ref]);
}

function StatusPill({ children }: { children: React.ReactNode }) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    return (
        <span className={`ml-2 inline-flex items-center rounded-full border px-2 py-[2px] text-[11px] font-medium ${
            isDark
                ? 'border-rose-700/30 bg-rose-900/20 text-rose-300'
                : 'border-rose-200 bg-rose-50 text-rose-700'
        }`}>
      {children}
    </span>
    );
}

/* =================== Fancy UI atoms =================== */

type OptionValue = string | number;
type FancyOption = { label: string; value: OptionValue };

function FancySelect({
                         value,
                         onChange,
                         options,
                         placeholder = "Выберите…",
                         className,
                         disabled,
                         widthClass = "w-[220px]",
                     }: {
    value: OptionValue | null | undefined;
    onChange: (v: OptionValue | null) => void;
    options: FancyOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    widthClass?: string;
}) {
    const [open, setOpen] = useState(false);
    const [focusIndex, setFocusIndex] = useState<number>(-1);
    const rootRef = useRef<HTMLDivElement | null>(null);
    useOutsideClick(rootRef, () => setOpen(false));
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    const selected = options.find((o) => o.value === value) || null;

    function toggle() {
        if (disabled) return;
        setOpen((o) => !o);
        setFocusIndex(
            Math.max(
                0,
                selected ? options.findIndex((o) => o.value === selected.value) : 0
            )
        );
    }

    function selectAt(i: number) {
        const opt = options[i];
        if (!opt) return;
        onChange(opt.value);
        setOpen(false);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (disabled) return;
        if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setOpen(true);
            setFocusIndex(Math.max(0, selected ? options.findIndex((o) => o.value === selected.value) : 0));
            return;
        }
        if (!open) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusIndex((i) => Math.min(options.length - 1, i + 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusIndex((i) => Math.max(0, i - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            selectAt(focusIndex);
        } else if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
        }
    }

    return (
        <div ref={rootRef} className={cx("relative", className)} onKeyDown={handleKeyDown}>
            <button
                type="button"
                className={cx(
                    "group inline-flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.99] focus:outline-none focus:ring-2",
                    widthClass,
                    disabled && "opacity-60 pointer-events-none",
                    isDark
                        ? "border-slate-700 bg-slate-800 text-slate-200 focus:ring-slate-500/30"
                        : "border-neutral-200 bg-white text-neutral-900 focus:ring-black/10"
                )}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={toggle}
            >
        <span className={cx("line-clamp-1 text-left", !selected && (isDark ? "text-slate-400" : "text-neutral-400"))}>
          {selected ? selected.label : placeholder}
        </span>
                <ChevronDown size={16} className={cx("transition-transform duration-200", open ? "rotate-180" : "rotate-0")} />
            </button>

            {open && (
                <div
                    role="listbox"
                    className={`absolute z-20 mt-2 max-h-[280px] overflow-auto rounded-2xl border shadow-xl animate-scaleInSm ${widthClass} ${
                        isDark
                            ? "border-slate-700 bg-slate-800 text-slate-200"
                            : "border-neutral-200 bg-white text-neutral-900"
                    }`}
                >
                    {options.map((opt, i) => {
                        const isSel = value === opt.value;
                        const isFocus = i === focusIndex;
                        return (
                            <div
                                key={String(opt.value)}
                                role="option"
                                aria-selected={isSel}
                                className={cx(
                                    "flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors",
                                    isFocus ? (isDark ? "bg-slate-700" : "bg-neutral-50") : (isDark ? "bg-slate-800" : "bg-white"),
                                    isDark ? "hover:bg-slate-700" : "hover:bg-neutral-50"
                                )}
                                onMouseEnter={() => setFocusIndex(i)}
                                onClick={() => selectAt(i)}
                            >
                                <span className="line-clamp-1">{opt.label}</span>
                                {isSel && (
                                    <span className={`ml-2 inline-flex items-center justify-center rounded-full border px-2 py-[2px] text-[11px] ${
                                        isDark
                                            ? "border-slate-600 text-slate-300"
                                            : "border-neutral-200 text-neutral-700"
                                    }`}>
                    Выбрано
                  </span>
                                )}
                            </div>
                        );
                    })}
                    {!options.length && <div className="px-3 py-2 text-sm text-neutral-500">Нет вариантов</div>}
                </div>
            )}
        </div>
    );
}

function DirectionToggle({
                             value,
                             onChange,
                         }: {
    value: "asc" | "desc";
    onChange: (v: "asc" | "desc") => void;
}) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';
    const isAsc = value === "asc";

    return (
        <div className={`relative inline-flex select-none items-center rounded-xl border p-1 text-sm ${
            isDark ? "border-slate-700 bg-slate-800" : "border-neutral-200 bg-white"
        }`}>
            <button
                type="button"
                onClick={() => onChange("asc")}
                className={cx("relative z-10 rounded-lg px-3 py-1.5 transition-all duration-200 focus:outline-none",
                    isAsc ? "text-white" : (isDark ? "text-slate-300" : "text-neutral-700"),
                    isAsc ? (isDark ? "bg-slate-600" : "bg-black") : ""
                )}
                title="По возрастанию"
            >
        <span className="inline-flex items-center gap-1">
          <ArrowUpAZ size={16} />
          A→Я
        </span>
            </button>
            <button
                type="button"
                onClick={() => onChange("desc")}
                className={cx("relative z-10 rounded-lg px-3 py-1.5 transition-all duration-200 focus:outline-none",
                    !isAsc ? "text-white" : (isDark ? "text-slate-300" : "text-neutral-700"),
                    !isAsc ? (isDark ? "bg-slate-600" : "bg-black") : ""
                )}
                title="По убыванию"
            >
        <span className="inline-flex items-center gap-1">
          <ArrowDownAZ size={16} />
          Я→A
        </span>
            </button>
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

/* ======================================================= */

export default function Courses() {
    const navigate = useNavigate();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';
    const { t } = useTranslation();

    /* --------- helper to open edit and prevent row/card click --------- */
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const goToCourseEdit = (id: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setOpenMenuId(null);
        navigate(`/courses/${id}/edit`);
    };

    /* --------- View --------- */
    const [display, setDisplay] = useState<"list" | "block">("block");

    /* --------- Data --------- */
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [statsMap, setStatsMap] = useState<Record<number, CourseStats>>({});
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* --------- Search & filters --------- */
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search);
    const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");

    /* --------- Ordering --------- */
    type OrderKey = "name" | "created_at" | "updated_at" | "author" | "category" | "students_count";
    const [orderBy, setOrderBy] = useState<OrderKey>("name");
    const [direction, setDirection] = useState<"asc" | "desc">("asc");

    /* --------- Menus / Modals --------- */
    const [openAddCourse, setOpenAddCourse] = useState(false);
    const [openEditCourse, setOpenEditCourse] = useState<null | Course>(null);
    const [openAddCategory, setOpenAddCategory] = useState(false);
    const [openEditCategory, setOpenEditCategory] = useState<null | Category>(null);
    const [openExport, setOpenExport] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<null | Course>(null);
    const [confirmDeactivate, setConfirmDeactivate] = useState<null | Course>(null);
    const [confirmActivate, setConfirmActivate] = useState<null | Course>(null);

    /* --------- Forms --------- */
    type CourseForm = {
        name: string;
        description: string;
        category: number | "";
        image?: File | null;
        free_order: boolean;
        is_certificated: boolean;
        block_course_after_deadline: boolean;
        allow_teachers_to_manage_tasks: boolean;
    };
    const emptyCourse: CourseForm = {
        name: "",
        description: "",
        category: "",
        image: null,
        free_order: true,
        is_certificated: true,
        block_course_after_deadline: false,
        allow_teachers_to_manage_tasks: false,
    };
    const [newCourse, setNewCourse] = useState<CourseForm>(emptyCourse);
    const [editCourse, setEditCourse] = useState<CourseForm>(emptyCourse);

    const [newCategory, setNewCategory] = useState<{ name: string; parent_category: number | "" }>({
        name: "",
        parent_category: "",
    });
    const [editCategory, setEditCategory] = useState<{ name: string; parent_category: number | "" }>({
        name: "",
        parent_category: "",
    });

    /* =================== Data Fetch =================== */
    useEffect(() => {
        let mounted = true;
        api
            .get("course/categories/")
            .then((r) => mounted && setCategories(r.data || []))
            .catch(() => mounted && setCategories([]));
        return () => {
            mounted = false;
        };
    }, []);

    const loadCourses = async () => {
        const params: Record<string, any> = {};
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (categoryFilter !== "all") params.category = categoryFilter;
        setLoading(true);
        setError(null);
        try {
            const r = await api.get("course/courses/", { params });
            setCourses(r.data || []);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Не удалось загрузить курсы");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadCourses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, categoryFilter]);

    // one-shot statistics for all courses
    const loadStats = async () => {
        setLoadingStats(true);
        try {
            const r = await api.get("course/courses/statistics/");
            const list: CourseStats[] = r.data || [];
            const map: Record<number, CourseStats> = {};
            list.forEach((s) => (map[s.course_id] = s));
            setStatsMap(map);
        } catch {
            setStatsMap({});
        } finally {
            setLoadingStats(false);
        }
    };
    useEffect(() => {
        loadStats();
    }, []);

    // outside click to close any action menu (search by attribute)
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const el = e.target as HTMLElement;
            if (!el.closest('[data-menu-root="true"]')) setOpenMenuId(null);
        };
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);

    /* =================== Ordering =================== */
    const viewCourses = useMemo(() => {
        const arr = [...courses];
        const key = (c: Course) => {
            switch (orderBy) {
                case "name":
                    return c.name || "";
                case "created_at":
                    return c.created_at || "";
                case "updated_at":
                    return c.updated_at || "";
                case "author":
                    return `${c.author?.last_name || ""} ${c.author?.first_name || ""}`.trim();
                case "category":
                    return c.category?.name || "";
                case "students_count":
                    return statsMap[c.id]?.students_count ?? 0;
                default:
                    return "";
            }
        };
        arr.sort((a, b) => {
            const A = key(a), B = key(b);
            if (orderBy === "students_count") {
                const nA = Number(A), nB = Number(B);
                return direction === "asc" ? nA - nB : nB - nA;
            }
            const sA = String(A).toLowerCase();
            const sB = String(B).toLowerCase();
            if (sA < sB) return direction === "asc" ? -1 : 1;
            if (sA > sB) return direction === "asc" ? 1 : -1;
            return 0;
        });
        return arr;
    }, [courses, orderBy, direction, statsMap]);

    const isAdmin = useMemo(() => courses.length > 0 && courses[0].role === 'Admin', [courses]);

    const activateCourse = async (course: Course) => {
        try {
            await api.post(`course/courses/${course.id}/activate/`);
            setConfirmActivate(null);
            await loadCourses();
            await loadStats();
        } catch (e: any) {
            alert(e?.response?.data?.detail || "Не удалось активировать курс");
        }
    };

    /* =================== Export (backend) =================== */
    const handleExport = async (fileType: "csv" | "xlsx") => {
        try {
            const resp = await api.get("course/courses/export-courses/", {
                params: { file_type: fileType },
                responseType: "blob",
            });
            let filename = `courses.${fileType}`;
            const disp = resp.headers["content-disposition"];
            if (disp) {
                const m = /filename="?([^"]+)"?/.exec(disp);
                if (m?.[1]) filename = m[1];
            }
            const url = URL.createObjectURL(resp.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            setOpenExport(false);
        } catch (e: any) {
            alert(e?.response?.data?.detail || "Экспорт не удался");
        }
    };

    /* =================== Create / Edit Course =================== */
    const submitCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append("name", newCourse.name);
        fd.append("description", newCourse.description);
        if (newCourse.category !== "") fd.append("category", String(newCourse.category));
        fd.append("free_order", String(newCourse.free_order));
        fd.append("is_certificated", String(newCourse.is_certificated));
        fd.append("block_course_after_deadline", String(newCourse.block_course_after_deadline));
        fd.append("allow_teachers_to_manage_tasks", String(newCourse.allow_teachers_to_manage_tasks));
        if (newCourse.image) fd.append("image", newCourse.image);
        try {
            await api.post("course/courses/", fd, { headers: { "Content-Type": "multipart/form-data" } });
            setOpenAddCourse(false);
            setNewCourse({ ...emptyCourse });
            await loadCourses();
            await loadStats();
        } catch (err: any) {
            alert(err?.response?.data?.detail || "Не удалось создать курс");
        }
    };

    const openCourseEditor = (c: Course) => {
        setEditCourse({
            name: c.name,
            description: c.description,
            category: c.category?.id ?? "",
            image: null,
            free_order: c.free_order,
            is_certificated: c.is_certificated,
            block_course_after_deadline: c.block_course_after_deadline,
            allow_teachers_to_manage_tasks: c.allow_teachers_to_manage_tasks || false,
        });
        setOpenEditCourse(c);
    };

    const submitEditCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!openEditCourse) return;
        const fd = new FormData();
        fd.append("name", editCourse.name);
        fd.append("description", editCourse.description);
        if (editCourse.category !== "") fd.append("category", String(editCourse.category));
        fd.append("free_order", String(editCourse.free_order));
        fd.append("is_certificated", String(editCourse.is_certificated));
        fd.append("block_course_after_deadline", String(editCourse.block_course_after_deadline));
        fd.append("allow_teachers_to_manage_tasks", String(editCourse.allow_teachers_to_manage_tasks));
        if (editCourse.image) fd.append("image", editCourse.image);
        try {
            await api.patch(`course/courses/${openEditCourse.id}/`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setOpenEditCourse(null);
            await loadCourses();
            await loadStats();
        } catch (err: any) {
            alert(err?.response?.data?.detail || "Не удалось обновить курс");
        }
    };

    /* =================== Category Create / Edit =================== */
    const submitCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("course/categories/", {
                name: newCategory.name,
                parent_category: newCategory.parent_category || null,
            });
            setOpenAddCategory(false);
            setNewCategory({ name: "", parent_category: "" });
            const r = await api.get("course/categories/");
            setCategories(r.data || []);
            await loadCourses();
        } catch (err: any) {
            alert(err?.response?.data?.detail || "Не удалось создать категорию");
        }
    };

    const openCategoryEditor = (cat: Category) => {
        setEditCategory({ name: cat.name, parent_category: cat.parent_category ?? "" });
        setOpenEditCategory(cat);
    };

    const submitEditCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!openEditCategory) return;
        try {
            await api.patch(`course/categories/${openEditCategory.id}/`, {
                name: editCategory.name,
                parent_category: editCategory.parent_category || null,
            });
            setOpenEditCategory(null);
            const r = await api.get("course/categories/");
            setCategories(r.data || []);
            await loadCourses();
        } catch (err: any) {
            alert(err?.response?.data?.detail || "Не удалось обновить категорию");
        }
    };

    /* =================== Deactivate / Delete =================== */
    const deactivateCourse = async (course: Course) => {
        try {
            await api.post(`course/courses/${course.id}/deactivate/`);
            setConfirmDeactivate(null);
            await loadCourses();
            await loadStats();
        } catch (e: any) {
            alert(e?.response?.data?.detail || "Не удалось деактивировать курс");
        }
    };

    const deleteCourse = async (course: Course) => {
        try {
            await api.delete(`course/courses/${course.id}/`);
            setConfirmDelete(null);
            await loadCourses();
            await loadStats();
        } catch (e: any) {
            alert(e?.response?.data?.detail || "Не удалось удалить курс");
        }
    };

    /* =================== UI =================== */
    return (
        <div
            className={`mx-auto max-w-[1400px] space-y-6 py-6 antialiased ${
                isDark ? "bg-slate-900 text-slate-100" : "bg-white text-neutral-900"
            }`}
        >
            {/* Global tiny enhancements */}
            <style>{`
        button, [role="button"], a { cursor: pointer; transition: transform .18s ease, opacity .18s ease, background-color .18s ease, color .18s ease; }
        button:hover:not(:disabled), [role="button"]:hover { transform: translateY(-1px); }
        button:active:not(:disabled), [role="button"]:active { transform: translateY(0); }
        @keyframes fadeIn { from { opacity: 0 } to { opacity 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: translateY(6px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        .animate-fadeIn { animation: fadeIn .18s ease-out both; }
        .animate-scaleIn { animation: scaleIn .22s cubic-bezier(.2,.8,.2,1) both; }
        .animate-scaleInSm { animation: scaleIn .16s cubic-bezier(.2,.8,.2,1) both; }
        .form-grid .cell { min-height: 40px; }
      `}</style>

            {/* Header */}
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{t('courses.title')}</h1>
                    <p className={`text-[0.9rem] ${isDark ? "text-slate-400" : "text-neutral-500"}`}>{t('courses.subtitle')}</p>
                </div>

                {isAdmin && (
                    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
                        {/* Search */}
                        <div className="relative w-full sm:w-auto">
                            <SearchIcon className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                                isDark ? "text-slate-400" : "text-neutral-400"
                            }`} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('courses.searchPlaceholder')}
                                className={`w-full rounded-xl border px-9 py-2 text-sm focus:outline-none focus:ring-2 ${
                                    isDark
                                        ? "border-slate-700 bg-slate-800 text-slate-200 focus:ring-slate-500/30"
                                        : "border-neutral-200 bg-white text-neutral-900 focus:ring-black/10"
                                }`}
                            />
                        </div>

                        {/* Display toggle */}
                        <div className={`flex overflow-hidden rounded-xl border ${
                            isDark ? "border-slate-700" : "border-neutral-200"
                        }`}>
                            <button
                                className={cx(
                                    "flex items-center gap-1 px-3 py-2 text-sm transition-colors",
                                    display === "list"
                                        ? (isDark ? "bg-slate-600 text-white" : "bg-black text-white")
                                        : (isDark ? "bg-slate-800 text-slate-300" : "bg-white text-neutral-700")
                                )}
                                onClick={() => setDisplay("list")}
                                title={t('courses.displayList')}
                            >
                                <ListIcon size={16} /> {t('courses.displayList')}
                            </button>
                            <button
                                className={cx(
                                    "flex items-center gap-1 px-3 py-2 text-sm transition-colors",
                                    display === "block"
                                        ? (isDark ? "bg-slate-600 text-white" : "bg-black text-white")
                                        : (isDark ? "bg-slate-800 text-slate-300" : "bg-white text-neutral-700")
                                )}
                                onClick={() => setDisplay("block")}
                                title={t('courses.displayBlocks')}
                            >
                                <LayoutGrid size={16} /> {t('courses.displayBlocks')}
                            </button>
                        </div>

                        {/* Export chooser */}
                        <button
                            onClick={() => setOpenExport(true)}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                                isDark
                                    ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                                    : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
                            }`}
                        >
                            <Download size={16} />
                            {t('common.export')}
                        </button>

                        {/* Add course */}
                        <button
                            onClick={() => setOpenAddCourse(true)}
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                        >
                            <Plus size={16} /> {t('courses.addCourse')}
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <FancySelect
                    value={categoryFilter === "all" ? "all" : categoryFilter}
                    onChange={(v) => setCategoryFilter((v === "all" ? "all" : (Number(v) as number)) as any)}
                    options={[
                        { label: t('courses.allCategories'), value: "all" },
                        ...categories.map((c) => ({ label: c.name, value: c.id })),
                    ]}
                    widthClass="w-full sm:w-[240px]"
                />

                <div className="flex items-center gap-2">
                    <FancySelect
                        value={orderBy}
                        onChange={(v) => setOrderBy(v as any)}
                        options={[
                            { value: "name", label: t('courses.orderName') },
                            { value: "created_at", label: t('courses.orderCreatedAt') },
                            { value: "updated_at", label: t('courses.orderUpdatedAt') },
                            { value: "author", label: t('courses.orderAuthor') },
                            { value: "category", label: t('courses.orderCategory') },
                            { value: "students_count", label: t('courses.orderStudentsCount') },
                        ]}
                        widthClass="w-full sm:w-[220px]"
                    />
                    <DirectionToggle value={direction} onChange={setDirection} />
                </div>

                <div className={`ml-auto text-sm ${isDark ? "text-slate-400" : "text-neutral-500"}`}>
                    {t('courses.coursesCount')}: <span className={`font-medium ${isDark ? "text-slate-200" : "text-neutral-800"}`}>{courses.length}</span>
                </div>
            </div>

            {/* Content */}
            <div className={`rounded-2xl border p-2 sm:p-3 ${
                isDark ? "border-slate-700 bg-slate-800" : "border-neutral-200 bg-white"
            }`}>
                {loading ? (
                    <div className={`flex h-40 items-center justify-center gap-2 ${
                        isDark ? "text-slate-400" : "text-neutral-500"
                    }`}>
                        <Loader2 className="animate-spin" /> {t('courses.loadingCourses')}
                    </div>
                ) : error ? (
                    <div className={`p-6 text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>{error}</div>
                ) : !viewCourses.length ? (
                    <div className={`p-6 text-sm ${isDark ? "text-slate-400" : "text-neutral-500"}`}>{t('common.noData')}</div>
                ) : display === "list" ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className={`border-b text-left ${
                                isDark ? "border-slate-700 text-slate-400" : "border-neutral-200 text-neutral-500"
                            }`}>
                                <th className="px-3 py-3">{t('courses.course')}</th>
                                <th className="px-3 py-3">{t('courses.category')}</th>
                                <th className="px-3 py-3">{t('courses.author')}</th>
                                <th className="px-3 py-3">{t('courses.students')}</th>
                                <th className="px-3 py-3">{t('courses.created')}</th>
                                <th className="px-3 py-3">{t('courses.updated')}</th>
                                <th className="px-3 py-3">{t('courses.actions')}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {viewCourses.map((c) => (
                                <tr
                                    key={c.id}
                                    className={`border-b last:border-b-0 cursor-pointer ${
                                        isDark
                                            ? "border-slate-700 hover:bg-slate-700/30"
                                            : "border-neutral-200 hover:bg-neutral-50/60"
                                    }`}
                                    onClick={() => c.role !== 'Not enrolled' ? navigate(`/courses/${c.id}`) : null}
                                >
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-10 w-14 items-center justify-center overflow-hidden rounded-lg ${
                                                isDark ? "bg-slate-700" : "bg-neutral-100"
                                            }`}>
                                                {c.image ? (
                                                    <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className={`text-[10px] ${
                                                        isDark ? "text-slate-400" : "text-neutral-400"
                                                    }`}>{t('courses.noImage')}</span>
                                                )}
                                            </div>
                                            <div className={`flex items-center font-medium ${
                                                isDark ? "text-slate-100" : "text-neutral-900"
                                            }`}>
                                                {c.name}
                                                {!c.is_active && <StatusPill>{t('courses.deactivated')}</StatusPill>}
                                            </div>
                                        </div>
                                    </td>

                                    <td className={`px-3 py-3 ${isDark ? "text-slate-300" : "text-neutral-700"}`}>
                                        {c.category?.name ?? "—"}
                                    </td>
                                    <td className={`px-3 py-3 ${isDark ? "text-slate-300" : "text-neutral-700"}`}>
                                        {(c.author && `${c.author.first_name ?? ""} ${c.author.last_name ?? ""}`.trim()) || "—"}
                                    </td>
                                    <td className={`px-3 py-3 ${isDark ? "text-slate-300" : "text-neutral-700"}`}>
                                        {loadingStats ? <span className={isDark ? "text-slate-400" : "text-neutral-400"}>…</span> : statsMap[c.id]?.students_count ?? 0}
                                    </td>
                                    <td className={`px-3 py-3 ${isDark ? "text-slate-300" : "text-neutral-700"}`}>
                                        {fmtDate(c.created_at)}
                                    </td>
                                    <td className={`px-3 py-3 ${isDark ? "text-slate-300" : "text-neutral-700"}`}>
                                        {fmtDate(c.updated_at)}
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="relative inline-block" data-menu-root="true">
                                            <button
                                                className={`rounded-2xl border p-2.5 shadow-sm transition-colors ${
                                                    isDark
                                                        ? "border-slate-700 bg-slate-800 hover:bg-slate-700"
                                                        : "border-neutral-200 bg-white hover:bg-neutral-50"
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // prevent row navigation
                                                    setOpenMenuId((id) => (id === c.id ? null : c.id));
                                                }}
                                                title={t('courses.actions')}
                                            >
                                                <MoreVertical size={18} className={isDark ? "text-slate-300" : "text-neutral-700"} />
                                            </button>
                                            {openMenuId === c.id && isAdmin && (
                                                <div
                                                    className={`absolute right-0 z-10 mt-2 w-60 overflow-hidden rounded-2xl border shadow-xl animate-scaleInSm ${
                                                        isDark
                                                            ? "border-slate-700 bg-slate-800 text-slate-200"
                                                            : "border-neutral-200 bg-white text-neutral-900"
                                                    }`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        className={`flex w-full items-center gap-2 px-4 py-3 text-[0.95rem] transition-colors text-left ${
                                                            isDark
                                                                ? "hover:bg-slate-700"
                                                                : "hover:bg-neutral-50"
                                                        }`}
                                                        onClick={(e) => goToCourseEdit(c.id, e)}
                                                    >
                                                        <PencilLine size={18} /> {t('common.edit')}
                                                    </button>
                                                    {c.is_active ? (
                                                        <button
                                                            className={`flex w-full items-center gap-2 px-4 py-3 text-[0.95rem] transition-colors text-left ${
                                                                isDark
                                                                    ? "text-amber-400 hover:bg-slate-700"
                                                                    : "text-amber-700 hover:bg-neutral-50"
                                                            }`}
                                                            onClick={() => {
                                                                setOpenMenuId(null);
                                                                setConfirmDeactivate(c);
                                                            }}
                                                        >
                                                            <UserX size={18} /> {t('courses.deactivate')}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className={`flex w-full items-center gap-2 px-4 py-3 text-[0.95rem] transition-colors text-left ${
                                                                isDark
                                                                    ? "text-emerald-400 hover:bg-slate-700"
                                                                    : "text-emerald-700 hover:bg-neutral-50"
                                                            }`}
                                                            onClick={() => {
                                                                setOpenMenuId(null);
                                                                setConfirmActivate(c);
                                                            }}
                                                        >
                                                            <UserCheck size={18} /> {t('courses.activate')}
                                                        </button>
                                                    )}

                                                    <button
                                                        className={`flex w-full items-center gap-2 px-4 py-3 text-[0.95rem] transition-colors text-left ${
                                                            isDark
                                                                ? "text-red-400 hover:bg-slate-700"
                                                                : "text-red-600 hover:bg-neutral-50"
                                                        }`}
                                                        onClick={() => {
                                                            setOpenMenuId(null);
                                                            setConfirmDelete(c);
                                                        }}
                                                    >
                                                        <Trash2 size={18} /> {t('common.delete')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    // Block view
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                        {viewCourses.map((c) => (
                            <div
                                key={c.id}
                                role="button"
                                onClick={() => c.role !== 'Not enrolled' ? navigate(`/courses/${c.id}`) : null}
                                className={`overflow-hidden rounded-2xl border transition-shadow hover:shadow-lg cursor-pointer ${
                                    isDark
                                        ? "border-slate-700 bg-slate-800 hover:shadow-slate-700/20"
                                        : "border-neutral-200 bg-white hover:shadow-neutral-200/50"
                                }`}
                            >
                                <div className={`relative h-40 ${isDark ? "bg-slate-700" : "bg-neutral-100"}`}>
                                    {c.image ? (
                                        <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className={`flex h-full items-center justify-center text-[11px] ${
                                            isDark ? "text-slate-400" : "text-neutral-400"
                                        }`}>
                                            {t('courses.noImage')}
                                        </div>
                                    )}
                                    {!c.is_active && (
                                        <div className={`absolute left-2 top-2 rounded-full border px-2 py-[2px] text-[11px] font-medium ${
                                            isDark
                                                ? "border-rose-700/30 bg-rose-900/20 text-rose-300"
                                                : "border-rose-200 bg-rose-50 text-rose-700"
                                        }`}>
                                            {t('courses.deactivated')}
                                        </div>
                                    )}
                                    {/* 3-dots menu */}
                                    {isAdmin && (
                                        <div className="absolute right-2 top-2" data-menu-root="true">
                                            <button
                                                className={`rounded-2xl border p-2.5 shadow-sm transition-colors ${
                                                    isDark
                                                        ? "border-slate-600 bg-slate-700/90 hover:bg-slate-600"
                                                        : "border-neutral-200 bg-white/90 hover:bg-white"
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // prevent card navigation
                                                    setOpenMenuId((id) => (id === c.id ? null : c.id));
                                                }}
                                                title={t('courses.actions')}
                                            >
                                                <MoreVertical size={18} className={isDark ? "text-slate-300" : "text-neutral-700"} />
                                            </button>
                                            {openMenuId === c.id && (
                                                <div
                                                    className={`absolute right-0 z-10 mt-2 w-60 overflow-hidden rounded-2xl border shadow-xl animate-scaleInSm ${
                                                        isDark
                                                            ? "border-slate-700 bg-slate-800 text-slate-200"
                                                            : "border-neutral-200 bg-white text-neutral-900"
                                                    }`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        className={`flex w-full items-center gap-2 px-4 py-3 text-[0.95rem] transition-colors text-left ${
                                                            isDark
                                                                ? "hover:bg-slate-700"
                                                                : "hover:bg-neutral-50"
                                                        }`}
                                                        onClick={(e) => goToCourseEdit(c.id, e)}
                                                    >
                                                        <PencilLine size={18} /> {t('common.edit')}
                                                    </button>
                                                    {c.is_active ? (
                                                        <button
                                                            className={`flex w-full items-center gap-2 px-4 py-3 text-[0.95rem] transition-colors text-left ${
                                                                isDark
                                                                    ? "text-amber-400 hover:bg-slate-700"
                                                                    : "text-amber-700 hover:bg-neutral-50"
                                                            }`}
                                                            onClick={() => {
                                                                setOpenMenuId(null);
                                                                setConfirmDeactivate(c);
                                                            }}
                                                        >
                                                            <UserX size={18} /> {t('courses.deactivate')}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className={`flex w-full items-center gap-2 px-4 py-3 text-[0.95rem] transition-colors text-left ${
                                                                isDark
                                                                    ? "text-emerald-400 hover:bg-slate-700"
                                                                    : "text-emerald-700 hover:bg-neutral-50"
                                                            }`}
                                                            onClick={() => {
                                                                setOpenMenuId(null);
                                                                setConfirmActivate(c);
                                                            }}
                                                        >
                                                            <UserCheck size={18} /> {t('courses.activate')}
                                                        </button>
                                                    )}

                                                    <button
                                                        className={`flex w-full items-center gap-2 px-4 py-3 text-[0.95rem] transition-colors text-left ${
                                                            isDark
                                                                ? "text-red-400 hover:bg-slate-700"
                                                                : "text-red-600 hover:bg-neutral-50"
                                                        }`}
                                                        onClick={() => {
                                                            setOpenMenuId(null);
                                                            setConfirmDelete(c);
                                                        }}
                                                    >
                                                        <Trash2 size={18} /> {t('common.delete')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 p-3">
                                    <div className={`line-clamp-2 font-medium ${
                                        isDark ? "text-slate-100" : "text-neutral-900"
                                    }`}>{c.name}</div>
                                    <div className={`text-xs ${isDark ? "text-slate-400" : "text-neutral-500"}`}>
                                        {c.category?.name ?? t('courses.noCategory')}
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <div className={`text-xs ${isDark ? "text-slate-400" : "text-neutral-600"}`}>
                                            👥 {statsMap[c.id]?.students_count ?? (loadingStats ? "…" : 0)} • 📝{" "}
                                            {statsMap[c.id]?.tasks_count ?? (loadingStats ? "…" : 0)}
                                        </div>
                                        <div className={`text-[11px] ${isDark ? "text-slate-500" : "text-neutral-400"}`}>
                                            {fmtDate(c.updated_at)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Categories (only for admins) */}
            {isAdmin && (
                <div>
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <h2 className="text-lg font-semibold">{t('courses.categories')}</h2>
                        <button
                            onClick={() => setOpenAddCategory(true)}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                                isDark
                                    ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                                    : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
                            }`}
                        >
                            <Plus size={16} /> {t('courses.addCategory')}
                        </button>
                    </div>
                    <div className={`rounded-2xl border p-2 sm:p-3 ${
                        isDark ? "border-slate-700 bg-slate-800" : "border-neutral-200 bg-white"
                    }`}>
                        {!categories.length ? (
                            <div className={`p-6 text-sm ${isDark ? "text-slate-400" : "text-neutral-500"}`}>{t('courses.noCategories')}</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr className={`border-b text-left ${
                                        isDark ? "border-slate-700 text-slate-400" : "border-neutral-200 text-neutral-500"
                                    }`}>
                                        <th className="px-3 py-3">{t('courses.name')}</th>
                                        <th className="px-3 py-3 text-right">{t('courses.actions')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {categories.map((cat) => (
                                        <tr key={cat.id} className={`border-b last:border-b-0 ${
                                            isDark ? "border-slate-700" : "border-neutral-200"
                                        }`}>
                                            <td className={`px-3 py-3 ${isDark ? "text-slate-200" : "text-neutral-900"}`}>{cat.name}</td>
                                            <td className="px-3 py-3 text-right">
                                                <button
                                                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-colors ${
                                                        isDark
                                                            ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                                                            : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
                                                    }`}
                                                    onClick={() => openCategoryEditor(cat)}
                                                    title={t('courses.editCategory')}
                                                >
                                                    <PencilLine size={16} /> {t('common.edit')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ----------------- Modals ----------------- */}
            {openAddCourse && isAdmin && (
                <ModalShell title={t('courses.newCourse')} onClose={() => setOpenAddCourse(false)} wide isDark={isDark}>
                    <CourseFormView
                        mode="create"
                        course={newCourse}
                        setCourse={setNewCourse}
                        categories={categories}
                        onCancel={() => setOpenAddCourse(false)}
                        onSubmit={submitCreateCourse}
                        isDark={isDark}
                    />
                </ModalShell>
            )}

            {openEditCourse && isAdmin && (
                <ModalShell title={`${t('common.edit')} — ${openEditCourse.name}`} onClose={() => setOpenEditCourse(null)} wide isDark={isDark}>
                    <CourseFormView
                        mode="edit"
                        course={editCourse}
                        setCourse={setEditCourse}
                        categories={categories}
                        onCancel={() => setOpenEditCourse(null)}
                        onSubmit={submitEditCourse}
                        isDark={isDark}
                    />
                </ModalShell>
            )}

            {openAddCategory && isAdmin && (
                <CategoryModal
                    title={t('courses.newCategory')}
                    values={newCategory}
                    setValues={setNewCategory}
                    categories={categories}
                    onCancel={() => setOpenAddCategory(false)}
                    onSubmit={submitCreateCategory}
                    isDark={isDark}
                />
            )}

            {openEditCategory && isAdmin && (
                <CategoryModal
                    title={`${t('common.edit')} — ${openEditCategory.name}`}
                    values={editCategory}
                    setValues={setEditCategory}
                    categories={categories}
                    onCancel={() => setOpenEditCategory(null)}
                    onSubmit={submitEditCategory}
                    isDark={isDark}
                />
            )}

            {openExport && isAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 animate-fadeIn bg-black/30 backdrop-blur-sm" onClick={() => setOpenExport(false)} />
                    <div className={`relative z-10 w-[min(380px,92vw)] animate-scaleIn rounded-2xl border shadow-xl ${
                        isDark ? "border-slate-700 bg-slate-800" : "border-neutral-200 bg-white"
                    }`}>
                        <div className={`flex items-center justify-between border-b p-4 ${
                            isDark ? "border-slate-700" : "border-neutral-200"
                        }`}>
                            <h3 className="font-semibold">{t('courses.exportCourses')}</h3>
                            <button className={`rounded-lg p-1 ${
                                isDark ? "hover:bg-slate-700" : "hover:bg-neutral-100"
                            }`} onClick={() => setOpenExport(false)}>
                                <X size={18} className={isDark ? "text-slate-300" : "text-neutral-700"} />
                            </button>
                        </div>
                        <div className="space-y-3 p-4">
                            <p className={`text-sm ${isDark ? "text-slate-400" : "text-neutral-600"}`}>{t('courses.chooseFormat')}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleExport("csv")}
                                    className={`flex-1 rounded-xl border px-4 py-2 transition-colors duration-200 ${
                                        isDark
                                            ? "border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600"
                                            : "border-neutral-200 bg-white text-neutral-900 hover:bg-black hover:text-white"
                                    }`}
                                >
                                    CSV
                                </button>
                                <button
                                    onClick={() => handleExport("xlsx")}
                                    className={`flex-1 rounded-xl border px-4 py-2 transition-colors duration-200 ${
                                        isDark
                                            ? "border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600"
                                            : "border-neutral-200 bg-white text-neutral-900 hover:bg-black hover:text-white"
                                    }`}
                                >
                                    XLSX
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {confirmDeactivate && isAdmin && (
                <ConfirmModal
                    title={t('courses.confirmDeactivateTitle')}
                    description={t('courses.confirmDeactivateDesc', { name: confirmDeactivate.name })}
                    confirmText={t('courses.deactivate')}
                    confirmColor={isDark ? "rgb(245, 158, 11)" : "rgb(245, 158, 11)"} // amber
                    onCancel={() => setConfirmDeactivate(null)}
                    onConfirm={() => deactivateCourse(confirmDeactivate)}
                    isDark={isDark}
                />
            )}

            {confirmDelete && isAdmin && (
                <ConfirmModal
                    title={t('courses.confirmDeleteTitle')}
                    description={t('courses.confirmDeleteDesc', { name: confirmDelete.name })}
                    confirmText={t('common.delete')}
                    confirmColor={isDark ? "rgb(239, 68, 68)" : "rgb(239, 68, 68)"} // red
                    onCancel={() => setConfirmDelete(null)}
                    onConfirm={() => deleteCourse(confirmDelete)}
                    isDark={isDark}
                />
            )}

            {confirmActivate && isAdmin && (
                <ConfirmModal
                    title={t('courses.confirmActivateTitle')}
                    description={t('courses.confirmActivateDesc', { name: confirmActivate.name })}
                    confirmText={t('courses.activate')}
                    confirmColor={isDark ? "rgb(34, 197, 94)" : "rgb(34, 197, 94)"} // green
                    onCancel={() => setConfirmActivate(null)}
                    onConfirm={() => activateCourse(confirmActivate)}
                    isDark={isDark}
                />
            )}
        </div>
    );
}

/* ---------- Reusable subviews ---------- */

function CourseFormView({
                            mode,
                            course,
                            setCourse,
                            categories,
                            onCancel,
                            onSubmit,
                            isDark = false,
                        }: {
    mode: "create" | "edit";
    course: CourseForm;
    setCourse: React.Dispatch<React.SetStateAction<CourseForm>>;
    categories: Category[];
    onCancel: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isDark?: boolean;
}) {
    const { t } = useTranslation();
    const catOptions: FancyOption[] = [
        { label: t('courses.noCategory'), value: "" },
        ...categories.map((c) => ({ label: c.name, value: c.id })),
    ];
    const catValue: OptionValue | null = course.category === "" ? "" : Number(course.category);

    return (
        <form onSubmit={onSubmit} className="form-grid grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            <div className="cell space-y-1">
                <label className={`text-sm ${isDark ? "text-slate-300" : "text-neutral-700"}`}>{t('courses.name')}</label>
                <input
                    required
                    value={course.name}
                    onChange={(e) => setCourse((s) => ({ ...s, name: e.target.value }))}
                    className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 ${
                        isDark
                            ? "border-slate-700 bg-slate-800 text-slate-200 focus:ring-slate-500/30"
                            : "border-neutral-200 bg-white text-neutral-900 focus:ring-black/10"
                    }`}
                    placeholder={t('courses.namePlaceholder')}
                />
            </div>

            <div className="cell space-y-1">
                <label className={`text-sm ${isDark ? "text-slate-300" : "text-neutral-700"}`}>{t('courses.category')}</label>
                <FancySelect
                    value={catValue}
                    onChange={(v) =>
                        setCourse((s) => ({
                            ...s,
                            category: v === "" || v === null ? "" : Number(v),
                        }))
                    }
                    options={catOptions}
                    widthClass="w-full"
                />
            </div>

            <div className="cell space-y-1 md:col-span-2">
                <label className={`text-sm ${isDark ? "text-slate-300" : "text-neutral-700"}`}>{t('courses.description')}</label>
                <textarea
                    required
                    value={course.description}
                    onChange={(e) => setCourse((s) => ({ ...s, description: e.target.value }))}
                    className={`min-h-28 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 ${
                        isDark
                            ? "border-slate-700 bg-slate-800 text-slate-200 focus:ring-slate-500/30"
                            : "border-neutral-200 bg-white text-neutral-900 focus:ring-black/10"
                    }`}
                    placeholder={t('courses.descriptionPlaceholder')}
                />
            </div>

            <div className="cell space-y-1">
                <label className={`text-sm ${isDark ? "text-slate-300" : "text-neutral-700"}`}>
                    {t('courses.image')} {mode === "edit" && <span className={isDark ? "text-slate-400" : "text-neutral-400"}> ({t('courses.optional')})</span>}
                </label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCourse((s) => ({ ...s, image: e.target.files?.[0] || null }))}
                    className={`w-full rounded-xl border px-3 py-2 ${isDark ? "border-slate-700 bg-slate-800 text-slate-200" : "border-neutral-200 bg-white text-neutral-900"}`}
                />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:col-span-2">
                <ToggleSwitch
                    checked={course.free_order}
                    onChange={(v) => setCourse((s) => ({ ...s, free_order: v }))}
                    label={t('courses.freeOrder')}
                    id="free_order"
                />
                <ToggleSwitch
                    checked={course.is_certificated}
                    onChange={(v) => setCourse((s) => ({ ...s, is_certificated: v }))}
                    label={t('courses.certification')}
                    id="is_certificated"
                />
                <ToggleSwitch
                    checked={course.block_course_after_deadline}
                    onChange={(v) => setCourse((s) => ({ ...s, block_course_after_deadline: v }))}
                    label={t('courses.blockAfterDeadline')}
                    id="block_course_after_deadline"
                />
                <ToggleSwitch
                    checked={course.allow_teachers_to_manage_tasks}
                    onChange={(v) => setCourse((s) => ({ ...s, allow_teachers_to_manage_tasks: v }))}
                    label={t('courses.allowTeachersManageTasks')}
                    id="allow_teachers_to_manage_tasks"
                />
            </div>

            <div className="cell md:col-span-2 flex justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className={`rounded-xl border px-4 py-2 text-sm ${
                        isDark
                            ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                            : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
                    }`}
                >
                    {t('common.cancel')}
                </button>
                <button
                    type="submit"
                    className={`rounded-xl px-4 py-2 text-sm text-white ${
                        isDark ? "bg-blue-600 hover:bg-blue-700" : "bg-black hover:bg-gray-800"
                    }`}
                >
                    {mode === "create" ? t('common.create') : t('common.save')}
                </button>
            </div>
        </form>
    );
}

function ModalShell({
                        title,
                        onClose,
                        children,
                        wide = false,
                        isDark = false,
                    }: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    wide?: boolean;
    isDark?: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 animate-fadeIn bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div
                className={cx(
                    "relative z-10 animate-scaleIn rounded-2xl shadow-xl",
                    wide ? "w-[90vw] sm:w-[70vw] max-w-[1200px]" : "w-[90vw] sm:w-[min(560px,95vw)]",
                    isDark
                        ? "border-slate-700 bg-slate-800"
                        : "border-neutral-200 bg-white"
                )}
            >
                <div className={`h-[3px] w-full bg-gradient-to-r ${
                    isDark
                        ? "from-slate-700 via-slate-600 to-slate-700"
                        : "from-neutral-200 via-neutral-300 to-neutral-200"
                }`} />
                <div className="flex items-center justify-between p-4">
                    <h3 className={`font-semibold ${isDark ? "text-slate-200" : "text-neutral-900"}`}>{title}</h3>
                    <button className={`rounded-lg p-1 ${
                        isDark ? "hover:bg-slate-700" : "hover:bg-neutral-100"
                    }`} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function CategoryModal({
                           title,
                           values,
                           setValues,
                           categories,
                           onCancel,
                           onSubmit,
                           isDark = false,
                       }: {
    title: string;
    values: { name: string; parent_category: number | "" };
    setValues: React.Dispatch<React.SetStateAction<{ name: string; parent_category: number | "" }>>;
    categories: Category[];
    onCancel: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isDark?: boolean;
}) {
    const { t } = useTranslation();
    return (
        <ModalShell title={title} onClose={onCancel} isDark={isDark}>
            <form onSubmit={onSubmit} className="space-y-3 p-4">
                <div className="space-y-1">
                    <label className={`text-sm ${isDark ? "text-slate-300" : "text-neutral-700"}`}>{t('courses.name')}</label>
                    <input
                        required
                        value={values.name}
                        onChange={(e) => setValues((s) => ({ ...s, name: e.target.value }))}
                        className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 ${
                            isDark
                                ? "border-slate-700 bg-slate-800 text-slate-200 focus:ring-slate-500/30"
                                : "border-neutral-200 bg-white text-neutral-900 focus:ring-black/10"
                        }`}
                        placeholder={t('courses.categoryPlaceholder')}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className={`rounded-xl border px-4 py-2 text-sm ${
                            isDark
                                ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                                : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
                        }`}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        className={`rounded-xl px-4 py-2 text-sm text-white ${
                            isDark ? "bg-blue-600 hover:bg-blue-700" : "bg-black hover:bg-gray-800"
                        }`}
                    >
                        {t('common.save')}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

function ConfirmModal({
                          title,
                          description,
                          confirmText,
                          confirmColor = "black",
                          onCancel,
                          onConfirm,
                          isDark = false,
                      }: {
    title: string;
    description: string;
    confirmText: string;
    confirmColor?: string;
    onCancel: () => void;
    onConfirm: () => void;
    isDark?: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 animate-fadeIn bg-black/30 backdrop-blur-sm" onClick={onCancel} />
            <div className={`relative z-10 w-[min(480px,92vw)] animate-scaleIn rounded-2xl border p-6 shadow-xl ${
                isDark ? "border-slate-700 bg-slate-800" : "border-neutral-200 bg-white"
            }`}>
                <h3 className={`text-lg font-semibold ${isDark ? "text-slate-200" : "text-neutral-900"}`}>{title}</h3>
                <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-neutral-600"}`}>{description}</p>
                <div className="mt-4 flex justify-end gap-2">
                    <button
                        className={`rounded-xl border px-4 py-2 text-sm ${
                            isDark
                                ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                                : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
                        }`}
                        onClick={onCancel}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        className={`rounded-xl px-4 py-2 text-sm text-white ${isDark ? "bg-blue-600 hover:bg-blue-700" : "bg-black hover:bg-gray-800"}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
