import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "@/api/api";
import { useTheme } from "@/components/common/ThemeContext";
import learnovax_logo from "@/assets/learnovax-logo.png";
import Input from "@/components/common/Input";
import { Mail, Send, ArrowLeft, RefreshCw } from "lucide-react";

export default function ForgotPassword() {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";

    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => {
            // cleanup on unmount
            abortRef.current?.abort();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const normalized = email.trim().toLowerCase();
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        try {
            await api.post(
                "accounts/auth/forgot_password/",
                { email: normalized },
                { signal: abortRef.current.signal }
            );

            // persist for next steps + refresh-safety
            sessionStorage.setItem("fp_email", normalized);

            // go to code verification immediately
            navigate("/forgot-password/verify", {
                replace: true,
                state: { email: normalized, info: "Код отправлен на вашу почту." },
            });
        } catch (err: any) {
            if (axios.isCancel(err)) return;
            const data = err?.response?.data;
            if (data?.email?.[0]) setError(data.email[0]);
            else if (data?.message) setError(data.message);
            else setError("Произошла ошибка. Попробуйте еще раз.");
        } finally {
            setLoading(false);
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
                            isDark ? "bg-orange-600/20" : "bg-orange-100"
                        }`}>
                            <RefreshCw className={`w-6 h-6 ${
                                isDark ? "text-orange-400" : "text-orange-600"
                            }`} />
                        </div>
                        <h1 className={`text-2xl font-light ${
                            isDark ? "text-slate-100" : "text-slate-800"
                        } tracking-wide`}>
                            Восстановление пароля
                        </h1>
                    </div>

                    <p className={`text-sm mt-3 ${
                        isDark ? "text-slate-400" : "text-slate-600"
                    }`}>
                        Введите ваш email для получения кода восстановления
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

                {/* Password Recovery Form */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <div className="space-y-2">
                        <label className={`text-sm font-medium ${
                            isDark ? "text-slate-300" : "text-slate-700"
                        }`}>
                            Email адрес
                        </label>
                        <div className="relative">
                            <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
                                isDark ? "text-slate-400" : "text-slate-500"
                            }`}>
                                <Mail size={20} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                autoComplete="email"
                                className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 ${
                                    isDark
                                        ? "bg-slate-900/50 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                        : "bg-white/70 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                } text-base`}
                                required
                            />
                        </div>
                    </div>

                    {/* Send Code Button */}
                    <button
                        type="submit"
                        disabled={loading || !email.trim()}
                        className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-300 transform ${
                            loading || !email.trim()
                                ? "bg-slate-400 cursor-not-allowed scale-95"
                                : "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
                        } flex items-center justify-center gap-3`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Отправка...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                Отправить код
                            </>
                        )}
                    </button>
                </form>

                {/* Information Box */}
                <div className={`mt-6 p-4 rounded-xl ${
                    isDark ? "bg-slate-900/30" : "bg-slate-50"
                }`}>
                    <div className="flex items-start gap-3">
                        <Mail className={`w-5 h-5 mt-0.5 ${
                            isDark ? "text-blue-400" : "text-blue-600"
                        }`} />
                        <div>
                            <p className={`text-sm font-medium mb-1 ${
                                isDark ? "text-slate-300" : "text-slate-700"
                            }`}>
                                Как это работает?
                            </p>
                            <p className={`text-xs ${
                                isDark ? "text-slate-400" : "text-slate-600"
                            }`}>
                                На ваш email будет отправлен код восстановления. Введите его на следующем экране для создания нового пароля.
                            </p>
                        </div>
                    </div>
                </div>

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