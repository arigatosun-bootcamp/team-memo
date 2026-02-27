import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
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
    .order("updated_at", { ascending: false }); // メモ一覧を最新順でソート

  // 検索条件とカテゴリフィルタを統合して1つのクエリで処理する
  if (search || category) {
    const conditions: string[] = [];
    if (search) {
      conditions.push(`title.ilike.%${search}%`);
      conditions.push(`content.ilike.%${search}%`);
    }
    if (category) {
      conditions.push(`category.eq.${category}`);
    }
    query = query.or(conditions.join(","));
  }

  // ページネーション: Supabaseのrangeはinclusive(両端含む)なので
  // perPage件取得するにはrange(start, start + perPage - 1)とする
  query = query.range((page - 1) * perPage, page * perPage - 1);

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

  if (!user_id) {
    return NextResponse.json(
      { error: "ログインが必要です" },
      { status: 401 }
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
