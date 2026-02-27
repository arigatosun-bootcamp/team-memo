/**
 * テキストを指定文字数で切り詰める
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * 日付を表示用にフォーマットする
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * 日時を表示用にフォーマットする
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * カテゴリに対応するバッジのCSSクラスを返す
 */
export function getCategoryBadgeClass(category: string): string {
  const classMap: Record<string, string> = {
    general: "badgeDefault",
    tech: "badgeInfo",
    meeting: "badgeWarning",
    idea: "badgeSuccess",
    other: "badgeDefault",
  };
  return classMap[category] || "badgeDefault";
}

/**
 * HTMLタグをサニタイズする
 */
export function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * URLをサニタイズする（javascript:プロトコル等を除去）
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return "";
  } catch {
    return "";
  }
}

/**
 * 数値を表示用にフォーマットする（1000以上はK表記）
 */
export function formatCount(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "K";
  }
  return String(count);
}

/**
 * 日時を相対表示する（「3分前」「2時間前」「昨日」など）
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "たった今";
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  return formatDate(dateString);
}

/**
 * タグ名を正規化する（小文字に変換）
 */
export function normalizeTag(tagName: string): string {
  return tagName.trim().toLowerCase();
}

/**
 * メモを日付ごとにグループ化する（統計用）
 */
export function groupByDate(items: { created_at: string }[]): Record<string, number> {
  const groups: Record<string, number> = {};
  for (const item of items) {
    const dateKey = new Date(item.created_at).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });
    groups[dateKey] = (groups[dateKey] || 0) + 1;
  }
  return groups;
}
