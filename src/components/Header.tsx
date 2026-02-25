"use client";

import Link from "next/link";
import styles from "./Header.module.css";
import NotificationBell from "./NotificationBell";

type HeaderProps = {
  userName?: string;
  userId?: string;
  onLogout?: () => void;
};

export default function Header({ userName, userId, onLogout }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          TeamMemo
        </Link>
        <nav className={styles.nav}>
          <Link href="/dashboard" style={{ color: "#666", textDecoration: "none", fontSize: "14px" }}>
            ダッシュボード
          </Link>
          <Link href="/memo/new" className={styles.newButton}>
            + 新規メモ
          </Link>
          {userName ? (
            <div className={styles.user}>
              <NotificationBell userId={userId} />
              <Link href="/bookmarks" style={{ color: "#666", textDecoration: "none", fontSize: "16px" }} title="ブックマーク">
                ☆
              </Link>
              <Link href="/profile" style={{ color: "#333", textDecoration: "none", fontSize: "14px" }}>
                <span className={styles.userName}>{userName}</span>
              </Link>
              <button onClick={onLogout} className={styles.logoutButton}>
                ログアウト
              </button>
            </div>
          ) : (
            <Link href="/login" className={styles.loginButton}>
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
