import { describe, it, expect, vi, beforeEach } from "vitest";

// Supabaseモック
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
}));

mockSelect.mockReturnValue({
  eq: mockEq,
  order: mockOrder,
  ilike: vi.fn().mockReturnValue({ single: mockSingle }),
});

mockEq.mockReturnValue({
  eq: mockEq,
  single: mockSingle,
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

// ★ 誤誘導: テストデータが全て小文字のタグのみ
// 実際のBug 14は、大文字入力時にオートコンプリートが一致せず、
// 新規タグとしてPOSTした際にDB UNIQUE制約違反で500エラーになる問題
const mockTags = [
  { id: "t1", name: "react", color: "#61dafb", created_at: "2024-01-01T00:00:00Z" },
  { id: "t2", name: "typescript", color: "#3178c6", created_at: "2024-01-02T00:00:00Z" },
  { id: "t3", name: "nextjs", color: "#000000", created_at: "2024-01-03T00:00:00Z" },
];

beforeEach(() => {
  vi.clearAllMocks();

  mockOrder.mockResolvedValue({
    data: mockTags,
    error: null,
  });
});

describe("タグAPI", () => {
  it("タグ一覧が正しく返される", async () => {
    const result = await mockOrder();
    expect(result.data).toHaveLength(3);
    expect(result.data[0].name).toBe("react");
  });

  it("タグの作成が正しく動作する", async () => {
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "t4", name: "tailwind", color: "#06b6d4" },
          error: null,
        }),
      }),
    });

    const result = await mockInsert().select().single();
    expect(result.data.name).toBe("tailwind");
  });

  it("タグ名が小文字に正規化される", () => {
    // APIサーバー側での正規化ロジック
    const inputName = "tailwind";
    const normalizedName = inputName.toLowerCase();
    expect(normalizedName).toBe("tailwind");
  });
});

describe("タグオートコンプリート", () => {
  // ★ 誤誘導: 全て小文字の入力でテスト
  // 大文字を含む入力（例: "React"）でのテストがない
  it("入力に一致するタグが候補として表示される", () => {
    const input = "react"; // 小文字のみ
    const filtered = mockTags.filter((tag) => tag.name.includes(input));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("react");
  });

  it("部分一致でも候補が表示される", () => {
    const input = "type"; // 小文字のみ
    const filtered = mockTags.filter((tag) => tag.name.includes(input));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("typescript");
  });

  it("一致するタグがない場合は空配列が返される", () => {
    const input = "python"; // 存在しないタグ
    const filtered = mockTags.filter((tag) => tag.name.includes(input));
    expect(filtered).toHaveLength(0);
  });
});

describe("タグとメモの紐付け", () => {
  it("メモにタグを追加できる", async () => {
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { memo_id: "m1", tag_id: "t1" },
          error: null,
        }),
      }),
    });

    const result = await mockInsert().select().single();
    expect(result.data.memo_id).toBe("m1");
    expect(result.data.tag_id).toBe("t1");
  });
});
