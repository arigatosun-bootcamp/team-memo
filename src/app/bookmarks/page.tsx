"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Bookmark } from "@/lib/types";
import Header from "@/components/Header";
import BookmarkButton from "@/components/BookmarkButton";
import Link from "next/link";
import { formatDate, truncateText } from "@/lib/utils";

// Bug 10（部分）: bookmark.memo がRLSによりnullになるケースでランタイムエラー
export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();
  const [userName, setUserName] = useState<string | undefined>();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      setUserName(user.user_metadata?.display_name);

      const response = await fetch(`/api/bookmarks?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setBookmarks(data.bookmarks || []);
      }
      setIsLoading(false);
    };
    init();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div>
      <Header userName={userName} onLogout={handleLogout} />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>
          ブックマーク
        </h1>
        {isLoading ? (
          <p style={{ textAlign: "center", color: "#888" }}>読み込み中...</p>
        ) : bookmarks.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888", padding: "48px" }}>
            ブックマークしたメモはありません
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Link
                  href={`/memo/${bookmark.memo_id}`}
                  style={{ textDecoration: "none", color: "inherit", flex: 1 }}
                >
                  {/* Bug 10: bookmark.memo が null の場合ランタイムエラー */}
                  <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 4px" }}>
                    {bookmark.memo.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#666", margin: "0 0 4px" }}>
                    {truncateText(bookmark.memo.content, 100)}
                  </p>
                  <span style={{ fontSize: "12px", color: "#888" }}>
                    {formatDate(bookmark.created_at)}
                  </span>
                </Link>
                <BookmarkButton memoId={bookmark.memo_id} userId={userId} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
