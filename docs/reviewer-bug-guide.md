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
| 8 | ★★★☆☆ | チャットボットのGemini APIキーに余分なスペース | `.env` + `api/chat/route.ts` | なし |

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

## Bug 8 (★★★☆☆): チャットボットのGemini APIキーに余分なスペース

### 該当コード

**`.env`**
```env
# Gemini AI（社内チャットボット用）
GEMINI_API_KEY="AIzaSyBVD-XlNX5DWit1f_aA7ezyfLawgQhVd1c "
```

**`src/app/api/chat/route.ts`**
```typescript
const apiKey = process.env.GEMINI_API_KEY;
// ...
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
  // ...
);
```

### 何が間違っているか

`.env` ファイルの `GEMINI_API_KEY` の値がダブルクォートで囲まれており、閉じクォートの直前に**末尾スペースが1つ**含まれている。

dotenvはクォート内のスペースを値の一部として保持するため、`process.env.GEMINI_API_KEY` は `"AIzaSyBVD-XlNX5DWit1f_aA7ezyfLawgQhVd1c "` （末尾に半角スペース1つ）になる。

このスペース入りAPIキーがGemini APIのURLに組み込まれ、`?key=AIzaSy...d1c ` とスペース付きでリクエストされるため、APIが `400 Bad Request` または `403 API key not valid` エラーを返す。

### AIが見逃す理由

- コードは完全に正しく書かれている（`process.env.GEMINI_API_KEY` をそのまま使用）
- `.env` ファイルの末尾スペースは目視でほぼ見えない
- ダブルクォートは他のenv値にも使われうる一般的な書き方で不自然ではない
- エラーメッセージが「API key not valid」で、スペースの存在を直接示唆しない
- AIがコードレビューしても`.env`ファイルの不可視スペースまでは通常チェックしない

### 画面操作での検証手順

1. 画面右下のチャットボタン（💬）をクリック
2. チャットパネルが開く
3. メッセージを入力して「送信」ボタンをクリック
4. **「エラーが発生しました: API key not valid」** のようなエラーメッセージが表示される
5. DevTools > Networkで `/api/chat` のレスポンスを確認 → 400/403エラー

### 正しい修正

`.env` ファイルのAPIキー値から末尾スペースを削除する（クォートごと削除しても可）:

```env
# 修正前（末尾にスペースあり）
GEMINI_API_KEY="AIzaSyBVD-XlNX5DWit1f_aA7ezyfLawgQhVd1c "

# 修正後
GEMINI_API_KEY=AIzaSyBVD-XlNX5DWit1f_aA7ezyfLawgQhVd1c
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
| 7 | 社内チャットボットにメッセージを送るとエラーになる |
