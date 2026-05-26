// src/utils/url.ts
export const ensureAbsoluteUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http')) return url;

    // Use the same base URL as your API, but remove the /api suffix
    const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '');

    return `${cleanBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
};