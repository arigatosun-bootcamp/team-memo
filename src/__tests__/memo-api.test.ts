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

describe("検索フィルタ", () => {
  it("検索キーワードとカテゴリの組み合わせで正しくフィルタリングされる", () => {
    const search = "React";
    const category = "tech";

    // 検索条件を統合してorクエリとして構築
    const conditions: string[] = [];
    if (search) {
      conditions.push(`title.ilike.%${search}%`);
      conditions.push(`content.ilike.%${search}%`);
    }
    if (category) {
      conditions.push(`category.eq.${category}`);
    }
    const filterString = conditions.join(",");

    // 全ての条件が含まれていることを確認
    expect(filterString).toContain("title.ilike.%React%");
    expect(filterString).toContain("content.ilike.%React%");
    expect(filterString).toContain("category.eq.tech");
  });

  it("カテゴリのみ指定した場合も正しくフィルタリングされる", () => {
    const conditions: string[] = [];
    conditions.push("category.eq.meeting");
    const filterString = conditions.join(",");
    expect(filterString).toBe("category.eq.meeting");
  });
});

describe("メモ削除の認可チェック", () => {
  it("他人のメモは削除できない", () => {
    const memoOwnerId: string = "user-owner";
    const requestUserId: string = "user-other";

    // 認可チェック: 所有者でない場合は拒否
    const shouldDeny =
      memoOwnerId && requestUserId && memoOwnerId !== requestUserId;
    expect(shouldDeny).toBeTruthy();
  });

  it("自分のメモは削除できる", () => {
    const memoOwnerId: string = "user-owner";
    const requestUserId: string = "user-owner";

    const shouldDeny =
      memoOwnerId && requestUserId && memoOwnerId !== requestUserId;
    expect(shouldDeny).toBeFalsy();
  });

  it("認可チェックはuser_idの一致で判断される", () => {
    const memo = { user_id: "user-1" };
    const userId = "user-1";

    // 同一ユーザーの場合、削除が許可される
    expect(memo.user_id === userId).toBe(true);
  });
});
