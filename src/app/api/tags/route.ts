import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET: タグ一覧を取得
export async function GET() {
  const { data: tags, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tags: tags || [] });
}

// POST: 新しいタグを作成
export async function POST(request: NextRequest) {
  const { name, color } = await request.json();

  if (!name) {
    return NextResponse.json(
      { error: "タグ名は必須です" },
      { status: 400 }
    );
  }

  // タグ名を小文字に正規化して保存
  const normalizedName = name.trim().toLowerCase();

  const { data: tag, error } = await supabase
    .from("tags")
    .insert({ name: normalizedName, color: color || "#666666" })
    .select()
    .single();

  if (error) {
    // UNIQUE制約エラーの場合は既存タグを返す
    if (error.code === "23505") {
      const { data: existingTag } = await supabase
        .from("tags")
        .select("*")
        .eq("name", normalizedName)
        .single();

      if (existingTag) {
        return NextResponse.json({ tag: existingTag });
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tag }, { status: 201 });
}
