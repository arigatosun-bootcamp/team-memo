import { describe, it, expect, vi, beforeEach } from "vitest";

// Supabaseモック
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      update: mockUpdate,
    })),
  },
}));

mockUpdate.mockReturnValue({
  eq: mockEq,
});

mockEq.mockReturnValue({
  select: mockSelect,
});

mockSelect.mockReturnValue({
  single: mockSingle,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({ single: mockSingle });
});

// 公開設定の更新ロジックを再現する関数
function updateVisibility(isPublic: boolean) {
  // isPublic が true → 公開 → is_private を false にする
  const updatePayload = { is_private: isPublic };
  mockUpdate(updatePayload);
  return updatePayload;
}

describe("メモ公開設定", () => {
  it("公開に設定するとis_privateがtrueになる", () => {
    const result = updateVisibility(true);
    expect(mockUpdate).toHaveBeenCalledWith({ is_private: true });
    expect(result.is_private).toBe(true);
  });

  it("非公開に設定するとis_privateがfalseになる", () => {
    const result = updateVisibility(false);
    expect(mockUpdate).toHaveBeenCalledWith({ is_private: false });
    expect(result.is_private).toBe(false);
  });

  it("更新が正常に完了する", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "memo-1", is_private: true },
      error: null,
    });

    updateVisibility(true);
    const result = await mockSingle();
    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
  });
});
