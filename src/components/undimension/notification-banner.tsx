"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, Sparkles, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * NotificationBanner — appears below the navbar.
 *
 * Listens for two custom events:
 *   1. 'ud-notify-error'    — DB/fetch failure: "Internetmu lambat..."
 *   2. 'ud-notify-secret'   — Hidden member revealed via shuffle
 *
 * Auto-dismisses after 5 seconds. Manual dismiss via X button.
 * Positioned sticky below the navbar (top-14 on mobile, top-16 on desktop
 * — matching the navbar height).
 */

type Notification = {
  message: string;
  type: "error" | "secret" | "info";
  id: number;
};

export function NotificationBanner() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let idCounter = 0;

    const showError = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setNotifications((prev) => [
        ...prev,
        { message: detail?.message || "Koneksi dengan sumber data terganggu.", type: "error", id: idCounter++ },
      ]);
    };

    const showSecret = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setNotifications((prev) => [
        ...prev,
        { message: detail?.message || "Secret member appeared!", type: "secret", id: idCounter++ },
      ]);
    };

    const showInfo = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setNotifications((prev) => [
        ...prev,
        { message: detail?.message || "", type: "info", id: idCounter++ },
      ]);
    };

    window.addEventListener("ud-notify-error", showError);
    window.addEventListener("ud-notify-secret", showSecret);
    window.addEventListener("ud-notify-info", showInfo);
    return () => {
      window.removeEventListener("ud-notify-error", showError);
      window.removeEventListener("ud-notify-secret", showSecret);
      window.removeEventListener("ud-notify-info", showInfo);
    };
  }, []);

  // Auto-dismiss each notification after 5 seconds
  useEffect(() => {
    if (notifications.length === 0) return;
    const timer = setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [notifications]);

  const dismiss = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-14 md:top-16 left-0 right-0 z-[45] flex flex-col items-center gap-1 px-2 pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={cn(
            "pointer-events-auto flex items-center gap-3 px-4 py-2.5 border-2 font-mono-ud text-xs md:text-sm font-bold shadow-lg animate-intro-zoom max-w-md w-full",
            n.type === "error" && "bg-[#ff4d4d] text-white border-black",
            n.type === "secret" && "bg-[#ff006e] text-white border-black",
            n.type === "info" && "bg-[#00e5ff] text-black border-black",
          )}
          role="alert"
        >
          {n.type === "error" && <WifiOff className="w-4 h-4 flex-shrink-0" />}
          {n.type === "secret" && <Sparkles className="w-4 h-4 flex-shrink-0" />}
          {n.type === "info" && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          <span className="flex-1 truncate">{n.message}</span>
          <button
            onClick={() => dismiss(n.id)}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
