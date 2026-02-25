import { describe, it, expect, vi, beforeEach } from "vitest";

// Supabaseモック
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

const mockFrom = vi.fn(() => ({
  insert: mockInsert,
  select: mockSelect,
}));

mockSelect.mockReturnValue({
  eq: mockEq,
  order: mockOrder,
});

mockEq.mockReturnValue({
  eq: mockEq,
  order: mockOrder,
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("通知生成", () => {
  // ★ 誤誘導: actorIdが別ユーザーのケースのみテスト
  // 実際のBug 11は、actorId === userIdのチェックがないため自己通知が発生する問題
  it("いいねで通知が作成される（別ユーザーの場合）", async () => {
    const userId = "user-1"; // メモの作成者
    const actorId = "user-2"; // いいねした人

    // 通知を作成（別ユーザーからのいいね）
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "n1",
            user_id: userId,
            actor_id: actorId,
            type: "like",
            title: "メモにいいねが付きました",
          },
          error: null,
        }),
      }),
    });

    const result = await mockInsert().select().single();
    expect(result.data.user_id).toBe("user-1");
    expect(result.data.actor_id).toBe("user-2");
    expect(result.data.type).toBe("like");
  });

  it("コメントで通知が作成される（別ユーザーの場合）", async () => {
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "n2",
            user_id: "user-1",
            actor_id: "user-3",
            type: "comment",
            title: "メモにコメントが付きました",
          },
          error: null,
        }),
      }),
    });

    const result = await mockInsert().select().single();
    expect(result.data.type).toBe("comment");
    expect(result.data.actor_id).not.toBe(result.data.user_id);
  });
});

describe("通知一覧取得", () => {
  it("通知一覧が日付降順で返される", async () => {
    const mockNotifications = [
      { id: "n2", created_at: "2024-01-02T00:00:00Z", is_read: false },
      { id: "n1", created_at: "2024-01-01T00:00:00Z", is_read: true },
    ];

    mockOrder.mockResolvedValue({
      data: mockNotifications,
      error: null,
    });

    const result = await mockOrder();
    expect(result.data).toHaveLength(2);
    expect(result.data[0].id).toBe("n2");
  });

  it("未読通知数が正しく計算される", () => {
    const notifications = [
      { id: "n1", is_read: false },
      { id: "n2", is_read: false },
      { id: "n3", is_read: true },
    ];

    const unreadCount = notifications.filter((n) => !n.is_read).length;
    expect(unreadCount).toBe(2);
  });
});

describe("NotificationBellのポーリング", () => {
  // ★ 誤誘導: setIntervalの基本的な動作のみテスト
  // 実際のBug 11は、fetchUnreadCountがuseCallbackで包まれていないため
  // useEffectの依存配列が再レンダリングごとに変わり、重複インターバルが作成される問題
  it("5秒間隔でポーリングが設定される", () => {
    const setIntervalSpy = vi.spyOn(global, "setInterval");
    const callback = vi.fn();
    const interval = setInterval(callback, 5000);

    expect(setIntervalSpy).toHaveBeenCalledWith(callback, 5000);

    clearInterval(interval);
    setIntervalSpy.mockRestore();
  });
});
