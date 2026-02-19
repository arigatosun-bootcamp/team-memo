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

    // 楽観的更新: UIを先に更新
    setCount((prev) => prev + 1);
    setIsLiked(true);

    // サーバーに送信
    const response = await fetch(`/api/memos/${memoId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await response.json();

    // サーバーの値で上書き
    setCount(data.likes_count);
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
        border: isLiked ? "1px solid #e94560" : "1px solid #2a2a4a",
        backgroundColor: isLiked ? "#3a1a2e" : "#16213e",
        color: isLiked ? "#e94560" : "#a0a0b0",
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
