# レビュー者用バグガイド（機密）

> **このドキュメントは研修生には共有しないでください。**
> 各バグの原因、該当コード、検証手順、正しい修正方法をまとめています。

---

## バグ一覧

| # | 難易度 | 概要 | 主な該当ファイル | テスト誤誘導 |
|---|--------|------|-----------------|-------------|
| 1 | ★★☆☆☆ | 検索+カテゴリフィルタのOR結合バグ | `api/memos/route.ts` | あり |
| 2 | ★★★☆☆ | タイムゾーン二重変換で更新日時が9〜18時間ずれる | `api/memos/[id]/route.ts` | あり |
| 3 | ★★★☆☆ | 公開/非公開トグルのロジックが逆 + テストが同じ間違い | `api/memos/[id]/route.ts` | あり |
| 4 | ★★★★☆ | ネットワークエラー後にいいねボタンが凍結する | `components/LikeButton.tsx` | あり |
| 5 | ★★★★☆ | DELETE APIの認可バイパス（セキュリティバグ） | `api/memos/[id]/route.ts` | あり |
| 6 | ★★★★★ | ページネーションのoff-by-one + ページ数計算の複合バグ | `api/memos/route.ts` + `Pagination.tsx` | あり |
| 7 | (潜在) | いいねカウントの非アトミック更新（競合状態） | `api/memos/[id]/like/route.ts` | なし |
| 8 | ★★★☆☆ | チャットボットのGemini APIキーの1文字typo（1→l） | `.env` | なし |
| 9 | ★★★★☆ | コメント削除時のカスケードカウント不整合 | `api/comments/[commentId]/route.ts` + `CommentList.tsx` + `memo/[id]/page.tsx` | あり |
| 10 | ★★★★★ | ブックマーク一覧で非公開メモがランタイムエラー | `api/bookmarks/route.ts` + `bookmarks/page.tsx` + `types.ts` + `BookmarkButton.tsx` | あり |
| 11 | ★★★★☆ | 通知の自己通知 + NotificationBellのメモリリーク | `lib/notifications.ts` + `api/like/route.ts` + `api/comments/route.ts` + `NotificationBell.tsx` | あり |
| 12 | ★★★★★ | プロフィール更新がHeaderと他画面で反映されない + XSS | `api/profile/route.ts` + `Header.tsx` + `UserAvatar.tsx` + `profile/page.tsx` | あり |
| 13 | ★★★★★ | ランキングの非公開メモ混入 + 統計タイムゾーンずれ | `api/stats/ranking/route.ts` + `api/stats/route.ts` + `lib/utils.ts` + `dashboard/page.tsx` | あり |
| 14 | ★★★★☆ | タグ検索の正規化不整合 + UNIQUE制約の500エラー | `api/tags/route.ts` + `TagInput.tsx` + `SearchBar.tsx` | あり |
| 15 | ★★★★★ | 管理者APIのミドルウェアバイパス + role判定の論理エラー | `middleware.ts` + `lib/auth.ts` + `api/admin/users/route.ts` + `admin/page.tsx` | あり |

---

## Bug 1 (★★☆☆☆): 検索+カテゴリフィルタのOR結合バグ

### 該当コード

**`src/app/api/memos/route.ts`**
```typescript
// 検索条件とカテゴリフィルタを統合して1つのクエリで処理する
if (search || category) {
    const conditions: string[] = [];
    if (search) {
        conditions.push(`title.ilike.%${search}%`);
        conditions.push(`content.ilike.%${search}%`);
    }
    if (category) {
        conditions.push(`category.eq.${category}`);
    }
    query = query.or(conditions.join(","));
}
```

### 何が間違っているか

`.or()` に全条件を入れると `(title ILIKE %search% OR content ILIKE %search% OR category = xxx)` となる。
正しくは `(title ILIKE %search% OR content ILIKE %search%) AND category = xxx` であるべき。

- カテゴリのみ指定 → **正常動作**（`.or("category.eq.xxx")` = `.eq("category", "xxx")` と同等）
- 検索のみ指定 → **正常動作**
- **両方指定 → バグ発現**（カテゴリが一致するだけで検索語を含まないメモもヒット）

### テストの誤誘導

`src/__tests__/memo-api.test.ts` に追加されたテストが、OR結合のフィルタ文字列に「全条件が含まれること」を検証しており、パスする。しかしANDとORの区別を検証していない。

### 画面操作での検証手順

