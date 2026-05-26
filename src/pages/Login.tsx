import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import lms_logo from "@/assets/lms-logo.svg";
import Input from "@/components/common/Input";
import ToggleDocument from "@/components/common/ToggleDocument";
import OTPVerification from "./OTPVerification";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/components/common/ThemeContext";
import { Eye, EyeOff, Mail, Lock, LogIn, KeyRound } from "lucide-react";

export default function Login() {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";

    const [openPD, setOpenPD] = useState(false);
    const [openPD2, setOpenPD2] = useState(false);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [showOTP, setShowOTP] = useState(false);
    const [otpToken, setOtpToken] = useState("");

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.message) {
            setSuccess(location.state.message);
        }
    }, [location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            const result = await login(username, password);

            if (result.otpRequired) {
                setOtpToken(result.otpToken!);
                setShowOTP(true);
            } else {
                navigate("/");
            }
        } catch (err: any) {
            if (err.response?.data) {
                const errorData = err.response.data;
                if (err.response.status === 401) {
                    if (errorData.code === "initial_password_required") {
                        setError("Сначала необходимо установить пароль");
                    } else if (errorData.code === "email_not_verified") {
                        setError("Пожалуйста, подтвердите свой email");
                    } else if (errorData.code === "user_disabled") {
                        setError("Учетная запись отключена");
                    } else {
                        setError("Неверный логин или пароль");
                    }
                } else {
                    setError("Произошла ошибка. Попробуйте еще раз.");
                }
            } else {
                setError("Неверный логин или пароль");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOTPSuccess = (tokens: { access: string; refresh: string }) => {
        localStorage.setItem("access", tokens.access);
        localStorage.setItem("refresh", tokens.refresh);
        window.location.href = "/";
    };

    const handleOTPBack = () => {
        setShowOTP(false);
        setOtpToken("");
    };

    const handleForgotPassword = () => {
        navigate("/forgot-password");
    };

    if (showOTP) {
        return (
            <OTPVerification
                email={username}
                password={password}
                otpToken={otpToken}
                onSuccess={handleOTPSuccess}
                onBack={handleOTPBack}
            />
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
                    <h1 className={`text-2xl font-light mt-6 ${
                        isDark ? "text-slate-100" : "text-slate-800"
                    } tracking-wide`}>
                        Добро пожаловать
                    </h1>
                    <p className={`text-sm mt-2 ${
                        isDark ? "text-slate-400" : "text-slate-600"
                    }`}>
                        Войдите в свою учетную запись
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

                {success && (
                    <div className={`mb-6 p-4 rounded-xl ${
                        isDark
                            ? "bg-green-900/20 border border-green-700/30 text-green-300"
                            : "bg-green-50 border border-green-200 text-green-700"
                    } animate-fade-in`}>
                        <p className="text-sm font-medium">{success}</p>
                    </div>
                )}

                {/* Login Form */}
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
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
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

                    {/* Password Field */}
                    <div className="space-y-2">
                        <label className={`text-sm font-medium ${
                            isDark ? "text-slate-300" : "text-slate-700"
                        }`}>
                            Пароль
                        </label>
                        <div className="relative">
                            <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
                                isDark ? "text-slate-400" : "text-slate-500"
                            }`}>
                                <Lock size={20} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 ${
                                    isDark
                                        ? "bg-slate-900/50 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                        : "bg-white/70 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                                } text-base`}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                                    isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"
                                } transition-colors duration-200`}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-300 transform ${
                            loading
                                ? "bg-slate-400 cursor-not-allowed scale-95"
                                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
                        } flex items-center justify-center gap-3`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Вход...
                            </>
                        ) : (
                            <>
                                <LogIn size={20} />
                                Войти
                            </>
                        )}
                    </button>

                    {/* Forgot Password Link */}
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className={`text-sm font-medium ${
                                isDark
                                    ? "text-blue-400 hover:text-blue-300"
                                    : "text-blue-600 hover:text-blue-700"
                            } transition-colors duration-200 flex items-center gap-2 mx-auto group`}
                        >
                            <KeyRound size={16} className="group-hover:rotate-12 transition-transform duration-200" />
                            Забыли пароль?
                        </button>
                    </div>
                </form>

                {/* Privacy Policy Links */}
                <div className="mt-8 pt-6 border-t border-slate-200/20">
                    <p className={`text-xs text-center mb-3 ${
                        isDark ? "text-slate-400" : "text-slate-600"
                    }`}>
                        Нажимая «Войти», вы даете согласие на:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center text-xs">
                        <button
                            type="button"
                            onClick={() => setOpenPD(true)}
                            className={`${
                                isDark
                                    ? "text-slate-400 hover:text-blue-400"
                                    : "text-slate-600 hover:text-blue-600"
                            } underline transition-colors duration-200`}
                        >
                            Обработку персональных данных
                        </button>
                        <span className={`hidden sm:inline ${isDark ? "text-slate-600" : "text-slate-400"}`}>•</span>
                        <button
                            type="button"
                            onClick={() => setOpenPD2(true)}
                            className={`${
                                isDark
                                    ? "text-slate-400 hover:text-blue-400"
                                    : "text-slate-600 hover:text-blue-600"
                            } underline transition-colors duration-200`}
                        >
                            Использование cookies
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal 1: Персональные данные */}
            <ToggleDocument
                open={openPD}
                onClose={() => setOpenPD(false)}
                title="Согласие на обработку персональных данных"
                sections={[
                    {
                        text: [
                            "Предоставляя свои персональные данные Пользователь даёт согласие на обработку, хранение и использование своих персональных данных на основании ФЗ № 152-ФЗ «О персональных данных» от 27.07.2006 г. в следующих целях:",
                        ],
                        unordered: [
                            "Регистрации Пользователя на сайте",
                            "Осуществление клиентской поддержки",
                            "Получения Пользователем информации о маркетинговых событиях",
                            "Выполнение Поставщиком услуг обязательств перед Пользователем",
                            "Проведения аудита и прочих внутренних исследований с целью повышения качества предоставляемых услуг",
                        ],
                    },
                    {
                        text: ["Под персональными данными подразумевается любая информация личного характера, позволяющая установить личность Пользователя такая как:"],
                        unordered: [
                            "Фамилия, Имя, Отчество",
                            "Дата рождения",
                            "Контактный телефон",
                            "Адрес электронной почты",
                            "Почтовый адрес",
                        ],
                    },
                    {
                        text: [
                            "Персональные данные Пользователей хранятся исключительно на электронных носителях и обрабатываются с использованием автоматизированных систем, за исключением случаев, когда неавтоматизированная обработка персональных данных необходима в связи с исполнением требований законодательства.",
                            "Поставщик услуг обязуется не передавать полученные персональные данные третьим лицам, за исключением следующих случаев:",
                        ],
                        unordered: [
                            "По запросам уполномоченных органов государственной власти РФ только по основаниям и в порядке, установленным законодательством РФ",
                            "Стратегическим партнерам, которые работают с Поставщиком услуг для предоставления продуктов и услуг, или тем из них, которые помогают Поставщиком услуг реализовывать продукты и услуги потребителям. Мы предоставляем третьим лицам минимальный объем персональных данных, необходимый только для оказания требуемой услуги или проведения необходимой транзакции.",
                        ],
                    },
                    {
                        text: [
                            "Поставщик услуг оставляет за собой право вносить изменения в одностороннем порядке в настоящие правила, при условии, что изменения не противоречат действующему законодательству РФ. Изменения условий настоящих правил вступают в силу после их публикации на Сайте.",
                        ],
                    },
                ]}
            />

            {/* Modal 2: Cookie policy */}
            <ToggleDocument
                open={openPD2}
                onClose={() => setOpenPD2(false)}
                title="Условия использования файлов cookie"
                sections={[
                    { text: ["На платформе Unicraft uLearn (далее — Платформа) используются файлы cookie."] },
                    { text: ["Файлы cookie — это небольшие текстовые файлы, которые после просмотра Пользователем фрагментов Платформы сохраняются на его устройстве."] },
                    { text: ["Использование файлов cookie позволяет ООО «Юникрафт» (далее – Оператор) контролировать доступность Платформы, анализировать данные, а также понимать, как развивать оказываемые услуги."] },
                    { text: ["На Платформе используются следующие типы файлов cookie:"] },
                    {
                        unordered: [
                            "Технические файлы cookie: они необходимы для корректной работы Платформы и вспомогательных сервисов. Такие файлы cookie позволяют определять аппаратное и программное обеспечение устройства Пользователя; выявлять ошибки при работе Платформы; тестировать новые функции для повышения производительности Платформы.",
                            "Файлы cookie для аутентификации: они необходимы, чтобы запоминать Пользователей. Благодаря таким файлам Пользователю при новом посещении Платформы не нужно заново вводить авторизационные данные.",
                            "Аналитические файлы cookie: они позволяют подсчитывать количество Пользователей Платформы; определять, какие действия Пользователь совершает на Платформе (посещаемые страницы, время и количество просмотренных страниц).",
                        ],
                    },
                    { text: ["Срок хранения файлов cookie зависит от конкретного типа, но в любом случае не превышает срока, необходимого для достижения целей обработки персональных данных."] },
                    { text: ["При авторизации на Платформе Оператор запрашивает согласие Пользователя на использование файлов cookie."] },
                    { text: ["Для прекращения обработки файлов cookie Пользователь может изменить настройки используемых браузеров на всех устройствах (компьютер, мобильные устройства)."] },
                    { text: ["ВАЖНО: при отказе от использования файлов cookie отдельные функции Платформы могут стать недоступными, что повлияет на возможность использования Платформы."] },
                ]}
            />

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