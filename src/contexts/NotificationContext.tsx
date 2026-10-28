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

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<any>([]);
    const audioRef: any = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio(popSound);
        audioRef.current.volume = 0.1;
    }, []);
    const removeNotification = useCallback((id: number) => {
        setNotifications((prev:any) => prev.filter((n:any) => n.id !== id));
    }, []);

    const showNotification = useCallback(
        (
            title: string,
            description: string,
            type: NotificationType,
            duration = 3000
        ) => {
            const id = Date.now();
            const newNotification: Notification = {
                id,
                title,
                description,
                type,
            };

            setNotifications((prev:any) => [...prev, newNotification]);
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            }
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        },
        [removeNotification]
    );

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center w-full px-4">
                {notifications?.map((notification:any) => (
                    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center w-full px-4">
                        {notifications?.map((notification:any) => (
                            <div
                                key={notification.id}
                                className={`relative px-4 py-2 shadow-lg text-white w-full max-w-[260px] 
                text-center transition-all duration-300 animate-bounceIn rounded-full overflow-hidden
                bg-bg1 border flex items-center justify-center
                ${notification.type === "success" && "border-green-400"}
                ${notification.type === "error" && "border-red-400"}
                ${notification.type === "warning" && "border-yellow-400"}
            `}
                            >

                                {/* PROGRESS BAR (10% opacity) */}
                                <div
                                    className={`
                    absolute left-0 top-0 h-full opacity-90
                    ${notification.type === "success"
                                            ? "bg-green-500"
                                            : notification.type === "error"
                                                ? "bg-red-500"
                                                : "bg-yellow-400"
                                        }
                `}
                                    style={{
                                        width: "100%",
                                        transform: "translateX(-100%)",
                                        animation: `fillProgress ${notification?.duration || 3000}ms linear forwards`,
                                    }}
                                ></div>

                                {/* Close Button */}
                                <button
                                    onClick={() => removeNotification(notification.id)}
                                    className={`
                    absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full text-[10px] font-bold
                    ${notification.type === "success"
                                            ? "bg-green-500 text-black"
                                            : notification.type === "error"
                                                ? "bg-red-500 text-black"
                                                : "bg-yellow-400 text-black"
                                        }
                    hover:opacity-70
                `}
                                >
                                    ✕
                                </button>

                                <div className="flex flex-col items-center justify-center relative z-10">
                                    <div className="font-semibold text-sm leading-tight">
                                        {notification.title}
                                    </div>

                                    <div className="text-xs text-white/80 leading-snug">
                                        {notification.description}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

        </NotificationContext.Provider>
    );
};
