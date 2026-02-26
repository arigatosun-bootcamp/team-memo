"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import Header from "@/components/Header";
import UserAvatar from "@/components/UserAvatar";

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | undefined>();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.display_name);
      }

      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("このユーザーを削除しますか？この操作は取り消せません。")) return;

    const response = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });

    if (response.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } else {
      alert("ユーザーの削除に失敗しました");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div>
      <Header userName={userName} onLogout={handleLogout} />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>
          管理者パネル
        </h1>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#f7fafc",
              borderBottom: "1px solid #e2e8f0",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr auto",
              gap: "16px",
              fontWeight: "bold",
              fontSize: "13px",
              color: "#94a3b8",
            }}
          >
            <span>ユーザー</span>
            <span>ロール</span>
            <span>登録日</span>
            <span>操作</span>
          </div>
          {isLoading ? (
            <p style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
              読み込み中...
            </p>
          ) : users.length === 0 ? (
            <p style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
              ユーザーがいません
            </p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #f0f0f0",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr auto",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <UserAvatar displayName={user.display_name} avatarUrl={user.avatar_url} size={32} />
                  <span style={{ fontSize: "14px" }}>{user.display_name}</span>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    backgroundColor: user.role === "admin" ? "#fed7d7" : "#e2e8f0",
                    color: user.role === "admin" ? "#dc2626" : "#94a3b8",
                    display: "inline-block",
                    width: "fit-content",
                  }}
                >
                  {user.role === "admin" ? "管理者" : "メンバー"}
                </span>
                <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                  {new Date(user.created_at).toLocaleDateString("ja-JP")}
                </span>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  style={{
                    padding: "4px 12px",
                    backgroundColor: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  削除
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
