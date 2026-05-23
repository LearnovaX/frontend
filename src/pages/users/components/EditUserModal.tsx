import React from "react";
import { X } from "lucide-react";
import FancySelect from "./FancySelect";
import UserLanguageSelect from "@/components/admin/UserLanguageSelect";
import UzPhoneField from "./UzPhoneField";

interface CreateUserData {
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    profile?: {
        phone_number?: string | null;
        // company removed from UI (left in type for compatibility elsewhere)
        birth_date?: string | null;
        middle_name?: string | null;
        interface_language?: string | null;
        // timezone removed from UI (left in type for compatibility elsewhere)
        profile_edit_blocked?: boolean;
        deactivation_time?: string | null;
        days_to_delete_after_deactivation?: number | null;
    };
}

interface EditUserModalProps {
    open: boolean;
    onClose: () => void;
    createForm: CreateUserData;
    setCreateForm: (f: CreateUserData) => void;
    handleEditUser: (e: React.FormEvent) => Promise<void>;
    roleLabels: Record<string, string>;
    isDark: boolean;
    t: any;
}

/** Elegant toggle switch (black when ON in light mode, blue when ON in dark mode) */
function ToggleSwitch({
                          checked,
                          onChange,
                          isDark,
                          id,
                          label,
                      }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    isDark: boolean;
    id?: string;
    label?: string;
}) {
    const onClasses = isDark ? "bg-blue-600 ring-blue-400/40" : "bg-black ring-black/10";
    const offClasses = isDark ? "bg-slate-600 ring-slate-500/60" : "bg-gray-300 ring-gray-300";
    return (
        <div className="flex items-center gap-3">
            {label && (
                <label htmlFor={id} className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-gray-800"}`}>
                    {label}
                </label>
            )}
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={[
                    "relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 shadow-inner ring-1 focus:outline-none",
                    isDark ? "focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900" : "focus:ring-black focus:ring-2 focus:ring-offset-2 focus:ring-offset-white",
                    checked ? onClasses : offClasses,
                ].join(" ")}
            >
                <span
                    className={[
                        "inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300",
                        checked ? "translate-x-6" : "translate-x-1",
                    ].join(" ")}
                />
            </button>
        </div>
    );
}

// ---- UZ phone formatting helpers ----
const UZ_PLACEHOLDER = "+998 xx xxx xx xx";

function formatUzPhoneDisplay(input: string): string {
    // keep only digits
    const digits = (input || "").replace(/\D/g, "");
    if (!digits) return "";

    // drop leading "998" if user pasted it; we'll add it back formatted
    let rest = digits.startsWith("998") ? digits.slice(3) : digits;

    // Uzbekistan numbers are 9 digits after +998
    rest = rest.slice(0, 9);

    const p1 = rest.slice(0, 2); // xx
    const p2 = rest.slice(2, 5); // xxx
    const p3 = rest.slice(5, 7); // xx
    const p4 = rest.slice(7, 9); // xx

    let out = "+998";
    if (p1) out += " " + p1;
    if (p2) out += " " + p2;
    if (p3) out += " " + p3;
    if (p4) out += " " + p4;

    return out;
}


