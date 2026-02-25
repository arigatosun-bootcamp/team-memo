import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { groupByDate } from "@/lib/utils";

// GET: 統計データを取得
export async function GET() {
  // 全公開メモを取得（統計計算用）
  const { data: memos } = await supabase
    .from("memos")
    .select("id, likes_count, comments_count, created_at, category")
    .eq("is_private", false)
    .order("created_at", { ascending: false });

  if (!memos) {
    return NextResponse.json({
      totalMemos: 0,
      totalLikes: 0,
      totalComments: 0,
      memosByDate: {},
      memosByCategory: {},
    });
  }

  const totalMemos = memos.length;
  const totalLikes = memos.reduce((sum, m) => sum + m.likes_count, 0);
  const totalComments = memos.reduce((sum, m) => sum + m.comments_count, 0);

  // Bug 13b: groupByDate()はサーバーサイドで実行されるためUTCタイムゾーンで日付が計算される
  // フロントサイド（JST）で見ると、日本時間0:00-8:59に作成されたメモが前日にカウントされる
  const memosByDate = groupByDate(memos);

  // カテゴリ別集計
  const memosByCategory: Record<string, number> = {};
  for (const memo of memos) {
    memosByCategory[memo.category] = (memosByCategory[memo.category] || 0) + 1;
  }

  // アクティブユーザー数（直近7日間にメモを投稿したユーザー）
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { count: activeUsers } = await supabase
    .from("memos")
    .select("user_id", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo.toISOString());

  return NextResponse.json({
    totalMemos,
    totalLikes,
    totalComments,
    activeUsers: activeUsers || 0,
    memosByDate,
    memosByCategory,
  });
}
