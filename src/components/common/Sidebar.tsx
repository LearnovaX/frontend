// Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/auth/AuthContext";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useTheme } from "@/components/common/ThemeContext";
import type { ReactNode } from "react";
import api from "@/api/api";
import { ensureAbsoluteUrl } from "@/utils/url";
import { useTranslation } from "react-i18next";

/* --------------------------- CUSTOM ICONS --------------------------- */

const CustomIcons = {
    News: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
        </svg>
    ),
    Catalog: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            <circle cx="12" cy="13" r="1" fill="currentColor" />
        </svg>
    ),
    Groups: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    Reports: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="M18 17V9M13 17V5M8 17v-3" strokeWidth="2.5" />
        </svg>
    ),
    Users: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    Learn: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
    ),
    Checking: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="m9 14 2 2 4-4" strokeWidth="2.5" />
        </svg>
    ),
    Integrity: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z" />
            <path d="M9 12h6M9 16h4M9 8h6" />
        </svg>
    ),
    Courses: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <path d="M8 7h8M8 11h8" strokeWidth="2" />
        </svg>
    ),
    Notifications: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            <circle cx="18" cy="6" r="3" fill="currentColor" stroke="none" />
        </svg>
    ),
    Chat: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H6l-4 3 1.3-4.9A8.5 8.5 0 1 1 21 11.5Z" />
            <path d="M8 10h8" />
            <path d="M8 14h5" />
        </svg>
    ),
    Profile: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    Logout: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    ChevronLeft: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    ),
    ChevronRight: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    ),
    Menu: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
    ),
    Close: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
};

/* --------------------------- TYPES & CONSTS --------------------------- */

type MenuItem = {
    id: string;
    label: string;
    path: string;
    icon: ReactNode;
    description?: string;
};

interface UserData {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    profile_photo?: string | null;
}

const ROUTES = {
    news: "/news",
    catalog: "/courses",
    groups: "/groups",
    reports: "/statistics",
    users: "/users",
    learn: "/learn",
    checking: "/checking",
    plagiarism: "/plagiarism",
    courses: "/courses",
    chat: "/chat",
};

const ALL_ITEMS: Record<string, MenuItem> = {
    news: { id: "news", label: "Новости", path: ROUTES.news, icon: <CustomIcons.News /> },
    catalog: { id: "catalog", label: "Каталог", path: ROUTES.catalog, icon: <CustomIcons.Catalog /> },
    groups: { id: "groups", label: "Группы", path: ROUTES.groups, icon: <CustomIcons.Groups /> },
    reports: { id: "reports", label: "Отчеты", path: ROUTES.reports, icon: <CustomIcons.Reports /> },
    users: { id: "users", label: "Пользователи", path: ROUTES.users, icon: <CustomIcons.Users /> },
    learn: { id: "learn", label: "Обучение", path: ROUTES.learn, icon: <CustomIcons.Learn /> },
    checking: { id: "checking", label: "Проверка", path: ROUTES.checking, icon: <CustomIcons.Checking /> },
    plagiarism: { id: "plagiarism", label: "Similarity Review", path: ROUTES.plagiarism, icon: <CustomIcons.Integrity /> },
    courses: { id: "courses", label: "Курсы", path: ROUTES.courses, icon: <CustomIcons.Courses /> },
    chat: { id: "chat", label: "Чаты", path: ROUTES.chat, icon: <CustomIcons.Chat /> },
};

const ALL_IDS = Object.keys(ALL_ITEMS);
const SIDEBAR_STATE_KEY = "sidebar_open_state";

/* --------------------------- MAIN COMPONENT --------------------------- */

