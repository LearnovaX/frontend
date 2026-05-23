import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "@/api/api";
import learnovax_logo from "@/assets/learnovax-logo.png";
import Input from "@/components/common/Input";
import { useTheme } from "@/components/common/ThemeContext";
import { Mail, Key, ArrowLeft, CheckCircle } from "lucide-react";

export default function VerifyPasswordReset() {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";

    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState<string>("");
    const [code, setCode] = useState("");
    const [info, setInfo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const st = location.state as { email?: string; info?: string } | null;
        const fromState = st?.email ?? null;
        const fromStore = sessionStorage.getItem("fp_email");
        const resolved = fromState || fromStore;

        if (!resolved) {
            navigate("/forgot-password", { replace: true });
            return;
        }
        setEmail(resolved);
        if (st?.info) setInfo(st.info);

        return () => abortRef.current?.abort();
    }, [location, navigate]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        abortRef.current?.abort();
        abortRef.current = new AbortController();

        try {
            const res = await api.post(
                "accounts/auth/verify_password_reset/",
                { email, code: code.trim() },
                { signal: abortRef.current.signal }
            );

            const { uid, token } = res.data;
            sessionStorage.setItem("fp_uid", uid);
            sessionStorage.setItem("fp_token", token);

            navigate("/forgot-password/reset", {
                replace: true,
                state: { email, uid, token },
            });
        } catch (err: any) {
            if (axios.isCancel(err)) return;
            const data = err?.response?.data;
            if (data?.code) setError(data.code[0] ?? "Неверный код");
            else if (data?.message) setError(data.message);
            else setError("Произошла ошибка. Попробуйте еще раз.");
        } finally {
            setLoading(false);
        }
    };

    if (!email) return null;

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
                            isDark ? "bg-yellow-600/20" : "bg-yellow-100"
                        }`}>
                            <Key className={`w-6 h-6 ${
                                isDark ? "text-yellow-400" : "text-yellow-600"
                            }`} />
                        </div>
                        <h1 className={`text-2xl font-light ${
                            isDark ? "text-slate-100" : "text-slate-800"
                        } tracking-wide`}>
                            Подтверждение кода
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
                {info && (
                    <div className={`mb-6 p-4 rounded-xl ${
                        isDark
                            ? "bg-green-900/20 border border-green-700/30 text-green-300"
                            : "bg-green-50 border border-green-200 text-green-700"
                    } animate-fade-in`}>
                        <p className="text-sm font-medium">{info}</p>
                    </div>
                )}

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
                <form className="space-y-6" onSubmit={submit}>
                    {/* Code Input */}
                    <div className="space-y-2">
                        <label className={`text-sm font-medium ${
                            isDark ? "text-slate-300" : "text-slate-700"
                        }`}>
                            Код из письма
                        </label>
                        <div className="relative">
                            <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
                                isDark ? "text-slate-400" : "text-slate-500"
                            }`}>
                                <Key size={20} />
                            </div>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Введите код восстановления"
                                autoComplete="one-time-code"
                                className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 ${
                                    isDark
                                        ? "bg-slate-900/50 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                        : "bg-white/70 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                } text-base`}
                                required
                            />
                            {code.trim() && (
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Confirm Button */}
                    <button
                        type="submit"
                        disabled={loading || !code.trim()}
                        className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-300 transform ${
                            loading || !code.trim()
                                ? "bg-slate-400 cursor-not-allowed scale-95"
                                : "bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
                        } flex items-center justify-center gap-3`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Проверяем...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                Подтвердить
                            </>
                        )}
                    </button>
                </form>

                {/* Back Button */}
                <div className="mt-8 pt-6 border-t border-slate-200/20 text-center">
                    <button
                        onClick={() => navigate("/forgot-password")}
                        className={`${
                            isDark
                                ? "text-slate-400 hover:text-slate-300"
                                : "text-slate-600 hover:text-slate-800"
                        } transition-colors duration-200 flex items-center gap-2 mx-auto group`}
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-200" />
                        Изменить email
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