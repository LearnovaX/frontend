import { useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowLeft,
    Loader2,
    MessageSquare,
    Paperclip,
    Plus,
    Search,
    Send,
    X,
} from "lucide-react";
import api from "@/api/api";
import { useTheme } from "@/components/common/ThemeContext";
import { ensureAbsoluteUrl } from "@/utils/url";
import { useAuth } from "@/auth/AuthContext";

/* =========================
   Types
========================= */
type ChatUser = {
    id: number;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    profile_photo?: string | null;
};

type ChatMessage = {
    id: number;
    chat_room_id: number;
    content: string;
    sender: ChatUser;
    file: string | null;
    is_read: boolean;
    created_at: string;
    updated_at: string;
    is_my_message: boolean;
    message_direction: "sent" | "received" | "unknown";
};

type ChatRoom = {
    id: number;
    teacher: ChatUser;
    student: ChatUser;
    course: number | null;
    is_active: boolean;
    last_message: ChatMessage | null;
    unread_count: number;
    other_user: ChatUser;
    created_at: string;
    updated_at: string;
};

type CourseMini = {
    id: number;
    name: string;
    role?: string;
};

type Enrollment = {
    user: ChatUser;
};

/* =========================
   Helpers
========================= */
const normalizeList = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (Array.isArray(payload?.results)) return payload.results as T[];
    if (Array.isArray(payload?.data)) return payload.data as T[];
    return [];
};

const formatTime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const displayName = (u?: ChatUser | null) => {
    const first = u?.first_name?.trim() || "";
    const last = u?.last_name?.trim() || "";
    const full = `${first} ${last}`.trim();
    return full || u?.email || "Unknown";
};

const initials = (u?: ChatUser | null) => {
    const first = u?.first_name?.[0] || "";
    const last = u?.last_name?.[0] || "";
    const v = `${first}${last}`.toUpperCase();
    return v || "?";
};

