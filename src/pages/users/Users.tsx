// src/pages/users/Users.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Search,
    Plus,
    Upload,
    Download,
    Loader2, ListIcon, LayoutGrid,
} from "lucide-react";

import api from "@/api/api";
import { useTheme } from '@/components/common/ThemeContext';
import StudentViewModal from "@/components/admin/UserStudentViewModal";
import { useTranslation } from "react-i18next";
import UserStatistics from "./components/UserStatistics";
import UserFilters from "./components/UserFilters";
import UserList from "./components/UserList";
import UserGrid from "./components/UserGrid";
import Pagination from "./components/Pagination";
import CreateUserModal from "./components/CreateUserModal";
import EditUserModal from "./components/EditUserModal";
import DeleteUserModal from "./components/DeleteUserModal";
import BulkActionsModal from "./components/BulkActionsModal";
import ExportModal from "./components/ExportModal";
import ActionResultModal from "./components/ActionResultModal";
import GeneralUsersChart from "./components/GeneralUsersChart";
import EnrolledUsersChart from "./components/EnrolledUsersChart";
import AuthorizedUsersChart from "./components/AuthorizedUsersChart";
import DailyGrowthChart from "./components/DailyGrowthChart";
import ChartModalWrapper from "./components/ChartModalWrapper";

// Types (kept here for now, could move to types.ts)
interface UserProfile {
    interface_language: string | null;
    timezone: string | null;
    birth_date: string | null;
    profile_edit_blocked: boolean;
    deactivation_time: string | null;
    days_to_delete: number | null;
    phone_number: string | null;
    company: string | null;
    profile_photo: string | null;
    updated_at: string;
}

type BackendStatus =
    | "Authorized"
    | "Unauthorized"
    | "Awaiting deletion"
    | "Deactivated"
    | string;

interface UserItem {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
    date_joined: string;
    last_login: string | null;
    profile: UserProfile;
    status: BackendStatus;
}

interface CreateUserData {
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    profile?: {
        phone_number?: string | null;
        company?: string | null;
        birth_date?: string | null;
        middle_name?: string | null;
        interface_language?: string | null;
        timezone?: string | null;
        profile_edit_blocked?: boolean;
        deactivation_time?: string | null;
        days_to_delete_after_deactivation?: number | null;
    };
}

interface ApiResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: UserItem[];
}

interface Statistics {
    total_users: number;
    active_users: number;
    inactive_users: number;
    authorized_users: number;
    not_authorized_users: number;
    users_last_day: number;
    users_last_7_days: number;
    users_last_30_days: number;
    deactivated_users_last_day?: number;
    deactivated_users_last_7_days?: number;
    deactivated_users_last_30_days?: number;
    complete_profile_users?: number;
    email_verified_rate?: number;
    google_login_count?: number;
    direct_signup_count?: number;
    role_statistics: Record<string, number>;
    available_roles: { value: string; label: string }[];
    enrolled_users: number;
}

interface CourseGroupLight {
    id: number;
    name?: string;
    title?: string;
    group_name?: string;
    course?: { id: number; title?: string; name?: string };
    teacher?: { id: number; first_name?: string; last_name?: string; email?: string };
    members_count?: number;
}

type StatusOption = "" | "authorized" | "not_authorized" | "deactivated" | "active";

type OrderField =
    | "last_name"
    | "first_name"
    | "email"
    | "date_joined"
    | "last_login"
    | "role"
    | "is_active"
    | "email_verified";


function toDateInputValue(isoOrDate: string | null | undefined): string {
    if (!isoOrDate) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)) return isoOrDate;
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}


