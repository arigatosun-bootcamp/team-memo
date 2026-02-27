export type Memo = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  is_private: boolean;
  summary: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
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
  avatar_url: string | null;
  role: "member" | "admin";
  created_at: string;
};

export type Comment = {
  id: string;
  memo_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  user?: Profile;
  replies?: Comment[];
};

export type Bookmark = {
  id: string;
  user_id: string;
  memo_id: string;
  memo: Memo | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: "like" | "comment" | "mention" | "system";
  title: string;
  body: string | null;
  memo_id: string | null;
  actor_id: string | null;
  is_read: boolean;
  created_at: string;
  actor?: Profile;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  created_at: string;
};

export type MemoTag = {
  memo_id: string;
  tag_id: string;
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

export const NOTIFICATION_TYPES: Record<string, string> = {
  like: "いいね",
  comment: "コメント",
  mention: "メンション",
  system: "システム",
};
