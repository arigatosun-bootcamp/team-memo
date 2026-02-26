"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Memo } from "@/lib/types";
import Header from "@/components/Header";
import UserAvatar from "@/components/UserAvatar";
import UserStats from "@/components/UserStats";
import MemoCard from "@/components/MemoCard";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId: profileUserId } = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);
  const [stats, setStats] = useState({ memoCount: 0, totalLikes: 0, commentCount: 0 });
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | undefined>();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.display_name);
      }

      // プロフィール取得
      const profileRes = await fetch(`/api/profile/${profileUserId}`);
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
        setStats(data.stats);
      }

      // ユーザーの公開メモ取得
      const memosRes = await fetch(`/api/memos?user_id=${profileUserId}`);
      if (memosRes.ok) {
        const data = await memosRes.json();
        setMemos(data.memos || []);
      }

      setIsLoading(false);
    };
    init();
  }, [profileUserId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div>
      <Header userName={userName} onLogout={handleLogout} />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
        {isLoading ? (
          <p style={{ textAlign: "center", color: "#94a3b8" }}>読み込み中...</p>
        ) : !profile ? (
          <p style={{ textAlign: "center", color: "#94a3b8" }}>ユーザーが見つかりません</p>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <UserAvatar
                displayName={profile.display_name}
                avatarUrl={profile.avatar_url}
                size={80}
              />
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
                  {profile.display_name}
                </h1>
              </div>
            </div>
            <UserStats
              memoCount={stats.memoCount}
              totalLikes={stats.totalLikes}
              commentCount={stats.commentCount}
            />
            <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #e2e8f0" }} />
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
              公開メモ
            </h2>
            {memos.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "24px" }}>
                公開メモはありません
              </p>
            ) : (
              <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                {memos.map((memo) => (
                  <MemoCard key={memo.id} memo={memo} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
