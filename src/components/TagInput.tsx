"use client";

import { useState, useEffect } from "react";
import type { Tag } from "@/lib/types";
import TagBadge from "./TagBadge";

type TagInputProps = {
  memoId?: string;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
};

export default function TagInput({ selectedTags, onTagsChange }: TagInputProps) {
  const [input, setInput] = useState("");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch("/api/tags");
        if (response.ok) {
          const data = await response.json();
          setAllTags(data.tags || []);
        }
      } catch {
        // エラー時は何もしない
      }
    };
    fetchTags();
  }, []);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.trim()) {
      const normalizedValue = value.trim().toLowerCase();
      const filtered = allTags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(normalizedValue) &&
          !selectedTags.some((t) => t.id === tag.id)
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectTag = (tag: Tag) => {
    onTagsChange([...selectedTags, tag]);
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleCreateTag = async () => {
    if (!input.trim()) return;

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: input.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        onTagsChange([...selectedTags, data.tag]);
        setAllTags([...allTags, data.tag]);
        setInput("");
        setShowSuggestions(false);
      } else {
        // Bug 14: UNIQUE制約エラーが500で返ってくるため、
        // ユーザーには「タグの作成に失敗しました」と表示される
        const error = await response.json();
        alert(`タグの作成に失敗しました: ${error.error}`);
      }
    } catch {
      alert("タグの作成に失敗しました");
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelectTag(suggestions[0]);
      } else if (input.trim()) {
        handleCreateTag();
      }
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          padding: "8px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          minHeight: "40px",
          alignItems: "center",
        }}
      >
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag.id}
            name={tag.name}
            color={tag.color}
            removable
            onRemove={() => handleRemoveTag(tag.id)}
          />
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={selectedTags.length === 0 ? "タグを追加..." : ""}
          style={{
            border: "none",
            outline: "none",
            flex: 1,
            minWidth: "100px",
            fontSize: "14px",
          }}
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderRadius: "6px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            zIndex: 10,
            maxHeight: "200px",
            overflow: "auto",
          }}
        >
          {suggestions.map((tag) => (
            <div
              key={tag.id}
              onClick={() => handleSelectTag(tag)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderBottom: "1px solid #f0f0f0",
                fontSize: "14px",
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <TagBadge name={tag.name} color={tag.color} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
