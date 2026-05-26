// AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "@/api/api";

interface AuthContextType {
    accessToken: string | null;
    refreshToken: string | null;
    login: (username: string, password: string) => Promise<{
        success: boolean;
        otpRequired?: boolean;
        otpToken?: string;
    }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => useContext(AuthContext)!;

// ---- ENV helpers (Vite) ----
const ENV_REFRESH_INTERVAL_MS = Number(import.meta.env.VITE_REFRESH_INTERVAL_MS);
const ENV_SKEW_MS = Number(import.meta.env.VITE_REFRESH_SKEW_MS);

const DEFAULT_REFRESH_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes fallback
const DEFAULT_SKEW_MS = 60 * 1000;                 // 1 minute fallback
const MIN_DELAY_MS = 10_000;                       // защита от слишком частых попыток

const REFRESH_INTERVAL_MS =
    Number.isFinite(ENV_REFRESH_INTERVAL_MS) && ENV_REFRESH_INTERVAL_MS > 0
        ? ENV_REFRESH_INTERVAL_MS
        : DEFAULT_REFRESH_INTERVAL_MS;

const REFRESH_SKEW_MS =
    Number.isFinite(ENV_SKEW_MS) && ENV_SKEW_MS >= 0 ? ENV_SKEW_MS : DEFAULT_SKEW_MS;

// ---- JWT utils ----
type JwtPayload = { exp?: number };

function parseJwt(token: string): JwtPayload | null {
    try {
        const base64Url = token.split(".")[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(jsonPayload) as JwtPayload;
    } catch {
        return null;
    }
}

/**
 * Возвращает, через сколько мс истечёт текущий access-токен.
 * Если не удалось — null.
 */
function msUntilAccessExpiry(access: string | null): number | null {
    if (!access) return null;
    const payload = parseJwt(access);
    if (!payload?.exp) return null;
    const expiresAtMs = payload.exp * 1000;
    const diff = expiresAtMs - Date.now();
    return diff > 0 ? diff : 0;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("access")?.trim() || null);
    const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem("refresh")?.trim() || null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Ensure stored tokens don't contain trailing whitespace/newlines
    useEffect(() => {
        const a = localStorage.getItem("access");
        if (a && a.trim() !== a) localStorage.setItem("access", a.trim());
        const r = localStorage.getItem("refresh");
        if (r && r.trim() !== r) localStorage.setItem("refresh", r.trim());
    }, []);

    // Save tokens to localStorage
    const saveTokens = (access: string, refresh: string) => {
        const a = access?.trim();
        const r = refresh?.trim();
        localStorage.setItem("access", a);
        localStorage.setItem("refresh", r);
        setAccessToken(a);
        setRefreshToken(r);
    };

    const login = async (email: string, password: string) => {
        try {
            const res = await api.post("accounts/login/", { email, password });

            if (res.data.otp_required) {
                return {
                    success: true,
                    otpRequired: true,
                    otpToken: res.data.otp_token,
                };
            } else {
                saveTokens(res.data.access, res.data.refresh);
                return { success: true };
            }
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            if (accessToken && refreshToken) {
                await api.delete("accounts/auth/logout/", {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    data: { refresh_token: refreshToken },
                    withCredentials: true,
                });
            }
        } catch (err) {
            console.warn("Server logout failed (tokens might already be invalid/blacklisted):", err);
        } finally {
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            setAccessToken(null);
            setRefreshToken(null);
            // убираем любой активный таймер
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            window.location.href = "/login";
        }
    };

    // ---- Auto-refresh access token (interval from .env, exp-aware) ----
    useEffect(() => {
        if (!refreshToken) return;

        let mounted = true;

        const scheduleNext = (suggestedMs?: number) => {
            if (!mounted) return;
            if (timerRef.current) clearTimeout(timerRef.current);

            // 1) Пытаемся опираться на exp access-токена
            const msLeft = msUntilAccessExpiry(localStorage.getItem("access"));
            let delay =
                msLeft !== null
                    ? Math.max(MIN_DELAY_MS, msLeft - REFRESH_SKEW_MS)
                    : // 2) Фоллбэк на .env интервал
                    (Number.isFinite(suggestedMs) && suggestedMs! > 0 ? suggestedMs! : REFRESH_INTERVAL_MS);

            timerRef.current = setTimeout(refreshOnce, delay);
        };

        const refreshOnce = async () => {
            try {
                const res = await api.post("accounts/login/refresh/", { refresh: refreshToken });
                let newAccess = (res.data.access as string) || "";
                newAccess = newAccess.trim();
                localStorage.setItem("access", newAccess);
                setAccessToken(newAccess);

                if (res.data.refresh) {
                    let newRefresh = (res.data.refresh as string) || "";
                    newRefresh = newRefresh.trim();
                    saveTokens(newAccess, newRefresh);
                }
            } catch (err) {
                console.error("Token refresh failed:", err);
                await logout();
                return;
            }
            // Перепланировать следующий запуск
            scheduleNext(REFRESH_INTERVAL_MS);
        };

        // Первое планирование сразу при монтировании/смене refreshToken
        scheduleNext(REFRESH_INTERVAL_MS);

        return () => {
            mounted = false;
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [refreshToken]);

    return (
        <AuthContext.Provider value={{ accessToken, refreshToken, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
