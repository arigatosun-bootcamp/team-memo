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
        borderBottom: "1px solid #f0f0f0",
        backgroundColor: notification.is_read ? "white" : "#f0f7ff",
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
              color: "#888",
              backgroundColor: "#f0f0f0",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            {typeLabel}
          </span>
          <span style={{ color: "#888", fontSize: "12px" }}>
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>
        <p style={{ margin: "4px 0 2px", fontSize: "14px", fontWeight: notification.is_read ? "normal" : "bold" }}>
          {notification.title}
        </p>
        {notification.body && (
          <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
            {notification.body}
          </p>
        )}
        <div style={{ marginTop: "6px", display: "flex", gap: "8px" }}>
          {notification.memo_id && (
            <Link
              href={`/memo/${notification.memo_id}`}
              style={{ fontSize: "12px", color: "#4299e1", textDecoration: "none" }}
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
                color: "#888",
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
