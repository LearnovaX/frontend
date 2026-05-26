import { useState, useEffect} from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ArrowLeft, Mail, Shield, RefreshCw, CheckCircle } from "lucide-react";
import api from "@/api/api";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/components/common/ThemeContext";
import lms_logo from "@/assets/lms-logo.svg";

interface EmailChangeVerificationProps {
    userId: string;
    newEmail: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function EmailChangeVerification({
                                                    userId,
                                                    newEmail,
                                                    onSuccess,
                                                    onCancel,
                                                }: EmailChangeVerificationProps) {
    const { accessToken } = useAuth();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";

    const [verificationCode, setVerificationCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [resendLoading, setResendLoading] = useState(false);

    // === Helpers ===
    const formatTime = (s: number) =>
        `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    const extractError = (err: any): string => {
        const data = err?.response?.data;
        if (!data) return "Произошла ошибка. Проверьте подключение к интернету.";
        if (typeof data === "string") return data;
        return (
            data.non_field_errors?.[0] ||
            data.new_email?.[0] ||
            data.user_id?.[0] ||
            data.code?.[0] ||
            "Неверный код подтверждения"
        );
    };

    // === API Calls ===
    const sendVerificationCode = async () => {
        setResendLoading(true);
        setError(null);
        try {
            await api.post(
                "accounts/user/request_email_change/",
                { user_id: userId, new_email: newEmail },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            setCodeSent(true);
            setTimeLeft(300); // reset
        } catch (err) {
            setError(extractError(err));
        } finally {
            setResendLoading(false);
        }
    };

    const confirmCode = async () => {
        setLoading(true);
        setError(null);
        try {
            await api.post(
                "accounts/user/confirm_email_change/",
                { new_email: newEmail, code: verificationCode },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            onSuccess();
        } catch (err) {
            setError(extractError(err));
        } finally {
            setLoading(false);
        }
    };

    // === Handlers ===
    const handleCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "");
        if (value.length <= 10) {
            setVerificationCode(value);
            setError(null);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (verificationCode.length < 4) {
            setError("Введите код подтверждения");
            return;
        }
        confirmCode();
    };

    // === Effects ===
    useEffect(() => {
        sendVerificationCode();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!codeSent) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setError("Код истек. Запросите новый код.");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [codeSent]);

    // === UI ===
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
                            isDark ? "bg-cyan-600/20" : "bg-cyan-100"
                        }`}>
                            <Mail className={`w-6 h-6 ${
                                isDark ? "text-cyan-400" : "text-cyan-600"
                            }`} />
                        </div>
                        <h1 className={`text-2xl font-light ${
                            isDark ? "text-slate-100" : "text-slate-800"
                        } tracking-wide`}>
                            Изменение email
                        </h1>
                    </div>

                    <p className={`text-sm mt-3 ${
                        isDark ? "text-slate-400" : "text-slate-600"
                    }`}>
                        Мы отправили код подтверждения на{" "}
                        <span className={`font-medium block mt-1 ${
                            isDark ? "text-slate-300" : "text-slate-800"
                        }`}>
                            {newEmail}
                        </span>
                    </p>
                </div>

                {/* Content based on state */}
                {codeSent ? (
                    <>
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

                        {/* Verification Form */}
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Code Input */}
                            <div className="space-y-2">
                                <label className={`text-sm font-medium ${
                                    isDark ? "text-slate-300" : "text-slate-700"
                                }`}>
                                    Код подтверждения
                                </label>
                                <div className="relative">
                                    <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
                                        isDark ? "text-slate-400" : "text-slate-500"
                                    }`}>
                                        <Shield size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        value={verificationCode}
                                        onChange={handleCodeChange}
                                        placeholder="Введите код"
                                        autoComplete="one-time-code"
                                        className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 ${
                                            isDark
                                                ? "bg-slate-900/50 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                                : "bg-white/70 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                        } text-lg tracking-wider font-mono text-center`}
                                    />
                                    {verificationCode && (
                                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Timer */}
                            <div className={`text-center p-4 rounded-xl ${
                                isDark ? "bg-slate-900/30" : "bg-slate-50"
                            }`}>
                                {timeLeft > 0 ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                                            isDark ? "bg-green-400" : "bg-green-500"
                                        }`}></div>
                                        <p className={`text-sm ${
                                            isDark ? "text-slate-300" : "text-slate-700"
                                        }`}>
                                            Код действителен еще{" "}
                                            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-red-500 font-medium">
                                        Код истек
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                {/* Confirm Button */}
                                <button
                                    type="submit"
                                    disabled={loading || timeLeft === 0 || !verificationCode}
                                    className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-300 transform ${
                                        loading || timeLeft === 0 || !verificationCode
                                            ? "bg-slate-400 cursor-not-allowed scale-95"
                                            : "bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
                                    } flex items-center justify-center gap-3`}
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Подтверждение...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={20} />
                                            Подтвердить
                                        </>
                                    )}
                                </button>

                                {/* Resend Button */}
                                <button
                                    type="button"
                                    onClick={sendVerificationCode}
                                    disabled={resendLoading || timeLeft > 240}
                                    className={`w-full py-3 px-6 rounded-xl border-2 font-medium text-base transition-all duration-300 transform ${
                                        resendLoading || timeLeft > 240
                                            ? "opacity-50 cursor-not-allowed border-slate-300 text-slate-400"
                                            : `${
                                                isDark
                                                    ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500"
                                                    : "border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                                            } hover:scale-105 active:scale-95`
                                    } flex items-center justify-center gap-3`}
                                >
                                    {resendLoading ? (
                                        <>
                                            <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                                                isDark ? "border-slate-400" : "border-slate-600"
                                            }`}></div>
                                            Отправка...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw size={18} />
                                            Отправить новый код
                                            {timeLeft > 240 && (
                                                <span className="text-xs opacity-70">
                                                    ({formatTime(timeLeft - 240)})
                                                </span>
                                            )}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    // Loading state
                    <div className="text-center">
                        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4 ${
                            isDark ? "border-slate-200" : "border-blue-600"
                        }`}></div>
                        <p className={`text-sm ${
                            isDark ? "text-slate-400" : "text-slate-600"
                        }`}>
                            {/*TODO->display proper error messages when bad request happens*/}
                            Отправляем код подтверждения...
                        </p>
                    </div>
                )}

                {/* Back Button */}
                <div className="mt-8 pt-6 border-t border-slate-200/20 text-center">
                    <button
                        onClick={onCancel}
                        className={`${
                            isDark
                                ? "text-slate-400 hover:text-slate-300"
                                : "text-slate-600 hover:text-slate-800"
                        } transition-colors duration-200 flex items-center gap-2 mx-auto group`}
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-200" />
                        Вернуться к профилю
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