import React, { memo } from "react";
import {
    Edit,
    Mail,
    Trash2,
    User,
    Phone,
} from "lucide-react";
import { RoundedCheckbox } from "@/components/ui/RoundedCheckbox";

interface UserListProps {
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

function UserListCmp({
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
                     }: UserListProps) {
    const someSelected = selectedUserIds.length > 0 && !allSelectedOnPage;

    return (
        <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${isDark ? "divide-slate-700" : "divide-gray-100"}`}>
                <thead className={`${isDark ? "bg-slate-800/70" : "bg-white/70"} backdrop-blur supports-[backdrop-filter]:backdrop-blur border-b ${isDark ? "border-slate-700" : "border-gray-100"}`}>
                <tr>
                    <th className="pl-4 pr-2 py-3 text-left align-middle">
                        <RoundedCheckbox
                            isDark={isDark}
                            checked={allSelectedOnPage}
                            indeterminate={someSelected}
                            aria-label={t("users.selectAllOnPage")}
                            onChange={(val) => {
                                if (val) setSelectedUserIds(users.map((u) => u.id));
                                else setSelectedUserIds([]);
                            }}
                        />
                    </th>
                    <th className={`pl-2 pr-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                        {t("users.user")}
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                        {t("common.role")}
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                        {t("common.status")}
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-300" : "text-gray-600"} hidden md:table-cell`}>
                        {t("order.lastLogin")}
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-300" : "text-gray-600"} hidden lg:table-cell`}>
                        {t("order.dateJoined")}
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                        {t("users.actions")}
                    </th>
                </tr>
                </thead>

                <tbody className={`${isDark ? "bg-slate-900/40" : "bg-white"} divide-y ${isDark ? "divide-slate-800/80" : "divide-gray-100"}`}>
                {users.map((user) => {
                    const selected = selectedUserIds.includes(user.id);

                    return (
                        <tr
                            key={user.id}
                            onClick={() => openStudentView(user)}
                            className={[
                                "group cursor-pointer transition-colors motion-safe:duration-300 ease-out",
                                isDark
                                    ? "hover:bg-slate-800/80"
                                    : "hover:bg-indigo-50/70",
                            ].join(" ")}
                        >
                            {/* left select */}
                            <td className="pl-4 pr-2 py-4 align-middle" onClick={(e) => e.stopPropagation()}>
                                <RoundedCheckbox
                                    isDark={isDark}
                                    checked={selected}
                                    aria-label={t("users.selectUser")}
                                    onChange={(val) => {
                                        if (val) setSelectedUserIds((ids) => [...ids, user.id]);
                                        else setSelectedUserIds((ids) => ids.filter((id) => id !== user.id));
                                    }}
                                />
                            </td>

                            {/* user cell (no inner hover/transition effects) */}
                            <td className="pl-2 pr-4 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 h-10 w-10">
                                        {user.profile?.profile_photo ? (
                                            <img
                                                className="h-10 w-10 rounded-full object-cover"
                                                src={user.profile.profile_photo}
                                                alt=""
                                            />
                                        ) : (
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isDark ? "bg-slate-700" : "bg-gray-100"}`}>
                                                <User className={`h-5 w-5 ${isDark ? "text-slate-400" : "text-gray-600"}`} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <div className={`text-sm sm:text-base font-semibold ${isDark ? "text-slate-100" : "text-gray-900"} truncate`}>
                                            {user.first_name} {user.last_name}
                                        </div>
                                        <div className={`text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-gray-500"} truncate`}>{user.email}</div>
                                        {user.profile?.phone_number && (
                                            <div className={`mt-1 text-xs sm:text-sm flex items-center gap-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                                                <Phone className="h-4 w-4" />
                                                <span className="truncate">{user.profile.phone_number}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>

                            {/* role */}
                            <td className="px-4 py-4 align-middle">
                  <span
                      className={`px-2.5 py-1 text-xs sm:text-sm font-medium rounded-full ring-1 ${
                          isDark ? "bg-slate-800 text-slate-200 ring-slate-700" : "bg-gray-100 text-gray-900 ring-gray-200"
                      }`}
                  >
                    {roleLabels[user.role] || user.role}
                  </span>
                            </td>

                            {/* status */}
                            <td className="px-4 py-4 align-middle">{renderStatusBadge(user.status)}</td>

                            {/* last login (hide on small) */}
                            <td className={`px-4 py-4 align-middle hidden md:table-cell ${isDark ? "text-slate-200" : "text-gray-900"}`}>
                                {formatDate(user.last_login)}
                            </td>

                            {/* joined (hide on <lg) */}
                            <td className={`px-4 py-4 align-middle hidden lg:table-cell ${isDark ? "text-slate-200" : "text-gray-900"}`}>
                                {formatDate(user.date_joined)}
                            </td>

                            {/* actions */}
                            <td className="px-4 py-4 align-middle" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => openEditModal(user)}
                                        className={`
                        p-2 rounded-lg transition-colors motion-safe:duration-200
                        ${isDark
                                            ? "text-slate-300 hover:text-white hover:bg-slate-700/80 focus-visible:ring-2 ring-slate-600"
                                            : "text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 focus-visible:ring-2 ring-indigo-200"}
                        focus:outline-none
                      `}
                                        title={t("common.edit")}
                                    >
                                        <Edit className="h-5 w-5" />
                                    </button>

                                    <button
                                        onClick={() => user.status === "Unauthorized" && handleResendInvite(user.id)}
                                        disabled={user.status !== "Unauthorized"}
                                        className={`
                        p-2 rounded-lg transition-colors motion-safe:duration-200
                        ${user.status === "Unauthorized"
                                            ? (isDark ? "text-emerald-300 hover:text-emerald-200 hover:bg-emerald-900/30 focus-visible:ring-2 ring-emerald-700"
                                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 focus-visible:ring-2 ring-emerald-200")
                                            : (isDark ? "text-slate-500" : "text-gray-400")}
                        disabled:cursor-not-allowed focus:outline-none
                      `}
                                        title={user.status === "Unauthorized" ? t("users.resendInvite") : t("users.resendOnlyUnauthorized")}
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
                                        className={`
                        p-2 rounded-lg transition-colors motion-safe:duration-200
                        ${isDark
                                            ? "text-rose-300 hover:text-rose-200 hover:bg-rose-900/30 focus-visible:ring-2 ring-rose-700"
                                            : "text-rose-600 hover:text-rose-700 hover:bg-rose-50 focus-visible:ring-2 ring-rose-200"}
                        focus:outline-none
                      `}
                                        title={t("common.delete")}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}

export default memo(UserListCmp);
