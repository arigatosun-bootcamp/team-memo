"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "こんにちは！TeamMemoの社内アシスタントです。メモの使い方や社内ナレッジについて、お気軽にご質問ください。",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "エラーが発生しました");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `エラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* フローティングボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          fontSize: "1.5rem",
          cursor: "pointer",
          boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s, box-shadow 0.2s",
          zIndex: 1000,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow =
            "0 6px 20px rgba(102, 126, 234, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow =
            "0 4px 15px rgba(102, 126, 234, 0.4)";
        }}
        aria-label="チャットボットを開く"
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* チャットパネル */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "5rem",
            right: "1.5rem",
            width: "380px",
            maxHeight: "520px",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            zIndex: 999,
            animation: "slideUp 0.3s ease-out",
          }}
        >
          {/* ヘッダー */}
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
              }}
            >
              🤖
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  color: "white",
                  fontSize: "0.95rem",
                }}
              >
                社内アシスタント
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                Powered by Gemini AI
              </div>
            </div>
          </div>

          {/* メッセージエリア */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1rem",
              backgroundColor: "#0f0f23",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              maxHeight: "350px",
              minHeight: "250px",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "0.6rem 0.9rem",
                    borderRadius:
                      msg.role === "user"
                        ? "12px 12px 2px 12px"
                        : "12px 12px 12px 2px",
                    backgroundColor:
                      msg.role === "user" ? "#667eea" : "#1a1a2e",
                    color: msg.role === "user" ? "white" : "#eee",
                    fontSize: "0.875rem",
                    lineHeight: 1.5,
                    border:
                      msg.role === "assistant"
                        ? "1px solid #2a2a4a"
                        : "none",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "0.6rem 0.9rem",
                    borderRadius: "12px 12px 12px 2px",
                    backgroundColor: "#1a1a2e",
                    border: "1px solid #2a2a4a",
                    fontSize: "0.875rem",
                    color: "#a0a0b0",
                  }}
                >
                  <span className="typing-dots">考え中...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 入力エリア */}
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: "#16213e",
              borderTop: "1px solid #2a2a4a",
              display: "flex",
              gap: "0.5rem",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "0.6rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid #2a2a4a",
                backgroundColor: "#0f0f23",
                color: "#eee",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{
                padding: "0.6rem 1rem",
                borderRadius: "8px",
                border: "none",
                background:
                  isLoading || !input.trim()
                    ? "#2a2a4a"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: isLoading || !input.trim() ? "#666" : "white",
                cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
                transition: "opacity 0.2s",
              }}
            >
              送信
            </button>
          </div>
        </div>
      )}

    </>
  );
}
