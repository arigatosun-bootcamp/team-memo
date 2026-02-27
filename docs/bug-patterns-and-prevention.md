# バグパターンと予防策

このドキュメントは、チーム内で発生したバグのパターンと予防策を記録し、同じミスを繰り返さないためのナレッジベースです。

---

## パターン14: ミドルウェアの保護範囲漏れ + API認可チェック欠如

**Issue**: #14
**発生箇所**: `src/middleware.ts`, `src/app/api/admin/users/route.ts`

### 何が起きたか
一般ユーザーが `/admin` 画面にはアクセスできないが、`/api/admin/users` にDevToolsから直接リクエストを送ると全ユーザー情報が取得でき、ユーザー削除もできてしまった。

### 原因
1. ミドルウェアの `matcher` に `/api/admin/:path*` が含まれておらず、APIルートが保護されていなかった
2. API側に認可チェック（ユーザーのroleがadminか確認）がなかった

### 壊れていたコード
```typescript
// middleware.ts - APIパスが含まれていない
export const config = {
  matcher: ["/admin/:path*"],  // /api/admin が漏れている
};

// admin/users/route.ts - 認可チェックなし
export async function GET() {
  const { data: profiles } = await supabase.from("profiles").select("*");
  return NextResponse.json({ users: profiles });
}
```

### 修正後のコード
```typescript
// middleware.ts - APIパスも追加 + API向けにJSONレスポンス
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

// admin/users/route.ts - トークンからroleを検証
async function verifyAdmin(request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { authorized: false };
  return { authorized: true };
}
```

### 予防策
- **多層防御**: ミドルウェアとAPI両方で認可チェックを行う
- ミドルウェアのmatcherは画面パスとAPIパスの両方を含める
- APIがJSONを返す場合、エラー時もリダイレクトではなくJSONで返す
- 管理者APIは必ずトークンからユーザーのroleを検証する

---

## コードレビューチェックリスト

- [ ] 管理者API: ミドルウェアとAPI両方で認可チェックしているか
- [ ] ミドルウェアmatcher: 画面パスとAPIパスの両方が含まれているか
- [ ] 文字列比較: 大文字小文字を考慮しているか
- [ ] DB制約エラー: UNIQUE違反等をコード別にハンドリングしているか
- [ ] データの保存先と参照先が一致しているか
- [ ] ユーザー入力のURLがサニタイズされているか
- [ ] API認証: サーバー側でトークン検証しているか
- [ ] 一覧・ランキングAPI: 非公開データのフィルタが入っているか
- [ ] 日付処理: サーバーサイドでタイムゾーンを明示的に指定しているか
