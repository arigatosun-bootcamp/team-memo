import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LikeButton from "@/components/LikeButton";

// fetchモック
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ likes_count: 6 }),
  });
});

describe("LikeButton", () => {
  it("初期カウントが正しく表示される", () => {
    render(<LikeButton memoId="1" initialCount={5} />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it("いいねボタンを押すとカウントが増える", () => {
    render(<LikeButton memoId="1" initialCount={5} userId="user-1" />);

    fireEvent.click(screen.getByRole("button"));

    // 楽観的更新により即座に6になる
    expect(screen.getByText(/6/)).toBeInTheDocument();
  });

  it("いいね済みの場合はボタンが無効化される", () => {
    render(<LikeButton memoId="1" initialCount={5} userId="user-1" />);

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("未ログイン時はアラートが表示される", () => {
    const alertMock = vi.fn();
    vi.stubGlobal("alert", alertMock);
    render(<LikeButton memoId="1" initialCount={5} />);

    fireEvent.click(screen.getByRole("button"));

    expect(alertMock).toHaveBeenCalledWith(
      "いいねするにはログインが必要です"
    );
  });

  it("連続クリックしても正しく動作する", async () => {
    render(<LikeButton memoId="1" initialCount={5} userId="user-1" />);

    // 2回連続でクリック
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button"));

    // 楽観的更新の値をチェック
    expect(screen.getByText(/6/)).toBeInTheDocument();
  });
});
