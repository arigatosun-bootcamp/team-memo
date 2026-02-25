import { formatCount } from "@/lib/utils";

type UserStatsProps = {
  memoCount: number;
  totalLikes: number;
  commentCount: number;
};

export default function UserStats({
  memoCount,
  totalLikes,
  commentCount,
}: UserStatsProps) {
  return (
    <div style={{ display: "flex", gap: "24px", padding: "16px 0" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2d3748" }}>
          {formatCount(memoCount)}
        </div>
        <div style={{ fontSize: "13px", color: "#888" }}>メモ</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#e53e3e" }}>
          {formatCount(totalLikes)}
        </div>
        <div style={{ fontSize: "13px", color: "#888" }}>いいね</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#4299e1" }}>
          {formatCount(commentCount)}
        </div>
        <div style={{ fontSize: "13px", color: "#888" }}>コメント</div>
      </div>
    </div>
  );
}