1. 以下のメモを作成する:
   - 技術カテゴリ: 「TypeScript入門」
   - 一般カテゴリ: 「買い物リスト」
   - 技術カテゴリ: 「Docker環境構築」
2. 検索ワード「TypeScript」+ カテゴリ「技術」で検索
3. **期待**: 「TypeScript入門」のみ表示
4. **実際**: 「TypeScript入門」+「Docker環境構築」が表示される

### 正しい修正

```typescript
if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
}
if (category) {
    query = query.eq("category", category);
}
```

---

## Bug 2 (★★★☆☆): タイムゾーン二重変換による更新日時のずれ

### 該当コード

**`src/app/api/memos/[id]/route.ts`** (PUTハンドラ)
```typescript
// 日本時間(JST)で統一して保存することで、表示時のタイムゾーン変換を簡素化する
// Supabaseのtimestamptz型はISO 8601形式のZ(UTC)表記を正しく解釈する
const now = new Date();
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const jstNow = new Date(now.getTime() + JST_OFFSET_MS);

const { data, error } = await supabase
    .from("memos")
    .update({
      title, content, category,
      updated_at: jstNow.toISOString(),  // ← ここが問題
    })
```

### 何が間違っているか

`toISOString()` は**常にUTC（Zサフィックス）**で出力する。
例: UTC 10:00 → +9h → 内部は19:00 → `toISOString()` → `"19:00:00.000Z"` （UTC 19:00として出力）

Supabaseの`timestamptz`はこの`Z`を見てUTCとして格納するため、実際より9時間先の時刻が保存される。さらにフロントエンドの`toLocaleString("ja-JP")`でブラウザのタイムゾーン(+9h)を加算するため、日本ユーザーには**合計18時間先**の時刻が表示される。

### テストの誤誘導

`src/__tests__/utils.test.ts` に追加されたテストがオフセット計算自体の正しさ（9h = 32400000ms）を検証してパスする。計算は確かに正しいが、`toISOString()`の挙動が問題の本質。

### 画面操作での検証手順

1. 既存のメモを開く
2. 内容を編集して保存（PUT）
3. 詳細ページの「更新日時」が現在時刻ではなく、大幅に先の時刻になっている
4. 一覧ページのソート順序が不自然になる

### 正しい修正

```typescript
updated_at: new Date().toISOString(),
```

---

## Bug 3 (★★★☆☆): 公開/非公開トグルのロジックが逆 + テストが嘘

### 該当コード

**`src/app/api/memos/[id]/route.ts`** (PATCHハンドラ)
```typescript
// isPublic が true → 公開 → is_private を false にする
const { data, error } = await supabase
    .from("memos")
    .update({ is_private: isPublic })  // ← !isPublic であるべき
```

**`src/app/memo/[id]/page.tsx`** (フロント側)
```typescript
body: JSON.stringify({ isPublic: memo.is_private }),
// is_private=true(非公開) → isPublic=true(公開にしたい) を送信
// API側: is_private = isPublic = true → まだ非公開のまま！
```

### 何が間違っているか

`is_private: isPublic` は `is_private: !isPublic` であるべき。
コメントには「isPublic が true → is_private を false にする」と正しい意図が書かれているが、コードが逆。

### テストの誤誘導

**`src/__tests__/visibility.test.ts`** のテストが同じ間違ったロジックで書かれている：
```typescript
function updateVisibility(isPublic: boolean) {
  const updatePayload = { is_private: isPublic };  // テストも間違い
}
```
→ `npm test` は全てパスする。

### 画面操作での検証手順

1. 公開メモの詳細ページで「非公開にする」をクリック
2. ページの公開状態表示を確認 — 変わらない（または逆に動作する）
3. ブラウザのDevTools > Networkで PATCH リクエストのペイロードとレスポンスを比較

### 正しい修正

```typescript
.update({ is_private: !isPublic })
```
加えて `visibility.test.ts` のテストも `is_private: !isPublic` に修正。

---

## Bug 4 (★★★★☆): ネットワークエラー後にいいねボタンが凍結する

### 該当コード

**`src/components/LikeButton.tsx`**
```typescript
const handleLike = async () => {
    if (!userId) { alert("いいねするにはログインが必要です"); return; }

    if (isLoading) return;  // ← エラー後ここで永久にreturn
    setIsLoading(true);

    setCount((prev) => prev + 1);
    setIsLiked(true);

    try {
      const response = await fetch(...);
      const data = await response.json();
      if (data.likes_count !== undefined) {
        setCount(data.likes_count);
      }
    } catch {
      setCount((prev) => prev - 1);
      setIsLiked(false);
    }
    // NOTE: isLoadingをリセットしない。
    // いいねは1メモにつき1回限りなので、成功後にリセットする必要がない。
    // 成功時はisLiked=trueでボタンがdisabledになるため問題ない。
};
```