function normalizePayload(data: CreateUserData): CreateUserData {
    const clone: CreateUserData = JSON.parse(JSON.stringify(data || {}));

    if (clone.profile) {
        const keys: (keyof NonNullable<CreateUserData["profile"]>)[] = [
            "phone_number",
            "company",
            "birth_date",
            "middle_name",
            "interface_language",
            "timezone",
            "deactivation_time",
        ];
        keys.forEach((k) => {
            const val = clone.profile?.[k] as any;
            if (val === "") (clone.profile as any)[k] = null;
        });

        if (clone.profile.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(clone.profile.birth_date)) {
            const d = new Date(clone.profile.birth_date);
            clone.profile.birth_date = isNaN(d.getTime()) ? null : toDateInputValue(d.toISOString());
        }

        if (clone.profile.deactivation_time && !/^\d{4}-\d{2}-\d{2}T/.test(clone.profile.deactivation_time)) {
            const d = new Date(clone.profile.deactivation_time);
            clone.profile.deactivation_time = isNaN(d.getTime()) ? null : d.toISOString();
        }
    }

    return clone;
}

const DEFAULT_CREATE_FORM: CreateUserData = {
    email: "",
    first_name: "",
    last_name: "",
    role: "student",
    profile: {
        phone_number: "",
        company: "",
        birth_date: "",
        middle_name: "",
        interface_language: "",
        timezone: "",
        profile_edit_blocked: false,
        deactivation_time: null,
        days_to_delete_after_deactivation: null,
    },
};

function cloneDefaultCreateForm(): CreateUserData {
    return JSON.parse(JSON.stringify(DEFAULT_CREATE_FORM));
}

const STATUS_BADGE: Record<string, { text: string; className: string; darkClassName: string }> = {
    Authorized: {
        text: "Авторизован",
        className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        darkClassName: "bg-emerald-900/30 text-emerald-300 ring-1 ring-emerald-700"
    },
    Unauthorized: {
        text: "Не авторизован",
        className: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
        darkClassName: "bg-sky-900/30 text-sky-300 ring-1 ring-sky-700"
    },
    "Awaiting deletion": {
        text: "Ожидает удаления",
        className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        darkClassName: "bg-amber-900/30 text-amber-300 ring-1 ring-amber-700"
    },
    Deactivated: {
        text: "Деактивирован",
        className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
        darkClassName: "bg-rose-900/30 text-rose-300 ring-1 ring-rose-700"
    },
};

const DEBOUNCE_MS = 450;

function useDebounced<T>(value: T, delay = DEBOUNCE_MS) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

