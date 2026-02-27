# バグパターンと予防策

このドキュメントは、チーム内で発生したバグのパターンと予防策を記録し、同じミスを繰り返さないためのナレッジベースです。

---

## パターン13: 大文字小文字の不一致によるタグ検索・作成エラー

**Issue**: #13
**発生箇所**: `src/components/TagInput.tsx`, `src/app/api/tags/route.ts`

### 何が起きたか
1. タグ入力欄に「React」（大文字）と入力しても、DB上の「react」が候補に表示されなかった
2. Enterキーで新規作成しようとすると、小文字に正規化された「react」がUNIQUE制約に違反し、500エラーが返された

### 原因
1. オートコンプリートの `.includes()` が大文字小文字を区別して比較していた
2. タグ作成APIがUNIQUE制約エラー（コード `23505`）を判別せず、一律500エラーとして返していた

### 壊れていたコード
```typescript
// TagInput.tsx - case-sensitiveな比較
tag.name.includes(value.trim())

// tags/route.ts - UNIQUE制約エラーも500で返す
if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}
```

### 修正後のコード
```typescript
// TagInput.tsx - 両方小文字にして比較
tag.name.toLowerCase().includes(normalizedValue)

// tags/route.ts - UNIQUE制約エラー時は既存タグを返す
if (error.code === "23505") {
  const { data: existingTag } = await supabase.from("tags").select("*").eq("name", normalizedName).single();
  if (existingTag) return NextResponse.json({ tag: existingTag });
}
```

### 予防策
- 文字列比較は大文字小文字を意識する（`.toLowerCase()` で正規化してから比較）
- DB制約エラーはコード別にハンドリングする（23505=重複、23503=外部キー違反 等）
- 同じエンティティの「保存時の正規化」と「検索時の正規化」を揃える

---

## コードレビューチェックリスト

- [ ] 文字列比較: 大文字小文字を考慮しているか
- [ ] DB制約エラー: UNIQUE違反等をコード別にハンドリングしているか
- [ ] データの保存先と参照先が一致しているか
- [ ] ユーザー入力のURLがサニタイズされているか
- [ ] 通知・メール送信: 自分自身への送信が除外されているか
- [ ] useEffectの依存配列: 関数参照が安定しているか
- [ ] API認証: サーバー側でトークン検証しているか
- [ ] 一覧・ランキングAPI: 非公開データのフィルタが入っているか
- [ ] 日付処理: サーバーサイドでタイムゾーンを明示的に指定しているか
