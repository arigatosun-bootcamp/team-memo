"use client";

import Link from "next/link";
import type { Memo } from "@/lib/types";
import { truncateText, formatDate, getCategoryBadgeClass } from "@/lib/utils";
import styles from "./MemoCard.module.css";

type MemoCardProps = {
  memo: Memo;
};

export default function MemoCard({ memo }: MemoCardProps) {
  const badgeClass = getCategoryBadgeClass(memo.category);

  return (
    <Link href={`/memo/${memo.id}`} className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.title}>{memo.title}</h2>
        <span className={`${styles.badge} ${styles[badgeClass]}`}>
          {memo.category}
        </span>
      </div>
      <p className={styles.content}>{truncateText(memo.content, 120)}</p>
      {memo.summary && (
        <p className={styles.summary}>AI要約: {truncateText(memo.summary, 80)}</p>
      )}
      {memo.tags && memo.tags.length > 0 && (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", margin: "4px 0" }}>
          {memo.tags.map((tag) => (
            <span
              key={tag.id}
              style={{
                fontSize: "11px",
                padding: "1px 6px",
                borderRadius: "8px",
                backgroundColor: (tag.color || "#666") + "20",
                color: tag.color || "#666",
              }}
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}
      <div className={styles.footer}>
        <span className={styles.date}>{formatDate(memo.created_at)}</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <span className={styles.likes}>♥ {memo.likes_count}</span>
          {memo.comments_count > 0 && (
            <span style={{ color: "#94a3b8", fontSize: "13px" }}>💬 {memo.comments_count}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
