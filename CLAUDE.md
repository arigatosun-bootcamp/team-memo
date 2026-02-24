# Team Memo - 開発ワークフロー

## 絶対ルール（すべての作業に適用）

### ワークフロー: Issue → Branch → PR → Review → Merge

1. **作業開始前に必ずGitHub Issueを確認する**
   - Issueがない作業は禁止
   - Issueの「受け入れ条件」「確認手順」を必ず確認してから着手

2. **ブランチ命名規則**
   - `feat/issue-{番号}-{短い説明}` — 新機能
   - `fix/issue-{番号}-{短い説明}` — バグ修正
   - `docs/issue-{番号}-{短い説明}` — ドキュメント
   - `chore/issue-{番号}-{短い説明}` — その他

3. **1 Issue = 1 PR（厳守）**
   - PRが複数Issueにまたがってはならない
   - PRが大きくなったら分割する

4. **PR作成時の必須事項**
   - PR本文のテンプレートをすべて埋める（特に「動作確認」は必須）
   - `Closes #Issue番号` で Issue を紐づける
   - Draft PR を早めに出す（完璧を待たない）

5. **コミットメッセージ規約**
   - `feat: 〜` / `fix: 〜` / `docs: 〜` / `test: 〜` / `chore: 〜`
   - 日本語OK、何を変えたか1行で明確に

## ビルド・テストコマンド

- 開発サーバー: `npm run dev`
- ビルド: `npm run build`
- リント: `npm run lint`
- 型チェック: `npm run typecheck`
- テスト: `npm test`

## コード作業時の注意

- `.env.local` は絶対にコミットしない
- テストは `npm test` で全件通ることを確認してからPR
- LLM出力は必ず「構造化 → バリデーション → 再試行 → 失敗ログ」の設計にする

## カスタムコマンド（受講者向け）

以下のスラッシュコマンドが使えます：

- `/start-task [Issue番号]` — Issueからブランチ作成して作業開始
- `/submit-pr` — lint/test実行 → PRテンプレ記入 → Draft PR作成
- `/daily-check [Day番号]` — 指定Dayの達成状況チェック
- `/workflow-status` — 現在のIssue/PR/ブランチ状態を一覧表示
