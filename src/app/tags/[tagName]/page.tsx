"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Memo } from "@/lib/types";
import Header from "@/components/Header";
import MemoCard from "@/components/MemoCard";

export default function TagMemosPage({
  params,
}: {
  params: Promise<{ tagName: string }>;
}) {
  const { tagName } = use(params);
  const router = useRouter();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | undefined>();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.display_name);
      }

      // タグ名でフィルタしたメモを取得
      const response = await fetch(`/api/memos?tag=${encodeURIComponent(tagName)}`);
      if (response.ok) {
        const data = await response.json();
        setMemos(data.memos || []);
      }
      setIsLoading(false);
    };
    init();
  }, [tagName]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div>
      <Header userName={userName} onLogout={handleLogout} />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>
          タグ: #{decodeURIComponent(tagName)}
        </h1>
        {isLoading ? (
          <p style={{ textAlign: "center", color: "#94a3b8" }}>読み込み中...</p>
        ) : memos.length === 0 ? (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: "48px" }}>
            このタグのメモはありません
          </p>
        ) : (
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {memos.map((memo) => (
              <MemoCard key={memo.id} memo={memo} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
