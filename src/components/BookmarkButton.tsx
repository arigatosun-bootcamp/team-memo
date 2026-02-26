"use client";

import { useState, useEffect } from "react";

type BookmarkButtonProps = {
  memoId: string;
  userId?: string;
};

export default function BookmarkButton({ memoId, userId }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Bug 10（部分）: useEffectの依存配列に userId が含まれていない
  // メモ詳細画面では画面遷移時に偶然動くが、ブックマーク一覧画面では
  // ページ表示後にuserIdが取得されるため、初期チェックが走らない
  useEffect(() => {
    if (!userId || !memoId) return;

    const checkBookmark = async () => {
      try {
        const response = await fetch(
          `/api/bookmarks?user_id=${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          const found = data.bookmarks?.some(
            (b: { memo_id: string }) => b.memo_id === memoId
          );
          setIsBookmarked(found);
        }
      } catch {
        // エラー時は何もしない
      }
    };

    checkBookmark();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoId]); // Bug 10: userId が依存配列に含まれていない

  const handleToggle = async () => {
    if (!userId) {
      alert("ブックマークするにはログインが必要です");
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isBookmarked) {
        await fetch(`/api/memos/${memoId}/bookmark?user_id=${userId}`, {
          method: "DELETE",
        });
        setIsBookmarked(false);
      } else {
        await fetch(`/api/memos/${memoId}/bookmark`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        });
        setIsBookmarked(true);
      }
    } catch {
      // エラー時は何もしない
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      title={isBookmarked ? "ブックマーク解除" : "ブックマーク"}
      style={{
        background: "none",
        border: "1px solid #ddd",
        borderRadius: "6px",
        padding: "6px 12px",
        cursor: isLoading ? "not-allowed" : "pointer",
        fontSize: "16px",
        color: isBookmarked ? "#eab308" : "#94a3b8",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {isBookmarked ? "★" : "☆"}
      <span style={{ fontSize: "13px" }}>
        {isBookmarked ? "保存済み" : "保存"}
      </span>
    </button>
  );
}
