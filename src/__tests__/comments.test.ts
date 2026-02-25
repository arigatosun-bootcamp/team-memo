import { describe, it, expect, vi, beforeEach } from "vitest";

// Supabaseモック
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  delete: mockDelete,
  update: mockUpdate,
}));

mockSelect.mockReturnValue({
  eq: mockEq,
  order: mockOrder,
  is: vi.fn().mockReturnValue({ order: mockOrder }),
});

mockEq.mockReturnValue({
  eq: mockEq,
  order: mockOrder,
  single: mockSingle,
  select: mockSelect,
});

mockOrder.mockReturnValue({
  eq: mockEq,
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

// テストデータ: parent_idなし（返信なし）のコメントのみ
// ※ 誤誘導: 返信付きコメント（parent_id あり）のテストケースが存在しない
const mockComments = [
  {
    id: "c1",
    memo_id: "m1",
    user_id: "u1",
    content: "コメント1",
    parent_id: null,
    created_at: "2024-01-01T10:00:00Z",
  },
  {
    id: "c2",
    memo_id: "m1",
    user_id: "u2",
    content: "コメント2",
    parent_id: null,
    created_at: "2024-01-01T11:00:00Z",
  },
];

beforeEach(() => {
  vi.clearAllMocks();

  mockOrder.mockResolvedValue({
    data: mockComments,
    error: null,
  });

  mockSingle.mockResolvedValue({
    data: { id: "m1", comments_count: 2 },
    error: null,
  });
});

describe("コメントAPI", () => {
  it("コメント一覧が正しく返される", async () => {
    const result = await mockOrder();
    expect(result.data).toHaveLength(2);
    expect(result.data[0].content).toBe("コメント1");
  });

  it("コメントの各項目に必要なフィールドがある", async () => {
    const result = await mockOrder();
    const comment = result.data[0];
    expect(comment).toHaveProperty("id");
    expect(comment).toHaveProperty("memo_id");
    expect(comment).toHaveProperty("user_id");
    expect(comment).toHaveProperty("content");
    expect(comment).toHaveProperty("parent_id");
    expect(comment).toHaveProperty("created_at");
  });

  it("コメント追加後にcomments_countが更新される", async () => {
    // コメントを追加
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "c3", content: "新しいコメント", parent_id: null },
          error: null,
        }),
      }),
    });

    // メモのcomments_countを更新
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: { comments_count: 3 },
        error: null,
      }),
    });

    const insertResult = await mockInsert().select().single();
    expect(insertResult.data.content).toBe("新しいコメント");
  });

  // ★ 誤誘導テスト: parent_idなしのコメント削除のみテスト
  // 実際のBug 9は「返信付きコメントを削除した時にCASCADEでカウントがずれる」問題
  it("コメント削除後にcomments_countが1つ減る", async () => {
    const currentCount = 2;
    const deleteCount = 1; // 削除するコメント数（常に1と仮定）
    const newCount = currentCount - deleteCount;

    expect(newCount).toBe(1);
  });

  it("存在しないコメントの削除はエラーになる", async () => {
    mockDelete.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "コメントが見つかりません" },
        }),
      }),
    });

    const result = await mockDelete().eq("id", "non-existent").eq("memo_id", "m1");
    expect(result.error).toBeTruthy();
  });
});

describe("コメントのカウント管理", () => {
  it("コメント追加でカウントがインクリメントされる", () => {
    const currentCount = 5;
    const newCount = currentCount + 1;
    expect(newCount).toBe(6);
  });

  it("コメント削除でカウントがデクリメントされる", () => {
    // ★ 誤誘導: 常に1だけデクリメント。返信の連鎖削除は考慮していない
    const currentCount = 5;
    const newCount = currentCount - 1;
    expect(newCount).toBe(4);
  });
});
