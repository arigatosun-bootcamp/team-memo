import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateSummary } from "@/lib/llm";

// メモの要約を生成して保存
export async function POST(request: NextRequest) {
  const { memoId } = await request.json();

  if (!memoId) {
    return NextResponse.json(
      { error: "メモIDが必要です" },
      { status: 400 }
    );
  }

  // メモの本文を取得
  const { data: memo, error: fetchError } = await supabase
    .from("memos")
    .select("content")
    .eq("id", memoId)
    .single();

  if (fetchError || !memo) {
    return NextResponse.json(
      { error: "メモが見つかりません" },
      { status: 404 }
    );
  }

  try {
    // LLMで要約を生成
    const result = await generateSummary(memo.content);

    // 要約をDBに保存
    const { data, error: updateError } = await supabase
      .from("memos")
      .update({ summary: result.content })
      .eq("id", memoId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      summary: result.content,
      model: result.model,
      memo: data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "要約の生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
