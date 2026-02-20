"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import LikeButton from "@/components/LikeButton";
import { formatDateTime, getCategoryBadgeClass } from "@/lib/utils";
import type { Memo } from "@/lib/types";

export default function MemoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const [userName, setUserName] = useState<string | undefined>();

  useEffect(() => {
    async function checkUser() {
      const { supabase } = await import("@/lib/supabase");
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserName(user.user_metadata?.display_name || user.email || "ユーザー");
      }
    }
    checkUser();
  }, []);

  useEffect(() => {
    async function fetchMemo() {
      try {
        const response = await fetch(`/api/memos/${params.id}`);
        if (!response.ok) throw new Error("メモが見つかりません");
        const data = await response.json();
        setMemo(data);
      } catch {
        console.error("メモの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    }
    if (params.id) fetchMemo();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("このメモを削除しますか？")) return;

    const response = await fetch(`/api/memos/${params.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      router.push("/");
    }
  };

  const handleToggleVisibility = async () => {
    if (!memo) return;

    const response = await fetch(`/api/memos/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: memo.is_private }),
    });
    if (response.ok) {
      const updated = await response.json();
      setMemo(updated);
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoId: params.id }),
      });
      if (response.ok) {
        const data = await response.json();
        setMemo((prev) => (prev ? { ...prev, summary: data.summary } : null));
      }
    } catch {
      alert("要約の生成に失敗しました");
    } finally {
      setIsSummarizing(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header
        userName={userName}
        onLogout={async () => {
          const { supabase } = await import("@/lib/supabase");
          await supabase.auth.signOut();
          router.push("/login");
        }}
      />
        <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1.5rem" }}>
          <p style={{ color: "#a0a0b0" }}>読み込み中...</p>
        </main>
      </>
    );
  }

  if (!memo) {
    return (
      <>
        <Header
        userName={userName}
        onLogout={async () => {
          const { supabase } = await import("@/lib/supabase");
          await supabase.auth.signOut();
          router.push("/login");
        }}
      />
        <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1.5rem" }}>
          <p style={{ color: "#a0a0b0" }}>メモが見つかりませんでした。</p>
        </main>
      </>
    );
  }

  const badgeClass = getCategoryBadgeClass(memo.category);

  return (
    <>
      <Header
        userName={userName}
        onLogout={async () => {
          const { supabase } = await import("@/lib/supabase");
          await supabase.auth.signOut();
          router.push("/login");
        }}
      />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <button
          onClick={() => router.push("/")}
          style={{
            background: "none",
            border: "none",
            color: "#a0a0b0",
            cursor: "pointer",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
          }}
        >
          ← 一覧に戻る
        </button>

        <article>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>
              {memo.title}
            </h1>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "12px",
                backgroundColor:
                  badgeClass === "badgeInfo"
                    ? "#1a3a5c"
                    : badgeClass === "badgeWarning"
                      ? "#4a3a1a"
                      : badgeClass === "badgeSuccess"
                        ? "#1a4a3a"
                        : "#2a2a4a",
                color:
                  badgeClass === "badgeInfo"
                    ? "#5dade2"
                    : badgeClass === "badgeWarning"
                      ? "#f39c12"
                      : badgeClass === "badgeSuccess"
                        ? "#2ecc71"
                        : "#a0a0b0",
              }}
            >
              {memo.category}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              color: "#666",
              fontSize: "0.8125rem",
              marginBottom: "1.5rem",
            }}
          >
            <span>作成: {formatDateTime(memo.created_at)}</span>
            <span>更新: {formatDateTime(memo.updated_at)}</span>
            <span>{memo.is_private ? "🔒 非公開" : "🌐 公開"}</span>
          </div>

          <div
            style={{
              backgroundColor: "#16213e",
              borderRadius: "8px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
              color: "#ccc",
            }}
          >
            {memo.content}
          </div>

          {memo.summary && (
            <div
              style={{
                backgroundColor: "#1a1a3e",
                border: "1px solid #7b68ee33",
                borderRadius: "8px",
                padding: "1rem 1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <h3 style={{ color: "#7b68ee", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                AI要約
              </h3>
              <p style={{ color: "#a0a0b0", fontSize: "0.875rem", lineHeight: 1.6 }}>
                {memo.summary}
              </p>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid #2a2a4a",
            }}
          >
            <LikeButton
              memoId={memo.id}
              initialCount={memo.likes_count}
              userId={userId}
            />
            <button
              onClick={handleSummarize}
              disabled={isSummarizing}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                border: "1px solid #7b68ee",
                backgroundColor: "transparent",
                color: "#7b68ee",
                cursor: isSummarizing ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                opacity: isSummarizing ? 0.6 : 1,
              }}
            >
              {isSummarizing ? "生成中..." : "AI要約を生成"}
            </button>
            <button
              onClick={handleToggleVisibility}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                border: "1px solid #2a2a4a",
                backgroundColor: "transparent",
                color: "#a0a0b0",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              {memo.is_private ? "公開にする" : "非公開にする"}
            </button>
            <button
              onClick={handleDelete}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                border: "1px solid #e94560",
                backgroundColor: "transparent",
                color: "#e94560",
                cursor: "pointer",
                fontSize: "0.875rem",
                marginLeft: "auto",
              }}
            >
              削除
            </button>
          </div>
        </article>
      </main>
    </>
  );
}
