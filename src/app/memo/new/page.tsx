"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import MemoForm from "@/components/MemoForm";
import type { Category } from "@/lib/types";

export default function NewMemoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
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

  const handleSubmit = async (data: {
    title: string;
    content: string;
    category: Category;
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, user_id: userId }),
      });

      if (response.ok) {
        const memo = await response.json();
        router.push(`/memo/${memo.id}`);
      } else {
        const error = await response.json();
        alert(error.error || "メモの作成に失敗しました");
      }
    } catch {
      alert("メモの作成に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

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

        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>
          新規メモ作成
        </h1>

        <MemoForm onSubmit={handleSubmit} isLoading={isLoading} submitLabel="作成" />
      </main>
    </>
  );
}
