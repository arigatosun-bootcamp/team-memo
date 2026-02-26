import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET: ユーザーのブックマーク一覧を取得
// Bug 10（部分）: JOINで取得したmemoがRLSにより非公開メモの場合nullになるが、
// フロント側の型定義では memo: Memo（non-nullable）として扱っている
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json(
      { error: "ユーザーIDは必須です" },
      { status: 400 }
    );
  }

  // メモデータをJOINで取得
  // Supabase RLSにより、他ユーザーの非公開メモはmemoがnullになる場合がある
  const { data: bookmarks, error } = await supabase
    .from("bookmarks")
    .select("*, memo:memos(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookmarks: bookmarks || [] });
}
