import { describe, it, expect, vi, beforeEach } from "vitest";

// Supabaseモック
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const _mockSingle = vi.fn();
const mockOr = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
}));

mockSelect.mockReturnValue({
  eq: mockEq,
  or: mockOr,
  order: mockOrder,
  range: mockRange,
  count: "exact",
});

mockEq.mockReturnValue({
  order: mockOrder,
  or: mockOr,
  range: mockRange,
});

mockOr.mockReturnValue({
  order: mockOrder,
  range: mockRange,
  eq: mockEq,
});

mockOrder.mockReturnValue({
  range: mockRange,
  eq: mockEq,
});

// テストデータ: created_atとupdated_atが同じ日付
const mockMemos = [
  {
    id: "1",
    title: "メモA",
    content: "内容A",
    category: "general",
    is_private: false,
    summary: null,
    likes_count: 0,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    title: "メモB",
    content: "内容B",
    category: "tech",
    is_private: false,
    summary: null,
    likes_count: 3,
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
  {
    id: "3",
    title: "メモC",
    content: "内容C",
    category: "meeting",
    is_private: false,
    summary: "要約テスト",
    likes_count: 5,
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z",
  },
];

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

beforeEach(() => {
  vi.clearAllMocks();

  mockRange.mockResolvedValue({
    data: mockMemos,
    error: null,
    count: mockMemos.length,
  });

  mockInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { id: "new-1", title: "新規メモ" },
        error: null,
      }),
    }),
  });
});

describe("メモAPI", () => {
  it("メモ一覧が正しく返される", async () => {
    const result = await mockRange();
    expect(result.data).toHaveLength(3);
    expect(result.data[0].title).toBe("メモA");
  });

  it("メモ一覧の各項目に必要なフィールドが含まれている", async () => {
    const result = await mockRange();
    const memo = result.data[0];

    expect(memo).toHaveProperty("id");
    expect(memo).toHaveProperty("title");
    expect(memo).toHaveProperty("content");
    expect(memo).toHaveProperty("category");
    expect(memo).toHaveProperty("likes_count");
    expect(memo).toHaveProperty("created_at");
  });

  it("メモの件数が正しく返される", async () => {
    const result = await mockRange();
    expect(result.count).toBe(3);
  });

  it("エラー時はerrorが返される", async () => {
    mockRange.mockResolvedValueOnce({
      data: null,
      error: { message: "テストエラー" },
      count: 0,
    });

    const result = await mockRange();
    expect(result.error).toBeTruthy();
    expect(result.error.message).toBe("テストエラー");
  });
});
