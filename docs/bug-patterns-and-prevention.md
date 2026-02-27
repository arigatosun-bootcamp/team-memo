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

## コードレビューチェックリスト

- [ ] データの保存先と参照先が一致しているか
- [ ] ユーザー入力のURLがサニタイズされているか
- [ ] 通知・メール送信: 自分自身への送信が除外されているか
- [ ] useEffectの依存配列: 関数参照が安定しているか
- [ ] API認証: サーバー側でトークン検証しているか
- [ ] Supabase `.range()`: 終了インデックスが inclusive であることを考慮しているか
- [ ] CASCADE削除: 子レコードの数をカウントに正しく反映しているか
- [ ] 環境変数: 似た文字（`l`と`1`、`O`と`0`）を確認しているか
