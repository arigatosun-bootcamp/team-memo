---
name: workflow-status
description: 現在のワークフロー状態（Issue/ブランチ/PR）を一覧表示
---

# ワークフロー状態確認

以下のコマンドを順に実行し、現在の開発状態を整理して表示してください。

## 情報収集

```bash
echo "=== ブランチ ===" && git branch --show-current && echo "" && echo "=== 未コミット ===" && git status --short && echo "" && echo "=== 最近のコミット（5件）===" && git log --oneline -5 2>/dev/null
```

```bash
echo "=== mainとの差分 ===" && git diff main...HEAD --stat 2>/dev/null || echo "(mainと同一)"
```

```bash
echo "=== オープンIssue ===" && gh issue list --state open --limit 10 2>/dev/null || echo "(gh未設定)"
```

```bash
echo "=== オープンPR ===" && gh pr list --state open --limit 5 2>/dev/null || echo "(gh未設定)"
```

## 表示フォーマット

収集した情報を以下の形式で整理してください：

```
=== ワークフロー状態 ===

ブランチ: {ブランチ名}（mainから{N}コミット先行）
未コミット: {N}ファイル変更あり / なし
対応中Issue: #{番号} {タイトル}
オープンPR: #{番号} {タイトル} [Draft/Ready]

最近のコミット:
  - {hash} {メッセージ}
  - {hash} {メッセージ}

次のアクション:
  - {推奨する次のステップ}
```

## 推奨アクションの判定ロジック

- mainブランチにいる → 「`/start-task [Issue番号]` でタスクを開始してください」
- 未コミットの変更がある → 「変更をコミットしてください」
- コミット済みだがPR未作成 → 「`/submit-pr` でPRを作成してください」
- PR作成済みでDraft → 「レビュー準備ができたらDraftを外してください」
- PR作成済みでレビュー待ち → 「レビューを待ってください」
