import { describe, it, expect, vi, beforeEach } from "vitest";

// Supabaseモック
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  delete: mockDelete,
}));

mockSelect.mockReturnValue({
  eq: mockEq,
  order: mockOrder,
});

mockEq.mockReturnValue({
  eq: mockEq,
  single: mockSingle,
  order: mockOrder,
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

// ★ 誤誘導: テストデータでmemoが常に存在する
// 実際のBug 10は、RLSで他ユーザーの非公開メモがnullになりランタイムエラーが出る問題
const mockBookmarks = [
  {
    id: "b1",
    user_id: "u1",
    memo_id: "m1",
    created_at: "2024-01-01T00:00:00Z",
    memo: {
      id: "m1",
      title: "テストメモ1",
      content: "内容1",
      category: "general",
      is_private: false,
      likes_count: 3,
      created_at: "2024-01-01T00:00:00Z",
    },
  },
  {
    id: "b2",
    user_id: "u1",
    memo_id: "m2",
    created_at: "2024-01-02T00:00:00Z",
    memo: {
      id: "m2",
      title: "テストメモ2",
      content: "内容2",
      category: "tech",
      is_private: false,
      likes_count: 5,
      created_at: "2024-01-02T00:00:00Z",
    },
  },
];

beforeEach(() => {
  vi.clearAllMocks();

  mockOrder.mockResolvedValue({
    data: mockBookmarks,
    error: null,
  });
});

describe("ブックマークAPI", () => {
  it("ブックマーク一覧が正しく返される", async () => {
    const result = await mockOrder();
    expect(result.data).toHaveLength(2);
  });

  it("ブックマークにメモ情報が含まれている", async () => {
    const result = await mockOrder();
    const bookmark = result.data[0];
    // ★ 誤誘導: memoが常に存在するテストデータなので、memo.titleアクセスは成功する
    expect(bookmark.memo).toBeTruthy();
    expect(bookmark.memo.title).toBe("テストメモ1");
  });

  it("ブックマークの追加が正しく動作する", async () => {
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "b3", user_id: "u1", memo_id: "m3" },
          error: null,
        }),
      }),
    });

    const result = await mockInsert().select().single();
    expect(result.data.memo_id).toBe("m3");
  });

  it("ブックマークの削除が正しく動作する", async () => {
    mockDelete.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    });

    const result = await mockDelete().eq("user_id", "u1").eq("memo_id", "m1");
    expect(result.error).toBeNull();
  });

  it("重複ブックマークはエラーになる", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "b1" },
      error: null,
    });

    const existing = await mockSingle();
    expect(existing.data).toBeTruthy();
  });
});

describe("BookmarkButton状態チェック", () => {
  it("ブックマーク状態の初期チェックが実行される", async () => {
    // ★ 誤誘導: useEffectの依存配列にuserIdが欠けている問題をテストしていない
    // テストではfetchモックが呼ばれることだけ確認
    const mockCheckBookmark = vi.fn().mockResolvedValue({ isBookmarked: false });
    await mockCheckBookmark("m1", "u1");
    expect(mockCheckBookmark).toHaveBeenCalledWith("m1", "u1");
  });
});
