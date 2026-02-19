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