export default function EditUserModal({
                                          open,
                                          onClose,
                                          createForm,
                                          setCreateForm,
                                          handleEditUser,
                                          roleLabels,
                                          isDark,
                                          t,
                                      }: EditUserModalProps) {
    if (!open) return null;

    function toDateTimeLocalValue(iso: string | null | undefined): string {
        if (!iso) return "";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    function fromDateInputValue(v: string): string | null {
        return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
    }

    function fromDateTimeLocalValue(v: string): string | null {
        if (!v) return null;
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d.toISOString();
    }

    const deactivationEnabled = !!createForm.profile?.deactivation_time;

    return (
        <div className={`fixed inset-0 z-50 p-4 ${isDark ? "bg-black/60" : "bg-black/50"} backdrop-blur-sm flex items-center justify-center`}>
            <div
                className={[
                    "rounded-3xl shadow-2xl border max-w-4xl w-full max-h-[92vh] overflow-y-auto transition-all",
                    isDark ? "bg-slate-900/95 border-slate-800" : "bg-white border-gray-100",
                ].join(" ")}
            >
                <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className={`text-2xl font-semibold tracking-tight ${isDark ? "text-slate-100" : "text-gray-900"}`}>
                                {t("users.editUser")}
                            </h2>
                            <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>{t("common.fillRequiredFields")}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className={`p-2 rounded-lg transition ${isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"}`}
                            aria-label={t("common.close")}
                        >
                            <X className={`h-6 w-6 ${isDark ? "text-slate-400" : "text-gray-600"}`} />
                        </button>
                    </div>

                    <form onSubmit={handleEditUser} className="space-y-8">
                        {/* Email + Role */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                                    {t("common.email")}
                                </label>
                                <input
                                    type="email"
                                    required
                                    className={[
                                        "w-full px-4 py-3 rounded-xl border text-base transition focus:outline-none focus:ring-4",
                                        isDark
                                            ? "bg-slate-800 border-slate-700 text-slate-100 focus:ring-blue-900/30"
                                            : "bg-white border-gray-200 text-gray-900 focus:ring-black/10",
                                    ].join(" ")}
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                                    {t("common.role")}
                                </label>
                                <FancySelect
                                    value={createForm.role}
                                    onChange={(v) => setCreateForm({ ...createForm, role: v })}
                                    options={Object.entries(roleLabels).map(([value, label]) => ({ value, label }))}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Names */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                                    {t("common.firstName")}
                                </label>
                                <input
                                    type="text"
                                    required
                                    className={[
                                        "w-full px-4 py-3 rounded-xl border text-base transition focus:outline-none focus:ring-4",
                                        isDark
                                            ? "bg-slate-800 border-slate-700 text-slate-100 focus:ring-blue-900/30"
                                            : "bg-white border-gray-200 text-gray-900 focus:ring-black/10",
                                    ].join(" ")}
                                    value={createForm.first_name}
                                    onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                                    {t("common.lastName")}
                                </label>
                                <input
                                    type="text"
                                    required
                                    className={[
                                        "w-full px-4 py-3 rounded-xl border text-base transition focus:outline-none focus:ring-4",
                                        isDark
                                            ? "bg-slate-800 border-slate-700 text-slate-100 focus:ring-blue-900/30"
                                            : "bg-white border-gray-200 text-gray-900 focus:ring-black/10",
                                    ].join(" ")}
                                    value={createForm.last_name}
                                    onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                                    {t("common.middleName")}
                                </label>
                                <input
                                    type="text"
                                    className={[
                                        "w-full px-4 py-3 rounded-xl border text-base transition focus:outline-none focus:ring-4",
                                        isDark
                                            ? "bg-slate-800 border-slate-700 text-slate-100 focus:ring-blue-900/30"
                                            : "bg-white border-gray-200 text-gray-900 focus:ring-black/10",
                                    ].join(" ")}
                                    value={createForm.profile?.middle_name ?? ""}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            profile: { ...createForm.profile, middle_name: e.target.value || null },
                                        })
                                    }
                                />
                            </div>
                        </div>

                        {/* Phone + Block profile editing (moved into former "company" spot) + Birth date */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <UzPhoneField
                                label={t("common.phone")}
                                isDark={isDark}
                                value={createForm.profile?.phone_number ?? ""}
                                onChange={(nextFull) =>
                                    setCreateForm({
                                        ...createForm,
                                        profile: { ...createForm.profile, phone_number: nextFull },
                                    })
                                }
                            />


                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                                    {t("common.birthDate")}
                                </label>
                                <input
                                    type="date"
                                    className={[
                                        "w-full px-4 py-3 rounded-xl border text-base transition focus:outline-none focus:ring-4",
                                        isDark
                                            ? "bg-slate-800 border-slate-700 text-slate-100 focus:ring-blue-900/30"
                                            : "bg-white border-gray-200 text-gray-900 focus:ring-black/10",
                                    ].join(" ")}
                                    value={createForm.profile?.birth_date ?? ""}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            profile: { ...createForm.profile, birth_date: fromDateInputValue(e.target.value) },
                                        })
                                    }
                                />
                            </div>

                            {/* Custom toggle replaces the removed "company" field */}
                            <div className="flex flex-col justify-end">
                                <ToggleSwitch
                                    id="profile_edit_blocked"
                                    isDark={isDark}
                                    checked={!!createForm.profile?.profile_edit_blocked}
                                    onChange={(val) =>
                                        setCreateForm({
                                            ...createForm,
                                            profile: { ...createForm.profile, profile_edit_blocked: val },
                                        })
                                    }
                                    label={t("users.blockProfileEdit")}
                                />
                            </div>



                        </div>

                        {/* Interface language (timezone removed; row simplified) */}
                        <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                                    {t("common.interfaceLanguage")}
                                </label>
                                <UserLanguageSelect
                                    value={createForm.profile?.interface_language}
                                    onChange={(lng) =>
                                        setCreateForm((prev) => ({
                                            ...prev,
                                            profile: { ...(prev.profile || {}), interface_language: lng },
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        {/* Deactivation toggle + fields (days only when enabled) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <ToggleSwitch
                                    id="edit_deactivation_toggle"
                                    isDark={isDark}
                                    checked={deactivationEnabled}
                                    onChange={(enabled) => {
                                        if (enabled) {
                                            const nowIso = new Date().toISOString();
                                            setCreateForm({
                                                ...createForm,
                                                profile: {
                                                    ...createForm.profile,
                                                    deactivation_time: createForm.profile?.deactivation_time || nowIso,
                                                },
                                            });
                                        } else {
                                            setCreateForm({
                                                ...createForm,
                                                profile: {
                                                    ...createForm.profile,
                                                    deactivation_time: null,
                                                    days_to_delete_after_deactivation: null,
                                                },
                                            });
                                        }
                                    }}
                                    label={t("users.deactivationDate")}
                                />

                                {deactivationEnabled && (
                                    <input
                                        type="datetime-local"
                                        className={[
                                            "w-full px-4 py-3 rounded-xl border text-base transition focus:outline-none focus:ring-4",
                                            isDark
                                                ? "bg-slate-800 border-slate-700 text-slate-100 focus:ring-blue-900/30"
                                                : "bg-white border-gray-200 text-gray-900 focus:ring-black/10",
                                        ].join(" ")}
                                        value={toDateTimeLocalValue(createForm.profile?.deactivation_time)}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                profile: {
                                                    ...createForm.profile,
                                                    deactivation_time: fromDateTimeLocalValue(e.target.value),
                                                },
                                            })
                                        }
                                    />
                                )}
                            </div>

                            {deactivationEnabled && (
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                                        {t("users.daysToDeleteAfterDeactivation")}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        className={[
                                            "w-full px-4 py-3 rounded-xl border text-base transition focus:outline-none focus:ring-4",
                                            isDark
                                                ? "bg-slate-800 border-slate-700 text-slate-100 focus:ring-blue-900/30"
                                                : "bg-white border-gray-200 text-gray-900 focus:ring-black/10",
                                        ].join(" ")}
                                        value={createForm.profile?.days_to_delete_after_deactivation ?? ""}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                profile: {
                                                    ...createForm.profile,
                                                    days_to_delete_after_deactivation:
                                                        e.target.value === "" ? null : Number(e.target.value),
                                                },
                                            })
                                        }
                                    />
                                    <p className={`mt-2 text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                                        {t("users.userWillBeArchivedAfterDeletion") ?? ""}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className={[
                                    "px-5 py-3 rounded-xl transition",
                                    isDark
                                        ? "border border-slate-700 text-slate-200 hover:bg-slate-800"
                                        : "border border-gray-200 text-gray-800 hover:bg-gray-50",
                                ].join(" ")}
                            >
                                {t("common.cancel")}
                            </button>
                            <button
                                type="submit"
                                className={[
                                    "px-5 py-3 rounded-xl transition font-medium",
                                    isDark ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-900 text-white hover:bg-gray-800",
                                ].join(" ")}
                            >
                                {t("common.save")}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
