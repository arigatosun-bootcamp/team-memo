"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Supabase認証（実装時にクライアントを直接使用）
      const { supabase } = await import("@/lib/supabase");

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("確認メールを送信しました。メールを確認してください。");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "認証に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main
        style={{
          maxWidth: "400px",
          margin: "0 auto",
          padding: "4rem 1.5rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: "2rem",
          }}
        >
          {isSignUp ? "アカウント作成" : "ログイン"}
        </h1>

        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #2563eb",
              borderRadius: "6px",
              padding: "0.75rem 1rem",
              color: "#2563eb",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#64748b",
                fontSize: "0.875rem",
              }}
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@example.com"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#f1f5f9",
                color: "#1e293b",
                fontSize: "1rem",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#64748b",
                fontSize: "0.875rem",
              }}
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="6文字以上"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#f1f5f9",
                color: "#1e293b",
                fontSize: "1rem",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: "0.75rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "white",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
              marginTop: "0.5rem",
            }}
          >
            {isLoading
              ? "処理中..."
              : isSignUp
                ? "アカウント作成"
                : "ログイン"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            color: "#64748b",
            fontSize: "0.875rem",
          }}
        >
          {isSignUp ? "既にアカウントをお持ちの方は" : "アカウントをお持ちでない方は"}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              background: "none",
              border: "none",
              color: "#2563eb",
              cursor: "pointer",
              fontSize: "0.875rem",
              marginLeft: "0.25rem",
            }}
          >
            {isSignUp ? "ログイン" : "新規登録"}
          </button>
        </p>
      </main>
    </>
  );
}
