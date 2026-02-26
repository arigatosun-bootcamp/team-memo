import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";

// GET: メモのコメント一覧を取得（スレッド対応）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoId } = await params;

  // 親コメント（parent_id が null）を取得し、返信はネストで取得
  const { data: comments, error } = await supabase
    .from("comments")
    .select("*, user:profiles!comments_user_id_profiles_fkey(display_name, avatar_url), replies:comments!parent_id(*, user:profiles!comments_user_id_profiles_fkey(display_name, avatar_url))")
    .eq("memo_id", memoId)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: comments || [] });
}

// POST: コメントを追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoId } = await params;
  const { content, user_id, parent_id } = await request.json();

  if (!content || !user_id) {
    return NextResponse.json(
      { error: "コメント内容とユーザーIDは必須です" },
      { status: 400 }
    );
  }

  // コメントを挿入
  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      memo_id: memoId,
      user_id,
      content,
      parent_id: parent_id || null,
    })
    .select("*, user:profiles!comments_user_id_profiles_fkey(display_name, avatar_url)")
    .single();

  if (error) {
    console.error("コメント挿入エラー:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // メモのコメント数をインクリメント
  const { data: memo } = await supabase
    .from("memos")
    .select("comments_count, user_id")
    .eq("id", memoId)
    .single();

  if (memo) {
    await supabase
      .from("memos")
      .update({ comments_count: memo.comments_count + 1 })
      .eq("id", memoId);

    // Bug 11（部分）: 通知を作成。createNotification内でactorId === userIdチェックなし
    await createNotification({
      userId: memo.user_id,
      actorId: user_id,
      type: "comment",
      title: "メモにコメントが付きました",
      body: content.slice(0, 100),
      memoId,
    });
  }

  return NextResponse.json({ comment }, { status: 201 });
}
