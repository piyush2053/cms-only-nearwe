import React, {
    ReactNode,
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef
} from "react";
import popSound from '../assets/sounds/pop.wav'

type NotificationType = "success" | "error" | "warning";

type Notification = {
    id: number;
    title: string;
    description: string;
    type: NotificationType;
};

const NotificationContext = createContext({
    showNotification: (
        title: string,
        desc: string,
        type: NotificationType,
        duration: number
    ) => { },
});
interface NotificationProviderProps {
    children: ReactNode;
}
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context)
        throw new Error("useNotification must be used inside NotificationProvider");
    return context;
};


let nextId = 1;

const TONE: Record<NotificationType, { dot: string; bar: string }> = {
    success: { dot: "#1F9D6B", bar: "rgba(31,157,107,0.18)" },
    error:   { dot: "#D6453A", bar: "rgba(214,69,58,0.18)" },
    warning: { dot: "#C9821A", bar: "rgba(201,130,26,0.18)" },
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<(Notification & { duration: number })[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio(popSound);
        audioRef.current.volume = 0.1;
    }, []);

    const removeNotification = useCallback((id: number) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const showNotification = useCallback(
        (title: string, description: string, type: NotificationType, duration = 3000) => {
            const id = nextId++;
            setNotifications((prev) => [...prev, { id, title, description, type, duration }]);
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => { /* autoplay blocked: ignore */ });
            }
            setTimeout(() => removeNotification(id), duration);
        },
        [removeNotification]
    );

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div
                className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center w-full px-4 pointer-events-none"
                role="status"
                aria-live="polite"
            >
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className="pointer-events-auto relative overflow-hidden flex items-center gap-3 w-full max-w-[340px] pl-4 pr-10 py-3 rounded-full animate-bounceIn"
                        style={{
                            background: "#202A40",
                            color: "#fff",
                            boxShadow: "0 20px 40px -18px rgba(32,42,64,0.6)",
                        }}
                    >
                        <div
                            className="absolute left-0 top-0 h-full"
                            style={{
                                width: "100%",
                                background: TONE[n.type].bar,
                                transform: "translateX(-100%)",
                                animation: `fillProgress ${n.duration}ms linear forwards`,
                            }}
                        />
                        <span
                            className="relative shrink-0 rounded-full"
                            style={{ width: 9, height: 9, background: TONE[n.type].dot, boxShadow: `0 0 0 4px ${TONE[n.type].bar}` }}
                        />
                        <div className="relative min-w-0">
                            <div className="font-semibold text-sm leading-tight">{n.title}</div>
                            {n.description && <div className="text-xs text-white/70 leading-snug">{n.description}</div>}
                        </div>
                        <button
                            type="button"
                            aria-label="Dismiss"
                            onClick={() => removeNotification(n.id)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full text-[11px] text-white/70 hover:text-white hover:bg-white/10"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
