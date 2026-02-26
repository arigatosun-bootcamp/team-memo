import type { Notification } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import { NOTIFICATION_TYPES } from "@/lib/types";
import Link from "next/link";

type NotificationItemProps = {
  notification: Notification;
  onMarkRead: (id: string) => void;
};

export default function NotificationItem({
  notification,
  onMarkRead,
}: NotificationItemProps) {
  const typeLabel = NOTIFICATION_TYPES[notification.type] || notification.type;

  const getIcon = () => {
    switch (notification.type) {
      case "like": return "❤️";
      case "comment": return "💬";
      case "mention": return "📢";
      case "system": return "🔧";
      default: return "📩";
    }
  };

  return (
    <div
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid #e2e8f0",
        backgroundColor: notification.is_read ? "#f8fafc" : "#eff6ff",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
      }}
    >
      <span style={{ fontSize: "20px" }}>{getIcon()}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontSize: "11px",
              color: "#64748b",
              backgroundColor: "#e2e8f0",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            {typeLabel}
          </span>
          <span style={{ color: "#64748b", fontSize: "12px" }}>
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>
        <p style={{ margin: "4px 0 2px", fontSize: "14px", fontWeight: notification.is_read ? "normal" : "bold", color: "#1e293b" }}>
          {notification.title}
        </p>
        {notification.body && (
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            {notification.body}
          </p>
        )}
        <div style={{ marginTop: "6px", display: "flex", gap: "8px" }}>
          {notification.memo_id && (
            <Link
              href={`/memo/${notification.memo_id}`}
              style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none" }}
            >
              メモを見る
            </Link>
          )}
          {!notification.is_read && (
            <button
              onClick={() => onMarkRead(notification.id)}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                fontSize: "12px",
                padding: 0,
              }}
            >
              既読にする
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
