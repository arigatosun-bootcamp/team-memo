"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import MemoRanking from "@/components/MemoRanking";
import { CATEGORIES } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<{
    totalMemos: number;
    totalLikes: number;
    totalComments: number;
    activeUsers: number;
    memosByDate: Record<string, number>;
    memosByCategory: Record<string, number>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | undefined>();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.display_name);
      }

      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div>
      <Header userName={userName} onLogout={handleLogout} />
      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>
          ダッシュボード
        </h1>
        {isLoading ? (
          <p style={{ textAlign: "center", color: "#94a3b8" }}>読み込み中...</p>
        ) : stats ? (
          <>
            {/* 統計カード */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
              {[
                { label: "総メモ数", value: stats.totalMemos, color: "#2563eb" },
                { label: "総いいね数", value: stats.totalLikes, color: "#dc2626" },
                { label: "総コメント数", value: stats.totalComments, color: "#16a34a" },
                { label: "アクティブユーザー", value: stats.activeUsers, color: "#9f7aea" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "20px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "32px", fontWeight: "bold", color: item.color }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: "14px", color: "#94a3b8", marginTop: "4px" }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* カテゴリ別 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
                  カテゴリ別メモ数
                </h2>
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat.value}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <span>{cat.label}</span>
                    <span style={{ fontWeight: "bold" }}>
                      {stats.memosByCategory[cat.value] || 0}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
                  日別メモ投稿数
                </h2>
                {Object.entries(stats.memosByDate)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 7)
                  .map(([date, count]) => (
                    <div
                      key={date}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <span>{date}</span>
                      <span style={{ fontWeight: "bold" }}>{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* ランキング */}
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
                メモランキング
              </h2>
              <MemoRanking />
            </div>
          </>
        ) : (
          <p style={{ textAlign: "center", color: "#94a3b8" }}>データの取得に失敗しました</p>
        )}
      </main>
    </div>
  );
}