export default function Users() {
    const { t } = useTranslation();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState<Statistics | null>(null);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusOption>("");
    const [groupIds, setGroupIds] = useState<number[]>([]);

    const [groupOptions, setGroupOptions] = useState<MultiOption[]>([]);
    const [groupsLoading, setGroupsLoading] = useState(false);

    const [orderField, setOrderField] = useState<OrderField>("last_name");
    const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc");

    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize, setPageSize] = useState(50);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [historicalData, setHistoricalData] = useState<any>(null);
    const [chartsLoading, setChartsLoading] = useState(false);
    const [bulkExportFormat, setBulkExportFormat] = useState<'csv' | 'xlsx'>('csv');

    const [showResultModal, setShowResultModal] = useState(false);
    const [resultTitle, setResultTitle] = useState('');
    const [resultMessage, setResultMessage] = useState('');
    const [resultWarning, setResultWarning] = useState('');
    const [isResultError, setIsResultError] = useState(false);

    const [deleteMode, setDeleteMode] = useState<"soft" | "hard">("soft");

    const [createForm, setCreateForm] = useState<CreateUserData>(cloneDefaultCreateForm());

    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [bulkAction, setBulkAction] = useState("");

    const [displayMode, setDisplayMode] = useState<"list" | "grid">("list");

    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const importInputRef = useRef<HTMLInputElement | null>(null);

    const debouncedSearch = useDebounced(search);
    const debouncedStatus = useDebounced(statusFilter);
    const debouncedRole = useDebounced(roleFilter);
    const debouncedGroups = useDebounced(groupIds);
    const debouncedOrderField = useDebounced(orderField);
    const debouncedOrderDir = useDebounced(orderDirection);
    const debouncedPageSize = useDebounced(pageSize);
    const debouncedPage = useDebounced(currentPage);
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    const pageRootRef = useRef<HTMLDivElement | null>(null);
    const [isStudentViewOpen, setIsStudentViewOpen] = useState(false);
    const [viewUser, setViewUser] = useState<UserItem | null>(null);

    const STATUS_OPTIONS: { value: StatusOption; label: string }[] = [
        {value: "", label: t('status.all')},
        {value: "authorized", label: t('status.authorized')},
        {value: "not_authorized", label: t('status.notAuthorized')},
        {value: "deactivated", label: t('status.deactivated')},
        {value: "active", label: t('status.activeOnly')},
    ];

    const openStudentView = (u: UserItem) => {
        setViewUser(u);
        setIsStudentViewOpen(true);
    };

    const closeStudentView = () => {
        setIsStudentViewOpen(false);
        setTimeout(() => setViewUser(null), 200);
    };

    useEffect(() => {
        pageRootRef.current?.scrollIntoView({behavior: "auto", block: "start"});
    }, [pageSize, currentPage, displayMode]);

    const roleLabels: Record<string, string> = useMemo(() => {
        if (!statistics?.available_roles?.length) return {
            student: t('roles.student'),
            teacher: t('roles.teacher'),
            admin: t('roles.admin'),
        };
        return statistics.available_roles.reduce<Record<string, string>>((acc, r) => {
            acc[r.value] = r.label;
            return acc;
        }, {} as Record<string, string>);
    }, [statistics?.available_roles, t]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setGroupsLoading(true);
                const res = await api.get<any>("accounts/user-management/groups/");
                if (cancelled) return;
                const groups: CourseGroupLight[] = res?.data?.groups ?? [];
                const mapped: MultiOption[] = groups.map((g) => {
                    const gName = g.name || g.group_name || g.title || `${t('groups.group')} #${g.id}`;
                    const courseName = g.course?.title || g.course?.name || "";
                    const teacherName = g.teacher ? [g.teacher.first_name, g.teacher.last_name].filter(Boolean).join(" ") : "";
                    const extraParts = [courseName, teacherName, g.members_count != null ? `${t('groups.members')}: ${g.members_count}` : ""]
                        .filter(Boolean)
                        .join(" · ");
                    return {value: g.id, label: gName, extra: extraParts || undefined};
                });
                setGroupOptions(mapped);
            } catch (e) {
                console.error("Failed to load groups:", e);
                setGroupOptions([]);
            } finally {
                setGroupsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [t]);

    const listAbortRef = useRef<AbortController | null>(null);

    const buildFilterParams = (opts?: { includePaging?: boolean }) => {
        const params = new URLSearchParams();

        if (debouncedSearch) params.append("search", debouncedSearch);
        if (debouncedRole) params.append("role", debouncedRole);

        if (["authorized", "not_authorized", "deactivated"].includes(debouncedStatus)) {
            params.append("user_status", debouncedStatus);
        } else if (debouncedStatus === "active") {
            params.append("is_active", "true");
        }

        if (debouncedGroups.length > 0) {
            params.append("group_ids", debouncedGroups.join(","));
        }

        const orderingValue = debouncedOrderDir === "desc" ? `-${debouncedOrderField}`
            : debouncedOrderField;
        params.append("ordering", orderingValue);

        if (opts?.includePaging) {
            params.append("page", String(debouncedPage));
            params.append("page_size", String(debouncedPageSize));
        }

        return params;
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            if (listAbortRef.current) listAbortRef.current.abort();
            const controller = new AbortController();
            listAbortRef.current = controller;

            const params = buildFilterParams({includePaging: true});

            const res = await api.get<ApiResponse>(`accounts/user-management/?${params.toString()}`, {
                signal: controller.signal as any,
            });
            setUsers(res.data.results);
            setTotalCount(res.data.count);
            setSelectedUserIds([]);
        } catch (e: any) {
            if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") {
                // ignore
            } else {
                console.error("Failed to fetch users:", e);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        debouncedSearch,
        debouncedStatus,
        debouncedRole,
        debouncedGroups,
        debouncedOrderField,
        debouncedOrderDir,
        debouncedPage,
        debouncedPageSize,
    ]);

    const fetchStatistics = async () => {
        try {
            const res = await api.get<Statistics>("accounts/user-management/statistics/");
            setStatistics(res.data);
        } catch (e) {
            console.error("Failed to fetch statistics:", e);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = normalizePayload(createForm);
            await api.post("accounts/user-management/", payload);
            setShowCreateModal(false);
            setCreateForm(cloneDefaultCreateForm());
            fetchUsers();
            fetchStatistics();
        } catch (e: any) {
            console.error("Failed to create user:", e?.response?.data || e);
            alert(t('users.createFailed'));
        }
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        try {
            const payload = normalizePayload(createForm);
            await api.patch(`accounts/user-management/${selectedUser.id}/`, payload);
            setShowEditModal(false);
            setSelectedUser(null);
            fetchUsers();
            fetchStatistics();
        } catch (e: any) {
            console.error("Failed to update user:", e?.response?.data || e);
            alert(t('users.updateFailed'));
        }
    };

    const fetchHistoricalStatistics = async (days = 30) => {
        try {
            const res = await api.get(`accounts/user-management/historical-statistics/?days=${days}`);
            return res.data;
        } catch (error) {
            console.error("Failed to fetch historical statistics:", error);
            throw error;
        }
    };

    const refetchHistorical = async (days: number) => {
        setChartsLoading(true);
        try {
            const data = await fetchHistoricalStatistics(days);
            setHistoricalData(data);
            setPeriodDays(days);
            requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
        } catch (e) {
            console.error("Failed to fetch historical data:", e);
        } finally {
            setChartsLoading(false);
        }
    };

    const openModal = async (modalType: string) => {
        setActiveModal(modalType);
        await refetchHistorical(periodDays);
    };

    const closeModal = () => {
        setActiveModal(null);
        setHistoricalData(null);
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            const hard = deleteMode === "hard" ? "true" : "false";
            await api.delete(`accounts/user-management/${selectedUser.id}/?hard=${hard}`);
            setShowDeleteModal(false);
            setSelectedUser(null);
            setSelectedUserIds((ids) => ids.filter((id) => id !== (selectedUser?.id ?? -1)));
            fetchUsers();
            fetchStatistics();
        } catch (e) {
            console.error("Failed to delete user:", e);
            alert(t('users.deleteFailed'));
        }
    };

    const handleBulkAction = async () => {
        if (!bulkAction || selectedUserIds.length === 0) return;

        let effectiveAction = bulkAction;
        let format: 'csv' | 'xlsx' = 'csv';
        if (bulkAction === 'export') {
            format = bulkExportFormat;
            effectiveAction = `export_${format}`;
        }

        const body: { user_ids: number[]; action: string; reason?: string } = {
            user_ids: selectedUserIds,
            action: effectiveAction,
        };

        const isExport = bulkAction === 'export';
        const config = isExport ? {responseType: 'blob'} : {};

        try {
            const res = await api.post("accounts/user-management/bulk_actions/", body, config);

            setShowBulkModal(false);

            if (isExport) {
                const disposition = res.headers?.['content-disposition'] || '';
                let filename = `bulk-users.${format}`;
                const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (match && match[1]) filename = decodeURIComponent(match[1].replace(/['"]/g, ''));

                const blob = new Blob([res.data]);
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);

                setResultTitle(t('common.success'));
                setResultMessage(t('users.exportSuccess'));
                setResultWarning('');
                setIsResultError(false);
                setShowResultModal(true);
            } else {
                const data = res.data;
                setResultTitle(t('common.success'));
                setResultMessage(data.message ?? t('users.bulkSuccess'));
                setResultWarning(data.warning ?? '');
                setIsResultError(false);
                setShowResultModal(true);
            }

            setSelectedUserIds([]);
            setBulkAction("");
            fetchUsers();
            fetchStatistics();
        } catch (e: any) {
            console.error("Failed to perform bulk action:", e?.response?.data || e);
            setShowBulkModal(false);
            const msg =
                e?.response?.data?.detail ||
                e?.response?.data?.message ||
                t('users.bulkFailed');
            setResultTitle(t('common.error'));
            setResultMessage(msg);
            setResultWarning('');
            setIsResultError(true);
            setShowResultModal(true);
        }
    };

    const handleResendInvite = async (userId: number) => {
        try {
            await api.post(`accounts/user-management/${userId}/resend_invite/`);
            alert(t('users.resendSuccess'));
        } catch (e: any) {
            console.error("Failed to resend invite:", e?.response?.data || e);
            const msg =
                e?.response?.data?.message ||
                e?.response?.data?.detail ||
                t('users.resendFailed');
            alert(msg);
        }
    };

    const [showExportModal, setShowExportModal] = useState(false);
    const openExportModal = () => setShowExportModal(true);

    const handleExportUsers = async (format: "csv" | "xlsx" = "csv") => {
        try {
            setExporting(true);
            const params = buildFilterParams({includePaging: false});
            params.set("file-type", format);

            const res = await api.get(`accounts/user-management/export-users/?${params.toString()}`, {
                responseType: "blob",
            });

            const disposition = (res.headers as any)?.["content-disposition"] || "";
            const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
            const filename = match ? decodeURIComponent(match ? match[1].replace(/['"]/g, "") : "") : `users-export.${format}`;

            const blob = new Blob([res.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e: any) {
            console.error("Export failed:", e?.response?.data || e);
            alert(t('users.exportFailed'));
        } finally {
            setExporting(false);
        }
    };



    const [periodDays, setPeriodDays] = useState<number>(30);

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setImporting(true);
            const formData = new FormData();
            formData.append("file", file);

            await api.post("accounts/user-management/import-users/", formData, {
                headers: {"Content-Type": "multipart/form-data"},
            });
            alert(t('users.importSuccess'));
            fetchUsers();
            fetchStatistics();
        } catch (err: any) {
            console.error("Import failed:", err?.response?.data || err);
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                t('users.importFailed');
            alert(msg);
        } finally {
            setImporting(false);
            if (importInputRef.current) importInputRef.current.value = "";
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return t('common.never');
        try {
            return new Date(dateString).toLocaleDateString("ru-RU");
        } catch {
            return dateString as string;
        }
    };

    const renderStatusBadge = (status: BackendStatus) => {
        const conf = STATUS_BADGE[status] ?? {
            text: status,
            className: "bg-gray-50 text-gray-700 ring-1 ring-gray-200",
            darkClassName: "bg-slate-800 text-slate-400 ring-1 ring-slate-700",
        };
        return (
            <span
                className={`px-2.5 py-1 text-sm rounded-full font-medium ${isDark ? conf.darkClassName : conf.className}`}>
        {t(`status.${status.toLowerCase()}`)}
      </span>
        );
    };

    const statusOptions = STATUS_OPTIONS.map((o) => ({value: o.value, label: o.label}));
    const roleOptions = [
        {value: "", label: t('roles.all')},
        ...Object.entries(roleLabels).map(([value, label]) => ({value, label})),
    ];
    const orderFieldOptions = [
        {value: "last_name", label: t('order.lastName')},
        {value: "first_name", label: t('order.firstName')},
        {value: "email", label: t('order.email')},
        {value: "date_joined", label: t('order.dateJoined')},
        {value: "last_login", label: t('order.lastLogin')},
        {value: "role", label: t('order.role')},
        {value: "is_active", label: t('order.activity')},
    ];

    const formatChartData = (data: any, fields: string[]) => {
        return data.dates.map((date: string, index: number) => {
            const item: any = {
                date: new Date(date).toLocaleDateString('ru-RU', {
                    month: 'short',
                    day: 'numeric'
                })
            };
            fields.forEach(field => {
                item[field] = data[field][index];
            });
            return item;
        });
    };

    const formatRoleData = (data: any) => {
        const latestRoles = data.role_distribution_over_time[data.role_distribution_over_time.length - 1]?.roles || {};
        return Object.entries(latestRoles).map(([role, count]) => ({
            name: role,
            value: count as number,
            fill: isDark ? {
                'Student': '#3b82f6',
                'Teacher': '#10b981',
                'Admin': '#ef4444'
            }[role] || '#94a3b8' : {
                'Student': '#3b82f6',
                'Teacher': '#10b981',
                'Admin': '#ef4444'
            }[role] || '#6B7280'
        }));
    };

    const normalizeLang = (lng?: string | null) =>
        (lng || "").split("-")[0].toLowerCase();
    const openEditModal = (user: UserItem) => {
        setSelectedUser(user);
        setCreateForm({
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            profile: {
                phone_number: user.profile?.phone_number ?? "",
                company: user.profile?.company ?? "",
                birth_date: toDateInputValue(user.profile?.birth_date) || "",
                middle_name: (user as any)?.profile?.["middle_name"] ?? "",
                interface_language: normalizeLang(user.profile?.interface_language) || "",
                timezone: user.profile?.timezone ?? "",
                profile_edit_blocked: user.profile?.profile_edit_blocked ?? false,
                deactivation_time: user.profile?.deactivation_time ?? null,
                days_to_delete_after_deactivation: user.profile?.days_to_delete ?? null,
            },
        });
        setShowEditModal(true);
    };

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const allSelectedOnPage = users.length > 0 && selectedUserIds.length === users.length;

    return (
        <div ref={pageRootRef}
             className={`p-6 md:p-8 min-h-0 overflow-x-hidden pb-24 ${isDark ? "bg-gradient-to-br from-slate-900 to-slate-800" : "bg-gradient-to-br from-gray-50 to-gray-100"}`}>
            <div
                className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${isDark ? "text-slate-200" : "text-gray-900"}`}>
                        {t('users.title')}
                    </h1>
                    <p className={`mt-1 text-base ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        {t('users.subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div
                        role="tablist"
                        aria-label={t('users.switchDisplay')}
                        className={`inline-flex rounded-lg border shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}
                    >
                        <button
                            role="tab"
                            aria-pressed={displayMode === "list"}
                            onClick={() => setDisplayMode("list")}
                            className={`px-4 py-2.5 text-base flex items-center gap-2 transition duration-200 cursor-pointer ${displayMode === "list" ? (isDark ? "bg-blue-600 text-white" : "bg-gray-900 text-white") : (isDark ? "text-slate-400 hover:bg-slate-700" : "text-gray-700 hover:bg-gray-50")}`}
                            title={t('users.list')}
                        >
                            <ListIcon className="h-5 w-5"/>
                            <span className="hidden sm:inline">{t('users.list')}</span>
                        </button>
                        <button
                            role="tab"
                            aria-pressed={displayMode === "grid"}
                            onClick={() => setDisplayMode("grid")}
                            className={`px-4 py-2.5 text-base flex items-center gap-2 transition duration-200 cursor-pointer ${displayMode === "grid" ? (isDark ? "bg-blue-600 text-white" : "bg-gray-900 text-white") : (isDark ? "text-slate-400 hover:bg-slate-700" : "text-gray-700 hover:bg-gray-50")}`}
                            title={t('users.blocks')}
                        >
                            <LayoutGrid className="h-5 w-5"/>
                            <span className="hidden sm:inline">{t('users.blocks')}</span>
                        </button>
                    </div>

                    <button
                        onClick={openExportModal}
                        disabled={exporting}
                        className={`h-11 px-4 rounded-lg inline-flex items-center gap-2 transition duration-200 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${isDark ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50"} shadow-sm`}
                        title={t('users.exportUsers')}
                    >
                        {exporting ? (
                            <Loader2 className="h-5 w-5 animate-spin"/>
                        ) : (
                            <Download className="h-5 w-5"/>
                        )}
                        <span className="hidden sm:inline text-base font-medium">{t('common.export')}</span>
                    </button>

                    {showExportModal && (
                        <ExportModal
                            open={showExportModal}
                            onClose={() => setShowExportModal(false)}
                            onExport={handleExportUsers}
                        />
                    )}

                    <input
                        ref={importInputRef}
                        type="file"
                        className="hidden"
                        accept=".csv, text/csv, application/vnd.ms-excel, .xlsx"
                        onChange={handleImportFile}
                    />
                    <button
                        onClick={handleImportClick}
                        disabled={importing}
                        className={`h-11 px-4 rounded-lg inline-flex items-center gap-2 transition duration-200 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${isDark ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50"} shadow-sm`}
                        title={t('users.importUsers')}
                    >
                        {importing ? (
                            <Loader2 className="h-5 w-5 animate-spin"/>
                        ) : (
                            <Upload className="h-5 w-5"/>
                        )}
                        <span className="hidden sm:inline text-base font-medium">{t('common.import')}</span>
                    </button>

                    <button
                        onClick={() => {
                            setCreateForm(cloneDefaultCreateForm());
                            setShowCreateModal(true);
                        }}
                        className={`h-11 px-5 rounded-lg inline-flex items-center gap-2 transition duration-200 shadow-sm hover:shadow-md cursor-pointer ${isDark ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-900 text-white hover:bg-gray-800"}`}
                    >
                        <Plus className="h-5 w-5"/>
                        <span className="text-base font-medium">{t('users.add')}</span>
                    </button>
                </div>
            </div>

            {statistics && (
                <UserStatistics
                    statistics={statistics}
                    isDark={isDark}
                    t={t}
                    openModal={openModal}
                />
            )}

            <UserFilters
                search={search}
                setSearch={setSearch}
                setCurrentPage={setCurrentPage}
                groupIds={groupIds}
                setGroupIds={setGroupIds}
                groupOptions={groupOptions}
                groupsLoading={groupsLoading}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                statusOptions={statusOptions}
                roleFilter={roleFilter}
                setRoleFilter={setRoleFilter}
                roleOptions={roleOptions}
                orderField={orderField}
                setOrderField={setOrderField}
                orderFieldOptions={orderFieldOptions}
                orderDirection={orderDirection}
                setOrderDirection={setOrderDirection}
                selectedUserIds={selectedUserIds}
                setShowBulkModal={setShowBulkModal}
                isDark={isDark}
                t={t}
            />

            <div
                className={`rounded-2xl border shadow-sm transition-shadow duration-200 hover:shadow-md ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"
                } ${displayMode === "grid" ? "overflow-visible" : "overflow-hidden"}`}
            >
                {loading ? (
                    <div
                        className={`p-16 text-center ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        <Loader2
                            className={`h-8 w-8 animate-spin mx-auto ${isDark ? "text-blue-400" : "text-gray-900"}`}/>
                        <p className="mt-4 text-base">{t('users.loadingUsers')}</p>
                    </div>
                ) : users.length === 0 ? (
                    <div
                        className={`p-12 text-center text-base ${isDark ? "text-slate-400" : "text-gray-600"}`}>{t('common.nothingFound')}</div>
                ) : displayMode === "list" ? (
                    <UserList
                        users={users}
                        selectedUserIds={selectedUserIds}
                        setSelectedUserIds={setSelectedUserIds}
                        allSelectedOnPage={allSelectedOnPage}
                        roleLabels={roleLabels}
                        renderStatusBadge={renderStatusBadge}
                        formatDate={formatDate}
                        isDark={isDark}
                        t={t}
                        openStudentView={openStudentView}
                        openEditModal={openEditModal}
                        handleResendInvite={handleResendInvite}
                        setSelectedUser={setSelectedUser}
                        setDeleteMode={setDeleteMode}
                        setShowDeleteModal={setShowDeleteModal}
                    />
                ) : (
                    <UserGrid
                        users={users}
                        selectedUserIds={selectedUserIds}
                        setSelectedUserIds={setSelectedUserIds}
                        allSelectedOnPage={allSelectedOnPage}
                        roleLabels={roleLabels}
                        renderStatusBadge={renderStatusBadge}
                        formatDate={formatDate}
                        isDark={isDark}
                        t={t}
                        openStudentView={openStudentView}
                        openEditModal={openEditModal}
                        handleResendInvite={handleResendInvite}
                        setSelectedUser={setSelectedUser}
                        setDeleteMode={setDeleteMode}
                        setShowDeleteModal={setShowDeleteModal}
                    />
                )}
                <Pagination
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    pageSize={pageSize}
                    setPageSize={setPageSize}
                    totalCount={totalCount}
                    totalPages={totalPages}
                    isDark={isDark}
                    t={t}
                />
            </div>

            {showCreateModal && (
                <CreateUserModal
                    open={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    createForm={createForm}
                    setCreateForm={setCreateForm}
                    handleCreateUser={handleCreateUser}
                    roleLabels={roleLabels}
                    isDark={isDark}
                    t={t}
                />
            )}

            {showEditModal && selectedUser && (
                <EditUserModal
                    open={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    createForm={createForm}
                    setCreateForm={setCreateForm}
                    handleEditUser={handleEditUser}
                    roleLabels={roleLabels}
                    isDark={isDark}
                    t={t}
                />
            )}

            {showDeleteModal && selectedUser && (
                <DeleteUserModal
                    open={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    selectedUser={selectedUser}
                    deleteMode={deleteMode}
                    setDeleteMode={setDeleteMode}
                    handleDeleteUser={handleDeleteUser}
                    isDark={isDark}
                    t={t}
                />
            )}

            {showBulkModal && (
                <BulkActionsModal
                    open={showBulkModal}
                    onClose={() => setShowBulkModal(false)}
                    selectedUserIds={selectedUserIds}
                    bulkAction={bulkAction}
                    setBulkAction={setBulkAction}
                    bulkExportFormat={bulkExportFormat}
                    setBulkExportFormat={setBulkExportFormat}
                    handleBulkAction={handleBulkAction}
                    isDark={isDark}
                    t={t}
                />
            )}

            {showResultModal && (
                <ActionResultModal
                    open={showResultModal}
                    onClose={() => setShowResultModal(false)}
                    title={resultTitle}
                    message={resultMessage}
                    warning={resultWarning}
                    isError={isResultError}
                    isDark={isDark}
                />
            )}

            <ChartModalWrapper
                isOpen={activeModal === 'total'}
                onClose={closeModal}
                chartsLoading={chartsLoading}
                isDark={isDark}
                t={t}
            >
                {historicalData && (
                    <GeneralUsersChart
                        historicalData={historicalData}
                        periodDays={periodDays}
                        setPeriodDays={setPeriodDays}
                        refetchHistorical={refetchHistorical}
                        formatChartData={formatChartData}
                        isDark={isDark}
                        t={t}
                        activeModal={activeModal}
                    />
                )}
            </ChartModalWrapper>

            <ChartModalWrapper
                isOpen={activeModal === 'enrolled'}
                onClose={closeModal}
                chartsLoading={chartsLoading}
                isDark={isDark}
                t={t}
            >
                {historicalData && (
                    <EnrolledUsersChart
                        historicalData={historicalData}
                        periodDays={periodDays}
                        setPeriodDays={setPeriodDays}
                        refetchHistorical={refetchHistorical}
                        formatChartData={formatChartData}
                        formatRoleData={formatRoleData}
                        isDark={isDark}
                        t={t}
                        activeModal={activeModal}
                    />
                )}
            </ChartModalWrapper>

            <ChartModalWrapper
                isOpen={activeModal === 'authorized'}
                onClose={closeModal}
                chartsLoading={chartsLoading}
                isDark={isDark}
                t={t}
            >
                {historicalData && (
                    <AuthorizedUsersChart
                        historicalData={historicalData}
                        periodDays={periodDays}
                        setPeriodDays={setPeriodDays}
                        refetchHistorical={refetchHistorical}
                        formatChartData={formatChartData}
                        isDark={isDark}
                        t={t}
                        activeModal={activeModal}
                    />
                )}
            </ChartModalWrapper>

            <ChartModalWrapper
                isOpen={activeModal === 'daily'}
                onClose={closeModal}
                chartsLoading={chartsLoading}
                isDark={isDark}
                t={t}
            >
                {historicalData && (
                    <DailyGrowthChart
                        historicalData={historicalData}
                        periodDays={periodDays}
                        setPeriodDays={setPeriodDays}
                        refetchHistorical={refetchHistorical}
                        formatChartData={formatChartData}
                        isDark={isDark}
                        t={t}
                        activeModal={activeModal}
                    />
                )}
            </ChartModalWrapper>

            <StudentViewModal
                open={isStudentViewOpen}
                onClose={closeStudentView}
                user={viewUser}
            />
        </div>
    );
}