### 何が間違っているか

`finally` で `setIsLoading(false)` がない。正常系では `isLiked=true` でボタンが `disabled` になるため問題ないが、**ネットワークエラー時**は:

1. `setIsLoading(true)` → 2. fetch失敗 → 3. catch: `setIsLiked(false)` → 4. ボタンは押せるように見える
5. 再度クリック → `if (isLoading) return` で何も起こらない

### テストの誤誘導

テストはカウント巻き戻しのみ検証し、`isLoading` は「実装の詳細」としてスキップ。コメントで「isLoadingをリセットしないのは意図的」と記載。

### 画面操作での検証手順

1. メモ詳細ページを開く
2. DevTools > Network > 「Offline」にチェック
3. いいねボタンをクリック → カウントが一瞬+1されて戻る（巻き戻し）
4. 「Offline」を解除
5. いいねボタンを再度クリック → **反応なし**（ボタンは有効に見えるのに何も起こらない）

### 正しい修正

```typescript
} catch {
    setCount((prev) => prev - 1);
    setIsLiked(false);
} finally {
    setIsLoading(false);  // ← 追加
}
```

---

## Bug 5 (★★★★☆): DELETE APIの認可バイパス（セキュリティバグ）

### 該当コード

**`src/app/api/memos/[id]/route.ts`** (DELETEハンドラ)
```typescript
// リクエストからユーザーIDを取得して認可チェックを行う
let userId: string | null = null;
try {
    const body = await request.json();
    userId = body.user_id;
} catch {
    // DELETEリクエストにbodyがない場合は無視する
}

const { data: memo } = await supabase
    .from("memos").select("user_id").eq("id", id).single();

// 所有者でない場合は削除を拒否する
if (memo && userId && memo.user_id !== userId) {
    return NextResponse.json({ error: "このメモを削除する権限がありません" }, { status: 403 });
}
```

**`src/app/memo/[id]/page.tsx`** (フロント側)
```typescript
const handleDelete = async () => {
    if (!confirm("このメモを削除しますか？")) return;
    const response = await fetch(`/api/memos/${params.id}`, {
        method: "DELETE",
        // body がない → userId は常にnull
    });
};
```

### 何が間違っているか

認可チェックの条件 `if (memo && userId && memo.user_id !== userId)` に `userId &&` が含まれる。
- `userId` が `null`（bodyなし）→ 条件全体が `false` → 認可チェックがスキップ
- フロントは `body` を送っていない → `userId` は常に `null` → **誰でも任意のメモを削除可能**

認可チェックのコードは存在し、403レスポンスも返す設計だが、実際には一度も発動しない。

### テストの誤誘導

テストは `userId` が存在する前提で「他人のメモは削除不可」「自分のメモは削除可」を検証してパスする。`userId=null` のケースがテストされていない。

### 画面操作での検証手順

1. ユーザーAでメモを作成
2. ログアウト or 別ユーザーでログイン
3. ユーザーAのメモの詳細ページに直接アクセス（URLを入力）
4. 「削除」ボタンをクリック → **削除できてしまう**
5. DevToolsでDELETEリクエストにbodyがないことを確認

### 正しい修正

```typescript
if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
}
if (memo && memo.user_id !== userId) {
    return NextResponse.json({ error: "このメモを削除する権限がありません" }, { status: 403 });
}
```
加えてフロント側で `body: JSON.stringify({ user_id: currentUserId })` を送信する。

---

## Bug 6 (★★★★★): ページネーションの off-by-one + ページ数計算の複合バグ

### 該当コード（2ファイルにまたがる）

**`src/app/api/memos/route.ts`**
```typescript
// ページネーション: Supabaseのrangeはinclusive(両端含む)なので
// perPage件取得するにはrange(start, start + perPage)とする
query = query.range((page - 1) * perPage, page * perPage);
// ↑ range(0, 10) は 0〜10 の11件を返す（正しくは range(0, 9) で10件）
```

