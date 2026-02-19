"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/types";

type SearchBarProps = {
  onSearch: (query: string, category: string) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, category);
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
