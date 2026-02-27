import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "@/components/Pagination";

describe("Pagination", () => {
  it("正しいページ数のボタンが表示される", () => {
    render(
      <Pagination
        totalItems={22}
        itemsPerPage={10}
        currentPage={1}
        onPageChange={() => {}}
      />
    );
    // 22 / 10 = 3ページ分のボタン + 前へ + 次へ = 5ボタン
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
  });

  it("1ページのみの場合はページネーションを表示しない", () => {
    const { container } = render(
      <Pagination
        totalItems={10}
        itemsPerPage={10}
        currentPage={1}
        onPageChange={() => {}}
      />
    );
    // 10 / 10 = 1ページ → 表示しない
    expect(container.firstChild).toBeNull();
  });

  it("ページボタンクリックでonPageChangeが呼ばれる", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        totalItems={33}
        itemsPerPage={10}
        currentPage={1}
        onPageChange={onPageChange}
      />
    );
    // 33 / 10 = 4ページ
    fireEvent.click(screen.getByText("2"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("現在のページのボタンは無効化される", () => {
    render(
      <Pagination
        totalItems={33}
        itemsPerPage={10}
        currentPage={2}
        onPageChange={() => {}}
      />
    );

    const currentButton = screen.getByText("2");
    expect(currentButton).toBeDisabled();
  });
});
