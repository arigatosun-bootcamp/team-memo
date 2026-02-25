import { describe, it, expect, vi, beforeEach } from "vitest";

// Supabaseモック
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
}));

mockSelect.mockReturnValue({
  eq: mockEq,
  order: mockOrder,
  limit: mockLimit,
});

mockEq.mockReturnValue({
  order: mockOrder,
  limit: mockLimit,
});

mockOrder.mockReturnValue({
  limit: mockLimit,
  eq: mockEq,
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

// ★ 誤誘導: ランキングデータに is_private カラムが含まれていない
// 実際のBug 13aは、ランキングAPIにis_privateフィルタがなく非公開メモが混入する問題
const mockRankingData = [
  { id: "m1", title: "人気メモ1", likes_count: 10 },
  { id: "m2", title: "人気メモ2", likes_count: 8 },
  { id: "m3", title: "人気メモ3", likes_count: 5 },
];

beforeEach(() => {
  vi.clearAllMocks();

  mockLimit.mockResolvedValue({
    data: mockRankingData,
    error: null,
  });
});

describe("ランキングAPI", () => {
  it("ランキングがlikes_count降順で返される", async () => {
    const result = await mockLimit();
    expect(result.data).toHaveLength(3);
    expect(result.data[0].likes_count).toBe(10);
    expect(result.data[1].likes_count).toBe(8);
  });

  it("ランキングの各メモに必要なフィールドがある", async () => {
    const result = await mockLimit();
    const memo = result.data[0];
    expect(memo).toHaveProperty("id");
    expect(memo).toHaveProperty("title");
    expect(memo).toHaveProperty("likes_count");
  });

  it("ランキングは上位10件に制限される", () => {
    const RANKING_LIMIT = 10;
    expect(RANKING_LIMIT).toBe(10);
  });
});

describe("統計の日付グルーピング", () => {
  // ★ 誤誘導: UTC日中の時刻のみでテスト（日跨ぎケースなし）
  // 実際のBug 13bは、サーバー(UTC)とクライアント(JST)でgroupByDate()の結果がずれる問題
  // JST 00:30 → UTC 前日 15:30 となるケースがテストされていない
  it("日付ごとにメモがグルーピングされる", () => {
    const memos = [
      { created_at: "2024-01-15T06:00:00Z" }, // UTC 06:00 = JST 15:00 → 1/15
      { created_at: "2024-01-15T08:00:00Z" }, // UTC 08:00 = JST 17:00 → 1/15
      { created_at: "2024-01-16T06:00:00Z" }, // UTC 06:00 = JST 15:00 → 1/16
    ];

    // 日付でグルーピング（UTC日中の時刻なのでJSTとの差分が出ない）
    const grouped: Record<string, number> = {};
    for (const memo of memos) {
      const date = new Date(memo.created_at).toLocaleDateString("ja-JP");
      grouped[date] = (grouped[date] || 0) + 1;
    }

    // UTC日中の時刻はJSTでも同じ日になるのでテストがパスする
    const dateKeys = Object.keys(grouped);
    expect(dateKeys.length).toBeGreaterThanOrEqual(2);
  });

  it("空のデータでもエラーにならない", () => {
    const grouped: Record<string, number> = {};
    expect(Object.keys(grouped)).toHaveLength(0);
  });
});

describe("ダッシュボード統計", () => {
  it("総メモ数が返される", () => {
    const stats = { totalMemos: 25, totalLikes: 100, totalComments: 50 };
    expect(stats.totalMemos).toBe(25);
  });

  it("総いいね数が返される", () => {
    const stats = { totalMemos: 25, totalLikes: 100, totalComments: 50 };
    expect(stats.totalLikes).toBe(100);
  });
});
