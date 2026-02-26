"use client";

import { useState } from "react";
import type { Comment } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import CommentForm from "./CommentForm";

type CommentListProps = {
  memoId: string;
  comments: Comment[];
  userId?: string;
  onCommentAdded: (comment: Comment) => void;
  onCommentDeleted: (commentId: string) => void;
};

export default function CommentList({
  memoId,
  comments,
  userId,
  onCommentAdded,
  onCommentDeleted,
}: CommentListProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleDelete = async (commentId: string) => {
    if (!confirm("このコメントを削除しますか？")) return;

    const response = await fetch(
      `/api/memos/${memoId}/comments/${commentId}`,
      { method: "DELETE" }
    );

    if (response.ok) {
      // Bug 9（部分）: 親コメントのみUIから除去。
      // CASCADEで返信も削除されるが、ここでは親のみ除去している
      // 返信がUIに残ったまま表示される（リロードすると消える）
      onCommentDeleted(commentId);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      style={{
        marginLeft: isReply ? "32px" : "0",
        padding: "12px",
        borderBottom: "1px solid #e2e8f0",
        backgroundColor: isReply ? "#f1f5f9" : "#f8fafc",
        borderRadius: "6px",
        marginBottom: "4px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontWeight: "bold", fontSize: "14px", color: "#1e293b" }}>
          {comment.user?.display_name || "不明なユーザー"}
        </span>
        <span style={{ color: "#64748b", fontSize: "12px" }}>
          {formatRelativeTime(comment.created_at)}
        </span>
      </div>
      <p style={{ margin: "4px 0 8px", fontSize: "14px", lineHeight: "1.5", color: "#475569" }}>
        {comment.content}
      </p>
      <div style={{ display: "flex", gap: "12px" }}>
        {userId && !isReply && (
          <button
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "12px",
              padding: 0,
            }}
          >
            {replyingTo === comment.id ? "キャンセル" : "返信"}
          </button>
        )}
        {userId === comment.user_id && (
          <button
            onClick={() => handleDelete(comment.id)}
            style={{
              background: "none",
              border: "none",
              color: "#dc2626",
              cursor: "pointer",
              fontSize: "12px",
              padding: 0,
            }}
          >
            削除
          </button>
        )}
      </div>
      {replyingTo === comment.id && userId && (
        <div style={{ marginTop: "8px" }}>
          <CommentForm
            memoId={memoId}
            userId={userId}
            parentId={comment.id}
            onCommentAdded={(newComment) => {
              onCommentAdded(newComment);
              setReplyingTo(null);
            }}
            placeholder="返信を入力..."
          />
        </div>
      )}
      {/* 返信の表示 */}
      {comment.replies?.map((reply) => renderComment(reply, true))}
    </div>
  );

  return (
    <div style={{ marginTop: "24px" }}>
      <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
        コメント ({comments.length})
      </h3>
      {userId && (
        <CommentForm
          memoId={memoId}
          userId={userId}
          onCommentAdded={onCommentAdded}
        />
      )}
      <div style={{ marginTop: "16px" }}>
        {comments.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "24px" }}>
            まだコメントはありません
          </p>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
}
