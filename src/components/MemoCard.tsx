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
      <div className={styles.footer}>
        <span className={styles.date}>{formatDate(memo.created_at)}</span>
        <span className={styles.likes}>♥ {memo.likes_count}</span>
      </div>
    </Link>
  );
}
