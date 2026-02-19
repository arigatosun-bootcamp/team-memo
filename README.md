# TeamMemo — チームメモ共有アプリ

社内チーム向けのメモ共有・ナレッジベースアプリケーションです。

## 機能

- メモのCRUD（作成・閲覧・編集・削除）
- カテゴリ分類（一般・技術・議事録・アイデア・その他）
- キーワード検索 / カテゴリフィルタ
- ページネーション
- いいね機能
- AI要約生成（LLM連携）
- 公開/非公開設定
- ユーザー認証

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript 5
- **UI**: React 19
- **DB / 認証**: Supabase
- **LLM**: OpenAI API / Anthropic API
- **テスト**: Vitest + Testing Library
- **リント**: ESLint

## セットアップ

```bash
# 依存パッケージのインストール
npm install

# 環境変数の設定
cp .env.example .env
# .env を編集

# 開発サーバーの起動
npm run dev
```

## コマンド

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run lint` | ESLintチェック |
| `npm run typecheck` | TypeScript型チェック |
| `npm test` | テスト実行 |

## ディレクトリ構成

```
src/
├── app/               # Next.js App Router
│   ├── api/           # APIルート
│   ├── memo/          # メモ関連ページ
│   └── login/         # 認証ページ
├── components/        # UIコンポーネント
├── lib/               # ユーティリティ・設定
└── __tests__/         # テストファイル
```
