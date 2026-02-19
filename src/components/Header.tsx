"use client";

import Link from "next/link";
import styles from "./Header.module.css";

type HeaderProps = {
  userName?: string;
  onLogout?: () => void;
};

export default function Header({ userName, onLogout }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          TeamMemo
        </Link>
        <nav className={styles.nav}>
          <Link href="/memo/new" className={styles.newButton}>
            + 新規メモ
          </Link>
          {userName ? (
            <div className={styles.user}>
              <span className={styles.userName}>{userName}</span>
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
