import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST: ブックマークを追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoId } = await params;
  const { user_id } = await request.json();

  if (!user_id) {
    return NextResponse.json(
      { error: "ユーザーIDは必須です" },
      { status: 400 }
    );
  }

  // 既にブックマーク済みかチェック
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user_id)
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
    .insert({ user_id, memo_id: memoId })
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
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json(
      { error: "ユーザーIDは必須です" },
      { status: 400 }
    );
  }

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
