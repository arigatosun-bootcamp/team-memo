# バグパターンと予防策

このドキュメントは、チーム内で発生したバグのパターンと予防策を記録し、同じミスを繰り返さないためのナレッジベースです。

---

## パターン10: 自分自身への通知送信 + ポーリング過多

**Issue**: #10
**発生箇所**: `src/lib/notifications.ts`, `src/components/NotificationBell.tsx`

### 何が起きたか
1. 自分のメモに自分でいいね/コメントすると、自分宛てに通知が作成された
2. 通知ベルのポーリングが毎レンダリングごとにインターバルを再作成し、リクエストが大量発生した

### 原因
1. `createNotification()`で `userId === actorId`（操作者と通知先が同一人物）のチェックがなかった
2. `fetchUnreadCount`関数がuseEffect外で定義されており、毎レンダリングで新しい関数参照が生成される。依存配列に`[fetchUnreadCount]`を指定していたため、useEffectが毎回再実行されていた

### 壊れていたコード
```typescript
// notifications.ts - チェックなし
if (!userId) return;
// ← ここに userId === actorId のチェックがなかった

// NotificationBell.tsx - useEffect外の関数定義
const fetchUnreadCount = async () => { ... };
useEffect(() => {
  const interval = setInterval(fetchUnreadCount, 5000);
  return () => clearInterval(interval);
}, [fetchUnreadCount]); // 毎レンダリングで再実行される
```

### 修正後のコード
```typescript
// notifications.ts - 自己通知を防止
if (!userId) return;
if (userId === actorId) return;

// NotificationBell.tsx - useEffect内に関数を移動
useEffect(() => {
  const fetchUnreadCount = async () => { ... };
  fetchUnreadCount();
  const interval = setInterval(fetchUnreadCount, 5000);
  return () => clearInterval(interval);
}, [userId]); // userIdが変わった時だけ再実行
```

### 予防策
- 通知系の機能では「自分自身への通知」を必ず除外する
- useEffectの依存配列に関数を入れる場合は、その関数をuseCallbackで安定化するか、useEffect内で定義する
- DevToolsのNetworkタブでポーリング頻度を定期的に確認する

---

## コードレビューチェックリスト

- [ ] 通知・メール送信: 自分自身への送信が除外されているか
- [ ] useEffectの依存配列: 関数参照が安定しているか（useCallback or useEffect内定義）
- [ ] setInterval/setTimeout: クリーンアップ関数で適切にクリアされているか
- [ ] API認証: サーバー側でトークン検証しているか
- [ ] Supabase `.range()`: 終了インデックスが inclusive であることを考慮しているか
- [ ] CASCADE削除: 子レコードの数をカウントに正しく反映しているか
- [ ] 環境変数: 似た文字（`l`と`1`、`O`と`0`）を確認しているか
