import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";

// いいね処理（重複チェックあり）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoId } = await params;

  // トークンからユーザーを検証
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: "認証が無効です" }, { status: 401 });
  }

  const userId = user.id;

  // 重複チェック
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", userId)
    .eq("memo_id", memoId)
    .single();

  if (existing) {
    // 既にいいね済み → 現在の count を返す
    const { data: memo } = await supabase
      .from("memos")
      .select("likes_count")
      .eq("id", memoId)
      .single();
    return NextResponse.json({ likes_count: memo?.likes_count ?? 0 });
  }

  // いいね追加
  await supabase
    .from("likes")
    .insert({ user_id: userId, memo_id: memoId });

  // カウント更新（非アトミック: SELECT → 計算 → UPDATE）
  const { data: memo } = await supabase
    .from("memos")
    .select("likes_count")
    .eq("id", memoId)
    .single();

  const newCount = (memo?.likes_count || 0) + 1;

  await supabase
    .from("memos")
    .update({ likes_count: newCount })
    .eq("id", memoId);

  const { data: memoData } = await supabase
    .from("memos")
    .select("user_id")
    .eq("id", memoId)
    .single();

  if (memoData) {
    await createNotification({
      userId: memoData.user_id,
      actorId: userId,
      type: "like",
      title: "メモにいいねが付きました",
      memoId,
    });
  }

  return NextResponse.json({ likes_count: newCount });
}
