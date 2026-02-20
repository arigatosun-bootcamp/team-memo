"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import MemoCard from "@/components/MemoCard";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";
import type { Memo } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | undefined>();

  useEffect(() => {
    async function checkUser() {
      const { supabase } = await import("@/lib/supabase");
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.display_name || user.email || "ユーザー");
      }
    }
    checkUser();
  }, []);

  const fetchMemos = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: currentPage.toString(),
    });
    if (searchQuery) params.set("search", searchQuery);
    if (searchCategory) params.set("category", searchCategory);

    try {
      const response = await fetch(`/api/memos?${params}`);
      const data = await response.json();
      setMemos(data.memos || []);
      setTotal(data.total || 0);
    } catch {
      console.error("メモの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, searchCategory]);

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  const handleSearch = (query: string, category: string) => {
    setSearchQuery(query);
    setSearchCategory(category);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Header
        userName={userName}
        onLogout={async () => {
          const { supabase } = await import("@/lib/supabase");
          await supabase.auth.signOut();
          setUserName(undefined);
          router.refresh();
        }}
      />
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2rem 1.5rem",
        }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            メモ一覧
          </h1>
          <SearchBar onSearch={handleSearch} />
        </div>

        {isLoading ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "#a0a0b0",
            }}
          >
            読み込み中...
          </div>
        ) : memos.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "#a0a0b0",
            }}
          >
            {searchQuery || searchCategory
              ? "検索条件に一致するメモがありません"
              : "メモがまだありません。最初のメモを作成しましょう！"}
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: "1rem",
              }}
            >
              {memos.map((memo) => (
                <MemoCard key={memo.id} memo={memo} />
              ))}
            </div>
            <Pagination
              totalItems={total}
              itemsPerPage={10}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </main>
    </>
  );
}
