import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ChatBot from "@/components/ChatBot";

// fetchモック
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ChatBot", () => {
  it("フローティングボタンが表示される", () => {
    render(<ChatBot />);
    expect(screen.getByLabelText("チャットボットを開く")).toBeInTheDocument();
  });

  it("ボタンクリックでチャットパネルが開く", () => {
    render(<ChatBot />);
    fireEvent.click(screen.getByLabelText("チャットボットを開く"));

    expect(screen.getByText("社内アシスタント")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("メッセージを入力...")).toBeInTheDocument();
  });

  it("初期メッセージが表示される", () => {
    render(<ChatBot />);
    fireEvent.click(screen.getByLabelText("チャットボットを開く"));

    expect(
      screen.getByText(/TeamMemoの社内アシスタントです/)
    ).toBeInTheDocument();
  });

  it("メッセージを送信するとAPIが呼ばれる", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: "テスト応答です" }),
    });

    render(<ChatBot />);
    fireEvent.click(screen.getByLabelText("チャットボットを開く"));

    const input = screen.getByPlaceholderText("メッセージを入力...");
    fireEvent.change(input, { target: { value: "こんにちは" } });
    fireEvent.click(screen.getByText("送信"));

    // ユーザーメッセージが表示される
    expect(screen.getByText("こんにちは")).toBeInTheDocument();

    // APIが呼ばれる
    expect(mockFetch).toHaveBeenCalledWith("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "こんにちは" }),
    });

    // 応答が表示される
    await vi.waitFor(() => {
      expect(screen.getByText("テスト応答です")).toBeInTheDocument();
    });
  });

  it("APIエラー時にエラーメッセージが表示される", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "APIキーが無効です" }),
    });

    render(<ChatBot />);
    fireEvent.click(screen.getByLabelText("チャットボットを開く"));

    const input = screen.getByPlaceholderText("メッセージを入力...");
    fireEvent.change(input, { target: { value: "テスト" } });
    fireEvent.click(screen.getByText("送信"));

    await vi.waitFor(() => {
      expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument();
    });
  });

  it("空メッセージは送信されない", () => {
    render(<ChatBot />);
    fireEvent.click(screen.getByLabelText("チャットボットを開く"));

    const sendButton = screen.getByText("送信");
    fireEvent.click(sendButton);

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
