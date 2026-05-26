// src/pages/Profile.tsx
import {
    User, Edit, Save, X, Camera, Calendar, Mail, Phone, Building, Globe,
    Shield, Clock, UserCheck, LogOut
} from "lucide-react";
import {useState, useEffect, useMemo} from "react";
import api from "@/api/api";
import {useAuth} from "@/auth/AuthContext";
import EmailChangeVerification from "./EmailChangeVerification";
import Input from "@/components/common/Input";
import {useTheme} from "@/components/common/ThemeContext";
import {ensureAbsoluteUrl} from "@/utils/url";
import {useTranslation} from "react-i18next";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import {useLanguage} from "@/components/common/LanguageContext";
import clsx from "clsx";

interface UserData {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    mfa_enabled: boolean;
    date_joined: string;
    last_login: string | null;
    role: string;
}

interface ProfileData {
    user: UserData;
    middle_name: string | null;
    interface_language: string;
    timezone: string;
    birth_date: string | null;
    profile_edit_blocked: boolean;
    deactivation_time: string | null;
    days_to_delete: number | null;
    phone_number: string | null;
    company: string | null;
    profile_photo: string | null;
    updated_at: string;
}

export default function Profile() {
    const {t} = useTranslation();
    const {currentLanguage, changeLanguage} = useLanguage();
    const [activeTab, setActiveTab] = useState<"manage" | "check" | "study">("manage");
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Email change workflow
    const [showEmailChange, setShowEmailChange] = useState(false);
    const [pendingChanges, setPendingChanges] = useState<any>(null);

    // Form data
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        middle_name: "",
        email: "",
        phone_number: "",
        company: "",
        birth_date: "",
        interface_language: "en",
        timezone: "UTC",
        mfa_enabled: false,
        profile_photo: null as File | null,
    });

    const {accessToken, logout} = useAuth();
    const {actualTheme} = useTheme();

    useEffect(() => {
        fetchProfile(); /* eslint-disable-next-line */
    }, []);

    // align i18n UI with server language when profile loads
    useEffect(() => {
        if (profileData?.interface_language) {
            const server = (profileData.interface_language || "ru").split("-")[0] as "ru" | "en" | "uz";
            changeLanguage(server); // no backend write; just sync UI
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileData?.interface_language]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get("accounts/user/profile/", {
                headers: {Authorization: `Bearer ${accessToken}`}
            });
            const data = response.data as ProfileData;
            setProfileData(data);

            setFormData({
                first_name: data.user.first_name || "",
                last_name: data.user.last_name || "",
                middle_name: data.middle_name || "",
                email: data.user.email || "",
                phone_number: data.phone_number || "",
                company: data.company || "",
                birth_date: data.birth_date || "",
                interface_language: data.interface_language || "en",
                timezone: data.timezone || "UTC",
                mfa_enabled: data.user.mfa_enabled || false,
                profile_photo: null
            });
        } catch (err: any) {
            setError(t("profile.loadFailed"));
            console.error("Profile fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({...prev, profile_photo: e.target.files![0]}));
        }
    };

    const handleSave = async () => {
        if (!profileData) return;
        setSaving(true);
        setError(null);

        try {
            const emailChanged = formData.email !== profileData.user.email;
            const apiFormData = new FormData();

            if (formData.first_name !== profileData.user.first_name) apiFormData.append("first_name", formData.first_name);
            if (formData.last_name !== profileData.user.last_name) apiFormData.append("last_name", formData.last_name);
            if (formData.middle_name !== profileData.middle_name) apiFormData.append("middle_name", formData.middle_name);
            if (formData.phone_number !== profileData.phone_number) apiFormData.append("phone_number", formData.phone_number);
            if (formData.company !== profileData.company) apiFormData.append("company", formData.company);
            if (formData.birth_date !== profileData.birth_date) apiFormData.append("birth_date", formData.birth_date);
            if (formData.interface_language !== profileData.interface_language) apiFormData.append("interface_language", formData.interface_language);
            if (formData.timezone !== profileData.timezone) apiFormData.append("timezone", formData.timezone);
            if (formData.mfa_enabled !== profileData.user.mfa_enabled) apiFormData.append("mfa_enabled", String(formData.mfa_enabled));
            if (formData.profile_photo) apiFormData.append("profile_photo", formData.profile_photo);

            if (Array.from(apiFormData.keys()).length > 0) {
                await api.patch("accounts/user/update_profile/", apiFormData, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "multipart/form-data"
                    }
                });
            }

            if (emailChanged) {
                setPendingChanges({newEmail: formData.email});
                setShowEmailChange(true);
            } else {
                await fetchProfile();
                setIsEditing(false);
            }

        } catch (err: any) {
            if (err.response?.data) {
                const errorData = err.response.data;
                if (typeof errorData === "string") setError(errorData);
                else if (errorData.non_field_errors) setError(errorData.non_field_errors[0]);
                else setError(t("common.saveError"));
            } else {
                setError(t("common.saveErrorGeneric"));
            }
        } finally {
            setSaving(false);
        }
    };

    const handleEmailChangeSuccess = () => {
        setShowEmailChange(false);
        setPendingChanges(null);
        setIsEditing(false);
        fetchProfile();
    };

    const handleEmailChangeCancel = () => {
        setShowEmailChange(false);
        setPendingChanges(null);
    };

    const locale = useMemo(() => {
        const map: Record<"ru" | "en" | "uz", string> = {ru: "ru-RU", en: "en-US", uz: "uz-UZ"};
        return map[currentLanguage as "ru" | "en" | "uz"] || "en-US";
    }, [currentLanguage]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return t("common.notSpecified");
        return new Date(dateString).toLocaleDateString(locale);
    };

    const getRoleColor = (role: string) => {
        const map: Record<string, string> = {
            admin: "bg-gradient-to-r from-red-500 to-pink-500 dark:from-red-600 dark:to-pink-700",
            manager: "bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-700",
            teacher: "bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600",
            assistant: "bg-gradient-to-r from-purple-500 to-violet-500 dark:from-purple-600 dark:to-violet-600",
            student: "bg-gradient-to-r from-orange-400 to-amber-500 dark:from-orange-500 dark:to-amber-600",
        };
        return map[role] || "bg-gradient-to-r from-gray-500 to-slate-500 dark:from-gray-600 dark:to-slate-600";
    };

    if (showEmailChange && pendingChanges) {
        return (
            <EmailChangeVerification
                userId={profileData?.user.id.toString() || ""}
                newEmail={pendingChanges.newEmail}
                onSuccess={handleEmailChangeSuccess}
                onCancel={handleEmailChangeCancel}
            />
        );
    }

    if (loading) {
        return (
            <div className={clsx(
                "flex h-screen items-center justify-center",
                actualTheme === "dark" ? "bg-gradient-to-br from-slate-950 to-slate-900" : "bg-gradient-to-br from-slate-50 to-gray-100"
            )}>
                <div className="relative">
                    <div
                        className="w-16 h-16 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                    <div
                        className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"
                        style={{animationDelay: "150ms"}}></div>
                </div>
            </div>
        );
    }

    if (error && !profileData) {
        return (
            <div className={clsx(
                "flex h-screen items-center justify-center",
                actualTheme === "dark" ? "bg-gradient-to-br from-slate-950 to-slate-900" : "bg-gradient-to-br from-slate-50 to-gray-100"
            )}>
                <div className={clsx(
                    "rounded-2xl shadow-2xl p-8 max-w-md mx-4 border animate-pop",
                    actualTheme === "dark" ? "bg-surface-1 border-border" : "bg-surface-1 border-border"
                )}>
                    <div className="text-center">
                        <div className={clsx(
                            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                            actualTheme === "dark" ? "bg-red-900/30" : "bg-red-50"
                        )}>
                            <X className="w-8 h-8 text-[var(--color-danger)]"/>
                        </div>
                        <h3 className={clsx("text-xl font-semibold mb-2", actualTheme === "dark" ? "text-slate-100" : "text-gray-900")}>
                            {t("common.loadErrorTitle")}
                        </h3>
                        <p className={clsx(actualTheme === "dark" ? "text-slate-300" : "text-gray-600", "mb-6")}>{error}</p>
                        <button
                            onClick={fetchProfile}
                            className="w-full bg-gradient-to-r from-[var(--color-accent-start)] to-[var(--color-accent-end)] text-white px-6 py-3 rounded-xl hover:opacity-95 transition-all duration-150 ease-[var(--ease-smooth)] shadow-lg"
                        >
                            {t("common.tryAgain")}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!profileData) return null;

    const canEdit = !profileData.profile_edit_blocked;
    const photoUrl = ensureAbsoluteUrl(profileData.profile_photo);

    return (
        <div className={clsx(
            "min-h-screen transition-colors duration-200 ease-[var(--ease-smooth)]",
            actualTheme === "dark"
                ? "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950"
                : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
        )}>
            <div className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ---------- Profile Card (Left) ---------- */}
                    <div className="lg:col-span-1">
                        <div className={clsx(
                            "rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm border animate-pop",
                            actualTheme === "dark" ? "bg-surface-1 border-border" : "bg-surface-1 border-white/20"
                        )}>
                            {/* Header gradient */}
                            <div
                                className={clsx("h-40 relative", getRoleColor(profileData.user.role))}>
                                <div
                                    className="absolute inset-0 bg-black/10 dark:bg-black/20"></div>

                                {/* BIGGER AVATAR */}
                                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                                    <div className="relative">
                                        <div
                                            className="w-32 h-32 rounded-full p-1 shadow-2xl ring-4 ring-[var(--color-surface-1)]/80">
                                            <div className={clsx(
                                                "w-full h-full rounded-full flex items-center justify-center overflow-hidden",
                                                actualTheme === "dark"
                                                    ? "bg-gradient-to-br from-slate-700 to-slate-800"
                                                    : "bg-gradient-to-br from-gray-100 to-gray-200"
                                            )}>
                                                {photoUrl ? (
                                                    <img src={photoUrl} alt="Profile"
                                                         className="w-full h-full object-cover rounded-full"/>
                                                ) : (
                                                    <User size={48}
                                                          className={actualTheme === "dark" ? "text-slate-300" : "text-gray-500"}/>
                                                )}
                                            </div>
                                        </div>

                                        {isEditing && canEdit && (
                                            <label
                                                className="absolute inset-0 flex items-center justify-center bg-black/25 dark:bg-black/40 rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-all duration-150 ease-[var(--ease-smooth)]">
                                                <Camera size={20} className="text-white"/>
                                                <input type="file"
                                                       accept="image/jpeg,image/jpg,image/png"
                                                       className="hidden"
                                                       onChange={handleFileChange}/>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Profile Info */}
                            <div className="pt-20 pb-8 px-6 text-center">
                                {/* Role badge */}
                                <div className={clsx(
                                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3",
                                    actualTheme === "dark" ? "bg-slate-700 text-slate-200" : "bg-gray-100 text-gray-700"
                                )}>
                                    <UserCheck size={12} className="mr-1"/>
                                    {t(`roles.${profileData.user.role}`, {defaultValue: profileData.user.role.toUpperCase()})}
                                </div>

                                {/* Name */}
                                <h1 className={clsx("text-2xl font-bold mb-1", actualTheme === "dark" ? "text-slate-100" : "text-gray-900")}>
                                    {profileData.user.first_name} {profileData.user.last_name}
                                </h1>

                                {/* Email */}
                                <p className={clsx(actualTheme === "dark" ? "text-slate-300" : "text-gray-600", "mb-4 flex items-center justify-center")}>
                                    <Mail size={14} className="mr-2"/>
                                    {profileData.user.email}
                                </p>

                                {/* Online status */}
                                <div className={clsx(
                                    "inline-flex items-center px-4 py-2 rounded-full mb-6",
                                    actualTheme === "dark" ? "bg-green-400/10 text-green-300" : "bg-green-50 text-green-700"
                                )}>
                                    <div
                                        className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"/>
                                    <span
                                        className="text-sm font-medium">{t("common.online")}</span>
                                </div>

                                {/* Actions */}
                                {canEdit ? (
                                    <div className="space-y-3">
                                        {!isEditing ? (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-150 ease-[var(--ease-smooth)] transform hover:scale-[1.02] shadow-lg hover:shadow-xl bg-gradient-to-r from-[var(--color-accent-start)] to-[var(--color-accent-end)] hover:opacity-95"
                                            >
                                                <Edit size={18}/>
                                                {t("common.editProfile")}
                                            </button>
                                        ) : (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                    className={clsx(
                                                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium transition-all duration-150 ease-[var(--ease-smooth)] transform hover:scale-[1.02] shadow-lg",
                                                        saving
                                                            ? "bg-gray-400 cursor-not-allowed"
                                                            : "bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-95"
                                                    )}
                                                >
                                                    <Save size={16}/>
                                                    {saving ? t("common.saving") : t("common.save")}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        setError(null);
                                                        setFormData({
                                                            first_name: profileData.user.first_name || "",
                                                            last_name: profileData.user.last_name || "",
                                                            middle_name: profileData.middle_name || "",
                                                            email: profileData.user.email || "",
                                                            phone_number: profileData.phone_number || "",
                                                            company: profileData.company || "",
                                                            birth_date: profileData.birth_date || "",
                                                            interface_language: profileData.interface_language || "en",
                                                            timezone: profileData.timezone || "UTC",
                                                            mfa_enabled: profileData.user.mfa_enabled || false,
                                                            profile_photo: null
                                                        });
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white transition-all duration-150 ease-[var(--ease-smooth)] transform hover:scale-[1.02] shadow-lg bg-gradient-to-r from-gray-500 to-slate-600 hover:opacity-95"
                                                >
                                                    <X size={16}/>
                                                    {t("common.cancel")}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className={clsx(
                                        "border rounded-xl p-3",
                                        actualTheme === "dark" ? "bg-red-900/10 border-red-900/30 text-red-300" : "bg-red-50 border-red-200 text-red-700"
                                    )}>
                                        <p className="text-sm flex items-center justify-center">
                                            <Shield size={16} className="mr-2"/>
                                            {t("common.editingBlocked")}
                                        </p>
                                    </div>
                                )}

                                {/* Updated at */}
                                <p className={clsx(
                                    actualTheme === "dark" ? "text-slate-400" : "text-gray-500",
                                    "text-xs mt-4 flex items-center justify-center"
                                )}>
                                    <Clock size={12} className="mr-1"/>
                                    {t("common.updated")} {formatDate(profileData.updated_at)}
                                </p>

                                {error && (
                                    <div className={clsx(
                                        "mt-4 border rounded-xl p-3",
                                        actualTheme === "dark" ? "bg-red-900/10 border-red-900/30 text-red-300" : "bg-red-50 border-red-200 text-red-700"
                                    )}>
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ---------- Main Content (Right) ---------- */}
                    <div className="lg:col-span-2">
                        <div className={clsx(
                            "rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm border animate-pop",
                            actualTheme === "dark" ? "bg-surface-1 border-border" : "bg-surface-1 border-white/20"
                        )}>

                            {/* Toolbar: title/subtitle left, actions right (LANG SWITCHER HERE) */}
                            <div
                                className="px-8 pt-6 pb-4 border-b border-[var(--color-border)] flex items-center justify-between">
                                <div className="min-w-0">
                                    <h2 className="text-xl font-bold truncate">{t("profile.info.title")}</h2>
                                    <p className="text-sm text-[var(--color-muted)]">{t("profile.info.subtitle")}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <LanguageSwitcher size="sm" persistToBackend
                                                      className="backdrop-blur"/>
                                </div>
                            </div>

                            {/* Tabs rail */}
                            <div className="border-b border-[var(--color-border)] px-8 pt-4">
                                <div
                                    className="bg-[var(--color-surface-2)] flex space-x-1 rounded-2xl p-1">
                                    {[
                                        {id: "manage", label: t("tabs.manage"), icon: User},
                                        {id: "check", label: t("tabs.check"), icon: Shield},
                                        {id: "study", label: t("tabs.study"), icon: Globe}
                                    ].map(({id, label, icon: Icon}) => (
                                        <button
                                            key={id}
                                            onClick={() => setActiveTab(id as any)}
                                            className={clsx(
                                                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold uppercase tracking-wide transition-all duration-150 ease-[var(--ease-smooth)]",
                                                activeTab === (id as any)
                                                    ? "bg-[var(--color-surface-1)] text-[var(--color-primary)] shadow-md"
                                                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-1)]/70"
                                            )}
                                        >
                                            <Icon size={16}/>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                {activeTab === "manage" && (
                                    <div className="space-y-8">
                                        {/* Section title is in toolbar now; keep two cards */}
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                                            {/* Personal info */}
                                            <div className={clsx(
                                                "rounded-2xl p-6 border bg-gradient-to-br",
                                                actualTheme === "dark"
                                                    ? "from-slate-900 to-slate-800 border-slate-700/30"
                                                    : "from-[var(--color-surface-1)] to-[var(--color-surface-2)] border-[var(--color-border)]"
                                            )}>
                                                <h3 className={clsx(
                                                    "text-lg font-semibold mb-6 flex items-center",
                                                    actualTheme === "dark" ? "text-slate-100" : "text-gray-900"
                                                )}>
                                                    <User size={20} className={clsx("mr-2",
                                                        actualTheme === "dark" ? "text-blue-300" : "text-blue-600")}/>
                                                    {t("profile.info.personal")}
                                                </h3>

                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className={clsx(
                                                                "block text-sm font-medium mb-2",
                                                                actualTheme === "dark" ? "text-slate-300" : "text-gray-700"
                                                            )}>{t("common.firstName")}</label>
                                                            {isEditing && canEdit ? (
                                                                <Input
                                                                    type="text"
                                                                    value={formData.first_name}
                                                                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                                                                    placeholder={t("placeholders.firstName")!}
                                                                    className={clsx(
                                                                        "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all duration-150",
                                                                        actualTheme === "dark" ? "border-slate-700 bg-slate-800" : "border-[var(--color-border)] bg-white"
                                                                    )}
                                                                />
                                                            ) : (
                                                                <div className={clsx(
                                                                    "px-4 py-3 rounded-xl border",
                                                                    actualTheme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-[var(--color-border)]"
                                                                )}>
                                                                    <p className={actualTheme === "dark" ? "text-slate-100" : "text-gray-900"}>
                                                                        {profileData.user.first_name || t("common.notSpecified")}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className={clsx(
                                                                "block text-sm font-medium mb-2",
                                                                actualTheme === "dark" ? "text-slate-300" : "text-gray-700"
                                                            )}>{t("common.lastName")}</label>
                                                            {isEditing && canEdit ? (
                                                                <Input
                                                                    type="text"
                                                                    value={formData.last_name}
                                                                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                                                                    placeholder={t("placeholders.lastName")!}
                                                                    className={clsx(
                                                                        "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all duration-150",
                                                                        actualTheme === "dark" ? "border-slate-700 bg-slate-800" : "border-[var(--color-border)] bg-white"
                                                                    )}
                                                                />
                                                            ) : (
                                                                <div className={clsx(
                                                                    "px-4 py-3 rounded-xl border",
                                                                    actualTheme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-[var(--color-border)]"
                                                                )}>
                                                                    <p className={actualTheme === "dark" ? "text-slate-100" : "text-gray-900"}>
                                                                        {profileData.user.last_name || t("common.notSpecified")}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {(profileData.middle_name || isEditing) && (
                                                        <div>
                                                            <label className={clsx(
                                                                "block text-sm font-medium mb-2",
                                                                actualTheme === "dark" ? "text-slate-300" : "text-gray-700"
                                                            )}>{t("common.middleName")}</label>
                                                            {isEditing && canEdit ? (
                                                                <Input
                                                                    type="text"
                                                                    value={formData.middle_name}
                                                                    onChange={(e) => handleInputChange("middle_name", e.target.value)}
                                                                    placeholder={t("placeholders.middleName")!}
                                                                    className={clsx(
                                                                        "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all duration-150",
                                                                        actualTheme === "dark" ? "border-slate-700 bg-slate-800" : "border-[var(--color-border)] bg-white"
                                                                    )}
                                                                />
                                                            ) : (
                                                                <div className={clsx(
                                                                    "px-4 py-3 rounded-xl border",
                                                                    actualTheme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-[var(--color-border)]"
                                                                )}>
                                                                    <p className={actualTheme === "dark" ? "text-slate-100" : "text-gray-900"}>
                                                                        {profileData.middle_name || t("common.notSpecified")}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div>
                                                        <label className={clsx(
                                                            "block text-sm font-medium mb-2 flex items-center",
                                                            actualTheme === "dark" ? "text-slate-300" : "text-gray-700"
                                                        )}>
                                                            <Mail size={14} className="mr-1"/>
                                                            {t("common.email")}
                                                        </label>
                                                        {isEditing && canEdit ? (
                                                            <Input
                                                                type="email"
                                                                value={formData.email}
                                                                onChange={(e) => handleInputChange("email", e.target.value)}
                                                                placeholder={t("placeholders.email")!}
                                                                className={clsx(
                                                                    "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all duration-150",
                                                                    actualTheme === "dark" ? "border-slate-700 bg-slate-800" : "border-[var(--color-border)] bg-white"
                                                                )}
                                                            />
                                                        ) : (
                                                            <div className={clsx(
                                                                "px-4 py-3 rounded-xl border",
                                                                actualTheme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-[var(--color-border)]"
                                                            )}>
                                                                <p className={actualTheme === "dark" ? "text-slate-100" : "text-gray-900"}>{profileData.user.email}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {(profileData.birth_date || isEditing) && (
                                                        <div>
                                                            <label className={clsx(
                                                                "block text-sm font-medium mb-2 flex items-center",
                                                                actualTheme === "dark" ? "text-slate-300" : "text-gray-700"
                                                            )}>
                                                                <Calendar size={14}
                                                                          className="mr-1"/>
                                                                {t("common.birthDate")}
                                                            </label>
                                                            {isEditing && canEdit ? (
                                                                <Input
                                                                    type="date"
                                                                    value={formData.birth_date}
                                                                    onChange={(e) => handleInputChange("birth_date", e.target.value)}
                                                                    className={clsx(
                                                                        "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all duration-150",
                                                                        actualTheme === "dark" ? "border-slate-700 bg-slate-800" : "border-[var(--color-border)] bg-white"
                                                                    )}
                                                                />
                                                            ) : (
                                                                <div className={clsx(
                                                                    "px-4 py-3 rounded-xl border",
                                                                    actualTheme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-[var(--color-border)]"
                                                                )}>
                                                                    <p className={actualTheme === "dark" ? "text-slate-100" : "text-gray-900"}>{formatDate(profileData.birth_date)}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Contacts & Security */}
                                            <div className={clsx(
                                                "rounded-2xl p-6 border bg-gradient-to-br",
                                                actualTheme === "dark"
                                                    ? "from-slate-900 to-slate-800 border-slate-700/30"
                                                    : "from-[var(--color-surface-1)] to-[var(--color-surface-2)] border-[var(--color-border)]"
                                            )}>
                                                <h3 className={clsx(
                                                    "text-lg font-semibold mb-6 flex items-center",
                                                    actualTheme === "dark" ? "text-slate-100" : "text-gray-900"
                                                )}>
                                                    <Phone size={20} className={clsx("mr-2",
                                                        actualTheme === "dark" ? "text-purple-300" : "text-purple-600")}/>
                                                    {t("profile.info.contactsSecurity")}
                                                </h3>

                                                <div className="space-y-6">
                                                    {(profileData.phone_number || isEditing) && (
                                                        <div>
                                                            <label className={clsx(
                                                                "block text-sm font-medium mb-2 flex items-center",
                                                                actualTheme === "dark" ? "text-slate-300" : "text-gray-700"
                                                            )}>
                                                                <Phone size={14} className="mr-1"/>
                                                                {t("common.phone")}
                                                            </label>
                                                            {isEditing && canEdit ? (
                                                                <Input
                                                                    type="tel"
                                                                    value={formData.phone_number}
                                                                    onChange={(e) => handleInputChange("phone_number", e.target.value)}
                                                                    placeholder={t("placeholders.phone")!}
                                                                    className={clsx(
                                                                        "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-150",
                                                                        actualTheme === "dark" ? "border-slate-700 bg-slate-800" : "border-[var(--color-border)] bg-white"
                                                                    )}
                                                                />
                                                            ) : (
                                                                <div className={clsx(
                                                                    "px-4 py-3 rounded-xl border",
                                                                    actualTheme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-[var(--color-border)]"
                                                                )}>
                                                                    <p className={actualTheme === "dark" ? "text-slate-100" : "text-gray-900"}>
                                                                        {profileData.phone_number || t("common.notSpecified")}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {(profileData.company || isEditing) && (
                                                        <div>
                                                            <label className={clsx(
                                                                "block text-sm font-medium mb-2 flex items-center",
                                                                actualTheme === "dark" ? "text-slate-300" : "text-gray-700"
                                                            )}>
                                                                <Building size={14}
                                                                          className="mr-1"/>
                                                                {t("common.company")}
                                                            </label>
                                                            {isEditing && canEdit ? (
                                                                <Input
                                                                    type="text"
                                                                    value={formData.company}
                                                                    onChange={(e) => handleInputChange("company", e.target.value)}
                                                                    placeholder={t("placeholders.company")!}
                                                                    className={clsx(
                                                                        "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-150",
                                                                        actualTheme === "dark" ? "border-slate-700 bg-slate-800" : "border-[var(--color-border)] bg-white"
                                                                    )}
                                                                />
                                                            ) : (
                                                                <div className={clsx(
                                                                    "px-4 py-3 rounded-xl border",
                                                                    actualTheme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-[var(--color-border)]"
                                                                )}>
                                                                    <p className={actualTheme === "dark" ? "text-slate-100" : "text-gray-900"}>
                                                                        {profileData.company || t("common.notSpecified")}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div>
                                                        <label className={clsx(
                                                            "block text-sm font-medium mb-2 flex items-center",
                                                            actualTheme === "dark" ? "text-slate-300" : "text-gray-700"
                                                        )}>
                                                            <Shield size={14} className="mr-1"/>
                                                            {t("common.twoFactorAuth")}
                                                        </label>
                                                        {isEditing && canEdit ? (
                                                            <label className={clsx(
                                                                "flex items-center p-4 rounded-xl border cursor-pointer transition-colors",
                                                                actualTheme === "dark"
                                                                    ? "bg-slate-800 border-slate-700 hover:bg-slate-700"
                                                                    : "bg-white border-[var(--color-border)] hover:bg-gray-50"
                                                            )}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.mfa_enabled}
                                                                    onChange={(e) => handleInputChange("mfa_enabled", e.target.checked)}
                                                                    className="w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500"
                                                                />
                                                                <span className={clsx(
                                                                    "ml-3",
                                                                    actualTheme === "dark" ? "text-slate-100" : "text-gray-900"
                                                                )}>
                                  {t("common.enable2FA")}
                                </span>
                                                            </label>
                                                        ) : (
                                                            <div className={clsx(
                                                                "px-4 py-3 rounded-xl border",
                                                                actualTheme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-[var(--color-border)]"
                                                            )}>
                                                                <div className="flex items-center">
                                                                    <div className={clsx(
                                                                        "w-3 h-3 rounded-full mr-2",
                                                                        profileData.user.mfa_enabled ? "bg-green-500" : "bg-red-500"
                                                                    )}/>
                                                                    <p className={clsx(
                                                                        actualTheme === "dark" ? "text-slate-100" : "text-gray-900"
                                                                    )}>
                                                                        {profileData.user.mfa_enabled ? t("common.enabled") : t("common.disabled")}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div>
                                                            <label className={clsx(
                                                                "block text-sm font-medium mb-2",
                                                                actualTheme === "dark" ? "text-slate-300" : "text-gray-700"
                                                            )}>{t("common.dateJoined")}</label>
                                                            <div className={clsx(
                                                                "px-4 py-3 rounded-xl border",
                                                                actualTheme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-[var(--color-border)]"
                                                            )}>
                                                                <p className={clsx(
                                                                    "flex items-center",
                                                                    actualTheme === "dark" ? "text-slate-100" : "text-gray-900"
                                                                )}>
                                                                    <Calendar size={14}
                                                                              className={clsx(
                                                                                  "mr-2",
                                                                                  actualTheme === "dark" ? "text-slate-400" : "text-gray-500"
                                                                              )}/>
                                                                    {formatDate(profileData.user.date_joined)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className={clsx(
                                                                "block text-sm font-medium mb-2",
                                                                actualTheme === "dark" ? "text-slate-300" : "text-gray-700"
                                                            )}>{t("common.lastLogin")}</label>
                                                            <div className={clsx(
                                                                "px-4 py-3 rounded-xl border",
                                                                actualTheme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-[var(--color-border)]"
                                                            )}>
                                                                <p className={clsx(
                                                                    "flex items-center",
                                                                    actualTheme === "dark" ? "text-slate-100" : "text-gray-900"
                                                                )}>
                                                                    <Clock size={14}
                                                                           className={clsx(
                                                                               "mr-2",
                                                                               actualTheme === "dark" ? "text-slate-400" : "text-gray-500"
                                                                           )}/>
                                                                    {formatDate(profileData.user.last_login)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-6">
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm(t("profile.logoutAll.confirm")!)) {
                                                                try {
                                                                    const res = await api.delete("accounts/auth/logout-of-all-devices/", {
                                                                        headers: {Authorization: `Bearer ${accessToken}`}
                                                                    });
                                                                    alert(res.data?.message || t("profile.logoutAll.success"));
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    alert(t("profile.logoutAll.error"));
                                                                } finally {
                                                                    logout();
                                                                }
                                                            }
                                                        }}
                                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all duration-150 ease-[var(--ease-smooth)] transform hover:scale-[1.02] shadow-lg bg-gradient-to-r from-red-500 to-orange-600 hover:opacity-95"
                                                    >
                                                        <LogOut size={18}/>
                                                        {t("profile.logoutAll.button")}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "check" && (
                                    <div className="text-center py-16">
                                        <div className={clsx(
                                            "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6",
                                            actualTheme === "dark"
                                                ? "bg-gradient-to-br from-slate-800 to-slate-700"
                                                : "bg-gradient-to-br from-blue-100 to-purple-100"
                                        )}>
                                            <Shield size={32}
                                                    className={actualTheme === "dark" ? "text-blue-300" : "text-blue-600"}/>
                                        </div>
                                        <h3 className={clsx(
                                            "text-2xl font-semibold mb-4",
                                            actualTheme === "dark" ? "text-slate-100" : "text-gray-900"
                                        )}>{t("profile.check.title")}</h3>
                                        <p className={clsx(
                                            "max-w-md mx-auto",
                                            actualTheme === "dark" ? "text-slate-300" : "text-gray-600"
                                        )}>{t("profile.check.desc")}</p>
                                    </div>
                                )}

                                {activeTab === "study" && (
                                    <div className="text-center py-16">
                                        <div className={clsx(
                                            "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6",
                                            actualTheme === "dark"
                                                ? "bg-gradient-to-br from-slate-800 to-slate-700"
                                                : "bg-gradient-to-br from-green-100 to-emerald-100"
                                        )}>
                                            <Globe size={32}
                                                   className={actualTheme === "dark" ? "text-green-300" : "text-green-600"}/>
                                        </div>
                                        <h3 className={clsx(
                                            "text-2xl font-semibold mb-4",
                                            actualTheme === "dark" ? "text-slate-100" : "text-gray-900"
                                        )}>{t("profile.study.title")}</h3>
                                        <p className={clsx(
                                            "max-w-md mx-auto",
                                            actualTheme === "dark" ? "text-slate-300" : "text-gray-600"
                                        )}>{t("profile.study.desc")}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
