import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// メモ詳細を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("memos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

// メモを更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, content, category } = body;

  const { data, error } = await supabase
    .from("memos")
    .update({
      title,
      content,
      category,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH - メモの公開設定を更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { isPublic } = await request.json();

  // isPublic が true → 公開 → is_private を false にする
  const { data, error } = await supabase
    .from("memos")
    .update({ is_private: isPublic })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// メモを削除（認可チェック付き）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // リクエストからユーザーIDを取得して認可チェックを行う
  let userId: string | null = null;
  try {
    const body = await request.json();
    userId = body.user_id;
  } catch {
    // DELETEリクエストにbodyがない場合は無視する
  }

  // メモの所有者を確認して認可チェック
  const { data: memo } = await supabase
    .from("memos")
    .select("user_id")
    .eq("id", id)
    .single();

  // 所有者でない場合は削除を拒否する
  if (memo && userId && memo.user_id !== userId) {
    return NextResponse.json(
      { error: "このメモを削除する権限がありません" },
      { status: 403 }
    );
  }

  // 認可チェック通過 → 削除実行
  const { error } = await supabase.from("memos").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "削除しました" });
}