**`src/components/Pagination.tsx`**
```typescript
// 総ページ数を計算（切り上げ）
// rangeがinclusiveで実際にはperPage+1件取得されるため、それに合わせて計算
const totalPages = Math.ceil(totalItems / (itemsPerPage + 1));
// ↑ 10ではなく11で割るためページ数が不足する
```

### 何が間違っているか

**2つのバグが互いを正当化し合っている:**

1. **API側**: `range(0, 10)` → inclusive なので11件返す（本来は `range(0, 9)` で10件）
2. **Pagination側**: `Math.ceil(N / 11)` → ページ数が少なく計算される

具体例（15件のメモ）:
- API: 1ページ目 `range(0, 10)` → 11件表示（本来10件）
- API: 2ページ目 `range(10, 20)` → インデックス10が1ページ目と**重複**
- Pagination: `Math.ceil(15 / 11) = 2` ページ（本来 `Math.ceil(15/10) = 2`）
- **結果**: 11件 + 5件 = 16表示（15件のはずが重複込みで16）、ページ数は偶然正しく見えるが、メモ数が増えると後半が消失

### テストの誤誘導

テストが `totalItems=22, itemsPerPage=10` で `22/11=2ページ` とコメント付きで検証しパスする。テストの値もバグのある計算に合わせて選ばれている。コメントが「rangeがinclusiveなのでperPage+1で計算」と2ファイル間で互いのバグを正当化。

### 画面操作での検証手順

1. メモを15件以上作成する
2. 一覧ページで1ページ目のメモ数を確認 → **11件**表示されている（本来10件）
3. 2ページ目に移動 → 1ページ目の最後のメモと同じメモが先頭に**重複**している
4. メモを25件以上にすると、最後の数件がどのページにも表示されない

### 正しい修正

```typescript
// route.ts
query = query.range((page - 1) * perPage, page * perPage - 1);

// Pagination.tsx
const totalPages = Math.ceil(totalItems / itemsPerPage);
```

---

## Bug 7 (潜在): いいねカウントの非アトミック更新

### 該当コード

**`src/app/api/memos/[id]/like/route.ts`**
```typescript
// SELECT → 計算 → UPDATE の3ステップ
const { data: memo } = await supabase
    .from("memos").select("likes_count").eq("id", memoId).single();
const newCount = (memo?.likes_count || 0) + 1;
await supabase
    .from("memos").update({ likes_count: newCount }).eq("id", memoId);
```

### 何が間違っているか

SELECT → +1 → UPDATE は非アトミック。2つの同時リクエストが同じ `likes_count` を読み取り、同じ値+1で上書きする可能性がある（Lost Update問題）。

### 検証手順

複数タブ/ユーザーでほぼ同時にいいねを押す → カウントが期待より少ない

### 正しい修正

```typescript
// アトミックなインクリメント
await supabase.rpc('increment_likes', { memo_id: memoId });
// または
await supabase.from("memos").update({ likes_count: supabase.raw('likes_count + 1') }).eq("id", memoId);
```

---

## Bug 8 (★★★☆☆): チャットボットのGemini APIキーの1文字typo（1→l）

### 該当コード

**`.env`**
```env
# Gemini AI（社内チャットボット用）
GEMINI_API_KEY=AIzaSyBVD-XlNX5DWit1f_aA7ezyfLawgQhVdlc
```

**`src/app/api/chat/route.ts`** — コード自体は完全に正しい
```typescript
const apiKey = process.env.GEMINI_API_KEY;
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
  // ...
);
```

### 何が間違っているか

APIキーの末尾付近 `...QhVd1c` の **`1`（数字の1）が `l`（小文字のL）に置き換わっている**。

- 正しいキー: `AIzaSyBVD-XlNX5DWit1f_aA7ezyfLawgQhVd1c`（末尾 `d1c`）
- 間違いキー: `AIzaSyBVD-XlNX5DWit1f_aA7ezyfLawgQhVdlc`（末尾 `dlc`）

多くのフォント（特にサンセリフ体）で `1` と `l` はほぼ同じ形に見えるため、目視での発見が極めて困難。

### AIが見逃す理由

- コードは完全に正しい（`process.env.GEMINI_API_KEY` をそのまま使用）
- AIはAPIキーの正しい値を知らないため、1文字の違いを検出できない
- `.env` ファイルの値は「設定値」であり、AIはコードのロジックバグを探すため見逃しやすい
- エラーメッセージが「API key not valid」で、typoの存在を直接示唆しない
- APIキーは長い文字列のため、1文字の違いを人間もAIも見落としやすい

