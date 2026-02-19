import { describe, it, expect } from "vitest";
import {
  truncateText,
  formatDate,
  getCategoryBadgeClass,
  sanitizeHtml,
} from "@/lib/utils";

describe("truncateText", () => {
  it("指定文字数以下のテキストはそのまま返す", () => {
    expect(truncateText("短いテキスト", 20)).toBe("短いテキスト");
  });

  it("指定文字数を超えるテキストは切り詰めて...を付ける", () => {
    const longText = "あ".repeat(30);
    const result = truncateText(longText, 10);
    expect(result).toBe("あ".repeat(10) + "...");
  });

  it("空文字列はそのまま返す", () => {
    expect(truncateText("", 10)).toBe("");
  });
});

describe("formatDate", () => {
  it("日付文字列をyyyy/MM/dd形式で返す", () => {
    const result = formatDate("2024-06-15T10:30:00Z");
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/06/);
    expect(result).toMatch(/15/);
  });
});

describe("getCategoryBadgeClass", () => {
  it("techカテゴリはbadgeInfoを返す", () => {
    expect(getCategoryBadgeClass("tech")).toBe("badgeInfo");
  });

  it("meetingカテゴリはbadgeWarningを返す", () => {
    expect(getCategoryBadgeClass("meeting")).toBe("badgeWarning");
  });

  it("ideaカテゴリはbadgeSuccessを返す", () => {
    expect(getCategoryBadgeClass("idea")).toBe("badgeSuccess");
  });

  it("不明なカテゴリはbadgeDefaultを返す", () => {
    expect(getCategoryBadgeClass("unknown")).toBe("badgeDefault");
  });
});

describe("sanitizeHtml", () => {
  it("HTMLタグをエスケープする", () => {
    expect(sanitizeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;"
    );
  });

  it("通常のテキストはそのまま返す", () => {
    expect(sanitizeHtml("普通のテキスト")).toBe("普通のテキスト");
  });

  it("ダブルクォートをエスケープする", () => {
    expect(sanitizeHtml('"hello"')).toBe("&quot;hello&quot;");
  });
});
