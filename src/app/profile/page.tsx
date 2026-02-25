"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import Header from "@/components/Header";
import UserAvatar from "@/components/UserAvatar";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
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

      const response = await fetch(`/api/profile?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setDisplayName(data.profile.display_name);
        setAvatarUrl(data.profile.avatar_url || "");
      }
      setIsLoading(false);
    };
    init();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !displayName.trim()) return;

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          display_name: displayName.trim(),
          avatar_url: avatarUrl.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setMessage("プロフィールを更新しました");
        // Bug 12: ここでは profiles テーブルのみ更新。
        // Headerで表示される名前は auth.users の user_metadata から取得されるため、
        // ページをリロードしても Header の名前は変わらない
      } else {
        setMessage("更新に失敗しました");
      }
    } catch {
      setMessage("更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div>
      <Header userName={userName} onLogout={handleLogout} />
      <main style={{ maxWidth: "600px", margin: "0 auto", padding: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>
          プロフィール設定
        </h1>
        {isLoading ? (
          <p style={{ textAlign: "center", color: "#888" }}>読み込み中...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <UserAvatar
                displayName={displayName}
                avatarUrl={avatarUrl || undefined}
                size={80}
              />
              <div>
                <p style={{ fontWeight: "bold" }}>{profile?.display_name}</p>
                <p style={{ fontSize: "13px", color: "#888" }}>
                  ロール: {profile?.role === "admin" ? "管理者" : "メンバー"}
                </p>
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}>
                表示名
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}>
                アバターURL
              </label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
              <p style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                画像URLを入力してください（任意）
              </p>
            </div>
            {message && (
              <p style={{
                padding: "8px 12px",
                borderRadius: "6px",
                marginBottom: "16px",
                backgroundColor: message.includes("失敗") ? "#fff5f5" : "#f0fff4",
                color: message.includes("失敗") ? "#e53e3e" : "#38a169",
                fontSize: "14px",
              }}>
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: "10px 24px",
                backgroundColor: isSaving ? "#ccc" : "#4299e1",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: isSaving ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              {isSaving ? "保存中..." : "保存"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
