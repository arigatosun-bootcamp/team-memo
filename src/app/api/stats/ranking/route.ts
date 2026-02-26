import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET: メモランキングを取得
// Bug 13a: is_private フィルタなし → 非公開メモもランキングに含まれてしまう
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "likes";
  const limit = parseInt(searchParams.get("limit") || "10");

  let query = supabase
    .from("memos")
    .select("*, user:profiles!user_id(display_name, avatar_url)");

  // NOTE: 公開メモのみをランキング対象とする
  // → 実際にはis_privateフィルタが抜けている
  if (type === "likes") {
    query = query.order("likes_count", { ascending: false });
  } else if (type === "comments") {
    query = query.order("comments_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: memos, error } = await query.limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ranking: memos || [] });
}