### 画面操作での検証手順

1. 画面右下のチャットボタン（💬）をクリック
2. チャットパネルが開く
3. メッセージを入力して「送信」ボタンをクリック
4. **「エラーが発生しました: API key not valid」** のようなエラーメッセージが表示される
5. DevTools > Networkで `/api/chat` のレスポンスを確認 → 400エラー

### 正しい修正

`.env` ファイルのAPIキーを正しい値に修正する:

```env
# 修正前（末尾の d"l"c が間違い — lは小文字のL）
GEMINI_API_KEY=AIzaSyBVD-XlNX5DWit1f_aA7ezyfLawgQhVdlc

# 修正後（末尾の d"1"c が正しい — 1は数字の1）
GEMINI_API_KEY=AIzaSyBVD-XlNX5DWit1f_aA7ezyfLawgQhVd1c
```

### ヒント（研修生向け・段階的に出す）

1. 「コードは正しいです。設定ファイルを確認してみてください」
2. 「.envファイルのAPIキーをGoogle Cloud Consoleの値と比較してみてください」
3. 「キーの末尾付近に注目してください。`1`と`l`を見比べてみてください」

---

## Bug 9 (★★★★☆): コメント削除時のカスケードカウント不整合

### 該当コード（3ファイルにまたがる）

**`src/app/api/memos/[id]/comments/[commentId]/route.ts`**
```typescript
// コメントを削除（DBのON DELETE CASCADEで子コメントも連鎖削除される）
await supabase.from("comments").delete().eq("id", commentId);

// comments_count を1つデクリメント
// ★ バグ: CASCADEで子コメント(返信)も削除されるが、カウントは1しか減らない
const newCount = Math.max(0, (memo?.comments_count || 0) - 1);
```

**`src/components/CommentList.tsx`**
```typescript
onCommentDeleted={(commentId) => {
  // Bug 9（部分）: 親コメントのみ除去。返信は残ったまま
  setComments((prev) => prev.filter((c) => c.id !== commentId));
}
```

### 何が間違っているか

1. **API側**: コメント削除時、DBの `ON DELETE CASCADE` で子コメント（返信）も連鎖削除されるが、`comments_count` は **1だけデクリメント**する
   - 例: 親コメント1件 + 返信3件 → 親を削除 → DBでは4件消える → countは1しか減らない
2. **フロント側**: `CommentList.tsx` は楽観的更新で親コメントのみUIから除去し、返信は残ったまま表示される

### テストの誤誘導

`src/__tests__/comments.test.ts` が `parent_id=null`（返信なし）のコメントのみでテストしており、CASCADEが発生するケースを検証していない。

### 画面操作での検証手順

1. メモ詳細ページでコメントを投稿
2. そのコメントに返信を3件追加
3. 親コメントを削除
4. **期待**: 親コメント+返信3件が消え、comments_countが4減る
5. **実際**: 返信がUI上に残り、comments_countが1しか減らない。ページリロードすると返信も消えるがカウントがずれている

### 正しい修正

```typescript
// API側: 削除前に子孫コメント数を再帰的にカウント
const { count } = await supabase
  .from("comments")
  .select("id", { count: "exact" })
  .or(`id.eq.${commentId},parent_id.eq.${commentId}`);

const deleteCount = count || 1;
const newCount = Math.max(0, (memo?.comments_count || 0) - deleteCount);

// フロント側: 親コメント削除時に返信もUIから除去
setComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_id !== commentId));
```

---

## Bug 10 (★★★★★): ブックマーク一覧で非公開メモがランタイムエラー

### 該当コード（4ファイルにまたがる）

**`src/app/api/bookmarks/route.ts`**
```typescript
const { data } = await supabase
  .from("bookmarks")
  .select("*, memo:memos(*)")  // JOINで取得
  // ★ RLSにより他ユーザーの非公開メモは memo: null になる
```

**`src/lib/types.ts`**
```typescript
export type Bookmark = {
  // ...
  memo: Memo;  // ★ null不許可で定義されている（実際はnullになり得る）
};
```

**`src/app/bookmarks/page.tsx`**
```typescript
{bookmarks.map((bookmark) => (
  <div key={bookmark.id}>
    <h3>{bookmark.memo.title}</h3>  // ★ memo が null だとランタイムエラー
  </div>
))}
```

