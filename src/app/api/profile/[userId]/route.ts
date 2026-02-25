import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: 指定ユーザーのプロフィールと統計情報を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  // プロフィール取得
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "ユーザーが見つかりません" },
      { status: 404 }
    );
  }

  // ユーザーの公開メモ数を取得
  const { count: memoCount } = await supabase
    .from("memos")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_private", false);

  // ユーザーの公開メモに対する合計いいね数
  const { data: memos } = await supabase
    .from("memos")
    .select("likes_count")
    .eq("user_id", userId)
    .eq("is_private", false);

  const totalLikes = memos?.reduce((sum, m) => sum + m.likes_count, 0) || 0;

  // ユーザーのコメント数
  const { count: commentCount } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return NextResponse.json({
    profile,
    stats: {
      memoCount: memoCount || 0,
      totalLikes,
      commentCount: commentCount || 0,
    },
  });
}
