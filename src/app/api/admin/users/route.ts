import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// 管理者権限を確認するヘルパー関数
async function verifyAdmin(request: NextRequest): Promise<{ authorized: boolean; response?: NextResponse }> {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return { authorized: false, response: NextResponse.json({ error: "認証が必要です" }, { status: 401 }) };
  }

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return { authorized: false, response: NextResponse.json({ error: "認証が必要です" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { authorized: false, response: NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 }) };
  }

  return { authorized: true };
}

// GET: ユーザー一覧を取得（管理者用）
export async function GET(request: NextRequest) {
  const { authorized, response } = await verifyAdmin(request);
  if (!authorized) return response!;

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
export async function DELETE(request: NextRequest) {
  const { authorized, response } = await verifyAdmin(request);
  if (!authorized) return response!;

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
