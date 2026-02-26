"use client";

import { useState } from "react";

type LikeButtonProps = {
  memoId: string;
  initialCount: number;
  userId?: string;
};

export default function LikeButton({
  memoId,
  initialCount,
  userId,
}: LikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    if (!userId) {
      alert("いいねするにはログインが必要です");
      return;
    }

    // 二重送信を防止
    if (isLoading) return;
    setIsLoading(true);

    // 楽観的更新: UIを先に更新してUXを向上させる
    setCount((prev) => prev + 1);
    setIsLiked(true);

    try {
      // サーバーに送信
      const response = await fetch(`/api/memos/${memoId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();

      // サーバーの実際の値でカウントを同期
      if (data.likes_count !== undefined) {
        setCount(data.likes_count);
      }
    } catch {
      // ネットワークエラー時は楽観的更新を巻き戻す
      setCount((prev) => prev - 1);
      setIsLiked(false);
    }
    // NOTE: isLoadingをリセットしない。
    // いいねは1メモにつき1回限りなので、成功後にリセットする必要がない。
    // 成功時はisLiked=trueでボタンがdisabledになるため問題ない。
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLiked}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.5rem 1rem",
        borderRadius: "20px",
        border: isLiked ? "1px solid #2563eb" : "1px solid #e2e8f0",
        backgroundColor: isLiked ? "#fef2f2" : "#f8fafc",
        color: isLiked ? "#2563eb" : "#64748b",
        cursor: isLiked ? "default" : "pointer",
        fontSize: "0.875rem",
        fontWeight: 500,
        transition: "all 0.2s",
      }}
    >
      {isLiked ? "♥" : "♡"} {count}
    </button>
  );
}
