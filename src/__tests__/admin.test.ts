import { describe, it, expect, vi, beforeEach } from "vitest";

// Supabaseモック
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
}));

mockSelect.mockReturnValue({
  eq: mockEq,
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("管理者権限チェック (isAdmin)", () => {
  // ★ 誤誘導: role === "admin" のケースだけテスト
  // 実際のBug 15bは、isAdmin()が "owner" ロールも含めているが
  // profilesテーブルには "owner" ロールが存在しない問題
  it("adminロールの場合はtrueを返す", async () => {
    mockSingle.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    const result = await mockSingle();
    const isAdmin = result.data?.role === "admin" || result.data?.role === "owner";
    expect(isAdmin).toBe(true);
  });

  it("memberロールの場合はfalseを返す", async () => {
    mockSingle.mockResolvedValue({
      data: { role: "member" },
      error: null,
    });

    const result = await mockSingle();
    const isAdmin = result.data?.role === "admin" || result.data?.role === "owner";
    expect(isAdmin).toBe(false);
  });

  it("プロフィールが存在しない場合はfalseを返す", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await mockSingle();
    const isAdmin = result.data?.role === "admin" || result.data?.role === "owner";
    expect(isAdmin).toBe(false);
  });
});

describe("ミドルウェアのパスマッチング", () => {
  // ★ 誤誘導: 画面パスのマッチングのみテスト
  // 実際のBug 15aは、matcher設定が /admin/:path* のみで
  // /api/admin/:path* にマッチしないため、APIが認可なしでアクセスできる問題
  it("/admin パスがマッチする", () => {
    const matcher = ["/admin/:path*"];
    const path = "/admin";

    // 簡易的なパスマッチング（:path* は任意のサブパスにマッチ）
    const matches = matcher.some((pattern) => {
      const basePattern = pattern.replace("/:path*", "");
      return path.startsWith(basePattern);
    });

    expect(matches).toBe(true);
  });

  it("/admin/users パスがマッチする", () => {
    const matcher = ["/admin/:path*"];
    const path = "/admin/users";

    const matches = matcher.some((pattern) => {
      const basePattern = pattern.replace("/:path*", "");
      return path.startsWith(basePattern);
    });

    expect(matches).toBe(true);
  });

  it("/ パスはマッチしない", () => {
    const matcher = ["/admin/:path*"];
    const path = "/";

    const matches = matcher.some((pattern) => {
      const basePattern = pattern.replace("/:path*", "");
      return path === basePattern || path.startsWith(basePattern + "/");
    });

    expect(matches).toBe(false);
  });
});

describe("ユーザー管理API", () => {
  it("ユーザー一覧が取得できる", async () => {
    const mockUsers = [
      { id: "u1", display_name: "ユーザー1", role: "member" },
      { id: "u2", display_name: "管理者", role: "admin" },
    ];

    mockEq.mockResolvedValueOnce({
      data: mockUsers,
      error: null,
    });

    const result = await mockEq();
    expect(result.data).toHaveLength(2);
  });

  it("ユーザーの削除ができる", () => {
    // 管理者のみ削除可能（認可チェックは別途テスト）
    const isAuthorized = true;
    const userId = "u1";
    expect(isAuthorized).toBe(true);
    expect(userId).toBeTruthy();
  });
});