**`src/components/BookmarkButton.tsx`**
```typescript
useEffect(() => {
  // ★ 依存配列に userId が欠けている
  const checkBookmark = async () => { ... };
  if (memoId) checkBookmark();
}, [memoId]);  // eslint-disable-next-line react-hooks/exhaustive-deps
```

### 何が間違っているか

1. **型定義**: `Bookmark` の `memo` フィールドが `Memo`（null不許可）だが、RLSにより `null` になり得る → `bookmark.memo.title` でランタイムエラー
2. **BookmarkButton**: `useEffect` の依存配列に `userId` が欠けているため、userId変更時にブックマーク状態のチェックが再実行されない

### テストの誤誘導

`src/__tests__/bookmarks.test.ts` のモックデータで `memo` が常に存在するオブジェクトを返すため、nullアクセスのテストケースがない。

### 画面操作での検証手順

1. ユーザーAのメモをブックマーク
2. ユーザーAがそのメモを非公開に変更
3. ブックマーク一覧ページを開く → **白画面（ランタイムエラー）**
4. DevToolsのコンソールに `Cannot read properties of null (reading 'title')` エラー

### 正しい修正

```typescript
// types.ts
memo: Memo | null;

// bookmarks/page.tsx
{bookmarks
  .filter((b) => b.memo !== null)
  .map((bookmark) => (
    <div key={bookmark.id}>
      <h3>{bookmark.memo!.title}</h3>
    </div>
  ))}

// BookmarkButton.tsx
}, [memoId, userId]);
```

---

## Bug 11 (★★★★☆): 通知の自己通知 + NotificationBellのメモリリーク

### 該当コード（4ファイルにまたがる）

**`src/lib/notifications.ts`**
```typescript
export async function createNotification({ userId, actorId, ... }) {
  // ★ userId === actorId のチェックがない
  // → 自分のメモに自分でいいね/コメントすると自分に通知が来る
  const { data } = await supabase.from("notifications").insert({ ... });
}
```

**`src/components/NotificationBell.tsx`**
```typescript
// ★ fetchUnreadCount が useCallback で包まれていない
const fetchUnreadCount = async () => { ... };

useEffect(() => {
  fetchUnreadCount();
  const interval = setInterval(fetchUnreadCount, 5000);
  return () => clearInterval(interval);
}, [fetchUnreadCount]);  // ★ 毎回新しい関数参照 → 再レンダリングごとにインターバル再作成
```

### 何が間違っているか

1. **通知生成**: `createNotification` に `userId !== actorId` ガードがないため、自分のメモに自分で操作すると自分に通知が来る
2. **NotificationBell**: `fetchUnreadCount` が `useCallback` で安定化されていないため、依存配列 `[fetchUnreadCount]` が毎回変わり、`useEffect` が再実行されてインターバルが重複する（メモリリーク + 不要なAPI呼び出し）

### テストの誤誘導

`src/__tests__/notifications.test.ts` が `actorId` を別ユーザーにしたケースのみ検証し、自己通知ケースをテストしていない。

### 画面操作での検証手順

1. 自分が作成したメモにいいねを押す → 通知ベルに「メモにいいねが付きました」が表示される（自己通知）
2. DevTools > Network でNotificationBellのポーリングリクエストが急速に増加していくのを確認（メモリリーク）

### 正しい修正

```typescript
// notifications.ts
if (userId === actorId) return null; // 自分への通知はスキップ

// NotificationBell.tsx
const fetchUnreadCount = useCallback(async () => { ... }, [userId]);
```

---

## Bug 12 (★★★★★): プロフィール更新がHeaderと他画面で反映されない

### 該当コード（5ファイルにまたがる）

**`src/app/api/profile/route.ts`** (PUT)
```typescript
// profilesテーブルのみ更新
const { data } = await supabase
  .from("profiles")
  .update({ display_name, avatar_url })
  .eq("id", userId)
  .select().single();
// ★ auth.users の user_metadata は更新していない
```

**`src/components/Header.tsx`**
```typescript
// Header は supabase.auth.getUser() の user_metadata を参照
setUserName(user.user_metadata?.display_name || user.email || "ユーザー");
// ★ profiles テーブルではなく auth.users のメタデータを使用
```

**`src/components/UserAvatar.tsx`**
```typescript
// ★ sanitizeUrl() を呼んでいない → javascript: プロトコルのXSS脆弱性
<img src={avatarUrl || "/default-avatar.png"} ... />
```

### 何が間違っているか

