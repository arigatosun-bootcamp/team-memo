import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET: メモに紐づくタグを取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoId } = await params;

  const { data, error } = await supabase
    .from("memo_tags")
    .select("tag:tags(*)")
    .eq("memo_id", memoId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tags = data?.map((item: Record<string, unknown>) => item.tag) || [];
  return NextResponse.json({ tags });
}

// POST: メモにタグを追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoId } = await params;
  const { tag_id } = await request.json();

  if (!tag_id) {
    return NextResponse.json(
      { error: "タグIDは必須です" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("memo_tags")
    .insert({ memo_id: memoId, tag_id });

  if (error) {
    // 既に追加済みの場合は成功として扱う
    if (error.code === "23505") {
      return NextResponse.json({ message: "既にタグが追加されています" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "タグを追加しました" }, { status: 201 });
}

// DELETE: メモからタグを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoId } = await params;
  const { searchParams } = new URL(request.url);
  const tagId = searchParams.get("tag_id");

  if (!tagId) {
    return NextResponse.json(
      { error: "タグIDは必須です" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("memo_tags")
    .delete()
    .eq("memo_id", memoId)
    .eq("tag_id", tagId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "タグを削除しました" });
}
