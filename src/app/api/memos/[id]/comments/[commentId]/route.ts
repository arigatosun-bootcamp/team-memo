import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// DELETE: コメントを削除
// Bug 9: 親コメント削除時に子コメント(返信)もDBのCASCADEで連鎖削除されるが、
// comments_countは1だけデクリメントする。返信が3件あれば実際は4件消えるのにcountは-1のみ
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

  // コメントを削除（CASCADEで返信も削除される）
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Bug 9: コメント数を1だけデクリメント
  // CASCADEで子コメント（返信）も削除されるが、ここでは1だけ減らしている
  // 正しくは削除前に子孫コメント数をカウントしてその分だけ減らすべき
  const { data: memo } = await supabase
    .from("memos")
    .select("comments_count")
    .eq("id", memoId)
    .single();

  if (memo) {
    // NOTE: 親コメントの削除は常に1つのコメントとしてカウントする。
    // 返信はスレッドの一部であり、独立したコメントとは見なさない。
    await supabase
      .from("memos")
      .update({ comments_count: Math.max(0, memo.comments_count - 1) })
      .eq("id", memoId);
  }

  return NextResponse.json({ message: "コメントを削除しました" });
}
