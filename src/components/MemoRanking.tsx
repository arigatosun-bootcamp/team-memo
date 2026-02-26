"use client";

import { useState, useEffect } from "react";
import type { Memo } from "@/lib/types";
import Link from "next/link";

type MemoRankingProps = {
  type?: "likes" | "comments" | "recent";
  limit?: number;
};

export default function MemoRanking({ type = "likes", limit = 10 }: MemoRankingProps) {
  const [ranking, setRanking] = useState<(Memo & { user?: { display_name: string } })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(type);

  useEffect(() => {
    const fetchRanking = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/stats/ranking?type=${selectedType}&limit=${limit}`
        );
        if (response.ok) {
          const data = await response.json();
          setRanking(data.ranking || []);
        }
      } catch {
        // エラー時は何もしない
      } finally {
        setIsLoading(false);
      }
    };
    fetchRanking();
  }, [selectedType, limit]);

  const getMetric = (memo: Memo) => {
    switch (selectedType) {
      case "likes": return `❤️ ${memo.likes_count}`;
      case "comments": return `💬 ${memo.comments_count}`;
      default: return "";
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {(["likes", "comments", "recent"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            style={{
              padding: "6px 12px",
              borderRadius: "16px",
              border: "1px solid #ddd",
              backgroundColor: selectedType === t ? "#2563eb" : "white",
              color: selectedType === t ? "white" : "#1e293b",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {t === "likes" ? "いいね順" : t === "comments" ? "コメント順" : "新着順"}
          </button>
        ))}
      </div>
      {isLoading ? (
        <p style={{ textAlign: "center", color: "#94a3b8", padding: "24px" }}>
          読み込み中...
        </p>
      ) : ranking.length === 0 ? (
        <p style={{ textAlign: "center", color: "#94a3b8", padding: "24px" }}>
          データがありません
        </p>
      ) : (
        <div>
          {ranking.map((memo, index) => (
            <Link
              key={memo.id}
              href={`/memo/${memo.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  borderBottom: "1px solid #f0f0f0",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: index < 3 ? "20px" : "16px",
                    color: index === 0 ? "#eab308" : index === 1 ? "#94a3b8" : index === 2 ? "#b45309" : "#888",
                    width: "32px",
                    textAlign: "center",
                  }}
                >
                  {index + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                    {memo.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                    {memo.user?.display_name || "不明"}
                  </div>
                </div>
                <span style={{ fontSize: "14px", color: "#94a3b8" }}>
                  {getMetric(memo)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
