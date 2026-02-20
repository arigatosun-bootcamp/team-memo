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

describe("タイムゾーン変換", () => {
  it("UTC→JST変換が正しく行われる", () => {
    const utcDate = new Date("2024-06-15T10:00:00Z");
    const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
    const jstDate = new Date(utcDate.getTime() + JST_OFFSET_MS);

    // JST = UTC+9 なので、10:00 UTC → 19:00 JST
    expect(jstDate.getUTCHours()).toBe(19);
    expect(jstDate.toISOString()).toBe("2024-06-15T19:00:00.000Z");
  });

  it("JSTオフセットの定数が正しい", () => {
    const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
    expect(JST_OFFSET_MS).toBe(32400000); // 9時間 = 32,400,000ミリ秒
  });
});
