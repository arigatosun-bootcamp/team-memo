# バグパターン集 & 再発防止チェックリスト

このドキュメントは、過去に発生したバグのパターンと原因を記録し、同じミスを繰り返さないための防止策をまとめたものです。

---

## 1. 認可チェックの欠落（Issue #5）

### 何が起きた？
他のユーザーや未ログインユーザーが、他人のメモを削除できてしまった。

### 原因
- API Routeで`request.json()`からuser_idを取得しようとしていたが、フロントエンドが送っていなかった
- `userId`が常にnullになり、認可チェックの条件式が常にfalseに
- `supabaseAdmin`（service_roleキー）を使っていたためRLSもバイパスされていた

### 壊れていたコード
```typescript
// userId は常に null（フロントが送っていない）
if (memo && userId && memo.user_id !== userId) {
  return 403エラー; // ← ここに到達しない
}
```

### 防止策
- API Routeで「誰がリクエストしたか」を確認するときは、必ずAuthorizationヘッダーのトークンで検証する
- `supabase.auth.getUser(token)` を使ってサーバー側でユーザーを特定する
- フロントエンドの表示制御（ボタンの非表示）だけでなく、必ずバックエンドでも認可チェックする
- 条件式で `&&` を使って複数条件を並べるとき、どれかがnull/undefinedだと全体がfalseになることに注意

---

## 2. ローディング状態のリセット漏れ（Issue #4）

### 何が起きた？
ネットワークエラー発生後、いいねボタンが永久に反応しなくなった。

### 原因
- `isLoading = true` を設定した後、成功パスでしかリセットしていなかった
- エラー時に `isLoading` が `true` のまま残り、以降のクリックが全て無視された

### 壊れていたコード
```typescript
try {
  setIsLoading(true);
  await apiCall();
  // 成功時の処理のみ...isLoadingをリセットしていない
} catch {
  // エラー時もisLoadingをリセットしていない！
}
```

### 防止策
- ローディング状態のリセットには必ず `finally` ブロックを使う
- `finally` なら成功/失敗/例外のどのケースでも確実にリセットされる
```typescript
try {
  setIsLoading(true);
  await apiCall();
} catch {
  // エラーハンドリング
} finally {
  setIsLoading(false); // 必ず実行される
}
```

---

## 3. コメントとコードの不一致（Issue #3）

### 何が起きた？
メモの公開/非公開トグルが逆に動作した。「公開にする」を押すと非公開になった。

### 原因
- コメントには正しいロジックが書かれていたが、コードが逆になっていた
- `is_private: isPublic` と書くべきところが `is_private: !isPublic` の `!` が抜けていた

### 壊れていたコード
```typescript
// isPublic が true → 公開 → is_private を false にする ← コメントは正しい
const { data, error } = await supabase
  .update({ is_private: isPublic }) // ← コードは逆！ !isPublic が正解
```

### 防止策
- コメントを書いたら、コードがコメント通りの動作になっているか必ず確認する
- booleanの反転（`!`）が必要な変換では、具体的な値を当てはめて確認する
  - 例: 「isPublic = true → is_private は false になるべき → `!isPublic` = false」
- ネーミングが逆の意味（publicとprivate）のときは特に注意

---

## 4. タイムゾーンの二重変換（Issue #2）

### 何が起きた？
メモを編集すると、更新日時が18時間先の未来の時刻になった。

### 原因
- JavaScriptで手動で+9時間（JST）を加算
- `.toISOString()`で末尾`Z`（UTC表記）の文字列に変換
- Supabaseの`timestamptz`がこれをUTCとして解釈し、表示時にさらに+9時間
- 結果: +9時間が二重に加算された

### 壊れていたコード
```typescript
const now = new Date();
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
// ↑ 手動で+9時間 → .toISOString()でUTC表記 → DBが+9時間 = 合計+18時間
```

### 防止策
- タイムゾーンの変換は手動で行わない
- `new Date().toISOString()` をそのまま使えば、DBが正しく処理してくれる
- Supabaseの`timestamptz`型はUTCで保存し、表示時にクライアント側で変換するのが正しいパターン
- 日時を扱うときは「どこで変換が起きるか」を全レイヤーで確認する（JS → API → DB → 表示）

