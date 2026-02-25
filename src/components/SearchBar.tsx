"use client";

import { useState, useEffect } from "react";
import { CATEGORIES } from "@/lib/types";
import type { Tag } from "@/lib/types";

type SearchBarProps = {
  onSearch: (query: string, category: string, tag?: string) => void;
  initialQuery?: string;
  initialCategory?: string;
};

export default function SearchBar({
  onSearch,
  initialQuery = "",
  initialCategory = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [selectedTag, setSelectedTag] = useState("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch("/api/tags");
        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data.tags || []);
        }
      } catch {
        // エラー時は何もしない
      }
    };
    fetchTags();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, category, selectedTag || undefined);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        gap: "0.75rem",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="キーワードで検索..."
        style={{
          flex: 1,
          minWidth: "200px",
          padding: "0.625rem 1rem",
          borderRadius: "6px",
          border: "1px solid #2a2a4a",
          backgroundColor: "#1a1a2e",
          color: "#eee",
          fontSize: "0.875rem",
        }}
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        style={{
          padding: "0.625rem 1rem",
          borderRadius: "6px",
          border: "1px solid #2a2a4a",
          backgroundColor: "#1a1a2e",
          color: "#eee",
          fontSize: "0.875rem",
        }}
      >
        <option value="">すべてのカテゴリ</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>
      <select
        value={selectedTag}
        onChange={(e) => setSelectedTag(e.target.value)}
        style={{
          padding: "0.625rem 1rem",
          borderRadius: "6px",
          border: "1px solid #2a2a4a",
          backgroundColor: "#1a1a2e",
          color: "#eee",
          fontSize: "0.875rem",
        }}
      >
        <option value="">すべてのタグ</option>
        {/* Bug 14（部分）: タグ名をそのまま value に設定。
            URLパラメータとして送信時に大文字小文字が区別される */}
        {availableTags.map((tag) => (
          <option key={tag.id} value={tag.name}>
            #{tag.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        style={{
          padding: "0.625rem 1.25rem",
          borderRadius: "6px",
          border: "none",
          backgroundColor: "#e94560",
          color: "white",
          fontSize: "0.875rem",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        検索
      </button>
    </form>
  );
}
