import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// いいね処理（重複チェックあり）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoId } = await params;
  const body = await request.json();
  const userId = body.user_id;

  if (!userId) {
    return NextResponse.json(
      { error: "ログインが必要です" },
      { status: 401 }
    );
  }

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

  return NextResponse.json({ likes_count: newCount });
}