const getWsUrl = (roomId: number, token: string) => {
    const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/";
    const httpBase = apiBase.replace(/\/api\/?$/, "");
    const protocol = httpBase.startsWith("https") ? "wss" : "ws";
    const host = httpBase.replace(/^https?:\/\//, "");
    return `${protocol}://${host}/ws/chat/${roomId}/?token=${encodeURIComponent(token)}`;
};

const sortRooms = (rooms: ChatRoom[]) =>
    [...rooms].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

/* =========================
   Page
========================= */
export default function ChatPage() {
    const { actualTheme } = useTheme();
    const { accessToken } = useAuth();
    const isDark = actualTheme === "dark";

    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [roomsLoading, setRoomsLoading] = useState(true);
    const [roomsSearch, setRoomsSearch] = useState("");
    const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [composerText, setComposerText] = useState("");
    const [composerFile, setComposerFile] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const [socketStatus, setSocketStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
    const [typingState, setTypingState] = useState<{ name: string } | null>(null);

    const [newChatOpen, setNewChatOpen] = useState(false);
    const [courses, setCourses] = useState<CourseMini[]>([]);
    const [courseLoading, setCourseLoading] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
    const [contacts, setContacts] = useState<ChatUser[]>([]);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [selectedContactId, setSelectedContactId] = useState<number | "">("");

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttemptRef = useRef(0);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const shouldReconnectRef = useRef(true);
    const listRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingActiveRef = useRef(false);

    const activeRoom = useMemo(
        () => rooms.find((r) => r.id === activeRoomId) || null,
        [rooms, activeRoomId]
    );

    const filteredRooms = useMemo(() => {
        const q = roomsSearch.trim().toLowerCase();
        if (!q) return rooms;
        return rooms.filter((r) => displayName(r.other_user).toLowerCase().includes(q));
    }, [rooms, roomsSearch]);

    useEffect(() => {
        let on = true;
        (async () => {
            setRoomsLoading(true);
            try {
                const r = await api.get("chat/rooms/");
                if (!on) return;
                const items = normalizeList<ChatRoom>(r.data);
                setRooms(sortRooms(items));
            } finally {
                if (on) setRoomsLoading(false);
            }
        })();
        return () => {
            on = false;
        };
    }, []);

    useEffect(() => {
        if (!activeRoomId) return;
        let on = true;
        (async () => {
            setMessagesLoading(true);
            try {
                const r = await api.get(`chat/rooms/${activeRoomId}/messages/`);
                if (!on) return;
                const items = normalizeList<ChatMessage>(r.data);
                items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                setMessages(items);

                await api.post(`chat/rooms/${activeRoomId}/mark_as_read/`);
                setRooms((prev) =>
                    prev.map((room) =>
                        room.id === activeRoomId ? { ...room, unread_count: 0 } : room
                    )
                );
            } finally {
                if (on) setMessagesLoading(false);
            }
        })();
        return () => {
            on = false;
        };
    }, [activeRoomId]);

    useEffect(() => {
        if (!activeRoomId || !accessToken) return;

        // Reset reconnect state
        shouldReconnectRef.current = true;
        reconnectAttemptRef.current = 0;
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }

        let cancelled = false;

        const connect = () => {
            if (cancelled) return;

            // sanitize token: trim whitespace/newlines and encode
            const token = (accessToken || "").trim();
            const wsUrl = getWsUrl(activeRoomId, token);

            try {
                const socket = new WebSocket(wsUrl);
                wsRef.current = socket;
                setSocketStatus("connecting");

                socket.onopen = () => {
                    console.info("WebSocket open", wsUrl);
                    setSocketStatus("connected");
                    reconnectAttemptRef.current = 0;
                    if (reconnectTimerRef.current) {
                        clearTimeout(reconnectTimerRef.current);
                        reconnectTimerRef.current = null;
                    }
                };

                socket.onerror = (ev) => {
                    console.warn("WebSocket error", ev);
                    setSocketStatus("error");
                };

                socket.onclose = (ev) => {
                    console.warn("WebSocket closed", ev.code, ev.reason);
                    setSocketStatus("idle");
                    wsRef.current = null;
                    if (!shouldReconnectRef.current || cancelled) return;

                    // exponential backoff with jitter
                    reconnectAttemptRef.current = Math.min(30, reconnectAttemptRef.current + 1);
                    const baseDelay = 1000; // 1s
                    const maxDelay = 30000; // 30s
                    const delay = Math.min(maxDelay, baseDelay * Math.pow(2, reconnectAttemptRef.current - 1));
                    const jitter = Math.floor(Math.random() * 1000); // up to 1s jitter
                    const total = delay + jitter;

                    reconnectTimerRef.current = setTimeout(() => {
                        if (shouldReconnectRef.current && !cancelled) connect();
                    }, total);
                };

                socket.onmessage = (event) => {
                    try {
                        const payload = JSON.parse(event.data);
                        if (payload.type === "message") {
                            const msg = payload.data as ChatMessage;
                            setMessages((prev) => {
                                if (prev.some((m) => m.id === msg.id)) return prev;
                                const next = [...prev, msg];
                                next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                                return next;
                            });

                            setRooms((prev) => {
                                const existing = prev.find((r) => r.id === msg.chat_room_id) || null;
                                let base: ChatRoom | null = existing;
                                if (!base) {
                                    const otherUser = msg.message_direction === "received" ? msg.sender : existing?.other_user || null;
                                    base = {
                                        id: msg.chat_room_id,
                                        teacher: (existing && (existing as any).teacher) || null,
                                        student: (existing && (existing as any).student) || null,
                                        course: (existing && (existing as any).course) || null,
                                        is_active: true,
                                        last_message: null,
                                        unread_count: 0,
                                        other_user: otherUser as ChatUser,
                                        created_at: msg.created_at,
                                        updated_at: msg.created_at,
                                    } as ChatRoom;
                                }

                                const nextUnread =
                                    msg.message_direction === "received" && msg.chat_room_id !== activeRoomId
                                        ? (existing?.unread_count || base.unread_count || 0) + 1
                                        : msg.chat_room_id === activeRoomId
                                            ? 0
                                            : (existing?.unread_count || base.unread_count || 0);

                                const updatedRoom = {
                                    ...base,
                                    id: msg.chat_room_id,
                                    last_message: msg,
                                    updated_at: msg.created_at,
                                    unread_count: nextUnread,
                                } as ChatRoom;
                                const without = prev.filter((r) => r.id !== msg.chat_room_id);
                                return sortRooms([updatedRoom, ...without]);
                            });

                            if (msg.message_direction === "received" && msg.chat_room_id === activeRoomId) {
                                try {
                                    socket.send(JSON.stringify({ type: "mark_as_read", message_id: msg.id }));
                                } catch (e) {
                                    console.warn(e);
                                }
                            }
                        }

                        if (payload.type === "message_read") {
                            const messageId = payload.message_id as number;
                            setMessages((prev) =>
                                prev.map((m) => (m.id === messageId ? { ...m, is_read: true } : m))
                            );
                        }

                        if (payload.type === "typing") {
                            if (payload.is_typing) {
                                setTypingState({ name: payload.user_name || "" });
                            } else {
                                setTypingState(null);
                            }
                        }
                    } catch {
                        // ignore malformed payloads
                    }
                };
            } catch (err) {
                console.warn(err);
                setSocketStatus("error");
                if (!shouldReconnectRef.current || cancelled) return;
                reconnectAttemptRef.current = Math.min(30, reconnectAttemptRef.current + 1);
                const baseDelay = 1000;
                const maxDelay = 30000;
                const delay = Math.min(maxDelay, baseDelay * Math.pow(2, reconnectAttemptRef.current - 1));
                const jitter = Math.floor(Math.random() * 1000);
                reconnectTimerRef.current = setTimeout(() => {
                    if (shouldReconnectRef.current && !cancelled) connect();
                }, delay + jitter);
            }
        };

        connect();

        return () => {
            cancelled = true;
            shouldReconnectRef.current = false;
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            if (wsRef.current) {
                try {
                    wsRef.current.close();
                } catch (e) {
                    console.warn(e);
                }
            }
            wsRef.current = null;
            setTypingState(null);
            setSocketStatus("idle");
        };
    }, [activeRoomId, accessToken]);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: "typing", is_typing: false }));
            }
        };
    }, []);

    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages, activeRoomId]);

    const handleSelectRoom = (roomId: number) => {
        setActiveRoomId(roomId);
    };

    const handleSendText = async () => {
        const content = composerText.trim();
        if (!content || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({ type: "send_message", content }));
        setComposerText("");
    };

    const handleSendFile = async () => {
        if (!composerFile || !activeRoomId) return;
        setSending(true);
        try {
            const fd = new FormData();
            fd.append("file", composerFile);
            if (composerText.trim()) fd.append("content", composerText.trim());

            const res = await api.post(`chat/rooms/${activeRoomId}/messages/`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const msg = res.data as ChatMessage;
            setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                const next = [...prev, msg];
                next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                return next;
            });
        } finally {
            setSending(false);
            setComposerFile(null);
            setComposerText("");
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleComposerKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    };

    const handleTyping = (value: string) => {
        setComposerText(value);
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        if (!typingActiveRef.current) {
            wsRef.current.send(JSON.stringify({ type: "typing", is_typing: true }));
            typingActiveRef.current = true;
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: "typing", is_typing: false }));
            }
            typingActiveRef.current = false;
        }, 1200);
    };

    const loadCourses = async () => {
        setCourseLoading(true);
        try {
            const r = await api.get("course/courses/");
            const items = normalizeList<CourseMini>(r.data);
            setCourses(items);
        } finally {
            setCourseLoading(false);
        }
    };

    const loadContacts = async (courseId: number, role?: string) => {
        setContactsLoading(true);
        try {
            const roleName = (role || "").toLowerCase();
            if (roleName === "student") {
                const r = await api.get(`course/courses/${courseId}/teachers/`);
                const items = normalizeList<ChatUser>(r.data);
                setContacts(items);
            } else if (roleName === "teacher") {
                const r = await api.get(`course/courses/${courseId}/students/`);
                const items = normalizeList<Enrollment>(r.data).map((e) => e.user).filter(Boolean);
                setContacts(items);
            } else {
                setContacts([]);
            }
        } finally {
            setContactsLoading(false);
        }
    };

    const handleNewChatOpen = () => {
        setNewChatOpen(true);
        setSelectedCourseId("");
        setSelectedContactId("");
        setContacts([]);
        loadCourses();
    };

    const handleCourseChange = (courseIdValue: string) => {
        const id = Number(courseIdValue);
        if (!id || Number.isNaN(id)) {
            setSelectedCourseId("");
            setContacts([]);
            return;
        }
        setSelectedCourseId(id);
        setSelectedContactId("");
        const course = courses.find((c) => c.id === id);
        loadContacts(id, course?.role);
    };

    const handleCreateRoom = async () => {
        if (!selectedCourseId || !selectedContactId) return;
        const payload = {
            other_user_id: selectedContactId,
            course: selectedCourseId,
        };
        const res = await api.post("chat/rooms/", payload);
        const room = res.data as ChatRoom;
        setRooms((prev) => {
            const without = prev.filter((r) => r.id !== room.id);
            return sortRooms([room, ...without]);
        });
        setActiveRoomId(room.id);
        setNewChatOpen(false);
    };

    const renderMessageBody = (msg: ChatMessage) => {
        const fileUrl = ensureAbsoluteUrl(msg.file || "");
        const fileName = msg.file ? decodeURIComponent(msg.file.split("/").pop() || "file") : "";
        return (
            <div className="space-y-2">
                {msg.content ? <p className="whitespace-pre-wrap">{msg.content}</p> : null}
                {msg.file && fileUrl ? (
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                            msg.message_direction === "sent"
                                ? "border-blue-500/30 bg-blue-500/15 text-white"
                                : isDark
                                    ? "border-slate-600 bg-slate-700 text-slate-100"
                                    : "border-slate-200 bg-white text-slate-800"
                        }`}
                    >
                        <Paperclip className="w-4 h-4" />
                        <span className="max-w-[220px] truncate">{fileName}</span>
                    </a>
                ) : null}
            </div>
        );
    };

    return (
        <div className="flex h-[calc(100vh-96px)] min-h-[520px] flex-col gap-4 lg:flex-row">
            {/* Rooms */}
            <div
                className={`flex h-full flex-col rounded-2xl border ${
                    isDark ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white"
                } ${activeRoomId ? "hidden lg:flex" : "flex"} lg:w-[320px]`}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                        <MessageSquare className={`h-5 w-5 ${isDark ? "text-slate-200" : "text-slate-700"}`} />
                        <div className={`text-base font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                            Direct Messages
                        </div>
                    </div>
                    <button
                        className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                            isDark
                                ? "bg-blue-500/20 text-blue-200 hover:bg-blue-500/30"
                                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                        onClick={handleNewChatOpen}
                    >
                        <Plus className="w-4 h-4" />
                        New
                    </button>
                </div>

                <div className="px-4 py-3">
                    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                        isDark ? "border-slate-700 bg-slate-800 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}>
                        <Search className="w-4 h-4" />
                        <input
                            className="w-full bg-transparent outline-none"
                            placeholder="Search"
                            value={roomsSearch}
                            onChange={(e) => setRoomsSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 px-2 pb-4 overflow-y-auto">
                    {roomsLoading ? (
                        <div className="flex items-center justify-center h-full text-sm text-slate-500">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading rooms...
                        </div>
                    ) : filteredRooms.length ? (
                        filteredRooms.map((room) => {
                            const isActive = room.id === activeRoomId;
                            const last = room.last_message;
                            return (
                                <button
                                    key={room.id}
                                    onClick={() => handleSelectRoom(room.id)}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                                        isActive
                                            ? isDark
                                                ? "bg-slate-800 text-slate-100"
                                                : "bg-slate-100 text-slate-900"
                                            : isDark
                                                ? "hover:bg-slate-800/60 text-slate-200"
                                                : "hover:bg-slate-50 text-slate-800"
                                    }`}
                                >
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                        isDark ? "bg-slate-700 text-slate-100" : "bg-slate-200 text-slate-700"
                                    }`}>
                                        {initials(room.other_user)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="text-sm font-semibold truncate">
                                                {displayName(room.other_user)}
                                            </div>
                                            {room.unread_count > 0 && (
                                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                    isDark
                                                        ? "bg-blue-500/20 text-blue-200"
                                                        : "bg-blue-100 text-blue-700"
                                                }`}>
                                                    {room.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`truncate text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                            {last?.content || (last?.file ? "Attachment" : "No messages yet")}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-sm text-center text-slate-500">
                            <MessageSquare className="w-6 h-6" />
                            No chats yet
                        </div>
                    )}
                </div>
            </div>

            {/* Chat panel */}
            <div
                className={`flex h-full flex-1 flex-col rounded-2xl border ${
                    isDark ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white"
                } ${activeRoomId ? "flex" : "hidden lg:flex"}`}
            >
                <div className={`flex items-center justify-between border-b px-4 py-3 ${
                    isDark ? "border-slate-700" : "border-slate-200"
                }`}>
                    <div className="flex items-center gap-3">
                        <button
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs lg:hidden ${
                                isDark ? "text-slate-200" : "text-slate-700"
                            }`}
                            onClick={() => setActiveRoomId(null)}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                        {activeRoom ? (
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                    isDark ? "bg-slate-700 text-slate-100" : "bg-slate-200 text-slate-700"
                                }`}>
                                    {initials(activeRoom.other_user)}
                                </div>
                                <div>
                                    <div className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                                        {displayName(activeRoom.other_user)}
                                    </div>
                                    <div className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                        {socketStatus === "connected" ? "Online" : socketStatus === "connecting" ? "Connecting..." : "Offline"}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                Select a chat to start
                            </div>
                        )}
                    </div>
                </div>

                <div ref={listRef} className="flex-1 px-4 py-4 overflow-y-auto">
                    {messagesLoading ? (
                        <div className="flex items-center justify-center h-full text-sm text-slate-500">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading messages...
                        </div>
                    ) : messages.length ? (
                        <div className="space-y-4">
                            {messages.map((msg) => {
                                const isMine = msg.message_direction === "sent" || msg.is_my_message;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                                isMine
                                                    ? "bg-blue-600 text-white"
                                                    : isDark
                                                        ? "bg-slate-800 text-slate-100"
                                                        : "bg-slate-100 text-slate-900"
                                            }`}
                                        >
                                            {renderMessageBody(msg)}
                                            <div className={`mt-2 flex items-center gap-2 text-[11px] ${
                                                isMine ? "text-blue-100" : isDark ? "text-slate-400" : "text-slate-500"
                                            }`}>
                                                <span>{formatTime(msg.created_at)}</span>
                                                {isMine && msg.is_read ? <span>Read</span> : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-sm text-slate-500">
                            <MessageSquare className="w-6 h-6" />
                            No messages yet
                        </div>
                    )}
                </div>

                <div className={`border-t px-4 py-3 ${isDark ? "border-slate-700" : "border-slate-200"}`}>
                    {typingState && activeRoomId ? (
                        <div className={`mb-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            {typingState.name || "User"} is typing...
                        </div>
                    ) : null}
                    {composerFile ? (
                        <div className={`mb-2 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                            isDark ? "border-slate-700 bg-slate-800 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}>
                            <Paperclip className="w-4 h-4" />
                            <span className="max-w-[240px] truncate">{composerFile.name}</span>
                            <button
                                className="ml-2 text-slate-400 hover:text-slate-200"
                                onClick={() => setComposerFile(null)}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ) : null}
                    <div className="flex items-end gap-2">
                        <button
                            type="button"
                            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                                isDark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={!activeRoomId}
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={(e) => setComposerFile(e.target.files?.[0] || null)}
                        />
                        <textarea
                            className={`min-h-[44px] flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none ${
                                isDark
                                    ? "border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
                                    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                            }`}
                            placeholder={activeRoomId ? "Write a message..." : "Select a chat to start"}
                            value={composerText}
                            onChange={(e) => handleTyping(e.target.value)}
                            onKeyDown={handleComposerKey}
                            disabled={!activeRoomId}
                        />
                        {composerFile ? (
                            <button
                                className={`flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold ${
                                    isDark ? "bg-blue-600 text-white" : "bg-blue-600 text-white"
                                }`}
                                onClick={handleSendFile}
                                disabled={!activeRoomId || sending}
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send
                            </button>
                        ) : (
                            <button
                                className={`flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold ${
                                    isDark ? "bg-blue-600 text-white" : "bg-blue-600 text-white"
                                }`}
                                onClick={handleSendText}
                                disabled={!activeRoomId || !composerText.trim()}
                            >
                                <Send className="w-4 h-4" />
                                Send
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* New chat modal */}
            {newChatOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
                    <div className={`w-full max-w-md rounded-2xl border p-5 shadow-xl ${
                        isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`text-base font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                                Start a chat
                            </div>
                            <button
                                className={`rounded-lg p-1 ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"}`}
                                onClick={() => setNewChatOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={`mb-1 block text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                    Course
                                </label>
                                <select
                                    className={`w-full rounded-xl border px-3 py-2 text-sm ${
                                        isDark
                                            ? "border-slate-700 bg-slate-800 text-slate-100"
                                            : "border-slate-200 bg-white text-slate-900"
                                    }`}
                                    value={selectedCourseId}
                                    onChange={(e) => handleCourseChange(e.target.value)}
                                >
                                    <option value="">Select course</option>
                                    {courseLoading ? (
                                        <option>Loading...</option>
                                    ) : (
                                        courses.map((course) => (
                                            <option key={course.id} value={course.id}>
                                                {course.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className={`mb-1 block text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                    Contact
                                </label>
                                <select
                                    className={`w-full rounded-xl border px-3 py-2 text-sm ${
                                        isDark
                                            ? "border-slate-700 bg-slate-800 text-slate-100"
                                            : "border-slate-200 bg-white text-slate-900"
                                    }`}
                                    value={selectedContactId}
                                    onChange={(e) => setSelectedContactId(Number(e.target.value))}
                                    disabled={!selectedCourseId || contactsLoading}
                                >
                                    <option value="">Select contact</option>
                                    {contactsLoading ? (
                                        <option>Loading...</option>
                                    ) : contacts.length ? (
                                        contacts.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {displayName(u)}
                                            </option>
                                        ))
                                    ) : (
                                        <option>No contacts found</option>
                                    )}
                                </select>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    className={`rounded-lg px-3 py-2 text-sm ${
                                        isDark ? "text-slate-200 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
                                    }`}
                                    onClick={() => setNewChatOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                                        selectedCourseId && selectedContactId
                                            ? "bg-blue-600 text-white"
                                            : "bg-blue-600/50 text-white/70"
                                    }`}
                                    disabled={!selectedCourseId || !selectedContactId}
                                    onClick={handleCreateRoom}
                                >
                                    Start
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
