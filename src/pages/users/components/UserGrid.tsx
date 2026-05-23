// src/pages/users/components/UserGrid.tsx
import React from "react";
import { Edit, Mail, Trash2, User, Phone, Calendar } from "lucide-react";
import { RoundedCheckbox } from "@/components/ui/RoundedCheckbox";

interface UserGridProps {
    users: UserItem[];
    selectedUserIds: number[];
    setSelectedUserIds: (ids: number[]) => void;
    allSelectedOnPage: boolean;
    roleLabels: Record<string, string>;
    renderStatusBadge: (status: BackendStatus) => JSX.Element;
    formatDate: (date: string | null) => string;
    isDark: boolean;
    t: any;
    openStudentView: (u: UserItem) => void;
    openEditModal: (u: UserItem) => void;
    handleResendInvite: (id: number) => void;
    setSelectedUser: (u: UserItem) => void;
    setDeleteMode: (m: "soft" | "hard") => void;
    setShowDeleteModal: (b: boolean) => void;
}

export default function UserGrid({
                                     users,
                                     selectedUserIds,
                                     setSelectedUserIds,
                                     allSelectedOnPage,
                                     roleLabels,
                                     renderStatusBadge,
                                     formatDate,
                                     isDark,
                                     t,
                                     openStudentView,
                                     openEditModal,
                                     handleResendInvite,
                                     setSelectedUser,
                                     setDeleteMode,
                                     setShowDeleteModal,
                                 }: UserGridProps) {
    return (
        <>
            {/* Top bar — glassy, compact, pro */}
            <div
                className={[
                    "px-5 py-4 border-b flex items-center justify-between",
                    "backdrop-blur supports-[backdrop-filter]:backdrop-blur",
                    isDark ? "bg-slate-800/70 border-slate-700" : "bg-white/70 border-gray-100",
                ].join(" ")}
            >
                <div className="inline-flex items-center gap-3">
                    {/* Use custom rounded checkbox */}
                    <div onClick={(e) => e.stopPropagation()}>
                        <RoundedCheckbox
                            isDark={isDark}
                            checked={allSelectedOnPage}
                            indeterminate={selectedUserIds.length > 0 && !allSelectedOnPage}
                            aria-label={t("users.selectAllOnPage")}
                            onChange={(val) => {
                                if (val) setSelectedUserIds(users.map((u) => u.id));
                                else setSelectedUserIds([]);
                            }}
                        />
                    </div>
                    <span className={isDark ? "text-slate-200" : "text-gray-900"}>
            {t("users.selectAllOnPage")}
          </span>
                </div>

                <span className={isDark ? "text-slate-400" : "text-gray-500"}>
          {t("users.selected")}: {selectedUserIds.length}
        </span>
            </div>

            {/* Grid */}
            <div
                className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5"
                style={{ overflow: "visible" }}
            >
                {users.map((user) => {
                    const isChecked = selectedUserIds.includes(user.id);

                    return (
                        <div
                            key={user.id}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") openStudentView(user);
                            }}
                            onClick={() => openStudentView(user)}
                            className={[
                                "group relative rounded-2xl border shadow-sm p-5 cursor-pointer",
                                "transition-all motion-safe:duration-300 ease-out",
                                "hover:shadow-xl hover:scale-[1.02]", // keep outer click/hover effect; size remains visually the same
                                isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-gray-100",
                                "focus-visible:outline-none focus-visible:ring-2",
                                isDark ? "focus-visible:ring-slate-600" : "focus-visible:ring-indigo-200",
                            ].join(" ")}
                        >
                            {/* Ambient gradient glow on hover (non-intrusive, pro) */}
                            <span
                                aria-hidden
                                className={[
                                    "pointer-events-none absolute -inset-px rounded-2xl opacity-0",
                                    "group-hover:opacity-60 motion-safe:duration-500",
                                    isDark
                                        ? "bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/10 to-sky-400/10"
                                        : "bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/10 to-sky-400/10",
                                    "blur-sm",
                                ].join(" ")}
                            />
                            {/* Thin top accent bar */}
                            <span
                                aria-hidden
                                className="pointer-events-none absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity motion-safe:duration-500"
                            />

                            {/* Header actions row */}
                            <div className="flex items-start justify-between" onClick={(e) => e.stopPropagation()}>
                                <div className="inline-flex items-center gap-2">
                                    <RoundedCheckbox
                                        isDark={isDark}
                                        checked={isChecked}
                                        aria-label={t("users.selectUser")}
                                        onChange={(val) => {
                                            if (val) setSelectedUserIds((ids) => [...ids, user.id]);
                                            else setSelectedUserIds((ids) => ids.filter((id) => id !== user.id));
                                        }}
                                    />
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => openEditModal(user)}
                                        className={[
                                            "p-2 rounded-lg transition-colors motion-safe:duration-200 focus:outline-none focus-visible:ring-2",
                                            isDark
                                                ? "text-slate-300 hover:text-white hover:bg-slate-700/70 focus-visible:ring-slate-600"
                                                : "text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 focus-visible:ring-indigo-200",
                                        ].join(" ")}
                                        title={t("common.edit")}
                                    >
                                        <Edit className="h-5 w-5" />
                                    </button>

                                    <button
                                        onClick={() => user.status === "Unauthorized" && handleResendInvite(user.id)}
                                        disabled={user.status !== "Unauthorized"}
                                        className={[
                                            "p-2 rounded-lg transition-colors motion-safe:duration-200 focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed",
                                            user.status === "Unauthorized"
                                                ? isDark
                                                    ? "text-emerald-300 hover:text-emerald-200 hover:bg-emerald-900/30 focus-visible:ring-emerald-700"
                                                    : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 focus-visible:ring-emerald-200"
                                                : isDark
                                                    ? "text-slate-500"
                                                    : "text-gray-400",
                                        ].join(" ")}
                                        title={
                                            user.status === "Unauthorized"
                                                ? t("users.resendInvite")
                                                : t("users.resendOnlyUnauthorized")
                                        }
                                        aria-disabled={user.status !== "Unauthorized"}
                                    >
                                        <Mail className="h-5 w-5" />
                                    </button>

                                    <button
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setDeleteMode("soft");
                                            setShowDeleteModal(true);
                                        }}
                                        className={[
                                            "p-2 rounded-lg transition-colors motion-safe:duration-200 focus:outline-none focus-visible:ring-2",
                                            isDark
                                                ? "text-rose-300 hover:text-rose-200 hover:bg-rose-900/30 focus-visible:ring-rose-700"
                                                : "text-rose-600 hover:text-rose-700 hover:bg-rose-50 focus-visible:ring-rose-200",
                                        ].join(" ")}
                                        title={t("common.delete")}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* USER INFO — no inner hover/transition; clean & stable */}
                            <div className="mt-4 flex items-center gap-4 -mx-1 px-1 py-1 rounded-xl">
                                {user.profile?.profile_photo ? (
                                    <img
                                        className="h-12 w-12 rounded-full object-cover"
                                        src={user.profile.profile_photo}
                                        alt=""
                                    />
                                ) : (
                                    <div
                                        className={[
                                            "h-12 w-12 rounded-full flex items-center justify-center",
                                            isDark ? "bg-slate-700" : "bg-gray-100",
                                        ].join(" ")}
                                    >
                                        <User className={isDark ? "h-6 w-6 text-slate-400" : "h-6 w-6 text-gray-600"} />
                                    </div>
                                )}

                                <div className="min-w-0">
                                    <div
                                        className={[
                                            "font-semibold text-lg truncate",
                                            isDark ? "text-slate-100" : "text-gray-900",
                                        ].join(" ")}
                                    >
                                        {user.first_name} {user.last_name}
                                    </div>
                                    <div className={isDark ? "text-base text-slate-400 truncate" : "text-base text-gray-500 truncate"}>
                                        {user.email}
                                    </div>
                                </div>
                            </div>

                            {/* Badges */}
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                    className={[
                        "px-2.5 py-1 text-sm font-medium rounded-full ring-1",
                        isDark
                            ? "bg-slate-800 text-slate-200 ring-slate-700"
                            : "bg-gray-100 text-gray-900 ring-gray-200",
                    ].join(" ")}
                >
                  {roleLabels[user.role] || user.role}
                </span>
                                {renderStatusBadge(user.status)}
                            </div>

                            {/* Meta */}
                            <div className={["mt-4 space-y-2 text-base", isDark ? "text-slate-300" : "text-gray-600"].join(" ")}>
                                {user.profile?.phone_number && (
                                    <div className="flex items-center gap-2">
                                        <Phone className={isDark ? "h-5 w-5 text-slate-400" : "h-5 w-5 text-gray-500"} />
                                        <span className="truncate">{user.profile.phone_number}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Calendar className={isDark ? "h-5 w-5 text-slate-400" : "h-5 w-5 text-gray-500"} />
                                    <span>
                    {t("order.dateJoined")}: {formatDate(user.date_joined)}
                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className={isDark ? "h-5 w-5 text-slate-400" : "h-5 w-5 text-gray-500"} />
                                    <span>{t("order.lastLogin")}: {formatDate(user.last_login)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
