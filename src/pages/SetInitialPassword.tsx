import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "@/api/api";
import lms_logo from "@/assets/lms-logo.svg";
import Input from "@/components/common/Input";
import { useTheme } from "@/components/common/ThemeContext";
import { Lock, Eye, EyeOff, UserPlus, CheckCircle, AlertCircle } from "lucide-react";

// Read min length from env with a safe numeric fallback
const envMin = Number((import.meta as any).env?.VITE_MIN_PASSWORD_LENGTH);
const MIN_PASSWORD_LENGTH =
    Number.isFinite(envMin) && envMin > 0 ? envMin : 6; // default to 6 if unset/invalid

export default function SetInitialPassword() {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const uid = searchParams.get("uid");
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [validatingLink, setValidatingLink] = useState(true);
    const [linkValid, setLinkValid] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Password strength calculator
    useEffect(() => {
        let strength = 0;
        if (newPassword.length >= MIN_PASSWORD_LENGTH) strength += 1;
        if (/[A-Z]/.test(newPassword)) strength += 1;
        if (/[a-z]/.test(newPassword)) strength += 1;
        if (/\d/.test(newPassword)) strength += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) strength += 1;
        setPasswordStrength(strength);
    }, [newPassword]);

    useEffect(() => {
        const validateInvite = async () => {
            if (!uid || !token) {
                navigate("/login");
                return;
            }

            try {
                const response = await api.post("accounts/validate-invite/", null, {
                    params: { uid, token },
                });

                if (response.data.valid) {
                    setLinkValid(true);
                } else {
                    const errors = response.data.errors;
                    if (errors?.detail?.[0] === "already_activated") {
                        setError("Эта ссылка уже была использована. Пароль уже установлен.");
                    } else if (errors?.token) {
                        setError("Недействительная или истекшая ссылка.");
                    } else if (errors?.uid) {
                        setError("Недействительная ссылка.");
                    } else {
                        setError("Ссылка недействительна или истекла.");
                    }
                }
            } catch (err) {
                setError("Не удается проверить ссылку. Попробуйте позже.");
            } finally {
                setValidatingLink(false);
            }
        };

        validateInvite();
    }, [uid, token, navigate]);

    const getPasswordStrengthColor = () => {
        if (passwordStrength <= 1) return isDark ? "bg-red-500" : "bg-red-500";
        if (passwordStrength <= 2) return isDark ? "bg-yellow-500" : "bg-yellow-500";
        if (passwordStrength <= 3) return isDark ? "bg-blue-500" : "bg-blue-500";
        return isDark ? "bg-green-500" : "bg-green-500";
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength <= 1) return "Слабый";
        if (passwordStrength <= 2) return "Средний";
        if (passwordStrength <= 3) return "Хороший";
        return "Отличный";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("Пароли не совпадают");
            return;
        }

        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            setError(`Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов`);
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("accounts/set-initial-password/", {
                uid: uid,
                token: token,
                new_password: newPassword,
                re_password: confirmPassword,
            });

            localStorage.setItem("access", response.data.tokens.access);
            localStorage.setItem("refresh", response.data.tokens.refresh);

            navigate("/");
        } catch (err: any) {
            if (err.response?.data) {
                const errorData = err.response.data;
                if (typeof errorData === "string") {
                    setError(errorData);
                } else if (errorData.non_field_errors) {
                    setError(errorData.non_field_errors[0]);
                } else if (errorData.re_password) {
                    setError(errorData.re_password[0]);
                } else {
                    setError("Произошла ошибка. Попробуйте еще раз.");
                }
            } else {
                setError("Произошла ошибка. Проверьте подключение к интернету.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (validatingLink) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 ${
                isDark
                    ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
                    : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"
            }`}>
                <div className={`w-full max-w-md relative z-10 ${
                    isDark
                        ? "bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-slate-900/50"
                        : "bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-black/10"
                } rounded-3xl p-8 text-center`}>
                    <img src={lms_logo} alt="LMS Logo" className="w-56 h-auto mx-auto mb-6" />
                    <h1 className={`text-2xl font-light mb-6 ${
                        isDark ? "text-slate-100" : "text-slate-800"
                    }`}>
                        Проверка ссылки...
                    </h1>
                    <div className="flex justify-center">
                        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                            isDark ? "border-slate-200" : "border-blue-600"
                        }`}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!linkValid) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 ${
                isDark
                    ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
                    : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"
            }`}>
                <div className={`w-full max-w-md relative z-10 ${
                    isDark
                        ? "bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-slate-900/50"
                        : "bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-black/10"
                } rounded-3xl p-8 text-center`}>
                    <img src={lms_logo} alt="LMS Logo" className="w-56 h-auto mx-auto mb-6" />

                    <div className={`p-3 rounded-full inline-block mb-4 ${
                        isDark ? "bg-red-900/20" : "bg-red-100"
                    }`}>
                        <AlertCircle className={`w-8 h-8 ${
                            isDark ? "text-red-400" : "text-red-600"
                        }`} />
                    </div>

                    <h1 className={`text-2xl font-light mb-4 ${
                        isDark ? "text-slate-100" : "text-slate-800"
                    }`}>
                        Ссылка недействительна
                    </h1>

                    {error && (
                        <div className={`mb-6 p-4 rounded-xl ${
                            isDark
                                ? "bg-red-900/20 border border-red-700/30 text-red-300"
                                : "bg-red-50 border border-red-200 text-red-700"
                        }`}>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={() => navigate("/login")}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg font-semibold rounded-xl py-4 px-6 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        Перейти к входу
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${
            isDark
                ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
                : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"
        }`}>
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20 ${
                    isDark ? "bg-blue-600" : "bg-blue-400"
                } animate-pulse`}></div>
                <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 ${
                    isDark ? "bg-purple-600" : "bg-purple-400"
                } animate-pulse delay-1000`}></div>
            </div>

            <div className={`w-full max-w-md relative z-10 ${
                isDark
                    ? "bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-slate-900/50"
                    : "bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-black/10"
            } rounded-3xl p-8 transform transition-all duration-300 hover:scale-[1.02]`}>

                {/* Logo Section */}
                <div className="text-center mb-8">
                    <div className="relative inline-block">
                        <div className={`absolute inset-0 rounded-2xl blur-2xl opacity-30 ${
                            isDark ? "bg-blue-500" : "bg-blue-400"
                        } animate-pulse`}></div>
                        <img
                            src={lms_logo}
                            alt="LMS Logo"
                            className="relative w-56 h-auto mx-auto transform transition-transform duration-300 hover:scale-105"
                        />
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-3">
                        <div className={`p-2 rounded-full ${
                            isDark ? "bg-purple-600/20" : "bg-purple-100"
                        }`}>
                            <UserPlus className={`w-6 h-6 ${
                                isDark ? "text-purple-400" : "text-purple-600"
                            }`} />
                        </div>
                        <h1 className={`text-2xl font-light ${
                            isDark ? "text-slate-100" : "text-slate-800"
                        } tracking-wide`}>
                            Создание пароля
                        </h1>
                    </div>

                    <p className={`text-sm mt-3 ${
                        isDark ? "text-slate-400" : "text-slate-600"
                    }`}>
                        Создайте новый пароль для вашей учетной записи{" "}
                        (минимум {MIN_PASSWORD_LENGTH} символ{MIN_PASSWORD_LENGTH === 1 ? "" : "ов"})
                    </p>
                </div>

                {/* Alert Messages */}
                {error && (
                    <div className={`mb-6 p-4 rounded-xl ${
                        isDark
                            ? "bg-red-900/20 border border-red-700/30 text-red-300"
                            : "bg-red-50 border border-red-200 text-red-700"
                    } animate-fade-in`}>
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Password Creation Form */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* New Password Field */}
                    <div className="space-y-2">
                        <label className={`text-sm font-medium ${
                            isDark ? "text-slate-300" : "text-slate-700"
                        }`}>
                            Новый пароль
                        </label>
                        <div className="relative">
                            <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
                                isDark ? "text-slate-400" : "text-slate-500"
                            }`}>
                                <Lock size={20} />
                            </div>
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 ${
                                    isDark
                                        ? "bg-slate-900/50 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                        : "bg-white/70 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                } text-base`}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                                    isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"
                                } transition-colors duration-200`}
                            >
                                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {/* Password Strength Indicator */}
                        {newPassword && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs ${
                                        isDark ? "text-slate-400" : "text-slate-600"
                                    }`}>
                                        Надежность пароля
                                    </span>
                                    <span className={`text-xs font-medium ${
                                        passwordStrength <= 1 ? "text-red-500" :
                                            passwordStrength <= 2 ? "text-yellow-500" :
                                                passwordStrength <= 3 ? "text-blue-500" : "text-green-500"
                                    }`}>
                                        {getPasswordStrengthText()}
                                    </span>
                                </div>
                                <div className={`h-2 rounded-full ${
                                    isDark ? "bg-slate-700" : "bg-slate-200"
                                }`}>
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                        <label className={`text-sm font-medium ${
                            isDark ? "text-slate-300" : "text-slate-700"
                        }`}>
                            Подтвердите пароль
                        </label>
                        <div className="relative">
                            <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
                                isDark ? "text-slate-400" : "text-slate-500"
                            }`}>
                                <Lock size={20} />
                            </div>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 ${
                                    isDark
                                        ? "bg-slate-900/50 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                        : "bg-white/70 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                } text-base ${
                                    confirmPassword && newPassword !== confirmPassword
                                        ? (isDark ? "border-red-500 focus:border-red-500" : "border-red-500 focus:border-red-500")
                                        : confirmPassword && newPassword === confirmPassword
                                            ? (isDark ? "border-green-500 focus:border-green-500" : "border-green-500 focus:border-green-500")
                                            : ""
                                }`}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                                    isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"
                                } transition-colors duration-200`}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {/* Password Match Indicator */}
                        {confirmPassword && (
                            <div className="flex items-center gap-2 mt-2">
                                {newPassword === confirmPassword ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                                <p className={`text-xs ${
                                    newPassword === confirmPassword
                                        ? "text-green-500"
                                        : "text-red-500"
                                }`}>
                                    {newPassword === confirmPassword ? "Пароли совпадают" : "Пароли не совпадают"}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Create Button */}
                    <button
                        type="submit"
                        disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                        className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-300 transform ${
                            loading || !newPassword || !confirmPassword || newPassword !== confirmPassword
                                ? "bg-slate-400 cursor-not-allowed scale-95"
                                : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
                        } flex items-center justify-center gap-3`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Создание...
                            </>
                        ) : (
                            <>
                                <UserPlus size={20} />
                                Создать пароль
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Custom CSS for animations */}
            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}