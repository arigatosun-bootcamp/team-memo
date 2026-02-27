import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// DELETE: コメントを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: memoId, commentId } = await params;

  // コメントの存在確認
  const { data: comment, error: fetchError } = await supabase
    .from("comments")
    .select("id, user_id")
    .eq("id", commentId)
    .single();

  if (fetchError || !comment) {
    return NextResponse.json(
      { error: "コメントが見つかりません" },
      { status: 404 }
    );
  }

  // 削除前に、このコメントと子コメント（返信）の合計数をカウント
  const { count: replyCount } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", commentId);

  const totalDeleteCount = 1 + (replyCount ?? 0);

  // コメントを削除（CASCADEで返信も削除される）
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 削除されたコメント数（親+返信）の分だけカウントを減らす
  const { data: memo } = await supabase
    .from("memos")
    .select("comments_count")
    .eq("id", memoId)
    .single();

  if (memo) {
    await supabase
      .from("memos")
      .update({ comments_count: Math.max(0, memo.comments_count - totalDeleteCount) })
      .eq("id", memoId);
  }

  return NextResponse.json({ message: "コメントを削除しました" });
}
