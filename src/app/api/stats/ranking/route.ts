import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET: メモランキングを取得
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "likes";
  const limit = parseInt(searchParams.get("limit") || "10");

  let query = supabase
    .from("memos")
    .select("*, user:profiles!memos_user_id_profiles_fkey(display_name, avatar_url)")
    .eq("is_private", false);

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