export default function Sidebar() {
    const { t } = useTranslation();
    const location = useLocation();

    const [isOpen, setIsOpen] = useState(() => {
        const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
        return saved !== null ? saved === "true" : true;
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // IMPORTANT: default to false, but never hide items when false.
    const [menuAnimated, setMenuAnimated] = useState(false);

    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const lastTokenRef = useRef<string | null>(null);
    const mountedRef = useRef(true);
    const sidebarRef = useRef<HTMLElement>(null);
    const touchStartX = useRef<number>(0);

    const { logout, accessToken } = useAuth();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";

    /* --------------------------- Responsive --------------------------- */
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    /* --------------------------- Persist state --------------------------- */
    useEffect(() => {
        localStorage.setItem(SIDEBAR_STATE_KEY, String(isOpen));
    }, [isOpen]);

    useEffect(() => {
        if (isMobile) {
            setIsOpen(false);
        } else {
            const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
            if (saved !== null) setIsOpen(saved === "true");
        }
    }, [isMobile]);

    /* --------------------------- Animate on open ONLY --------------------------- */
    useEffect(() => {
        // Start a new staggered animation when the sidebar becomes visible (open or mobile-open).
        if (isOpen || isMobileOpen) {
            // reset then enable so the class re-applies
            setMenuAnimated(false);
            const timer = setTimeout(() => setMenuAnimated(true), 50);
            return () => clearTimeout(timer);
        } else {
            // closed: no animation, but items must remain visible
            setMenuAnimated(false);
        }
    }, [isOpen, isMobileOpen]);

    /* --------------------------- Fetch user profile --------------------------- */
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!accessToken) return;
        if (lastTokenRef.current === accessToken) return;
        lastTokenRef.current = accessToken;

        (async () => {
            try {
                const resp = await api.get("accounts/user/profile/", {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    withCredentials: true,
                });
                if (!mountedRef.current) return;

                const u = resp.data?.user ?? {};
                const role = String(u.role || resp.data?.role || "").toLowerCase();

                setUserData({
                    first_name: u.first_name || "",
                    last_name: u.last_name || "",
                    email: u.email || "",
                    role,
                    profile_photo: ensureAbsoluteUrl(resp.data?.profile_photo),
                });
            } catch {
                if (!mountedRef.current) return;
                setUserData((prev) => prev ?? { first_name: "", last_name: "", email: "", role: "", profile_photo: null });
            }
        })();
    }, [accessToken]);

    /* --------------------------- Outside click for profile --------------------------- */
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /* --------------------------- Swipe to close on mobile --------------------------- */
    useEffect(() => {
        if (!isMobile) return;

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX.current = e.touches[0].clientX;
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (!isMobileOpen) return;
            const diff = touchStartX.current - e.touches[0].clientX;
            if (diff > 50) setIsMobileOpen(false);
        };

        document.addEventListener("touchstart", handleTouchStart);
        document.addEventListener("touchmove", handleTouchMove);
        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchmove", handleTouchMove);
        };
    }, [isMobile, isMobileOpen]);

    /* --------------------------- Handlers --------------------------- */
    const handleLogout = async () => {
        setProfileOpen(false);
        try {
            await logout();
        } catch {
            window.location.href = "/login";
        }
    };

    const toggleSidebar = () => {
        if (isMobile) setIsMobileOpen((v) => !v);
        else setIsOpen((prev) => {
            const newState = !prev;
            localStorage.setItem(SIDEBAR_STATE_KEY, String(newState));
            return newState;
        });
    };

    const closeMobileSidebar = () => {
        if (isMobile) setIsMobileOpen(false);
    };

    /* --------------------------- Role / Menu --------------------------- */
    const getRoleDisplayName = (role: string) => {
        const roleMap: Record<string, string> = {
            admin: "Администратор",
            manager: "Менеджер",
            teacher: "Преподаватель",
            assistant: "Ассистент",
            student: "Студент",
            viewer: "Наблюдатель",
        };
        const translationKey = `sidebar.roles.${role}`;
        return t(translationKey, { defaultValue: roleMap[role] || role || t("sidebar.user") });
    };

    const getDisplayName = () => {
        if (!userData) return t("sidebar.user");
        const firstName = userData.first_name || "";
        const lastName = userData.last_name || "";
        return `${firstName} ${lastName}`.trim() || t("sidebar.user");
    };

    const role = (userData?.role || "").toLowerCase();

    const ROLE_TO_MENU_IDS: Record<string, string[]> = {
        student: ["news", "learn", "catalog", "chat"],
        admin: ["news", "catalog", "groups", "plagiarism", "reports", "users", "chat"],
        teacher: ["news", "checking", "plagiarism", "courses", "chat"],
        viewer: ALL_IDS,
    };

    const visibleIds = useMemo(() => ROLE_TO_MENU_IDS[role] ?? ["news", "catalog"], [role]);
    const visibleMenuItems = visibleIds.map((id) => ALL_ITEMS[id]).filter(Boolean);

    const isActive = (path: string) => {
        if (path === "/courses") {
            return location.pathname === "/" || location.pathname === "/courses" || location.pathname.startsWith("/courses");
        }
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

    /* --------------------------- Computed classes --------------------------- */
    const sidebarWidth = isOpen ? "w-64" : "w-20";
    const mobileSidebarTransform = isMobile ? (isMobileOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0";
    const shouldAnimate = (isOpen || isMobileOpen) && menuAnimated;

    /* --------------------------- Render --------------------------- */
    return (
        <>
            {/* Overlay (mobile) */}
            {isMobile && isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
                    onClick={() => setIsMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Burger (mobile) */}
            {isMobile && (
                <button
                    onClick={toggleSidebar}
                    className={`
            fixed top-4 left-4 z-50 p-3 rounded-xl shadow-lg
            transition-all duration-300 transform active:scale-95
            ${isDark ? "bg-gray-800/95 text-white hover:bg-gray-700 backdrop-blur-md" : "bg-white/95 text-gray-900 hover:bg-gray-50 backdrop-blur-md"}
            ${isMobileOpen ? "rotate-90" : "rotate-0"}
          `}
                    aria-label={isMobileOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isMobileOpen}
                >
                    {isMobileOpen ? <CustomIcons.Close /> : <CustomIcons.Menu />}
                </button>
            )}

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className={`
          ${isMobile ? "fixed" : "relative"}
          ${sidebarWidth}
          ${mobileSidebarTransform}
          h-screen flex flex-col
          transition-all duration-300 ease-out
          ${isMobile ? "z-50" : "z-10"}
          ${isDark ? "bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800" : "bg-gradient-to-b from-white via-gray-50 to-gray-100"}
          ${isDark ? "border-r border-gray-800" : "border-r border-gray-200"}
          shadow-2xl
          ${isMobile ? "safe-area-inset" : ""}
        `}
                aria-label="Main navigation"
            >
                {/* Header */}
                <div className={`relative p-4 border-b backdrop-blur-sm ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                    <div className="flex items-center gap-3 mb-4">
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className={`
                flex-shrink-0 rounded-full overflow-hidden
                transition-all duration-300 transform hover:scale-110 active:scale-95
                ${isOpen ? "w-12 h-12" : "w-10 h-10"}
                ${isDark ? "ring-2 ring-gray-700 hover:ring-blue-500" : "ring-2 ring-gray-300 hover:ring-gray-900"}
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isDark ? "focus:ring-blue-500" : "focus:ring-gray-900"}
              `}
                            aria-label="User profile"
                            aria-expanded={profileOpen}
                        >
                            {userData?.profile_photo ? (
                                <img src={userData.profile_photo} alt={getDisplayName()} className="w-full h-full object-cover" />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center ${isDark ? "bg-gradient-to-br from-blue-600 to-blue-700" : "bg-gradient-to-br from-gray-900 to-gray-800"}`}>
                                    <CustomIcons.Profile />
                                </div>
                            )}
                        </button>

                        {isOpen && (
                            <div className="flex-1 min-w-0 overflow-hidden animate-fade-in">
                                <h3 className={`font-semibold text-sm truncate transition-colors ${isDark ? "text-white" : "text-gray-900"}`}>{getDisplayName()}</h3>
                                <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-600"}`}>{getRoleDisplayName(role)}</p>
                            </div>
                        )}
                    </div>

                    {!isMobile && (
                        <button
                            onClick={toggleSidebar}
                            className={`
                absolute -right-3 top-1/2 -translate-y-1/2
                w-6 h-6 rounded-full flex items-center justify-center
                transition-all duration-300 transform hover:scale-110 active:scale-95
                ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-white hover:bg-gray-50 text-gray-600"}
                ${isDark ? "border border-gray-700" : "border border-gray-300"}
                shadow-lg hover:shadow-xl
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isDark ? "focus:ring-blue-500" : "focus:ring-gray-900"}
              `}
                            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
                            aria-expanded={isOpen}
                        >
                            {isOpen ? <CustomIcons.ChevronLeft /> : <CustomIcons.ChevronRight />}
                        </button>
                    )}

                    {profileOpen && (
                        <div
                            ref={dropdownRef}
                            className={`
                absolute ${isOpen ? "left-full ml-2" : "left-full ml-2"} top-0
                w-64 rounded-xl shadow-2xl p-4 z-50
                backdrop-blur-xl
                transition-all duration-300 transform
                animate-scale-in origin-left
                ${isDark ? "bg-gray-800/95 border border-gray-700" : "bg-white/95 border border-gray-200"}
              `}
                        >
                            <div className="mb-4">
                                <h2 className={`font-bold text-base ${isDark ? "text-white" : "text-gray-900"}`}>{getDisplayName()}</h2>
                                <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>{getRoleDisplayName(role)}</p>
                                <p className={`text-xs mt-1 truncate ${isDark ? "text-gray-500" : "text-gray-400"}`}>{userData?.email}</p>
                                <span className={`text-xs block mt-2 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                  {t("sidebar.version", { version: "v3.45.1454", defaultValue: "uLearn v3.45.1454" })}
                </span>
                            </div>

                            <div className="space-y-1 mb-4">
                                <Link
                                    onClick={() => setProfileOpen(false)}
                                    to="/profile"
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 transform active:scale-95 ${
                                        isDark ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-700"
                                    }`}
                                >
                                    <CustomIcons.Profile />
                                    <span className="text-sm font-medium">{t("sidebar.profile")}</span>
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 transform active:scale-95 ${
                                        isDark ? "text-red-400 hover:bg-red-900/20" : "text-red-600 hover:bg-red-50"
                                    }`}
                                >
                                    <CustomIcons.Logout />
                                    <span className="text-sm font-medium">{t("sidebar.logout")}</span>
                                </button>
                            </div>

                            <div className={`pt-3 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                                <ThemeToggle />
                            </div>
                        </div>
                    )}
                </div>

                {/* Menu */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 custom-scrollbar" aria-label="Primary navigation">
                    <div className="space-y-1">
                        {visibleMenuItems.map((item, index) => {
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.id}
                                    to={item.path}
                                    onClick={closeMobileSidebar}
                                    className={`
                    group relative flex items-center gap-3 px-3 py-3 rounded-xl
                    transition-all duration-300 transform
                    ${active
                                        ? isDark
                                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                                            : "bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg shadow-gray-900/20"
                                        : isDark
                                            ? "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                                            : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"}
                    ${!isOpen && "justify-center"}
                    hover:scale-[1.02] hover:shadow-md active:scale-[0.98]
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${isDark ? "focus:ring-blue-500" : "focus:ring-gray-900"}
                    ${shouldAnimate ? "animate-slide-in" : ""}
                  `}
                                    style={shouldAnimate ? { animationDelay: `${index * 50}ms`, animationFillMode: "forwards" } : undefined}
                                    aria-current={active ? "page" : undefined}
                                    title={!isOpen ? t(`sidebar.${item.id}`, { defaultValue: item.label }) : undefined}
                                >
                                    <div
                                        className={`
                      flex-shrink-0 transition-all duration-300
                      ${active ? "scale-110 rotate-[3deg]" : "group-hover:scale-110 group-hover:rotate-[3deg]"}
                    `}
                                    >
                                        {item.icon}
                                    </div>

                                    {isOpen && (
                                        <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-300 ${active ? "font-semibold" : ""}`}>
                      {t(`sidebar.${item.id}`, { defaultValue: item.label })}
                    </span>
                                    )}

                                    {active && (
                                        <div
                                            className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l-full ${isDark ? "bg-blue-400" : "bg-white"} shadow-lg`}
                                        />
                                    )}

                                    {!isOpen && (
                                        <div
                                            className={`
                        absolute left-full ml-2 px-3 py-2 rounded-lg
                        whitespace-nowrap text-sm font-medium
                        opacity-0 pointer-events-none
                        group-hover:opacity-100 group-hover:pointer-events-auto
                        transition-all duration-300 transform
                        group-hover:translate-x-0 -translate-x-2
                        ${isDark ? "bg-gray-800 text-white border border-gray-700" : "bg-white text-gray-900 border border-gray-300"}
                        shadow-xl z-50
                      `}
                                        >
                                            {t(`sidebar.${item.id}`, { defaultValue: item.label })}
                                            <div className={`absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent ${isDark ? "border-r-gray-800" : "border-r-white"}`} />
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Bottom / notifications */}
                <div className={`p-4 border-t border-opacity-10 ${isDark ? "border-gray-700 bg-gray-900/30" : "border-gray-200 bg-gray-50/30"}`}>
                    <Link
                        to="/notifications"
                        onClick={closeMobileSidebar}
                        className={`
              flex items-center gap-3 px-3 py-3 rounded-xl
              transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
              ${isOpen ? "justify-start" : "justify-center"}
              ${isDark ? "text-gray-400 hover:bg-gray-800/50 hover:text-white" : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"}
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${isDark ? "focus:ring-blue-500" : "focus:ring-gray-900"}
            `}
                        title={!isOpen ? t("sidebar.notifications") : undefined}
                        aria-label="Notifications"
                    >
                        <div className="relative">
                            <CustomIcons.Notifications />
                            <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isDark ? "bg-blue-500" : "bg-red-500"} animate-pulse`} aria-hidden="true" />
                        </div>
                        {isOpen && <span className="text-sm font-medium">{t("sidebar.notifications")}</span>}
                    </Link>
                </div>
            </aside>

            {/* Styles */}
            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDark ? "#4B5563" : "#D1D5DB"}; border-radius: 10px; transition: background 0.3s ease; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDark ? "#6B7280" : "#9CA3AF"}; }

        @keyframes fade-in { from { opacity:0 } to { opacity:1 } }
        @keyframes slide-in { from { opacity:0; transform: translateX(-10px) } to { opacity:1; transform: translateX(0) } }
        @keyframes slide-in-right { from { opacity:0; transform: translateY(-50%) translateX(-10px) } to { opacity:1; transform: translateY(-50%) translateX(0) } }
        @keyframes scale-in { from { opacity:0; transform: scale(0.95) } to { opacity:1; transform: scale(1) } }

        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-in { animation: slide-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }

        .safe-area-inset { padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in,
          .animate-slide-in,
          .animate-slide-in-right,
          .animate-scale-in { animation: none !important; opacity: 1 !important; transform: none !important; }
          aside, button, a, div { transition: none !important; }
        }

        .focus-visible:focus-visible { outline: 2px solid ${isDark ? "#3B82F6" : "#1F2937"}; outline-offset: 2px; }

        @media (pointer: coarse) {
          a, button { min-height: 44px; min-width: 44px; }
        }
      `}</style>
        </>
    );
}
