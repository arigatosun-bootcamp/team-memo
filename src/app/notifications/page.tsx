"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Notification } from "@/lib/types";
import Header from "@/components/Header";
import NotificationItem from "@/components/NotificationItem";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();
  const [userName, setUserName] = useState<string | undefined>();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      setUserName(user.user_metadata?.display_name);

      const response = await fetch(`/api/notifications?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
      setIsLoading(false);
    };
    init();
  }, [router]);

  const handleMarkRead = async (notificationId: string) => {
    if (!userId) return;

    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notification_ids: [notificationId],
        user_id: userId,
      }),
    });

    if (response.ok) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;

    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all: true, user_id: userId }),
    });

    if (response.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <Header userName={userName} onLogout={handleLogout} />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
            通知 {unreadCount > 0 && <span style={{ color: "#e53e3e", fontSize: "16px" }}>({unreadCount}件の未読)</span>}
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4299e1",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              すべて既読にする
            </button>
          )}
        </div>
        {isLoading ? (
          <p style={{ textAlign: "center", color: "#888" }}>読み込み中...</p>
        ) : notifications.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888", padding: "48px" }}>
            通知はありません
          </p>
        ) : (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
