// src/pages/users/components/DeleteUserModal.tsx
import React from "react";
import { AlertCircle, X } from "lucide-react";

interface DeleteUserModalProps {
    open: boolean;
    onClose: (b: boolean) => void;
    selectedUser: UserItem;
    deleteMode: "soft" | "hard";
    setDeleteMode: (m: "soft" | "hard") => void;
    handleDeleteUser: () => Promise<void>;
    isDark: boolean;
    t: any;
}

export default function DeleteUserModal({
                                            open,
                                            onClose,
                                            selectedUser,
                                            deleteMode,
                                            setDeleteMode,
                                            handleDeleteUser,
                                            isDark,
                                            t,
                                        }: DeleteUserModalProps) {
    if (!open) return null;
    return (
        <div
            className={`fixed inset-0 z-50 p-4 transition-all duration-300 ${isDark ? "bg-black/60" : "bg-black/50"} backdrop-blur-sm flex items-center justify-center`}>
            <div
                className={`rounded-2xl shadow-2xl border max-w-md w-full transform scale-100 opacity-100 transition-all duration-200 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle
                            className={`h-6 w-6 ${isDark ? "text-rose-300" : "text-rose-600"}`}/>
                        <h2 className={`text-xl font-bold ${isDark ? "text-slate-200" : "text-gray-900"}`}>{t('users.deleteUser')}</h2>
                    </div>
                    <p className={`text-base ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                        {t('users.confirmDelete')} {" "}
                        <strong>
                            {selectedUser.first_name} {selectedUser.last_name}
                        </strong>
                        ?
                    </p>

                    <div className="mt-4 space-y-3">
                        <label
                            className={`flex items-center gap-3 cursor-pointer text-base ${isDark ? "text-slate-300" : "text-gray-800"}`}>
                            <input
                                type="radio"
                                name="deleteMode"
                                className={`form-radio ${isDark ? "text-blue-600" : "text-indigo-600"}`}
                                checked={deleteMode === "soft"}
                                onChange={() => setDeleteMode("soft")}
                            />
                            <span>{t('users.softDelete')}</span>
                        </label>
                        <label
                            className={`flex items-center gap-3 cursor-pointer text-base ${isDark ? "text-slate-300" : "text-gray-800"}`}>
                            <input
                                type="radio"
                                name="deleteMode"
                                className={`form-radio ${isDark ? "text-blue-600" : "text-indigo-600"}`}
                                checked={deleteMode === "hard"}
                                onChange={() => setDeleteMode("hard")}
                            />
                            <span>{t('users.hardDelete')}</span>
                        </label>
                    </div>

                    <div className="mt-6 flex gap-4 justify-end">
                        <button
                            onClick={() => onClose(false)}
                            className={`px-5 py-3 rounded-lg transition duration-200 cursor-pointer ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "text-gray-700 border border-gray-200 hover:bg-gray-50"}`}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleDeleteUser}
                            className={`px-5 py-3 rounded-lg transition duration-200 cursor-pointer ${isDark ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-rose-600 text-white hover:bg-rose-700"}`}
                        >
                            {t('common.delete')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}