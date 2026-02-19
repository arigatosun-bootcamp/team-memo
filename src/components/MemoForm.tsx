"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/types";
import type { Category } from "@/lib/types";

type MemoFormProps = {
  initialTitle?: string;
  initialContent?: string;
  initialCategory?: Category;
  onSubmit: (data: {
    title: string;
    content: string;
    category: Category;
  }) => void;
  isLoading?: boolean;
  submitLabel?: string;
};

export default function MemoForm({
  initialTitle = "",
  initialContent = "",
  initialCategory = "general",
  onSubmit,
  isLoading = false,
  submitLabel = "保存",
}: MemoFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [category, setCategory] = useState<Category>(initialCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, content, category });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <label htmlFor="title" style={{ display: "block", marginBottom: "0.5rem", color: "#a0a0b0" }}>
          タイトル
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="メモのタイトル"
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid #2a2a4a",
            backgroundColor: "#1a1a2e",
            color: "#eee",
            fontSize: "1rem",
          }}
        />
      </div>

      <div>
        <label htmlFor="category" style={{ display: "block", marginBottom: "0.5rem", color: "#a0a0b0" }}>
          カテゴリ
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid #2a2a4a",
            backgroundColor: "#1a1a2e",
            color: "#eee",
            fontSize: "1rem",
          }}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="content" style={{ display: "block", marginBottom: "0.5rem", color: "#a0a0b0" }}>
          本文
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={10}
          placeholder="メモの内容を入力..."
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid #2a2a4a",
            backgroundColor: "#1a1a2e",
            color: "#eee",
            fontSize: "1rem",
            resize: "vertical",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          padding: "0.75rem 1.5rem",
          borderRadius: "6px",
          border: "none",
          backgroundColor: "#e94560",
          color: "white",
          fontSize: "1rem",
          fontWeight: 600,
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.6 : 1,
          alignSelf: "flex-start",
        }}
      >
        {isLoading ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}
