import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Memo } from "@/lib/types";

// メモ一覧を最新順で取得
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page")) || 1;
  const perPage = 10;
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  let query = supabase
    .from("memos")
    .select("*", { count: "exact" })
    .eq("is_private", false)
    .order("updated_at", { ascending: false }) // メモ一覧を最新順でソート
    .range((page - 1) * perPage, page * perPage - 1);

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ memos: data as Memo[], total: count ?? 0 });
}

// メモを新規作成
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, content, category, is_private, user_id } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: "タイトルと本文は必須です" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("memos")
    .insert({
      title,
      content,
      category: category || "general",
      is_private: is_private || false,
      user_id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
