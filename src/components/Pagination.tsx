"use client";

type PaginationProps = {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}: PaginationProps) {
  // 総ページ数を計算（切り上げ）
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "0.5rem",
        marginTop: "2rem",
      }}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "4px",
          border: "1px solid #e2e8f0",
          backgroundColor: currentPage === 1 ? "#f1f5f9" : "#f8fafc",
          color: currentPage === 1 ? "#555" : "#64748b",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
        }}
      >
        前へ
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          disabled={page === currentPage}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "4px",
            border:
              page === currentPage
                ? "1px solid #2563eb"
                : "1px solid #e2e8f0",
            backgroundColor: page === currentPage ? "#2563eb" : "#f8fafc",
            color: page === currentPage ? "white" : "#64748b",
            cursor: page === currentPage ? "default" : "pointer",
            fontWeight: page === currentPage ? 600 : 400,
          }}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "4px",
          border: "1px solid #e2e8f0",
          backgroundColor:
            currentPage === totalPages ? "#f1f5f9" : "#f8fafc",
          color: currentPage === totalPages ? "#555" : "#64748b",
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
        }}
      >
        次へ
      </button>
    </nav>
  );
}
