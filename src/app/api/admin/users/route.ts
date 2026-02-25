import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: ユーザー一覧を取得（管理者用）
// Bug 15a: middleware.tsの matcher に /api/admin が含まれていないため、
// 認可チェックなしでアクセス可能
export async function GET() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: profiles || [] });
}

// DELETE: ユーザーを削除（管理者用）
// Bug 15a: middleware.tsの matcher に /api/admin が含まれていないため、
// 認可チェックなしでアクセス可能
export async function DELETE(request: NextRequest) {
  const { user_id } = await request.json();

  if (!user_id) {
    return NextResponse.json(
      { error: "ユーザーIDは必須です" },
      { status: 400 }
    );
  }

  // profiles テーブルから削除（CASCADE で関連データも削除される）
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "ユーザーを削除しました" });
}
