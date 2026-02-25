"use client";

import { useState } from "react";
import type { Comment } from "@/lib/types";

type CommentFormProps = {
  memoId: string;
  userId: string;
  parentId?: string;
  onCommentAdded: (comment: Comment) => void;
  placeholder?: string;
};

export default function CommentForm({
  memoId,
  userId,
  parentId,
  onCommentAdded,
  placeholder = "コメントを入力...",
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/memos/${memoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          user_id: userId,
          parent_id: parentId || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onCommentAdded(data.comment);
        setContent("");
      }
    } catch (error) {
      console.error("コメントの投稿に失敗しました:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: "8px 12px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          fontSize: "14px",
        }}
      />
      <button
        type="submit"
        disabled={isSubmitting || !content.trim()}
        style={{
          padding: "8px 16px",
          backgroundColor: isSubmitting ? "#ccc" : "#4299e1",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          fontSize: "14px",
        }}
      >
        {isSubmitting ? "送信中..." : "送信"}
      </button>
    </form>
  );
}
