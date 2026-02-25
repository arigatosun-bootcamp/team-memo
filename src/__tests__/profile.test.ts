import { describe, it, expect, vi, beforeEach } from "vitest";

// Supabaseモック
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
}));

mockSelect.mockReturnValue({
  eq: mockEq,
});

mockEq.mockReturnValue({
  eq: mockEq,
  single: mockSingle,
});

mockUpdate.mockReturnValue({
  eq: mockEq,
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "u1", user_metadata: { display_name: "テストユーザー" } } },
      }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));

const mockProfile = {
  id: "u1",
  display_name: "テストユーザー",
  avatar_url: "https://example.com/avatar.jpg",
  role: "member",
  created_at: "2024-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();

  mockSingle.mockResolvedValue({
    data: mockProfile,
    error: null,
  });
});

describe("プロフィールAPI", () => {
  it("プロフィールが正しく取得される", async () => {
    const result = await mockSingle();
    expect(result.data.display_name).toBe("テストユーザー");
    expect(result.data.avatar_url).toBe("https://example.com/avatar.jpg");
  });

  // ★ 誤誘導: profilesテーブルの更新のみ検証
  // 実際のBug 12は、auth.usersのuser_metadataも同時に更新しないと
  // Headerやコメント表示で古い名前が表示され続ける問題
  it("プロフィール更新が正しく動作する", async () => {
    const updatedProfile = {
      ...mockProfile,
      display_name: "新しい名前",
    };

    mockSingle.mockResolvedValueOnce({
      data: updatedProfile,
      error: null,
    });

    // profilesテーブルの更新を確認
    const result = await mockSingle();
    expect(result.data.display_name).toBe("新しい名前");
  });

  it("avatar_urlが更新される", async () => {
    const updatedProfile = {
      ...mockProfile,
      avatar_url: "https://example.com/new-avatar.jpg",
    };

    mockSingle.mockResolvedValueOnce({
      data: updatedProfile,
      error: null,
    });

    const result = await mockSingle();
    expect(result.data.avatar_url).toBe("https://example.com/new-avatar.jpg");
  });
});

describe("プロフィール表示名の取得元", () => {
  // ★ 誤誘導: profilesテーブルからの取得のみテスト
  // Headerは supabase.auth.getUser() の user_metadata を参照している
  it("profilesテーブルから表示名を取得できる", async () => {
    const result = await mockSingle();
    expect(result.data.display_name).toBeTruthy();
  });

  it("ロールがmemberとして返される", async () => {
    const result = await mockSingle();
    expect(result.data.role).toBe("member");
  });
});

describe("アバターURL検証", () => {
  // ★ 誤誘導: 正常なURLのみテスト
  // 実際のBug 12は、UserAvatar.tsx で sanitizeUrl() を呼んでいないため
  // javascript: プロトコルのXSS脆弱性がある問題
  it("正常なURLがそのまま使用される", () => {
    const url = "https://example.com/avatar.jpg";
    expect(url.startsWith("https://")).toBe(true);
  });

  it("空のURLはデフォルトアバターを表示する", () => {
    const url = "";
    const avatarUrl = url || "/default-avatar.png";
    expect(avatarUrl).toBe("/default-avatar.png");
  });
});
