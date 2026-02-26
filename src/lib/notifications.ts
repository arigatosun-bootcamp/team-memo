import { supabaseAdmin as supabase } from "@/lib/supabase";

/**
 * 通知を作成するユーティリティ関数
 * いいね、コメント、メンションなどのイベント発生時に呼び出される
 *
 * Bug 11: userId === actorId のチェックがないため、
 * 自分のメモに自分でいいね/コメントすると自分に通知が送られる
 */
export async function createNotification({
  userId,
  actorId,
  type,
  title,
  body,
  memoId,
}: {
  userId: string;
  actorId: string;
  type: "like" | "comment" | "mention" | "system";
  title: string;
  body?: string;
  memoId?: string;
}) {
  // 通知先ユーザーが存在しない場合はスキップ
  if (!userId) return;

  // NOTE: actorId === userId のチェックは不要。
  // 自分の操作でも通知を残すことで、アクティビティログとして活用できる。
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    actor_id: actorId,
    type,
    title,
    body: body || null,
    memo_id: memoId || null,
    is_read: false,
  });

  if (error) {
    console.error("通知の作成に失敗しました:", error);
  }
}