1. **API**: プロフィール更新で `profiles` テーブルは更新するが `supabase.auth.updateUser({ data: { display_name, avatar_url } })` を呼んでいない。Headerは `auth.users` のメタデータを参照するため、古い名前が表示され続ける
2. **XSS脆弱性**: `UserAvatar.tsx` で `avatar_url` に対する `sanitizeUrl()` 呼び出しがなく、`javascript:` プロトコルのURLを設定可能

### テストの誤誘導

`src/__tests__/profile.test.ts` が `profiles` テーブルの更新のみ検証し、`auth.users` のメタデータを検証しない。アバターURLも正常なHTTPSのURLのみテスト。

### 画面操作での検証手順

1. プロフィール画面で名前を変更して保存
2. プロフィール画面では新しい名前が表示される（profilesテーブルから取得）
3. ヘッダーを確認 → **古い名前のまま**（auth.usersから取得）
4. ページをリロードしても変わらない
5. avatar_urlに `javascript:alert('XSS')` を設定すると、アバター表示時にXSSが発動する

### 正しい修正

```typescript
// profile/route.ts (PUT) に追加
await supabase.auth.updateUser({
  data: { display_name, avatar_url }
});

// UserAvatar.tsx
import { sanitizeUrl } from "@/lib/utils";
<img src={sanitizeUrl(avatarUrl) || "/default-avatar.png"} ... />
```

---

## Bug 13 (★★★★★): ダッシュボードランキングの非公開メモ混入 + 統計タイムゾーンずれ

### 該当コード（5ファイルにまたがる、2つの独立バグが1画面に共存）

**Bug 13a: `src/app/api/stats/ranking/route.ts`**
```typescript
const { data } = await supabase
  .from("memos")
  .select("id, title, likes_count, comments_count, category, created_at")
  .order("likes_count", { ascending: false })
  .limit(10);
// ★ is_private フィルタなし → 非公開メモがランキングに表示
```

**Bug 13b: `src/lib/utils.ts`**
```typescript
export function groupByDate(items: { created_at: string }[]): Record<string, number> {
  const grouped: Record<string, number> = {};
  for (const item of items) {
    const date = new Date(item.created_at).toLocaleDateString("ja-JP");
    // ★ サーバー(UTC)とクライアント(JST)で結果が異なる
    grouped[date] = (grouped[date] || 0) + 1;
  }
  return grouped;
}
```

### 何が間違っているか

1. **Bug 13a**: ランキングAPIで `is_private` フィルタがなく、非公開メモがランキングに表示される。クリックして詳細に遷移するとRLSで弾かれ「メモが見つかりません」
2. **Bug 13b**: `groupByDate()` が `toLocaleDateString` を使用するが、サーバー（UTC）とクライアント（JST）で結果が異なる。JST 00:30 → UTC 前日 15:30 となるケースで日跨ぎのずれが発生

### テストの誤誘導

- ランキングテストが `is_private` カラムを含まないモックデータ
- 日付テストがUTC日中の時刻（06:00, 08:00等）のみでテスト（JST 15:00, 17:00に相当し、日跨ぎが発生しない）

### 画面操作での検証手順

1. 非公開のメモにいいねをたくさんつける
2. ダッシュボードのランキングに非公開メモが表示される
3. ランキングのメモをクリック → 「メモが見つかりません」
4. 深夜0時〜9時にメモを作成し、ダッシュボードの日別グラフを確認 → 前日にカウントされている

### 正しい修正

```typescript
// ranking/route.ts
.eq("is_private", false)

// utils.ts
const date = new Date(item.created_at).toLocaleDateString("ja-JP", {
  timeZone: "Asia/Tokyo"
});
```

---

## Bug 14 (★★★★☆): タグ検索の正規化不整合 + UNIQUE制約の500エラー

### 該当コード（4ファイルにまたがる）

**`src/components/TagInput.tsx`**
```typescript
// ★ 大文字小文字を区別して比較
const filtered = allTags.filter(
  (tag) => tag.name.includes(value.trim()) && ...
);
// 例: "React" で検索 → DB上の "react" は候補に表示されない
```

**`src/app/api/tags/route.ts`** (POST)
```typescript
const name = body.name.toLowerCase();  // 小文字に正規化して保存
// ★ UNIQUE制約エラー(23505)を判別せず一律500を返す
```

### 何が間違っているか