---

## 5. OR/AND条件の混同（Issue #1）

### 何が起きた？
検索ワードとカテゴリフィルタを同時に使うと、関係ないメモまで表示された。

### 原因
- 検索条件（タイトル OR 内容）とカテゴリ条件をすべて `.or()` で結合していた
- 「タイトル一致 OR 内容一致 OR カテゴリ一致」となり、カテゴリだけ一致するメモも表示

### 壊れていたコード
```typescript
// 全部をORで結合 → カテゴリだけ一致するメモも表示されてしまう
query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,category.eq.${category}`);
```

### 防止策
- 検索条件を組み立てるときは「AND条件」と「OR条件」を明確に分ける
- 「検索ワード（タイトル OR 内容）」AND「カテゴリ」のように、グループを意識する
```typescript
// 正しい: 検索はOR、カテゴリはANDで別々に適用
if (search) {
  query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
}
if (category) {
  query = query.eq("category", category);
}
```

---

## 6. UI機能の欠落（Issue #17）

### 何が起きた？
メモ作成時に公開/非公開を選択するUIがなかった。

### 原因
- フォームコンポーネントに `is_private` の入力欄が実装されていなかった
- APIは対応していたが、フロントエンドのUIが不足していた

### 防止策
- 新しいDB項目を追加したら、対応するUIも同時に実装する
- 「API → フロントエンド → テスト」をセットで考える

---

## 7. ページネーションのOff-by-Oneエラー（Issue #6）

### 何が起きた？
メモが15件以上あるとき、1ページ目が11件表示され、ページ間でメモが重複し、最後のメモがどのページにも表示されなかった。

### 原因
- Supabaseの `.range(start, end)` は**両端を含む（inclusive）** だが、end の計算で `-1` を忘れていた
- `range(0, 10)` → 11件取得（0〜10）、ページ2は `range(10, 20)` → インデックス10が重複
- Paginationコンポーネントが「11件ずつ」に合わせて `itemsPerPage + 1` で割っていたため、総ページ数も不正確に

### 壊れていたコード
```typescript
// API側: 1件多く取得してしまう
query = query.range((page - 1) * perPage, page * perPage);
// page=1 → range(0, 10) = 11件

// Pagination側: 11件に合わせた計算（根本修正ではなく回避）
const totalPages = Math.ceil(totalItems / (itemsPerPage + 1));
```

### 防止策
- Supabaseの `.range()` はinclusive（両端含む）なので、endは `start + perPage - 1` にする
- ライブラリのAPIが0始まりかinclusive/exclusiveか、必ずドキュメントで確認する
- Off-by-Oneエラーは具体的な数値を当てはめて検算する
  - 例: `range(0, 9)` = 0,1,2,...,9 = 10件
- 「回避策」ではなく「根本修正」を選ぶ（Paginationの `+1` はバグの上塗り）

---

## コードレビュー用チェックリスト

PRを出す前、またはレビューするときに以下を確認してください。

### セキュリティ
- [ ] API Routeに認可チェックがあるか（誰がリクエストしたか検証しているか）
- [ ] フロントエンドの表示制御だけでなく、バックエンドでも権限チェックしているか
- [ ] `supabaseAdmin`（service_role）を使う場合、アプリケーションコードで認可チェックしているか

### 状態管理
- [ ] ローディング状態は `finally` でリセットしているか
- [ ] エラー発生時にUIが操作不能にならないか

### ロジック
- [ ] booleanの反転（`!`）が正しいか、具体的な値で確認したか
- [ ] コメントとコードの内容が一致しているか
- [ ] OR/AND条件の組み立てが意図通りか

### 日時処理
- [ ] タイムゾーンの手動変換をしていないか
- [ ] 日時データの流れ（JS → API → DB → 表示）で二重変換がないか

### ページネーション・配列操作
- [ ] `.range()` や `.slice()` のinclusive/exclusiveを確認したか
- [ ] Off-by-Oneエラーがないか、具体的な数値で検算したか

### 機能の完全性
- [ ] DBスキーマの変更に対応するUIがあるか
- [ ] API/DB/フロントエンドの3層がすべて整合しているか
