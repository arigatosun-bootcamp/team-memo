import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// トークンからユーザーを検証するヘルパー
async function verifyUser(request: NextRequest): Promise<{ userId: string | null; error?: NextResponse }> {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return { userId: null, error: NextResponse.json({ error: "ログインが必要です" }, { status: 401 }) };
  }
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return { userId: null, error: NextResponse.json({ error: "認証が無効です" }, { status: 401 }) };
  }
  return { userId: user.id };
}

// POST: ブックマークを追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoId } = await params;
  const { userId, error: authError } = await verifyUser(request);
  if (!userId) return authError!;

  // 既にブックマーク済みかチェック
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("memo_id", memoId)
    .single();

  if (existing) {
    return NextResponse.json(
      { message: "既にブックマーク済みです" },
      { status: 200 }
    );
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({ user_id: userId, memo_id: memoId })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookmark: data }, { status: 201 });
}

// DELETE: ブックマークを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoId } = await params;
  const { userId, error: authError } = await verifyUser(request);
  if (!userId) return authError!;

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("memo_id", memoId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "ブックマークを削除しました" });
}
