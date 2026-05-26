import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import api from "@/api/api";
import lms_logo from "@/assets/lms-logo.svg";
import Input from "@/components/common/Input";
import { useTheme } from "@/components/common/ThemeContext";
import { Lock, Eye, EyeOff, Save, ArrowLeft, Shield } from "lucide-react";

export default function ResetPassword() {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [email, setEmail] = useState("");
    const [uid, setUid] = useState("");
    const [token, setToken] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const st = location.state as { email?: string; uid?: string; token?: string } | null;
        const emailS = st?.email ?? sessionStorage.getItem("fp_email") ?? "";
        const uidS = st?.uid ?? sessionStorage.getItem("fp_uid") ?? "";
        const tokenS = st?.token ?? sessionStorage.getItem("fp_token") ?? "";

        if (!emailS || !uidS || !tokenS) {
            navigate("/forgot-password", { replace: true });
            return;
        }

        setEmail(emailS);
        setUid(uidS);
        setToken(tokenS);

        return () => abortRef.current?.abort();
    }, [location, navigate]);

    // Password strength calculator
    useEffect(() => {
        let strength = 0;
        if (newPassword.length >= 8) strength += 1;
        if (/[A-Z]/.test(newPassword)) strength += 1;
        if (/[a-z]/.test(newPassword)) strength += 1;
        if (/\d/.test(newPassword)) strength += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) strength += 1;
        setPasswordStrength(strength);
    }, [newPassword]);

    const validatePassword = (password: string) => {
        if (password.length < 2) return "Пароль должен содержать минимум 2 символов";
        return null;
    };

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

        const pwdErr = validatePassword(newPassword);
        if (pwdErr) return setError(pwdErr);
        if (newPassword !== confirmPassword) return setError("Пароли не совпадают");

        setLoading(true);
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        try {
            await api.post(
                "accounts/auth/reset_password/",
                {
                    uid,
                    token,
                    new_password: newPassword,
                    re_new_password: confirmPassword,
                },
                { signal: abortRef.current.signal }
            );

            sessionStorage.removeItem("fp_email");
            sessionStorage.removeItem("fp_uid");
            sessionStorage.removeItem("fp_token");

            navigate("/login", {
                replace: true,
                state: { message: "Пароль успешно изменен. Войдите с новым паролем." },
            });
        } catch (err: any) {
            if (axios.isCancel(err)) return;
            const data = err?.response?.data;
            if (data?.new_password?.[0]) setError(data.new_password[0]);
            else if (data?.non_field_errors?.[0]) setError(data.non_field_errors[0]);
            else if (data?.message) setError(data.message);
            else setError("Произошла ошибка. Попробуйте еще раз.");
        } finally {
            setLoading(false);
        }
    };

    if (!email || !uid || !token) return null;

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
                            isDark ? "bg-green-600/20" : "bg-green-100"
                        }`}>
                            <Shield className={`w-6 h-6 ${
                                isDark ? "text-green-400" : "text-green-600"
                            }`} />
                        </div>
                        <h1 className={`text-2xl font-light ${
                            isDark ? "text-slate-100" : "text-slate-800"
                        } tracking-wide`}>
                            Новый пароль
                        </h1>
                    </div>

                    <p className={`text-sm mt-3 ${
                        isDark ? "text-slate-400" : "text-slate-600"
                    }`}>
                        Установите новый пароль для{" "}
                        <span className={`font-medium ${
                            isDark ? "text-slate-300" : "text-slate-800"
                        }`}>
                            {email}
                        </span>
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

                {/* Reset Password Form */}
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
                                <div className={`w-2 h-2 rounded-full ${
                                    newPassword === confirmPassword ? "bg-green-500" : "bg-red-500"
                                }`}></div>
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

                    {/* Password Requirements */}
                    <div className={`p-4 rounded-xl ${
                        isDark ? "bg-slate-900/30" : "bg-slate-50"
                    }`}>
                        <p className={`text-xs ${
                            isDark ? "text-slate-400" : "text-slate-600"
                        } mb-2`}>
                            Требования к паролю:
                        </p>
                        <ul className="space-y-1 text-xs">
                            <li className={`flex items-center gap-2 ${
                                newPassword.length >= 2 ? "text-green-500" : (isDark ? "text-slate-400" : "text-slate-500")
                            }`}>
                                <div className={`w-1 h-1 rounded-full ${
                                    newPassword.length >= 2 ? "bg-green-500" : (isDark ? "bg-slate-500" : "bg-slate-400")
                                }`}></div>
                                Минимум 2 символа
                            </li>
                        </ul>
                    </div>

                    {/* Save Button */}
                    <button
                        type="submit"
                        disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                        className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-300 transform ${
                            loading || !newPassword || !confirmPassword || newPassword !== confirmPassword
                                ? "bg-slate-400 cursor-not-allowed scale-95"
                                : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
                        } flex items-center justify-center gap-3`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Сохранение...
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Сохранить пароль
                            </>
                        )}
                    </button>
                </form>

                {/* Back Button */}
                <div className="mt-8 pt-6 border-t border-slate-200/20 text-center">
                    <button
                        onClick={() => navigate("/login")}
                        className={`${
                            isDark
                                ? "text-slate-400 hover:text-slate-300"
                                : "text-slate-600 hover:text-slate-800"
                        } transition-colors duration-200 flex items-center gap-2 mx-auto group`}
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-200" />
                        Вернуться к входу
                    </button>
                </div>
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