1. **TagInput**: オートコンプリートで `tag.name.includes(input)` が大文字小文字を区別するため、「React」と入力しても既存の「react」が候補に表示されない
2. **タグAPI**: 候補に出ないので新規タグとしてPOSTすると、`toLowerCase()` で「react」に正規化 → DB UNIQUE制約違反 → 500エラー
3. UNIQUE制約エラー(PostgreSQLエラーコード 23505)を判別せず、一律500を返すためユーザーにわかりにくいエラーメッセージ

### テストの誤誘導

`src/__tests__/tags.test.ts` が全て小文字のタグのみでテストしているため、大文字入力のケースが検証されない。

### 画面操作での検証手順

1. メモ新規作成画面でタグ入力欄に「React」と入力
2. オートコンプリートに「react」が表示されない
3. Enterキーで新規タグ作成 → **「タグの作成に失敗しました」**エラー
4. DevToolsで `/api/tags` POST が500エラーを返していることを確認

### 正しい修正

```typescript
// TagInput.tsx
tag.name.toLowerCase().includes(value.trim().toLowerCase())

// tags/route.ts (POST)
if (error.code === "23505") {
  const { data: existing } = await supabase
    .from("tags").select("*").eq("name", name).single();
  return NextResponse.json({ tag: existing }, { status: 200 });
}
```

---

## Bug 15 (★★★★★): 管理者APIのミドルウェアバイパス + role判定の論理エラー

### 該当コード（4ファイルにまたがる、2層のセキュリティバグ）

**Bug 15a: `src/middleware.ts`**
```typescript
export const config = {
  matcher: ["/admin/:path*"],
  // ★ /api/admin/:path* にマッチしない → APIは認可チェックなしで通る
};
```

**Bug 15b: `src/lib/auth.ts`**
```typescript
export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles").select("role").eq("id", userId).single();
  return data?.role === "admin" || data?.role === "owner";
  // ★ "owner" ロールは profiles テーブルには存在しない
  // profiles.role は "member" | "admin" のみ
}
```

### 何が間違っているか

1. **Bug 15a**: middleware の matcher が `/admin/:path*` のみで `/api/admin/:path*` にマッチしない。画面はブロックされるが、APIに直接リクエストすれば認可チェックなしでアクセスできる
2. **Bug 15b**: `isAdmin()` が `"owner"` ロールを含めているが、profiles テーブルには `"owner"` ロールが存在しない。一見正しそうだが意味のない条件

### テストの誤誘導

- `src/__tests__/admin.test.ts` が `isAdmin()` を `role === "admin"` のケースだけ検証（"owner"ケースをテストしない）
- ミドルウェアテストが画面パス（`/admin`、`/admin/users`）のマッチのみ確認し、APIパス（`/api/admin/users`）を検証しない

### 画面操作での検証手順

1. 一般ユーザーで `/admin` にアクセス → リダイレクトされる（ミドルウェアが機能）
2. `curl` や DevTools で直接 `GET /api/admin/users` を叩く → **ユーザー一覧が返される**（認可バイパス）
3. `DELETE /api/admin/users` で他ユーザーを削除できてしまう

### 正しい修正

```typescript
// middleware.ts
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

// auth.ts
return data?.role === "admin";  // "owner" 条件を削除
```

---

## GitHub Issue テンプレート（研修生向け・曖昧に記述）

研修生が見るIssue報告は意図的に曖昧にして、原因特定の訓練にする。

| Issue # | タイトル |
|---------|---------|
| 1 | 検索結果がおかしい — カテゴリを指定すると関係ないメモまで表示される |
| 2 | メモを編集すると更新日時がおかしくなる |
| 3 | メモの公開/非公開を切り替えても反映されない |
| 4 | ネットワークが不安定だといいねボタンが効かなくなる |
| 5 | ログインしていないのに他人のメモが削除できる気がする |
| 6 | メモが増えるとページ送りで同じメモが2回出たり、見られないメモがある |
| 7 | 社内チャットボットにメッセージを送るとエラーが出て応答が返ってこない |
| 8 | 返信付きコメントを削除すると数がおかしくなる |
| 9 | ブックマーク一覧を開くと画面が真っ白になることがある |
| 10 | 自分のメモにいいねしたら自分に通知が来る + 通知ベルがおかしい |
| 11 | プロフィール画面で名前を変えてもヘッダーの表示が古いまま |
| 12 | ダッシュボードのランキングに見られないメモが表示される + 日付グラフがずれる |
| 13 | タグ入力で大文字を使うとエラーになる |
| 14 | 管理者画面にアクセスできないはずのユーザーがAPIを直接叩ける |
