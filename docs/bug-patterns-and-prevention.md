# バグパターンと予防策

このドキュメントは、チーム内で発生したバグのパターンと予防策を記録し、同じミスを繰り返さないためのナレッジベースです。

---

## パターン11: データの保存先と参照先の不一致 + URL未検証によるXSS

**Issue**: #11
**発生箇所**: `src/app/api/profile/route.ts`, `src/components/UserAvatar.tsx`, `src/app/profile/page.tsx`

### 何が起きたか
1. プロフィール画面で名前を変更しても、ヘッダーに古い名前が表示され続けた
2. アバターURLに `javascript:` スキームを設定でき、XSS脆弱性があった

### 原因
1. プロフィールAPIが `profiles`テーブルのみ更新し、`auth.users`の`user_metadata`を更新していなかった。ヘッダーは`user_metadata`から名前を読んでいたため不整合が発生
2. `UserAvatar`コンポーネントでURLのサニタイズ(`sanitizeUrl()`)を行っていなかった

### 壊れていたコード
```typescript
// profile/route.ts - profilesテーブルのみ更新
await supabase.from("profiles").update({ display_name }).eq("id", user_id);
// auth.usersのメタデータは更新されない

// UserAvatar.tsx - URLを検証せずそのまま使用
<img src={avatarUrl} />  // javascript: URLが通ってしまう

// profile/page.tsx - ヘッダーの表示名を同期していない
setProfile(data.profile);
// setUserName() が呼ばれていない
```

### 修正後のコード
```typescript
// profile/route.ts - auth.usersも同期更新
await supabase.auth.admin.updateUserById(user_id, {
  user_metadata: { display_name, avatar_url },
});

// UserAvatar.tsx - sanitizeUrlで検証
const safeUrl = avatarUrl ? sanitizeUrl(avatarUrl) : "";
if (safeUrl) { <img src={safeUrl} /> }

// profile/page.tsx - ヘッダー表示名も更新
setProfile(data.profile);
setUserName(data.profile.display_name);
```

### 予防策
- データの「書き込み先」と「読み取り元」が一致しているか必ず確認する
- 複数のデータソースに同じ情報がある場合、更新時にすべて同期する
- ユーザー入力のURLは必ず`sanitizeUrl()`等でhttp/httpsのみ許可する
- `<img src>` や `<a href>` にユーザー入力を使う場合はXSSに注意する

---

## パターン12: ランキングの外部キー欠損・非公開フィルタ漏れ + 日付タイムゾーンずれ

**Issue**: #12
**発生箇所**: `src/app/api/stats/ranking/route.ts`, `src/lib/utils.ts`, DB（memos → profiles外部キー）

### 何が起きたか
1. ダッシュボードのランキングが「データがありません」と表示された
2. 非公開メモがランキングに含まれ、クリックすると「メモが見つかりません」になる
3. 日別メモ投稿数で深夜に作成したメモが前日にカウントされた

### 原因
1. ランキングAPIが `profiles!user_id` でJOINしようとしたが、`memos.user_id` の外部キーが `auth.users` のみを参照しており `profiles` への外部キーがなかった
2. ランキングAPIに `.eq("is_private", false)` のフィルタがなかった
3. `groupByDate()` がタイムゾーン指定なしで `toLocaleDateString()` を呼んでおり、サーバー（UTC）で実行されると日本時間の深夜メモが前日扱いになった

### 壊れていたコード
```typescript
// ranking/route.ts - 外部キーが合わない + フィルタなし
.select("*, user:profiles!user_id(display_name, avatar_url)")
// .eq("is_private", false) がない

// utils.ts - タイムゾーン指定なし
const dateKey = new Date(item.created_at).toLocaleDateString("ja-JP");
```

### 修正後のコード
```typescript
// ranking/route.ts - 正しい外部キー名 + 公開メモのみ
.select("*, user:profiles!memos_user_id_profiles_fkey(display_name, avatar_url)")
.eq("is_private", false);

// utils.ts - JSTタイムゾーンを指定
const dateKey = new Date(item.created_at).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });

// DB: memos → profiles への外部キーを追加
// ALTER TABLE memos ADD CONSTRAINT memos_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
```

### 予防策
- Supabaseの `!foreign_key` JOIN構文を使う場合、実際のDB外部キーが存在するか確認する
- 公開/非公開の区別があるテーブルでは、一覧系APIに必ずフィルタを入れる
- サーバーサイドで日付処理する場合は明示的にタイムゾーンを指定する

---

## コードレビューチェックリスト

- [ ] データの保存先と参照先が一致しているか
- [ ] ユーザー入力のURLがサニタイズされているか
- [ ] 通知・メール送信: 自分自身への送信が除外されているか
- [ ] useEffectの依存配列: 関数参照が安定しているか
- [ ] API認証: サーバー側でトークン検証しているか
- [ ] Supabase `.range()`: 終了インデックスが inclusive であることを考慮しているか
- [ ] CASCADE削除: 子レコードの数をカウントに正しく反映しているか
- [ ] 環境変数: 似た文字（`l`と`1`、`O`と`0`）を確認しているか
- [ ] Supabase JOIN: 外部キーがDBに存在するか確認しているか
- [ ] 一覧・ランキングAPI: 非公開データのフィルタが入っているか
- [ ] 日付処理: サーバーサイドでタイムゾーンを明示的に指定しているか
