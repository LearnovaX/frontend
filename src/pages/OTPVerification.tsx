import { useState, useEffect } from "react";
import api from "@/api/api";
import learnovax_logo from "@/assets/learnovax-logo.png";
import { useTheme } from "@/components/common/ThemeContext";
import { ArrowLeft, Shield, Mail, RefreshCw, CheckCircle } from "lucide-react";

interface OTPVerificationProps {
    email: string;
    password: string;
    otpToken: string;
    onSuccess: (tokens: { access: string; refresh: string }) => void;
    onBack: () => void;
}

export default function OTPVerification({ email, password, otpToken, onSuccess, onBack }: OTPVerificationProps) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";

    const [otpCode, setOtpCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const [resendLoading, setResendLoading] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setError("Код истек. Попробуйте войти снова.");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 6) {
            setOtpCode(value);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (otpCode.length !== 6) {
            setError("Введите 6-значный код");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("accounts/login/", {
                email,
                password,
                otp_token: otpToken,
                otp_code: otpCode
            });

            onSuccess({
                access: response.data.access,
                refresh: response.data.refresh
            });

        } catch (err: any) {
            if (err.response?.data) {
                const errorData = err.response.data;
                if (err.response.status === 401) {
                    if (errorData.code === "otp_expired") {
                        setError("Код истек или превышено количество попыток. Попробуйте войти снова.");
                    } else if (errorData.code === "otp_invalid") {
                        setError("Неверный код. Попробуйте еще раз.");
                    } else {
                        setError("Ошибка аутентификации. Попробуйте еще раз.");
                    }
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

    const handleResend = async () => {
        setResendLoading(true);
        setError(null);

        try {
            await api.post("accounts/login/", {
                email,
                password
            });

            setTimeLeft(300);
            setOtpCode("");

        } catch (err) {
            setError("Не удалось отправить новый код. Попробуйте еще раз.");
        } finally {
            setResendLoading(false);
        }
    };

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
                            src={learnovax_logo}
                            alt="Logo"
                            className="relative w-48 h-auto mx-auto transform transition-transform duration-300 hover:scale-105"
                        />
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-3">
                        <div className={`p-2 rounded-full ${
                            isDark ? "bg-blue-600/20" : "bg-blue-100"
                        }`}>
                            <Shield className={`w-6 h-6 ${
                                isDark ? "text-blue-400" : "text-blue-600"
                            }`} />
                        </div>
                        <h1 className={`text-2xl font-light ${
                            isDark ? "text-slate-100" : "text-slate-800"
                        } tracking-wide`}>
                            Код подтверждения
                        </h1>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2">
                        <Mail className={`w-4 h-4 ${
                            isDark ? "text-slate-400" : "text-slate-600"
                        }`} />
                        <p className={`text-sm ${
                            isDark ? "text-slate-400" : "text-slate-600"
                        }`}>
                            Код отправлен на{" "}
                            <span className={`font-medium ${
                                isDark ? "text-slate-300" : "text-slate-800"
                            }`}>
                                {email}
                            </span>
                        </p>
                    </div>
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

                {/* OTP Form */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* OTP Input */}
                    <div className="space-y-2">
                        <label className={`text-sm font-medium ${
                            isDark ? "text-slate-300" : "text-slate-700"
                        }`}>
                            Введите 6-значный код
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={otpCode}
                                onChange={handleOtpChange}
                                placeholder="• • • • • •"
                                maxLength={6}
                                className={`w-full text-center text-3xl font-mono tracking-[0.5em] border-2 rounded-xl py-6 px-4 focus:outline-none focus:ring-4 transition-all duration-300 ${
                                    isDark
                                        ? "bg-slate-900/50 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                                        : "bg-white/70 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                } ${otpCode.length === 6 ? (isDark ? "border-green-500" : "border-green-500") : ""}`}
                                autoComplete="one-time-code"
                            />
                            {otpCode.length === 6 && (
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                </div>
                            )}
                        </div>

                        {/* Progress indicator */}
                        <div className="flex justify-center gap-1 mt-3">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                        i < otpCode.length
                                            ? (isDark ? "bg-blue-400" : "bg-blue-500")
                                            : (isDark ? "bg-slate-700" : "bg-slate-300")
                                    }`}
                                />
                            ))}
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
                            disabled={loading || timeLeft === 0 || otpCode.length !== 6}
                            className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-300 transform ${
                                loading || timeLeft === 0 || otpCode.length !== 6
                                    ? "bg-slate-400 cursor-not-allowed scale-95"
                                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
                            } flex items-center justify-center gap-3`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Проверка...
                                </>
                            ) : (
                                <>
                                    <Shield size={20} />
                                    Подтвердить
                                </>
                            )}
                        </button>

                        {/* Resend Button */}
                        <button
                            type="button"
                            onClick={handleResend}
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

                {/* Back Button */}
                <div className="mt-8 pt-6 border-t border-slate-200/20 text-center">
                    <button
                        onClick={onBack}
                        className={`${
                            isDark
                                ? "text-slate-400 hover:text-slate-300"
                                : "text-slate-600 hover:text-slate-800"
                        } transition-colors duration-200 flex items-center gap-2 mx-auto group`}
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-200" />
                        Назад к входу
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