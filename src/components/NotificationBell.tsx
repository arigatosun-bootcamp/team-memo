"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type NotificationBellProps = {
  userId?: string;
};

// Bug 11（部分）: useEffectの依存配列にfetchUnreadCountが含まれているが、
// fetchUnreadCountはuseCallback無しで毎レンダリングで再生成されるため、
// setIntervalが再レンダリングのたびに再作成される
export default function NotificationBell({ userId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // Bug 11: useCallback無しの関数定義 → 毎レンダリングで新しい参照が生成される
  const fetchUnreadCount = async () => {
    if (!userId) return;
    try {
      const response = await fetch(
        `/api/notifications?user_id=${userId}&unread_only=true`
      );
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // エラー時は何もしない
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // 5秒ごとにポーリング
    const interval = setInterval(fetchUnreadCount, 5000);

    return () => clearInterval(interval);
  // Bug 11: fetchUnreadCount は毎レンダリングで新しい参照になるため、
  // このuseEffectは再レンダリングのたびに実行される（インターバルが再作成される）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUnreadCount]); // 正しくは [] にするか、fetchUnreadCountをuseCallbackで安定化すべき

  if (!userId) return null;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "20px",
          position: "relative",
          padding: "4px 8px",
        }}
        aria-label="通知"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "0",
              backgroundColor: "#dc2626",
              color: "white",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            width: "280px",
            zIndex: 100,
            padding: "8px 0",
          }}
        >
          <div
            style={{
              padding: "8px 16px",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: "bold", fontSize: "14px" }}>通知</span>
            {unreadCount > 0 && (
              <span style={{ fontSize: "12px", color: "#dc2626" }}>
                {unreadCount}件の未読
              </span>
            )}
          </div>
          <Link
            href="/notifications"
            onClick={() => setShowDropdown(false)}
            style={{
              display: "block",
              padding: "12px 16px",
              textAlign: "center",
              color: "#2563eb",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            すべての通知を見る →
          </Link>
        </div>
      )}
    </div>
  );
}
