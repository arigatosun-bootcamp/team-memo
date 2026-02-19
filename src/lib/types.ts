export type Memo = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  is_private: boolean;
  summary: string | null;
  likes_count: number;
  created_at: string;
  updated_at: string;
};

export type Like = {
  id: string;
  user_id: string;
  memo_id: string;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string;
  created_at: string;
};

export type MemoListResponse = {
  memos: Memo[];
  total: number;
};

export type Category = "general" | "tech" | "meeting" | "idea" | "other";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "general", label: "一般" },
  { value: "tech", label: "技術" },
  { value: "meeting", label: "議事録" },
  { value: "idea", label: "アイデア" },
  { value: "other", label: "その他" },
];
